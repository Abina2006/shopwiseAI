import React, { useState } from 'react';

/**
 * Category-specific styling tokens for clean fallback placeholders
 */
const CATEGORY_STYLES = {
  'Mobiles & Tablets': { bg: 'from-violet-900/50 to-indigo-950/80', text: 'text-violet-400', icon: '📱' },
  'Smartphones': { bg: 'from-violet-900/50 to-indigo-950/80', text: 'text-violet-400', icon: '📱' },
  'Laptops & Computers': { bg: 'from-cyan-900/50 to-blue-950/80', text: 'text-cyan-400', icon: '💻' },
  'Computers': { bg: 'from-cyan-900/50 to-blue-950/80', text: 'text-cyan-400', icon: '💻' },
  'Electronics & Accessories': { bg: 'from-blue-900/50 to-slate-950/80', text: 'text-blue-400', icon: '🔌' },
  'Audio': { bg: 'from-purple-900/50 to-slate-950/80', text: 'text-purple-400', icon: '🎧' },
  'Gaming': { bg: 'from-rose-900/50 to-red-950/80', text: 'text-rose-400', icon: '🎮' },
  'TV & Appliances': { bg: 'from-amber-900/50 to-slate-950/80', text: 'text-amber-400', icon: '📺' },
  'Fashion & Clothing': { bg: 'from-pink-900/50 to-purple-950/80', text: 'text-pink-400', icon: '👕' },
  'Shoes & Footwear': { bg: 'from-orange-900/50 to-amber-950/80', text: 'text-orange-400', icon: '👟' },
  'Beauty & Personal Care': { bg: 'from-rose-900/50 to-pink-950/80', text: 'text-rose-400', icon: '✨' },
  'Home & Kitchen': { bg: 'from-emerald-900/50 to-teal-950/80', text: 'text-emerald-400', icon: '🍳' },
  'Furniture': { bg: 'from-amber-900/50 to-stone-950/80', text: 'text-amber-400', icon: '🛋️' },
  'Sports & Fitness': { bg: 'from-lime-900/50 to-emerald-950/80', text: 'text-lime-400', icon: '🏋️' },
  'Toys & Baby Products': { bg: 'from-yellow-900/50 to-amber-950/80', text: 'text-yellow-400', icon: '🧸' },
  'Books & Stationery': { bg: 'from-indigo-900/50 to-slate-950/80', text: 'text-indigo-400', icon: '📚' },
  'Grocery & Daily Essentials': { bg: 'from-green-900/50 to-emerald-950/80', text: 'text-green-400', icon: '🛒' },
  'Jewellery & Accessories': { bg: 'from-amber-900/50 to-yellow-950/80', text: 'text-amber-300', icon: '💎' },
  'Automotive': { bg: 'from-slate-800 to-zinc-950', text: 'text-slate-300', icon: '🚗' },
  'Pet Supplies': { bg: 'from-amber-900/50 to-orange-950/80', text: 'text-amber-400', icon: '🐾' },
  'Travel & Luggage': { bg: 'from-sky-900/50 to-blue-950/80', text: 'text-sky-400', icon: '🧳' },
  'Tools & Home Improvement': { bg: 'from-stone-900/50 to-slate-950/80', text: 'text-stone-300', icon: '🔧' },
  'Default': { bg: 'from-slate-900/80 to-slate-950', text: 'text-indigo-400', icon: '📦' }
};

/**
 * Validate that an image URL is legitimate and safe
 */
export function isValidImageUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  return trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/');
}

export default function ProductImage({
  src,
  alt = 'Product',
  category = 'Default',
  brand = '',
  className = 'w-full h-full object-cover',
  containerClassName = 'relative w-full h-48 overflow-hidden bg-slate-900 flex items-center justify-center'
}) {
  const [hasError, setHasError] = useState(false);
  const isValid = isValidImageUrl(src);

  const style = CATEGORY_STYLES[category] || CATEGORY_STYLES.Default;
  const brandDisplay = brand && brand !== 'Generic' && brand !== 'Unknown' ? brand : '';

  if (hasError || !isValid) {
    return (
      <div className={`${containerClassName} bg-gradient-to-br ${style.bg} border-b border-slate-800/80 select-none`}>
        <div className="flex flex-col items-center justify-center text-center p-4 space-y-1.5">
          <span className="text-4xl drop-shadow-md filter drop-shadow">{style.icon}</span>
          {brandDisplay && (
            <span className="text-[11px] font-extrabold tracking-wide uppercase px-2 py-0.5 rounded-md bg-slate-900/90 border border-slate-700/60 text-slate-200 shadow-sm">
              {brandDisplay}
            </span>
          )}
          <span className={`text-[10px] font-semibold ${style.text} tracking-wider uppercase`}>
            {category || 'ShopWise Verified'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClassName}>
      <img
        src={src}
        alt={alt}
        className={`${className} transition-transform duration-300 group-hover:scale-105`}
        loading="lazy"
        onError={() => setHasError(true)}
      />
    </div>
  );
}
