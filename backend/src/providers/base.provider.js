/**
 * Base Provider Interface for ShopWise AI product providers.
 * Every platform provider (Amazon, Flipkart, Meesho) must extend this class.
 *
 * Interface contract:
 *   - searchProducts(query: string): Promise<NormalizedProduct[]>
 *   - getProductDetails(productId: string): Promise<NormalizedProduct | null>
 *
 * NormalizedProduct schema:
 * {
 *   name, platform, price, original_price, discount, currency,
 *   rating, review_count, seller, delivery_info, image_url,
 *   product_url, availability, source
 * }
 */
export class BaseProvider {
  constructor(name) {
    this.name = name;
  }

  /**
   * Search for products matching the query on this platform.
   * @param {string} query - Search term e.g. "wireless headphones"
   * @returns {Promise<NormalizedProduct[]>}
   */
  async searchProducts(query) { // eslint-disable-line no-unused-vars
    throw new Error(`${this.name}.searchProducts() is not implemented.`);
  }

  /**
   * Get detailed information for a single product.
   * @param {string} productId - Platform-specific product identifier
   * @returns {Promise<NormalizedProduct|null>}
   */
  async getProductDetails(productId) { // eslint-disable-line no-unused-vars
    throw new Error(`${this.name}.getProductDetails() is not implemented.`);
  }

  /**
   * Helper: normalize a raw product object into the standard schema.
   * Each provider should call this before returning results.
   */
  normalize(raw) {
    const price = parseFloat(raw.price) || 0;
    const originalPrice = parseFloat(raw.original_price || raw.originalPrice) || price;
    const discount = originalPrice > price
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : (parseFloat(raw.discount || raw.discount_percentage || raw.discountPercentage) || 0);

    return {
      name: (raw.name || '').trim(),
      platform: raw.platform || this.name,
      price,
      original_price: originalPrice,
      discount,
      discount_percentage: discount,
      currency: raw.currency || 'INR',
      rating: parseFloat(raw.rating) || 0,
      review_count: parseInt(raw.review_count || raw.reviewCount, 10) || 0,
      seller: raw.seller || raw.sellerName || this.name,
      delivery_info: raw.delivery_info || raw.deliveryTime || '3-5 Days',
      image_url: raw.image_url || raw.imageUrl || '',
      product_url: raw.product_url || raw.productUrl || raw.sellerUrl || '',
      availability: raw.availability || 'In Stock',
      in_stock: raw.in_stock !== undefined ? Boolean(raw.in_stock) : (raw.availability ? !raw.availability.toLowerCase().includes('out of stock') : true),
      source: this.name,
      brand: raw.brand || '',
      category: raw.category || 'General',
      description: raw.description || '',
    };
  }

  /**
   * Helper: Generate a realistic mock product for arbitrary queries
   */
  generateMockProduct(query, variant = 'Standard') {
    const q = query.toLowerCase();
    
    // Determine realistic price range based on keywords
    let minPrice = 500;
    let maxPrice = 3000;
    
    // Default generic product image: Uses placehold.co to generate a clean image with the exact product name
    const fallbackText = query.substring(0, 15);
    let imageUrl = `https://placehold.co/600x600/2c3e50/ecf0f1?text=${encodeURIComponent(fallbackText)}`; 

    if (q.includes('apple') || q.includes('iphone') || q.includes('mac') || q.includes('s24')) {
      minPrice = 50000; maxPrice = 150000;
      imageUrl = q.includes('mac') ? "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=600" : "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?q=80&w=600";
    } else if (q.includes('phone') || q.includes('mobile') || q.includes('smartphone')) {
      minPrice = 10000; maxPrice = 40000;
      imageUrl = "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=600";
    } else if (q.includes('laptop') || q.includes('computer') || q.includes('pc')) {
      minPrice = 30000; maxPrice = 90000;
      imageUrl = "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?q=80&w=600";
    } else if (q.includes('headphone') || q.includes('earbud') || q.includes('earphone') || q.includes('airpod')) {
      minPrice = 1500; maxPrice = 25000;
      imageUrl = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=600"; // Headphones
    } else if (q.includes('watch') || q.includes('smartwatch')) {
      minPrice = 2000; maxPrice = 35000;
      imageUrl = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=600";
    } else if (q.includes('shoe') || q.includes('sneaker') || q.includes('boot')) {
      minPrice = 1000; maxPrice = 8000;
      imageUrl = "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=600";
    } else if (q.includes('shirt') || q.includes('tshirt') || q.includes('clothing')) {
      minPrice = 300; maxPrice = 2000;
      imageUrl = "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=600";
    } else if (q.includes('bottle') || q.includes('flask') || q.includes('water')) {
      minPrice = 200; maxPrice = 1500;
      imageUrl = "https://images.unsplash.com/photo-1602143407151-7111542de6e8?q=80&w=600"; // Water bottle
    } else if (q.includes('bag') || q.includes('backpack')) {
      minPrice = 500; maxPrice = 3000;
      imageUrl = "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=600"; // Backpack
    } else if (q.includes('coffee') || q.includes('maker') || q.includes('espresso')) {
      minPrice = 1000; maxPrice = 15000;
      imageUrl = "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?q=80&w=600"; // Coffee maker
    }

    const price = Math.floor(Math.random() * (maxPrice - minPrice)) + minPrice;
    
    // Capitalize query
    const title = query.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    return {
      name: `${title} - ${variant}`,
      price: price,
      original_price: Math.floor(price * (1 + (Math.random() * 0.4 + 0.1))), // 10-50% original markup
      product_url: `https://${this.name.toLowerCase()}.in/search?q=${encodeURIComponent(query)}`,
      image_url: imageUrl,
      rating: (Math.random() * 1.5 + 3.5).toFixed(1),
      reviews: Math.floor(Math.random() * 10000) + 50
    };
  }
}

export default BaseProvider;

