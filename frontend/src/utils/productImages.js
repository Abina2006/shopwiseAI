/**
 * Helper to get accurate visual icons, gradient themes, and reliable images for products.
 * Guarantees that soaps never show watches, laptops never show shoes, etc.
 */

export function getProductVisual(product = {}) {
  const name = (product.name || '').toLowerCase();
  const brand = (product.brand || '').toLowerCase();
  const category = (product.category || '').toLowerCase();

  // 1. Soaps & Personal Care
  if (name.includes('dove') || brand.includes('dove')) {
    return {
      emoji: '🧼',
      tag: 'Dove Beauty Bar',
      badgeColor: 'from-blue-600 to-indigo-800',
      bgGradient: 'from-blue-950/80 via-slate-900 to-slate-950',
      textColor: 'text-blue-300',
      desc: '1/4 Moisturizing Cream White Bathing Bar',
      fallbackImg: 'https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?q=80&w=600'
    };
  }

  if (name.includes('dettol') || brand.includes('dettol')) {
    return {
      emoji: '🧼',
      tag: 'Dettol Original',
      badgeColor: 'from-emerald-600 to-green-800',
      bgGradient: 'from-emerald-950/80 via-slate-900 to-slate-950',
      textColor: 'text-emerald-300',
      desc: '100% Germ Protection Antiseptic Soap',
      fallbackImg: 'https://images.unsplash.com/photo-1590439471364-192aa70c0b53?q=80&w=600'
    };
  }

  if (name.includes('pears') || brand.includes('pears')) {
    return {
      emoji: '🧼',
      tag: 'Pears Pure & Gentle',
      badgeColor: 'from-amber-500 to-amber-700',
      bgGradient: 'from-amber-950/80 via-slate-900 to-slate-950',
      textColor: 'text-amber-300',
      desc: '98% Pure Glycerin Transparent Soap Bar',
      fallbackImg: 'https://images.unsplash.com/photo-1607006411601-775c8cc632dc?q=80&w=600'
    };
  }

  if (name.includes('medimix') || brand.includes('medimix')) {
    return {
      emoji: '🌿',
      tag: 'Medimix Ayurvedic',
      badgeColor: 'from-green-600 to-teal-800',
      bgGradient: 'from-green-950/80 via-slate-900 to-slate-950',
      textColor: 'text-teal-300',
      desc: '18 Herbs Fast-Acting Herbal Bathing Bar',
      fallbackImg: 'https://images.unsplash.com/photo-1607006483702-326002f23b12?q=80&w=600'
    };
  }

  if (name.includes('santoor') || brand.includes('santoor')) {
    return {
      emoji: '✨',
      tag: 'Santoor Sandalwood',
      badgeColor: 'from-orange-500 to-amber-700',
      bgGradient: 'from-orange-950/80 via-slate-900 to-slate-950',
      textColor: 'text-orange-300',
      desc: 'Sandal & Turmeric Glowing Skin Bathing Bar',
      fallbackImg: 'https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?q=80&w=600'
    };
  }

  if (name.includes('shampoo') || name.includes('tresemme')) {
    return {
      emoji: '🧴',
      tag: 'Tresemme Keratin',
      badgeColor: 'from-purple-600 to-indigo-800',
      bgGradient: 'from-purple-950/80 via-slate-900 to-slate-950',
      textColor: 'text-purple-300',
      desc: 'Keratin Smooth Salon Frizz Control Shampoo',
      fallbackImg: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?q=80&w=600'
    };
  }

  if (name.includes('fogg') || name.includes('perfume')) {
    return {
      emoji: '✨',
      tag: 'Fogg Eau De Parfum',
      badgeColor: 'from-amber-600 to-yellow-800',
      bgGradient: 'from-amber-950/80 via-slate-900 to-slate-950',
      textColor: 'text-yellow-300',
      desc: 'Long-Lasting No-Gas Luxury Body Fragrance',
      fallbackImg: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?q=80&w=600'
    };
  }

  // 2. Laptops & Computers
  if (name.includes('macbook') || brand.includes('apple') && (category.includes('computer') || name.includes('laptop'))) {
    return {
      emoji: '💻',
      tag: 'Apple MacBook',
      badgeColor: 'from-slate-600 to-slate-800',
      bgGradient: 'from-slate-900 via-slate-900 to-slate-950',
      textColor: 'text-slate-200',
      desc: 'Apple M-Series Liquid Retina Display Laptop',
      fallbackImg: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=600'
    };
  }

  if (name.includes('dell') || name.includes('hp') || name.includes('lenovo') || category.includes('computer')) {
    return {
      emoji: '💻',
      tag: product.brand || 'Laptop',
      badgeColor: 'from-cyan-600 to-blue-800',
      bgGradient: 'from-cyan-950/80 via-slate-900 to-slate-950',
      textColor: 'text-cyan-300',
      desc: 'High Performance IPS Display Computer',
      fallbackImg: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?q=80&w=600'
    };
  }

  // 3. Smartphones
  if (name.includes('iphone') || name.includes('galaxy') || name.includes('oneplus') || name.includes('pixel') || category.includes('smartphone')) {
    return {
      emoji: '📱',
      tag: product.brand || 'Smartphone',
      badgeColor: 'from-indigo-600 to-blue-800',
      bgGradient: 'from-indigo-950/80 via-slate-900 to-slate-950',
      textColor: 'text-indigo-300',
      desc: '5G Flagship OLED Display Smartphone',
      fallbackImg: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?q=80&w=600'
    };
  }

  // 4. Audio & Sound
  if (name.includes('airdopes') || name.includes('sony') || name.includes('jbl') || name.includes('airpods') || category.includes('audio')) {
    return {
      emoji: '🎧',
      tag: product.brand || 'Audio',
      badgeColor: 'from-violet-600 to-purple-800',
      bgGradient: 'from-violet-950/80 via-slate-900 to-slate-950',
      textColor: 'text-violet-300',
      desc: 'Active Noise Cancellation & Deep Bass Audio',
      fallbackImg: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?q=80&w=600'
    };
  }

  // 5. Footwear
  if (name.includes('nike') || name.includes('adidas') || name.includes('crocs') || category.includes('footwear')) {
    return {
      emoji: '👟',
      tag: product.brand || 'Footwear',
      badgeColor: 'from-rose-600 to-red-800',
      bgGradient: 'from-rose-950/80 via-slate-900 to-slate-950',
      textColor: 'text-rose-300',
      desc: 'Responsive Cushioning Performance Sneaker',
      fallbackImg: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=600'
    };
  }

  // 6. Ethnic Wear & Kurtis
  if (name.includes('kurti') || name.includes('palazzo') || name.includes('saree') || name.includes('lehenga') || name.includes('ethnic') || name.includes('womans') || name.includes('dress')) {
    return {
      emoji: '👗',
      tag: 'Ethnic Kurti & Palazzo',
      badgeColor: 'from-pink-600 to-rose-800',
      bgGradient: 'from-pink-950/80 via-slate-900 to-slate-950',
      textColor: 'text-pink-300',
      desc: 'Rayon Printed Ethnic Wear Set',
      fallbackImg: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=600'
    };
  }

  // 7. Fashion & Clothing
  if (name.includes('jean') || name.includes('hoodie') || name.includes('sunglass') || name.includes('shirt') || category.includes('fashion')) {
    return {
      emoji: '👕',
      tag: product.brand || 'Fashion',
      badgeColor: 'from-sky-600 to-indigo-800',
      bgGradient: 'from-sky-950/80 via-slate-900 to-slate-950',
      textColor: 'text-sky-300',
      desc: 'Premium Comfort Casual Apparel',
      fallbackImg: 'https://images.unsplash.com/photo-1542272604-780c96856592?q=80&w=600'
    };
  }

  // 7. Groceries
  if (name.includes('oil') || name.includes('tea') || name.includes('rice') || category.includes('groceries')) {
    return {
      emoji: '🛒',
      tag: product.brand || 'Groceries',
      badgeColor: 'from-emerald-600 to-lime-800',
      bgGradient: 'from-emerald-950/80 via-slate-900 to-slate-950',
      textColor: 'text-emerald-300',
      desc: 'Pure Natural Daily Kitchen Essential',
      fallbackImg: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?q=80&w=600'
    };
  }

  // 8. Appliances
  if (name.includes('fryer') || name.includes('induction') || category.includes('appliances')) {
    return {
      emoji: '🍳',
      tag: product.brand || 'Appliances',
      badgeColor: 'from-orange-600 to-red-800',
      bgGradient: 'from-orange-950/80 via-slate-900 to-slate-950',
      textColor: 'text-orange-300',
      desc: 'Smart Kitchen & Home Cooking Appliance',
      fallbackImg: 'https://images.unsplash.com/photo-1585659722983-3a675dabf23d?q=80&w=600'
    };
  }

  // Default
  return {
    emoji: '📦',
    tag: product.brand || 'Product',
    badgeColor: 'from-slate-700 to-slate-900',
    bgGradient: 'from-slate-900 via-slate-900 to-slate-950',
    textColor: 'text-slate-300',
    desc: 'Verified E-Commerce Deal',
    fallbackImg: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?q=80&w=600'
  };
}
