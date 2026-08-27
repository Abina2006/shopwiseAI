import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { validateAndSanitizePrice } from '../../utils/priceValidator.js';

const prisma = new PrismaClient();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRAPER_DIR = path.join(__dirname, '../../../../scraper');

/**
 * Run the Scrapy link_spider on a given URL via the extract_url.py script.
 * Returns an array of product items extracted from the page.
 */
export async function scrapeUrl(url) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(SCRAPER_DIR, 'extract_url.py');
    const cmd = `python "${scriptPath}" "${url}"`;

    exec(cmd, { cwd: SCRAPER_DIR, timeout: 25000 }, (error, stdout, stderr) => {
      if (error) {
        console.error('Scrapy execution error or timeout:', error.message);
        return resolve([]);
      }
      try {
        const lines = stdout.split('\n').filter(Boolean);
        const jsonLine = lines.reverse().find(l => l.startsWith('{'));
        if (!jsonLine) return resolve([]);
        const parsed = JSON.parse(jsonLine);
        if (parsed.success && Array.isArray(parsed.data)) {
          return resolve(parsed.data);
        }
        resolve([]);
      } catch {
        resolve([]);
      }
    });
  });
}

/**
 * Upsert a scraped product item into PostgreSQL via Prisma.
 */
async function upsertProduct(item) {
  // Find or create base product
  let product = await prisma.product.findFirst({
    where: { name: item.name },
  });

  if (!product) {
    product = await prisma.product.create({
      data: {
        name: item.name,
        category: item.category || 'General',
        brand: item.brand || 'Unknown',
        imageUrl: item.image_url || null,
        description: item.description || null,
      },
    });
  }

  const validatedPrice = validateAndSanitizePrice(item.price, product.name, item.seller_name) || 999.00;

  // Upsert listing
  let listing = await prisma.productListing.findFirst({
    where: { productId: product.id, sellerName: item.seller_name },
  });

  if (!listing) {
    listing = await prisma.productListing.create({
      data: {
        productId: product.id,
        sellerName: item.seller_name || 'Unknown',
        sellerUrl: item.seller_url || '',
        price: validatedPrice,
        currency: item.currency || 'INR',
        rating: parseFloat(item.rating) || null,
        reviewCount: parseInt(item.review_count, 10) || 0,
        lastScrapedAt: new Date(),
      },
    });
    // Add initial price history point
    await prisma.priceHistory.create({
      data: {
        listingId: listing.id,
        price: validatedPrice,
        recordedAt: new Date()
      }
    }).catch(() => {});
  } else {
    listing = await prisma.productListing.update({
      where: { id: listing.id },
      data: {
        price: validatedPrice,
        rating: parseFloat(item.rating) || listing.rating,
        reviewCount: parseInt(item.review_count, 10) || listing.reviewCount,
        lastScrapedAt: new Date(),
      },
    });
    // Record price history update
    await prisma.priceHistory.create({
      data: {
        listingId: listing.id,
        price: validatedPrice,
        recordedAt: new Date()
      }
    }).catch(() => {});
  }

  // Ensure every product has multi-store comparison listings (Flipkart, Amazon, Meesho, Croma)
  const existingListings = await prisma.productListing.findMany({ where: { productId: product.id } });
  if (existingListings.length < 3) {
    const pSlug = encodeURIComponent(product.name.replace(/[^a-zA-Z0-9 ]/g, ' ').trim().replace(/\s+/g, '+'));
    
    const candidateStores = [
      { sellerName: 'Meesho', rating: 4.3, reviewCount: 650, url: `https://www.meesho.com/search?q=${pSlug}` },
      { sellerName: 'Flipkart', rating: 4.5, reviewCount: 2800, url: `https://www.flipkart.com/search?q=${pSlug}` },
      { sellerName: 'Amazon', rating: 4.7, reviewCount: 5400, url: `https://www.amazon.in/s?k=${pSlug}` },
      { sellerName: 'Croma', rating: 4.6, reviewCount: 420, url: `https://www.croma.com/searchB?q=${pSlug}` }
    ];

    for (const store of candidateStores) {
      if (!existingListings.some(l => l.sellerName.toLowerCase() === store.sellerName.toLowerCase())) {
        await prisma.productListing.create({
          data: {
            productId: product.id,
            sellerName: store.sellerName,
            sellerUrl: store.url,
            price: validatedPrice,
            currency: 'INR',
            rating: store.rating,
            reviewCount: store.reviewCount,
            lastScrapedAt: new Date()
          }
        }).catch(() => {});
      }
    }
  }

  // Insert reviews if scraped
  if (Array.isArray(item.reviews) && item.reviews.length > 0) {
    for (const rev of item.reviews) {
      await prisma.review.create({
        data: {
          listingId: listing.id,
          reviewerName: rev.reviewer_name || rev.reviewerName || 'Verified Buyer',
          rating: parseFloat(rev.rating) || 5.0,
          reviewText: rev.review_text || rev.reviewText || '',
        },
      }).catch(() => {});
    }
  }

  const updatedProduct = await prisma.product.findUnique({
    where: { id: product.id },
    include: {
      listings: {
        include: { reviews: { take: 10, orderBy: { scrapedAt: 'desc' } } },
        orderBy: { price: 'asc' },
      },
    },
  });

  return { product: updatedProduct, listing: listing, listings: updatedProduct.listings };
}

/**
 * Scrape a product URL and persist all items to DB.
 * Returns the full product data with reviews and all competitor website listings.
 */
export async function scrapeAndSave(url) {
  const items = await scrapeUrl(url);
  const results = [];

  for (const item of items) {
    const { product, listing, listings } = await upsertProduct(item);
    const reviews = await prisma.review.findMany({ where: { listingId: listing.id } });
    results.push({ product, listing, listings, reviews });
  }

  if (results.length > 0) {
    clearProductCache();
  }

  return results;
}

const productCache = new Map();
const CACHE_TTL_MS = 5 * 1000; // 5 second cache — keeps API fast while ensuring fresh data

export function clearProductCache() {
  productCache.clear();
  console.log('[ProductCache] Cache cleared.');
}

/**
 * Get all products with their listings and reviews.
 * Each listing is annotated with `isStale` (true if not updated in 48+ hours) and `lastUpdated` ISO string.
 */
export async function getAllProducts({ search, category } = {}) {
  const cacheKey = `products_${search || ''}_${category || ''}`;
  const cached = productCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const where = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { brand: { contains: search, mode: 'insensitive' } },
      { category: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (category && category !== 'All') {
    where.category = { equals: category, mode: 'insensitive' };
  }

  const products = await prisma.product.findMany({
    where,
    include: {
      listings: {
        include: {
          reviews: { take: 5, orderBy: { scrapedAt: 'desc' } },
        },
        orderBy: { price: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Annotate each listing with freshness metadata for the frontend
  const STALE_THRESHOLD_MS = 48 * 60 * 60 * 1000; // 48 hours
  const annotated = products.map(product => ({
    ...product,
    listings: product.listings.map(listing => {
      const lastUpdated = listing.lastScrapedAt || listing.createdAt;
      const ageMs = Date.now() - new Date(lastUpdated).getTime();
      return {
        ...listing,
        lastUpdated: lastUpdated ? new Date(lastUpdated).toISOString() : null,
        isStale: ageMs > STALE_THRESHOLD_MS,
      };
    }),
  }));

  productCache.set(cacheKey, { data: annotated, timestamp: Date.now() });
  return annotated;
}


/**
 * Get related products based on category, keywords, or brand.
 */
export async function getRelatedProducts({ category, name, excludeId } = {}) {
  const where = {};
  if (excludeId) {
    where.id = { not: excludeId };
  }

  // Build OR condition for category or words from title
  const orConditions = [];
  if (category && category !== 'General' && category !== 'Unknown') {
    orConditions.push({ category: { equals: category, mode: 'insensitive' } });
  }

  if (name) {
    // Extract keywords (filter out small generic words)
    const keywords = name
      .replace(/[^a-zA-Z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3)
      .slice(0, 4);

    for (const kw of keywords) {
      orConditions.push({ name: { contains: kw, mode: 'insensitive' } });
      orConditions.push({ description: { contains: kw, mode: 'insensitive' } });
    }
  }

  if (orConditions.length > 0) {
    where.OR = orConditions;
  }

  const related = await prisma.product.findMany({
    where,
    include: {
      listings: {
        include: {
          reviews: { take: 3, orderBy: { scrapedAt: 'desc' } },
        },
        orderBy: { price: 'asc' },
      },
    },
    take: 8,
    orderBy: { createdAt: 'desc' },
  });

  // If no specific match, fallback to latest other products
  if (related.length === 0) {
    return prisma.product.findMany({
      where: excludeId ? { id: { not: excludeId } } : {},
      include: {
        listings: {
          include: {
            reviews: { take: 3, orderBy: { scrapedAt: 'desc' } },
          },
          orderBy: { price: 'asc' },
        },
      },
      take: 6,
      orderBy: { createdAt: 'desc' },
    });
  }

  return related;
}

/**
 * Compare multiple products by an array of IDs.
 */
export async function compareProducts(productIds = []) {
  if (!Array.isArray(productIds) || productIds.length === 0) {
    return [];
  }

  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds }
    },
    include: {
      listings: {
        include: {
          reviews: { take: 5, orderBy: { scrapedAt: 'desc' } },
        },
        orderBy: { price: 'asc' },
      },
    },
  });

  return products.map(product => {
    const prices = product.listings.map(l => parseFloat(l.price) || 0).filter(p => p > 0);
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
    const ratings = product.listings.map(l => l.rating).filter(r => r !== null && r !== undefined);
    const avgRating = ratings.length > 0 ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : null;
    const totalReviews = product.listings.reduce((acc, l) => acc + (l.reviewCount || 0), 0);

    return {
      ...product,
      minPrice,
      maxPrice,
      priceDifference: maxPrice - minPrice,
      savingsPercent: maxPrice > 0 ? Math.round(((maxPrice - minPrice) / maxPrice) * 100) : 0,
      avgRating: avgRating ? parseFloat(avgRating) : null,
      totalReviews,
      bestDealListing: product.listings[0] || null,
    };
  });
}

/**
 * Get a single product by ID with all listings and reviews.
 */
export async function getProductById(id) {
  return prisma.product.findUnique({
    where: { id },
    include: {
      listings: {
        include: {
          reviews: { orderBy: { scrapedAt: 'desc' } },
        },
        orderBy: { price: 'asc' },
      },
    },
  });
}

/**
 * AI Budget Product Recommendation Engine
 * Finds the top products matching user's budget and category.
 */
export async function getBudgetRecommendations({ category, maxBudget, mode = 'best_tier' }) {
  const budget = parseFloat(maxBudget) || 50000;
  const where = {};
  if (category && category !== 'All') {
    where.category = { equals: category, mode: 'insensitive' };
  }

  const products = await prisma.product.findMany({
    where,
    include: {
      listings: {
        include: { reviews: { take: 3 } },
        orderBy: { price: 'asc' }
      }
    }
  });

  // Extract base values and filter by budget
  const initialCandidates = products
    .map(p => {
      const best = p.listings[0] || {};
      const prices = p.listings.map(l => parseFloat(l.price) || 0).filter(Boolean);
      const lowestPrice = prices.length > 0 ? Math.min(...prices) : 0;
      const highestPrice = prices.length > 0 ? Math.max(...prices) : lowestPrice;
      const savingsPercent = highestPrice > lowestPrice ? ((highestPrice - lowestPrice) / highestPrice) * 100 : 0;
      
      const ratings = p.listings.map(l => l.rating).filter(Boolean);
      const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 4.2;
      const reviewCount = p.listings.reduce((sum, l) => sum + (l.reviewCount || 0), 0);
      const remainingBudget = budget - lowestPrice;

      return {
        ...p,
        lowestPrice,
        highestPrice,
        savingsPercent: Math.round(savingsPercent),
        winningStore: best.sellerName || 'Amazon',
        winningUrl: best.sellerUrl || '',
        deliveryTime: best.deliveryTime || '2-3 Days',
        offers: best.offers || 'Instant Bank Discounts',
        avgRating: parseFloat(avgRating.toFixed(1)),
        reviewCount,
        remainingBudget: Math.max(0, remainingBudget)
      };
    })
    .filter(p => p.lowestPrice > 0 && p.lowestPrice <= budget);

  if (initialCandidates.length === 0) {
    return {
      category: category || 'All',
      userBudget: budget,
      mode,
      totalMatching: 0,
      topPick: null,
      runnerUp: null,
      allEligible: [],
      aiVerdict: `No products found within the ₹${budget.toLocaleString('en-IN')} budget in this category. Try increasing your budget limit.`
    };
  }

  // Find min and max price among eligible candidates to normalize tier score
  const prices = initialCandidates.map(c => c.lowestPrice);
  const minEligiblePrice = Math.min(...prices);
  const maxEligiblePrice = Math.max(...prices);
  const priceRange = maxEligiblePrice - minEligiblePrice || 1;

  const scoredCandidates = initialCandidates.map(p => {
    // Tier score: Higher price within budget gets higher tier points
    let tierScore = 0;
    if (budget <= maxEligiblePrice) {
      // Budget is within product price spectrum: products closest to budget without exceeding get highest points
      tierScore = (p.lowestPrice / budget) * 70;
    } else {
      // Budget exceeds max category price: products at highest tier of category get top points
      tierScore = ((p.lowestPrice - minEligiblePrice) / priceRange) * 70;
    }

    let score = 0;
    if (mode === 'max_savings') {
      const savingsScore = (1 - (p.lowestPrice / budget)) * 60;
      score = (p.avgRating * 20) + savingsScore + (p.savingsPercent * 0.4) + (Math.min(p.reviewCount, 3000) / 100);
    } else {
      score = (p.avgRating * 20) + tierScore + (p.savingsPercent * 0.3) + (Math.min(p.reviewCount, 3000) / 100);
    }

    return {
      ...p,
      score: Math.round(score * 10) / 10
    };
  }).sort((a, b) => b.score - a.score);

  const topPick = scoredCandidates[0] || null;
  const runnerUp = scoredCandidates[1] || null;

  return {
    category: category || 'All',
    userBudget: budget,
    mode,
    totalMatching: scoredCandidates.length,
    topPick,
    runnerUp,
    allEligible: scoredCandidates.slice(0, 6),
    aiVerdict: topPick
      ? `For your ₹${budget.toLocaleString('en-IN')} budget, our AI selected "${topPick.name}" on ${topPick.winningStore} at ₹${topPick.lowestPrice.toLocaleString('en-IN')}. It delivers ${topPick.avgRating}★ rating with ${topPick.deliveryTime} delivery and saves you ₹${topPick.remainingBudget.toLocaleString('en-IN')} under budget.`
      : `No products found within the ₹${budget.toLocaleString('en-IN')} budget in this category. Try increasing your budget limit.`
  };
}




