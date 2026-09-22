import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ProductImage from './ProductImage';
import { isProductWishlisted, toggleWishlist } from '../utils/wishlistHelper';
import { useAuth } from '../context/AuthContext';

function StarRating({ rating = 4.5, reviewCount = 0 }) {
  const numericRating = Number(rating) || 4.5;
  return (
    <div className="flex items-center gap-1.5 text-xs text-slate-400">
      <div className="flex items-center text-amber-400">
        <span>⭐</span>
        <span className="font-bold ml-1 text-slate-200">{numericRating.toFixed(1)}</span>
      </div>
      {reviewCount > 0 && (
        <span className="text-slate-500 text-[11px]">
          ({Number(reviewCount).toLocaleString('en-IN')} reviews)
        </span>
      )}
    </div>
  );
}

export default function ProductCard({
  product,
  onWishlistChange,
  showComparison = true,
  className = ''
}) {
  const { user } = useAuth();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [showStoreBreakdown, setShowStoreBreakdown] = useState(false);
  const [wishlistToast, setWishlistToast] = useState('');

  const productId = product.id || product.productId;

  // Initialize wishlist state and listen for updates
  useEffect(() => {
    setIsWishlisted(isProductWishlisted(productId, user?.id));

    const handleUpdate = (e) => {
      if (e.detail?.productId === productId) {
        setIsWishlisted(e.detail.added);
      }
    };
    window.addEventListener('shopwise_wishlist_updated', handleUpdate);
    return () => window.removeEventListener('shopwise_wishlist_updated', handleUpdate);
  }, [productId, user?.id]);

  const handleWishlistClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const isNowAdded = await toggleWishlist(product, user?.id, lowestPrice, bestStoreName);
    setIsWishlisted(isNowAdded);
    setWishlistToast(isNowAdded ? 'Saved to Wishlist ♥' : 'Removed from Wishlist ♡');
    setTimeout(() => setWishlistToast(''), 2200);

    if (onWishlistChange) {
      onWishlistChange(productId, isNowAdded);
    }
  };

  // Listings normalization
  const listings = (Array.isArray(product.listings) ? product.listings : [])
    .filter(l => !isNaN(parseFloat(l.price)) && parseFloat(l.price) > 0);
  
  // Calculate lowest valid price across stores
  const validPrices = listings
    .map(l => parseFloat(l.price))
    .filter(p => !isNaN(p) && p > 0);

  const lowestPrice = validPrices.length > 0
    ? Math.min(...validPrices)
    : (product.price ? parseFloat(product.price) : null);

  const bestListing = listings.find(l => parseFloat(l.price) === lowestPrice) || listings[0] || null;
  const bestStoreName = bestListing?.sellerName || product.platform || 'Featured Store';

  // Calculate highest price / savings
  const originalPrice = bestListing?.originalPrice
    ? parseFloat(bestListing.originalPrice)
    : (product.original_price ? parseFloat(product.original_price) : null);

  const savingsPct = originalPrice && lowestPrice && originalPrice > lowestPrice
    ? Math.round(((originalPrice - lowestPrice) / originalPrice) * 100)
    : (bestListing?.discount ? parseInt(bestListing.discount, 10) : 0);

  // Price change calculation from priceHistory or previousPrice
  const priceChange = product.priceChange || (() => {
    const hist = bestListing?.priceHistory || [];
    if (hist.length > 1 && lowestPrice) {
      const prev = parseFloat(hist[1].price);
      if (!isNaN(prev) && prev > 0) {
        const diff = Math.round(prev - lowestPrice);
        if (diff > 0) return { type: 'dropped', text: `Price dropped by ₹${diff.toLocaleString('en-IN')}` };
        if (diff < 0) return { type: 'increased', text: `Price increased by ₹${Math.abs(diff).toLocaleString('en-IN')}` };
        return { type: 'unchanged', text: 'Price unchanged' };
      }
    }
    return null;
  })();

  const brand = product.brand || 'Generic';
  const name = product.name || product.product_name || 'Product';
  const category = product.category || 'General';
  const imageUrl = product.imageUrl || product.image_url || '';

  return (
    <div
      className={`group relative bg-slate-900/90 hover:bg-slate-900 border border-slate-800/80 hover:border-indigo-500/50 rounded-2xl overflow-hidden shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-indigo-950/30 flex flex-col justify-between h-full ${className}`}
    >
      {/* Toast Notification */}
      {wishlistToast && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 bg-slate-950/95 border border-indigo-500/40 text-indigo-300 text-[11px] font-bold px-3 py-1 rounded-full shadow-xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
          {wishlistToast}
        </div>
      )}

      {/* Top Media Header */}
      <div>
        <div className="relative">
          <ProductImage
            src={imageUrl}
            alt={name}
            category={category}
            brand={brand}
            containerClassName="relative w-full h-48 bg-slate-950 overflow-hidden flex items-center justify-center border-b border-slate-800/70"
          />

          {/* Category Tag */}
          <span className="absolute top-3 left-3 bg-slate-950/80 border border-slate-700/60 text-indigo-300 text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-lg backdrop-blur-md shadow-sm">
            {category}
          </span>

          {/* Wishlist Heart Toggle Button */}
          <button
            onClick={handleWishlistClick}
            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
            title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
            className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md border transition-all duration-200 z-20 shadow-md ${
              isWishlisted
                ? 'bg-rose-950/90 border-rose-500/80 text-rose-400 scale-110 shadow-rose-950/50'
                : 'bg-slate-950/70 border-slate-700/80 text-slate-400 hover:text-rose-400 hover:border-rose-500/40 hover:scale-110'
            }`}
          >
            <span className="text-base select-none leading-none">
              {isWishlisted ? '♥' : '♡'}
            </span>
          </button>

          {/* Stores Count Badge */}
          {listings.length > 1 && (
            <span className="absolute bottom-2 right-2 bg-slate-950/85 border border-slate-700/60 text-slate-300 text-[10px] font-semibold px-2 py-0.5 rounded-md backdrop-blur-md">
              🏪 {listings.length} Stores Available
            </span>
          )}
        </div>

        {/* Card Body */}
        <div className="p-4 space-y-3">
          {/* Title & Brand */}
          <div className="min-h-[44px]">
            <h3 className="text-sm font-bold text-slate-100 leading-snug line-clamp-2 group-hover:text-indigo-200 transition-colors" title={name}>
              {name}
            </h3>
            <p className="text-[11px] font-medium text-slate-400 mt-0.5 truncate">
              {brand} {product.model ? `• ${product.model}` : ''}
            </p>
          </div>

          {/* Star Rating */}
          <StarRating
            rating={bestListing?.rating || product.rating || 4.5}
            reviewCount={bestListing?.reviewCount || product.review_count || 120}
          />

          {/* Price & Best Store Section */}
          <div className="pt-2 border-t border-slate-800/80 flex items-baseline justify-between gap-2">
            <div>
              <p className="text-[10px] font-medium text-slate-400">
                Best price on <span className="text-indigo-300 font-semibold">{bestStoreName}</span>
              </p>
              <div className="flex items-baseline gap-2 mt-0.5">
                {lowestPrice !== null && lowestPrice > 0 ? (
                  <span className="text-xl font-extrabold text-emerald-400">
                    ₹{lowestPrice.toLocaleString('en-IN')}
                  </span>
                ) : (
                  <span className="text-sm font-semibold text-slate-400">
                    Price unavailable
                  </span>
                )}

                {savingsPct > 0 && (
                  <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded-full">
                    Save {savingsPct}%
                  </span>
                )}
              </div>
            </div>

            {originalPrice && originalPrice > (lowestPrice || 0) && (
              <span className="text-xs text-slate-500 line-through">
                ₹{originalPrice.toLocaleString('en-IN')}
              </span>
            )}
          </div>

          {/* Verified Price Change Indicator */}
          {priceChange && (
            <div className={`text-[11px] font-semibold px-2 py-1 rounded-lg border flex items-center gap-1.5 ${
              priceChange.type === 'dropped'
                ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                : priceChange.type === 'increased'
                ? 'bg-amber-950/40 border-amber-500/30 text-amber-300'
                : 'bg-slate-800/40 border-slate-700/40 text-slate-400'
            }`}>
              <span>{priceChange.type === 'dropped' ? '📉' : priceChange.type === 'increased' ? '📈' : '➡️'}</span>
              <span>{priceChange.text}</span>
            </div>
          )}

          {/* Multi-Marketplace Price Comparison Breakdown */}
          {showComparison && listings.length > 0 && (
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-2.5 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                <span>🛒 Price Comparison</span>
                {listings.length > 2 && (
                  <button
                    onClick={() => setShowStoreBreakdown(!showStoreBreakdown)}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 underline font-normal lowercase"
                  >
                    {showStoreBreakdown ? 'show less' : `view all (${listings.length})`}
                  </button>
                )}
              </div>

              <div className="space-y-1">
                {(showStoreBreakdown ? listings : listings.slice(0, 3)).map((st, i) => {
                  const stPrice = parseFloat(st.price);
                  const isLowest = !isNaN(stPrice) && stPrice === lowestPrice;

                  return (
                    <div
                      key={i}
                      className={`flex items-center justify-between text-xs px-2 py-1 rounded-lg border transition-all ${
                        isLowest
                          ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300 font-semibold'
                          : 'bg-slate-900/80 border-slate-800/80 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="truncate">{st.sellerName}</span>
                        {isLowest && (
                          <span className="text-[9px] bg-emerald-500/20 text-emerald-400 font-bold px-1 rounded">
                            BEST
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span>
                          {!isNaN(stPrice) && stPrice > 0
                            ? `₹${stPrice.toLocaleString('en-IN')}`
                            : 'Unavailable'}
                        </span>
                        {st.sellerUrl ? (
                          <a
                            href={st.sellerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-indigo-400 hover:text-indigo-300 underline"
                          >
                            Store ↗
                          </a>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons: [Compare Prices] and [View Product] */}
      <div className="p-4 pt-0 grid grid-cols-2 gap-2">
        <Link
          to={`/compare?ids=${productId}`}
          className="flex items-center justify-center gap-1 text-center py-2 px-3 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700/80 hover:border-slate-600 transition-all shadow-sm"
        >
          <span>📊</span> Compare
        </Link>
        <Link
          to={`/product/${productId}`}
          className="flex items-center justify-center gap-1 text-center py-2 px-3 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-600/20"
        >
          View Product →
        </Link>
      </div>
    </div>
  );
}
