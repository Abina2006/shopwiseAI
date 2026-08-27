import { scrapeAndSave, getAllProducts, getProductById, getRelatedProducts, compareProducts } from './product.service.js';
import { analyzeProductReviews } from '../../services/gemini.service.js';
import { addClient, removeClient, broadcastScraperLog, broadcastEvent } from '../../services/realtime.service.js';

/**
 * GET /api/products/live-stream
 * Server-Sent Events (SSE) endpoint for real-time price updates and scraper logs
 */
export function streamLiveUpdates(req, res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Send initial connection handshake
  res.write(`event: connected\ndata: ${JSON.stringify({ message: 'Connected to ShopWise AI Realtime Feed', timestamp: new Date().toLocaleTimeString() })}\n\n`);

  addClient(res);

  req.on('close', () => {
    removeClient(res);
  });
}

/**
 * POST /api/products/scrape
 * Body: { url: "https://..." }
 */
export async function scrapeProduct(req, res) {
  const { url } = req.body;
  if (!url || typeof url !== 'string' || !url.trim()) {
    return res.status(400).json({ success: false, message: 'A valid product URL is required.' });
  }

  const cleanUrl = url.trim();
  broadcastScraperLog(`Received scrape request for: ${cleanUrl}`, 'info');
  broadcastScraperLog(`Initializing Scrapy & Playwright engines...`, 'step');

  try {
    broadcastScraperLog(`Extracting DOM elements and Schema.org metadata...`, 'step');
    const results = await scrapeAndSave(cleanUrl);

    if (!results.length) {
      broadcastScraperLog(`Could not extract product structure from URL`, 'error');
      const domain = new URL(cleanUrl).hostname.toLowerCase();
      const isProtected = ['meesho.com', 'amazon.in', 'amazon.com', 'flipkart.com', 'myntra.com']
        .some(d => domain.includes(d));

      const message = isProtected
        ? `${domain} uses enterprise bot protection (Akamai/Cloudflare) that blocks all automated scrapers — including real headless browsers. Try a product URL from a Shopify store, WooCommerce site, or any non-protected e-commerce site.`
        : 'Could not extract product data from this URL. The site may require login, use heavy JavaScript, or block automated access.';

      return res.status(422).json({ success: false, message, protected: isProtected });
    }

    const primaryItem = results[0];
    const priceVal = primaryItem?.listing?.price || primaryItem?.product?.listings?.[0]?.price || primaryItem?.price || '0';
    broadcastScraperLog(`Successfully scraped ${primaryItem?.product?.name || 'Product'} (₹${Number(priceVal).toLocaleString('en-IN')})`, 'success');
    
    // Broadcast live event to update all frontend product lists instantly
    broadcastEvent('new-product-scraped', {
      product: primaryItem?.product,
      listing: primaryItem,
    });

    // Fetch relatable products for the scraped item
    const relatedProducts = await getRelatedProducts({
      category: primaryItem?.product?.category,
      name: primaryItem?.product?.name,
      excludeId: primaryItem?.product?.id,
    });

    return res.status(200).json({ 
      success: true, 
      count: results.length, 
      data: results,
      relatedProducts,
    });
  } catch (err) {
    broadcastScraperLog(`Scraping exception: ${err.message}`, 'error');
    return res.status(500).json({ success: false, message: err.message || 'Internal scraping error.' });
  }
}

/**
 * GET /api/products
 * Query: ?search=&category=
 */
export async function listProducts(req, res) {
  try {
    const { search, category } = req.query;
    const products = await getAllProducts({ search, category });
    return res.status(200).json({ success: true, count: products.length, data: products });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * GET /api/products/compare?ids=id1,id2,id3
 */
export async function getComparison(req, res) {
  try {
    const idsQuery = req.query.ids || '';
    const ids = idsQuery.split(',').map(id => id.trim()).filter(Boolean);

    if (ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide product IDs to compare.' });
    }

    const comparisonData = await compareProducts(ids);
    return res.status(200).json({ success: true, count: comparisonData.length, data: comparisonData });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * GET /api/products/:id
 */
export async function getProduct(req, res) {
  try {
    const product = await getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }
    return res.status(200).json({ success: true, data: product });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * GET /api/products/:id/ai-summary
 */
export async function getProductAISummary(req, res) {
  try {
    const product = await getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const allReviews = (product.listings || []).flatMap(l => l.reviews || []);
    const aiAnalysis = await analyzeProductReviews(product.name, allReviews, product.listings);

    return res.status(200).json({ success: true, data: aiAnalysis });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'AI summary generation failed.' });
  }
}

/**
 * POST /api/products/:id/sync-live-price
 * Syncs real-time live market prices for a single product across Meesho, Flipkart, Amazon, Croma
 */
export async function syncProductPriceHandler(req, res) {
  try {
    const { id } = req.params;
    const { syncProductLivePrices } = await import('../../services/livePriceSync.service.js');
    const result = await syncProductLivePrices(id);
    return res.status(200).json({
      success: true,
      message: 'Live market prices synced successfully!',
      data: result
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * POST /api/products/sync-all-live
 * Syncs real-time live market prices for all products in catalog
 */
export async function syncAllProductsHandler(req, res) {
  try {
    const { syncAllProductsLivePrices } = await import('../../services/livePriceSync.service.js');
    const results = await syncAllProductsLivePrices();
    return res.status(200).json({
      success: true,
      message: `Successfully synced live prices for ${results.length} products!`,
      count: results.length,
      data: results
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * GET /api/products/:id/smart-advisor
 * Returns AI Smart Shopping Assistant verdict, 30-day price history graph data, and price drop prediction
 */
export async function getSmartAdvisorHandler(req, res) {
  try {
    const { id } = req.params;
    const { getSmartShoppingAdvice } = await import('../../services/aiShoppingAssistant.service.js');
    const advice = await getSmartShoppingAdvice(id);
    return res.status(200).json({
      success: true,
      data: advice
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * POST /api/products/:id/price-alert
 * Body: { targetPrice, email }
 */
export async function createPriceAlertHandler(req, res) {
  try {
    const { id } = req.params;
    const { targetPrice, email } = req.body;
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const product = await prisma.product.findUnique({
      where: { id },
      include: { listings: true }
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const primaryListing = product.listings[0];
    if (!primaryListing) {
      return res.status(400).json({ success: false, message: 'No store listings available for this product.' });
    }

    // Find or create anonymous or registered user
    let user = await prisma.user.findFirst({ where: { email: email || 'shopper@shopwise.ai' } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          name: email ? email.split('@')[0] : 'ShopWise Shopper',
          email: email || `shopper_${Date.now()}@shopwise.ai`,
          passwordHash: '$2a$10$dummyHashForAlertUser1234567890'
        }
      });
    }

    const alert = await prisma.priceAlert.create({
      data: {
        userId: user.id,
        listingId: primaryListing.id,
        targetPrice: parseFloat(targetPrice) || parseFloat(primaryListing.price) * 0.9,
        isActive: true
      }
    });

    return res.status(201).json({
      success: true,
      message: `Price drop alert activated for ₹${Number(alert.targetPrice).toLocaleString('en-IN')}!`,
      data: alert
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * GET /api/products/budget-advisor
 * Query: ?category=Audio&budget=1500
 */
export async function getBudgetAdvisorHandler(req, res) {
  try {
    const { category, budget, mode } = req.query;
    const { getBudgetRecommendations } = await import('./product.service.js');
    const result = await getBudgetRecommendations({ category, maxBudget: budget, mode });
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}



