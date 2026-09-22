/**
 * Meesho Product Provider for ShopWise AI.
 *
 * NOTE: Meesho has no public product API. This provider returns curated mock
 * data. Meesho specializes in fashion, lifestyle, and low-cost consumer goods.
 *
 * Env var: MEESHO_API_KEY (placeholder — not used, no official API exists)
 */

import { BaseProvider } from './base.provider.js';

const MOCK_CATALOG = {
  'headphone': [
    {
      name: 'boAt Rockerz 450 Bluetooth On-Ear Headphones',
      brand: 'boAt', category: 'Audio',
      price: 898, original_price: 2990, discount: 70, rating: 3.9, review_count: 22000,
      seller: 'MeeshoPro Store', delivery_info: '5-7 Days',
      image_url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?q=80&w=600',
      product_url: 'https://www.meesho.com/search?q=boat+rockerz+450',
      availability: 'In Stock',
    },
    {
      name: 'Hoppup ArcX Gaming Headphones (3.5mm, LED)',
      brand: 'Hoppup', category: 'Audio',
      price: 499, original_price: 1499, discount: 67, rating: 3.7, review_count: 5100,
      seller: 'TechBuy Meesho', delivery_info: '5-7 Days',
      image_url: 'https://images.unsplash.com/photo-1574920162043-b872873f19c8?q=80&w=600',
      product_url: 'https://www.meesho.com/search?q=hoppup+arcx+gaming',
      availability: 'In Stock',
    },
    {
      name: 'Sony WH-CH720N Wireless Noise Cancelling Headphones',
      brand: 'Sony', category: 'Audio',
      price: 8499, original_price: 12990, discount: 35, rating: 4.2, review_count: 3100,
      seller: 'ElectroHub', delivery_info: '5-7 Days',
      image_url: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?q=80&w=600',
      product_url: 'https://www.meesho.com/search?q=sony+wh-ch720n',
      availability: 'In Stock',
    },
  ],
  'earbud': [
    {
      name: 'boAt Airdopes 141 TWS Earbuds',
      brand: 'boAt', category: 'Audio',
      price: 799, original_price: 2990, discount: 73, rating: 3.9, review_count: 48000,
      seller: 'MeeshoPro Store', delivery_info: '5-7 Days',
      image_url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?q=80&w=600',
      product_url: 'https://www.meesho.com/search?q=boat+airdopes+141',
      availability: 'In Stock',
    },
    {
      name: 'Hoppup XO3 Gaming Earbuds (35ms Low Latency)',
      brand: 'Hoppup', category: 'Audio',
      price: 699, original_price: 1999, discount: 65, rating: 3.8, review_count: 9200,
      seller: 'TechBuy Meesho', delivery_info: '5-7 Days',
      image_url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?q=80&w=600',
      product_url: 'https://www.meesho.com/search?q=hoppup+xo3+gaming',
      availability: 'In Stock',
    },
  ],
  'phone': [
    {
      name: 'Redmi Note 13 (128GB, 6GB RAM)',
      brand: 'Redmi', category: 'Smartphones',
      price: 14499, original_price: 18999, discount: 24, rating: 4.1, review_count: 6700,
      seller: 'PhoneBazaar', delivery_info: '5-7 Days',
      image_url: 'https://images.unsplash.com/photo-1512499617640-c2f999108c72?q=80&w=600',
      product_url: 'https://www.meesho.com/search?q=redmi+note+13',
      availability: 'In Stock',
    },
  ],
  'watch': [
    {
      name: 'Noise ColorFit Ultra 3 Smartwatch (46mm AMOLED)',
      brand: 'Noise', category: 'Wearables',
      price: 2599, original_price: 7999, discount: 68, rating: 3.8, review_count: 11200,
      seller: 'GadgetHub', delivery_info: '5-7 Days',
      image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=600',
      product_url: 'https://www.meesho.com/search?q=noise+colorfit+ultra+3',
      availability: 'In Stock',
    },
  ],
  'kurti': [
    {
      name: 'Cotton Printed Straight Kurti (Women, XS-3XL)',
      brand: 'FashionHub', category: 'Fashion',
      price: 299, original_price: 899, discount: 67, rating: 4.0, review_count: 32000,
      seller: 'FashionHub Meesho', delivery_info: '5-7 Days',
      image_url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=600',
      product_url: 'https://www.meesho.com/search?q=cotton+kurti',
      availability: 'In Stock',
    },
  ],
  'default': [
    {
      name: 'boAt Airdopes 141 TWS Earbuds',
      brand: 'boAt', category: 'Audio',
      price: 799, original_price: 2990, discount: 73, rating: 3.9, review_count: 48000,
      seller: 'MeeshoPro Store', delivery_info: '5-7 Days',
      image_url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?q=80&w=600',
      product_url: 'https://www.meesho.com/search?q=boat+airdopes+141',
      availability: 'In Stock',
    },
    {
      name: 'Hoppup XO3 Gaming Earbuds',
      brand: 'Hoppup', category: 'Audio',
      price: 699, original_price: 1999, discount: 65, rating: 3.8, review_count: 9200,
      seller: 'TechBuy Meesho', delivery_info: '5-7 Days',
      image_url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?q=80&w=600',
      product_url: 'https://www.meesho.com/search?q=hoppup+xo3',
      availability: 'In Stock',
    },
  ],
};

class MeeshoProvider extends BaseProvider {
  constructor() {
    super('Meesho');
    this.apiKey = process.env.MEESHO_API_KEY || null;
  }

  async searchProducts(query) {
    if (this.apiKey) {
      console.log('[Meesho] API key detected (no official API exists — using mock).');
    }
    return this._mockSearch(query);
  }

  async getProductDetails(productId) {
    const all = Object.values(MOCK_CATALOG).flat();
    const match = all.find(p => p.product_url.includes(productId));
    return match ? this.normalize({ ...match, platform: 'Meesho' }) : null;
  }

  _mockSearch(query) {
    const q = query.toLowerCase();
    
    // Meesho: Exclude premium electronics completely
    const premiumKeywords = ['laptop', 'macbook', 'iphone', 'samsung galaxy', 'ps5', 'playstation', 'tablet', 'ipad', 'camera', 'dslr', 'tv', 'television', 'airpods', 'oneplus'];
    if (premiumKeywords.some(kw => q.includes(kw))) {
      return []; // Not available on Meesho
    }

    let products = [];

    for (const [keyword, items] of Object.entries(MOCK_CATALOG)) {
      if (keyword !== 'default' && q.includes(keyword)) {
        products = [...products, ...items];
      }
    }

    if (products.length === 0) {
      const queryWords = q.split(/\s+/).filter(w => w.length > 3);
      for (const item of Object.values(MOCK_CATALOG).flat()) {
        const nameWords = item.name.toLowerCase().split(/\s+/);
        const hasMatch = queryWords.some(w => nameWords.some(nw => nw.includes(w) || w.includes(nw)));
        if (hasMatch && !products.includes(item)) {
          products.push(item);
        }
      }
    }

    // If no hardcoded matches, dynamically generate realistic-looking variants
    if (products.length === 0) {
      const p1 = this.generateMockProduct(query, "Premium Edition");
      p1.name = `Premium ${query.charAt(0).toUpperCase() + query.slice(1)} (Trusted Seller)`;
      
      const p2 = this.generateMockProduct(query, "Standard Edition");
      p2.name = `${query.charAt(0).toUpperCase() + query.slice(1)} - Standard Pack`;
      p2.price = Math.floor(p1.price * 0.72);
      p2.original_price = Math.floor(p1.original_price * 0.72);
      
      const p3 = this.generateMockProduct(query, "Value Pack");
      p3.name = `${query.charAt(0).toUpperCase() + query.slice(1)} (Factory Outlet)`;
      p3.price = Math.floor(p1.price * 0.45);
      p3.original_price = Math.floor(p1.original_price * 0.45);
      
      products = [p1, p2, p3];
    }

    const seen = new Set();
    const unique = products.filter(p => {
      if (seen.has(p.name)) return false;
      seen.add(p.name);
      return true;
    });

    return unique.map(p => this.normalize({ ...p, platform: 'Meesho' }));
  }
}

export default new MeeshoProvider();
