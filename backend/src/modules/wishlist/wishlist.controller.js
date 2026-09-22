import prisma from '../../config/db.js';


/**
 * GET /api/wishlist
 * Query: ?userId=...
 */
export async function getWishlist(req, res) {
  try {
    const { userId } = req.query;
    
    // Find matching user or fallback to first test user
    let user = null;
    if (userId) {
      user = await prisma.user.findUnique({ where: { id: userId } });
    }
    if (!user) {
      user = await prisma.user.findFirst();
    }

    if (!user) {
      return res.status(200).json({ success: true, data: [] });
    }

    const items = await prisma.wishlist.findMany({
      where: { userId: user.id },
      include: {
        product: {
          include: {
            listings: {
              orderBy: { price: 'asc' },
              include: {
                priceHistory: {
                  orderBy: { recordedAt: 'desc' },
                  take: 3
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formatted = items.map(w => {
      const bestListing = w.product.listings?.[0] || null;
      const currentPrice = bestListing ? parseFloat(bestListing.price) : 0;
      
      // Look for a distinct historical price in the last 3 recordings
      let previousPrice = null;
      if (bestListing?.priceHistory && bestListing.priceHistory.length > 1) {
        // Look for the most recent historical recording before the current one
        const pastHist = bestListing.priceHistory.slice(1).find(h => parseFloat(h.price) > 0);
        if (pastHist) {
          previousPrice = parseFloat(pastHist.price);
        }
      }

      let priceChange = null;
      if (previousPrice !== null && previousPrice > 0 && currentPrice > 0) {
        const diff = Math.round(previousPrice - currentPrice);
        if (diff > 0) {
          priceChange = {
            type: 'dropped',
            amount: diff,
            previousPrice,
            currentPrice,
            text: `Price dropped by ₹${diff.toLocaleString('en-IN')}`
          };
        } else if (diff < 0) {
          const increase = Math.abs(diff);
          priceChange = {
            type: 'increased',
            amount: increase,
            previousPrice,
            currentPrice,
            text: `Price increased by ₹${increase.toLocaleString('en-IN')}`
          };
        } else {
          priceChange = {
            type: 'unchanged',
            amount: 0,
            previousPrice,
            currentPrice,
            text: 'Price unchanged'
          };
        }
      }

      return {
        id: w.id,
        productId: w.productId,
        createdAt: w.createdAt,
        priceChange,
        product: {
          id: w.product.id,
          name: w.product.name,
          category: w.product.category,
          brand: w.product.brand,
          imageUrl: w.product.imageUrl,
          lowestPrice: currentPrice,
          previousPrice: previousPrice,
          lowestSeller: bestListing?.sellerName || 'Best Store',
          priceChange,
          listings: w.product.listings
        }
      };
    });

    return res.status(200).json({
      success: true,
      count: formatted.length,
      data: formatted
    });
  } catch (err) {
    console.error('Error fetching wishlist:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * POST /api/wishlist
 * Body: { productId, userId }
 */
export async function addToWishlist(req, res) {
  try {
    const { productId, userId } = req.body;
    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required.' });
    }

    let user = null;
    if (userId) {
      user = await prisma.user.findUnique({ where: { id: userId } });
    }
    if (!user) {
      user = await prisma.user.findFirst();
    }

    if (!user) {
      return res.status(400).json({ success: false, message: 'User not found.' });
    }

    // Check if already in wishlist
    let item = await prisma.wishlist.findUnique({
      where: {
        userId_productId: {
          userId: user.id,
          productId: productId
        }
      }
    });

    if (!item) {
      item = await prisma.wishlist.create({
        data: {
          userId: user.id,
          productId: productId
        }
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Product added to wishlist!',
      data: item
    });
  } catch (err) {
    console.error('Error adding to wishlist:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * DELETE /api/wishlist/:productId
 * Query or Body: { userId }
 */
export async function removeFromWishlist(req, res) {
  try {
    const { productId } = req.params;
    const userId = req.query.userId || req.body.userId;

    let user = null;
    if (userId) {
      user = await prisma.user.findUnique({ where: { id: userId } });
    }
    if (!user) {
      user = await prisma.user.findFirst();
    }

    if (!user) {
      return res.status(400).json({ success: false, message: 'User not found.' });
    }

    await prisma.wishlist.deleteMany({
      where: {
        userId: user.id,
        productId: productId
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Product removed from wishlist.'
    });
  } catch (err) {
    console.error('Error removing from wishlist:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
}
