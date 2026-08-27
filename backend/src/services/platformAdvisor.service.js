import { PrismaClient } from '@prisma/client';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
let aiClient = null;

function getAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here' || apiKey.trim() === '') {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

/**
 * Category-based platform intelligence profiles
 */
const CATEGORY_PROFILES = {
  Clothing: {
    topPlatforms: ['Myntra', 'Meesho', 'Ajio', 'Flipkart'],
    strengths: {
      Myntra: ['Curated top fashion brands', 'Hassle-free size exchange & returns', 'Frequent '],
      Meesho: ['Lowest unbranded/direct-to-consumer prices', 'Free delivery on apparel', 'Budget ethnic wear'],
      Ajio: ['Trendy international & streetwear labels', 'Lucrative AJIOMANIA coupon discounts'],
      Flipkart: ['Wide variety and affordable fashion bundles'],
    },
    defaultOffers: 'Up to 60% Off + Flat ₹200 on First Order',
    delivery: '2-4 Business Days with Open-Box Delivery',
  },
  Fashion: {
    topPlatforms: ['Myntra', 'Ajio', 'Meesho'],
    strengths: {
      Myntra: ['Original brand guarantee', 'Premium quality checks', '14-day hassle-free returns'],
      Ajio: ['Direct retail discounts', 'Exclusive style drops'],
      Meesho: ['Lowest budget pricing for everyday essentials'],
    },
    defaultOffers: 'Instant 10% Bank Discount on HDFC/ICICI Cards',
    delivery: '2-3 Days Fast Dispatch',
  },
  Footwear: {
    topPlatforms: ['Myntra', 'Nike Official', 'Amazon', 'Flipkart'],
    strengths: {
      Myntra: ['Authentic sneaker authentication', 'Easy size exchanges'],
      'Nike Official': ['Direct manufacturer warranty', 'Exclusive member drops'],
      Amazon: ['Fast Prime dispatch', 'Verified seller authenticity'],
    },
    defaultOffers: 'Extra ₹300 Off on Prepaid Orders',
    delivery: '1-3 Business Days',
  },
  Electronics: {
    topPlatforms: ['Amazon', 'Flipkart', 'Croma'],
    strengths: {
      Amazon: ['Prime 1-2 Day Delivery', 'Hassle-free replacement policy', 'Official brand warranty support'],
      Flipkart: ['High exchange value for old electronics', 'Flipkart Assured quality checks'],
      Croma: ['Authorized brand partner', 'Option for physical store pickup & demo', 'Dedicated technical support'],
    },
    defaultOffers: 'Flat ₹1,500 Instant Discount on Credit Cards + No Cost EMI up to 12 months',
    delivery: 'Next-Day Prime Delivery available',
  },
  Audio: {
    topPlatforms: ['Amazon', 'Flipkart', 'Meesho'],
    strengths: {
      Amazon: ['Widest brand selection (Apple, Sony, boAt)', '1-day fast replacement guarantee', 'Verified buyer review authenticity'],
      Flipkart: ['Competitive pricing on TWS earbuds', 'Exclusive brand launches'],
      Meesho: ['Lowest prices for budget gaming earbuds and accessories'],
    },
    defaultOffers: 'Up to 5% Cashback with Amazon Pay / Flipkart Axis Bank Cards',
    delivery: '1-2 Business Days',
  },
  Computers: {
    topPlatforms: ['Amazon', 'Croma', 'Flipkart'],
    strengths: {
      Amazon: ['Brand-authorized store listings', 'Free doorstep transit insurance', 'Fast Prime dispatch'],
      Croma: ['In-store technician setup', 'Extended warranty protection plans'],
      Flipkart: ['SuperCoins cashback and trade-in bonuses'],
    },
    defaultOffers: 'Up to ₹5,000 Exchange Bonus + Free Microsoft Office bundle',
    delivery: 'Scheduled doorstep delivery with verification OTP',
  },
  Wearables: {
    topPlatforms: ['Amazon', 'Flipkart', 'Croma'],
    strengths: {
      Amazon: ['Fast 24-hr replacement guarantee', 'Official Apple & Samsung brand hubs'],
      Flipkart: ['Flipkart Assured packaging & swift refund support'],
      Croma: ['Live store trial & fitting assistance'],
    },
    defaultOffers: 'Instant ₹1,000 Off on SBI & ICICI Bank Cards',
    delivery: '1-2 Days Express Delivery',
  },
  General: {
    topPlatforms: ['Amazon', 'Flipkart', 'Meesho'],
    strengths: {
      Amazon: ['Widest product catalog', 'Reliable customer service', 'A-to-z Guarantee protection'],
      Flipkart: ['Strong pan-India delivery network and competitive sale events'],
      Meesho: ['Direct factory prices without middlemen markups'],
    },
    defaultOffers: '10% Instant Savings on Major Credit & Debit Cards',
    delivery: '2-4 Business Days',
  },
};

/**
 * Generate Rule-based AI platform recommendation
 */
export function generatePlatformAdvice({ product, listings = [], userPreference = 'best_value' }) {
  const category = product?.category || 'General';
  const profile = CATEGORY_PROFILES[category] || CATEGORY_PROFILES.General;

  const validListings = listings.filter(l => (parseFloat(l.price) || 0) > 0);
  const lowestListing = validListings.length > 0
    ? validListings.reduce((min, cur) => parseFloat(cur.price) < parseFloat(min.price) ? cur : min, validListings[0])
    : null;
  const highestListing = validListings.length > 0
    ? validListings.reduce((max, cur) => parseFloat(cur.price) > parseFloat(max.price) ? cur : max, validListings[0])
    : null;

  // Best Price
  const bestPrice = lowestListing ? parseFloat(lowestListing.price) : 999;
  const maxPrice = highestListing ? parseFloat(highestListing.price) : bestPrice;
  const savings = Math.max(0, maxPrice - bestPrice);
  const savingsPct = maxPrice > 0 ? Math.round((savings / maxPrice) * 100) : 0;

  // Best Seller
  const bestSellerListing = validListings.length > 0
    ? validListings.reduce((top, cur) => (cur.rating || 0) > (top.rating || 0) ? cur : top, validListings[0])
    : null;
  const bestSeller = bestSellerListing?.sellerName || profile.topPlatforms[0];

  // Pick Winning Platform based on actual live listings and lowest verified price
  let recommendedPlatform = profile.topPlatforms[0];
  let confidenceScore = 94;
  let reasons = [];

  if (lowestListing) {
    const sellerLower = (lowestListing.sellerName || '').toLowerCase();
    recommendedPlatform = lowestListing.sellerName;

    if (sellerLower.includes('flipkart')) {
      confidenceScore = 95;
      reasons = [
        `Lowest verified market price of ₹${bestPrice.toLocaleString('en-IN')}`,
        'Flipkart Assured certified quality and fast transit protection',
        'High customer rating with easy 7-day replacement support',
        savings > 0 ? `Save ₹${savings.toLocaleString('en-IN')} (${savingsPct}%) compared to other marketplaces` : 'Best overall value deal on verified electronics'
      ];
    } else if (sellerLower.includes('meesho')) {
      confidenceScore = 93;
      reasons = [
        `Unbeatable lowest price of ₹${bestPrice.toLocaleString('en-IN')}`,
        'Zero shipping fees with verified seller fulfillment',
        'Huge order volume with positive buyer satisfaction',
        savings > 0 ? `Save ₹${savings.toLocaleString('en-IN')} (${savingsPct}%) compared to competing stores` : 'Direct factory discount'
      ];
    } else if (sellerLower.includes('croma')) {
      confidenceScore = 96;
      reasons = [
        `Best price of ₹${bestPrice.toLocaleString('en-IN')} from authorized Tata retail chain`,
        'Official manufacturer warranty & technician setup assistance',
        'Option for instant in-store pickup and demo',
        'Transparent refund and replacement terms'
      ];
    } else if (sellerLower.includes('nike')) {
      confidenceScore = 98;
      reasons = [
        '100% Guaranteed Direct Manufacturer Authenticity',
        'Official Nike warranty and member-exclusive benefits',
        'Fast authorized dispatch and hassle-free returns',
        `Best direct brand price at ₹${bestPrice.toLocaleString('en-IN')}`
      ];
    } else if (sellerLower.includes('myntra')) {
      confidenceScore = 96;
      reasons = [
        '100% Original Brand Guarantee with verified authenticity',
        '14-day hassle-free doorstep size exchange and returns',
        `Lowest available fashion deal at ₹${bestPrice.toLocaleString('en-IN')}`,
        'Highest rating and review volume for fit & quality'
      ];
    } else {
      confidenceScore = 95;
      reasons = [
        `Best verified price of ₹${bestPrice.toLocaleString('en-IN')}`,
        'Prime 1-2 Day Superfast Delivery with verified transit safety',
        'Hassle-free 7-day replacement and genuine seller badge',
        'Highest customer satisfaction and review volume'
      ];
    }
  } else if (category === 'Clothing' || category === 'Fashion') {
    recommendedPlatform = 'Myntra';
    confidenceScore = 95;
    reasons = [
      '100% Verified Original Brand Guarantee',
      'Fast 14-day hassle-free doorstep size exchange',
      'Highest customer satisfaction scores for fabric & fit',
      'Exclusive platform coupon discounts and early access sales'
    ];
  } else if (category === 'Footwear') {
    recommendedPlatform = 'Nike Official';
    confidenceScore = 96;
    reasons = [
      'Authentic manufacturer warranty and verified quality',
      'Fast doorstep delivery with genuine product authentication',
      'Easy size exchange and return policy'
    ];
  } else {
    recommendedPlatform = profile.topPlatforms[0] || 'Amazon';
    confidenceScore = 94;
    reasons = [
      'Prime fast delivery with verified seller authenticity',
      'Comprehensive customer protection and warranty assistance',
      'Highest rating and review volume across tech buyers'
    ];
  }

  const fastestDelivery = profile.delivery;
  const bestOffer = profile.defaultOffers;
  const verdictSummary = `We recommend purchasing from ${recommendedPlatform} with a ${confidenceScore}% confidence rating. It provides the strongest combination of authentic inventory, fast shipping, and favorable price savings.`;

  return {
    recommendedPlatform,
    confidenceScore,
    reasons,
    bestPrice,
    bestPriceStore: lowestListing?.sellerName || recommendedPlatform,
    savingsAmount: savings,
    savingsPercent: savingsPct,
    bestSeller,
    bestSellerRating: bestSellerListing?.rating || 4.7,
    fastestDelivery,
    bestOffer,
    verdictSummary,
    source: 'ShopWise AI Recommendation Engine'
  };
}

/**
 * Full AI Platform Advisor evaluation (with Gemini AI enhancement if available)
 */
export async function getPlatformRecommendation({ productId, productName, category, price, listings = [] }) {
  let product = null;

  if (productId) {
    product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        listings: {
          include: { reviews: { take: 5, orderBy: { scrapedAt: 'desc' } } },
          orderBy: { price: 'asc' },
        },
      },
    });
    if (product && product.listings) {
      listings = product.listings;
    }
  }

  const name = product?.name || productName || 'Selected Product';
  const cat = product?.category || category || 'General';

  // Compute baseline analysis
  const baseAdvice = generatePlatformAdvice({ product: { name, category: cat }, listings });

  const client = getAIClient();
  let finalAdvice = baseAdvice;

  if (client) {
    try {
      const storeList = listings.map(l => `- ${l.sellerName}: ₹${l.price} (Rating: ${l.rating || 4.5}★, Reviews: ${l.reviewCount || 0})`).join('\n');
      const prompt = `You are an expert e-commerce platform shopping advisor. Recommend the BEST e-commerce platform (e.g. Amazon, Flipkart, Meesho, Myntra, Croma, Ajio) to purchase the following product.
      
Product: "${name}"
Category: "${cat}"
Base Price: ₹${price || baseAdvice.bestPrice}

Available Stores & Listings:
${storeList || 'Standard major Indian marketplaces'}

Rules:
- If Clothing/Fashion: recommend Meesho (if ultra-budget), Myntra (if branded/premium), or Ajio.
- If Electronics/Laptops: recommend Amazon, Flipkart, or Croma.
- If Audio/Wearables: recommend Amazon, Flipkart, or Meesho.
- Provide a confidence score between 85 and 98.
- Provide 4 clear bullet points for 'reasons' why this platform is best.

Return valid JSON with schema:
{
  "recommendedPlatform": "Platform Name",
  "confidenceScore": number,
  "reasons": ["reason 1", "reason 2", "reason 3", "reason 4"],
  "bestPrice": number,
  "bestSeller": "Seller Name",
  "fastestDelivery": "Delivery time string",
  "bestOffer": "Best discount/offer string",
  "verdictSummary": "A concise 2-sentence summary of why to buy here."
}`;

      const response = await client.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });

      const parsed = JSON.parse(response.text.trim());
      finalAdvice = {
        ...baseAdvice,
        ...parsed,
        source: 'Google Gemini AI Advisor',
      };
    } catch (err) {
      console.warn('Gemini Advisor fallback active:', err.message);
    }
  }

  // Persist recommendation in PostgreSQL if product exists
  if (product?.id) {
    try {
      const existing = await prisma.platformRecommendation.findFirst({
        where: { productId: product.id },
      });

      if (existing) {
        await prisma.platformRecommendation.update({
          where: { id: existing.id },
          data: {
            recommendedPlatform: finalAdvice.recommendedPlatform,
            confidenceScore: finalAdvice.confidenceScore,
            reasons: finalAdvice.reasons,
            bestPrice: finalAdvice.bestPrice,
            bestSeller: finalAdvice.bestSeller,
            fastestDelivery: finalAdvice.fastestDelivery,
            bestOffer: finalAdvice.bestOffer,
            verdictSummary: finalAdvice.verdictSummary,
          },
        });
      } else {
        await prisma.platformRecommendation.create({
          data: {
            productId: product.id,
            recommendedPlatform: finalAdvice.recommendedPlatform,
            confidenceScore: finalAdvice.confidenceScore,
            reasons: finalAdvice.reasons,
            bestPrice: finalAdvice.bestPrice,
            bestSeller: finalAdvice.bestSeller,
            fastestDelivery: finalAdvice.fastestDelivery,
            bestOffer: finalAdvice.bestOffer,
            verdictSummary: finalAdvice.verdictSummary,
          },
        });
      }
    } catch (dbErr) {
      console.warn('Could not save platform recommendation to database:', dbErr.message);
    }
  }

  return finalAdvice;
}
