import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProductImage from '../components/ProductImage';
import { getLocalWishlist, getWishlistKey, toggleWishlist } from '../utils/wishlistHelper';

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

function StarRating({ rating = 4.5 }) {
  return (
    <span className="flex items-center gap-1 text-xs text-amber-400">
      <span>★</span>
      <span className="text-slate-300 font-semibold">{Number(rating || 4.5).toFixed(1)}</span>
    </span>
  );
}

export default function WishlistPage() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [wishlist, setWishlist] = useState([]);
  const [enriched, setEnriched] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  const loadWishlist = () => {
    // Read both local key and unified key
    const primaryKey = getWishlistKey(user?.id);
    const legacyKey = `wishlist_${user?.id || 'guest'}`;

    let items = getLocalWishlist(user?.id);
    if (!items.length) {
      try {
        const legacy = localStorage.getItem(legacyKey);
        if (legacy) items = JSON.parse(legacy);
      } catch {}
    }
    setWishlist(items);
  };

  // Fetch live product data for wishlisted items to get fresh prices & price changes
  const enrichProducts = async (items) => {
    if (!items.length) {
      setEnriched([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    try {
      // 1. Try server wishlist API first for authenticated users or synced items
      const serverRes = await fetch(`${API}/wishlist?userId=${user?.id || ''}`);
      const serverJson = await serverRes.json();
      
      const serverMap = new Map();
      if (serverJson.success && Array.isArray(serverJson.data)) {
        serverJson.data.forEach(item => {
          serverMap.set(item.productId, item);
        });
      }

      // 2. Fetch all products to match any remaining items
      const res = await fetch(`${API}/products`);
      const json = await res.json();
      const productMap = new Map();
      if (json.success && Array.isArray(json.data)) {
        json.data.forEach(p => { productMap.set(p.id, p); });
      }

      const merged = items.map(w => {
        const pid = w.productId || w.id;
        const serverItem = serverMap.get(pid);
        const liveProduct = productMap.get(pid);

        const currentProduct = liveProduct || serverItem?.product || w;
        const listings = currentProduct.listings || w.listings || [];

        const prices = listings.map(l => parseFloat(l.price)).filter(p => !isNaN(p) && p > 0);
        const currentLowest = prices.length ? Math.min(...prices) : (parseFloat(w.current_price) || 0);

        // Previous price comparison
        const storedPrevious = w.savedPrice || serverItem?.product?.previousPrice || null;
        let priceChange = serverItem?.priceChange || null;

        if (!priceChange && storedPrevious && currentLowest > 0) {
          const diff = Math.round(storedPrevious - currentLowest);
          if (diff > 0) {
            priceChange = {
              type: 'dropped',
              amount: diff,
              text: `Price dropped by ₹${diff.toLocaleString('en-IN')}`
            };
          } else if (diff < 0) {
            priceChange = {
              type: 'increased',
              amount: Math.abs(diff),
              text: `Price increased by ₹${Math.abs(diff).toLocaleString('en-IN')}`
            };
          } else {
            priceChange = {
              type: 'unchanged',
              amount: 0,
              text: 'Price unchanged'
            };
          }
        }

        return {
          ...currentProduct,
          id: pid,
          productId: pid,
          name: currentProduct.name || w.product_name,
          brand: currentProduct.brand || w.brand || 'Generic',
          category: currentProduct.category || w.category || 'General',
          imageUrl: currentProduct.imageUrl || currentProduct.image_url || w.imageUrl || w.image_url,
          lowestPrice: currentLowest,
          platform: listings[0]?.sellerName || w.platform || 'Store',
          listings,
          priceChange
        };
      });

      setEnriched(merged);
    } catch {
      setEnriched(items);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWishlist();
  }, [user]);

  useEffect(() => {
    enrichProducts(wishlist);
  }, [wishlist.length]);

  const removeFromWishlist = async (productId) => {
    await toggleWishlist({ id: productId }, user?.id);
    const updated = wishlist.filter(p => (p.productId || p.id) !== productId);
    setWishlist(updated);
    setEnriched(prev => prev.filter(p => (p.productId || p.id) !== productId));
    showToast('Removed from wishlist');
  };

  const clearAll = () => {
    localStorage.removeItem(getWishlistKey(user?.id));
    localStorage.removeItem(`wishlist_${user?.id || 'guest'}`);
    setWishlist([]);
    setEnriched([]);
    showToast('Wishlist cleared');
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const displayList = enriched.length ? enriched : wishlist;

  return (
    <div className="min-h-screen bg-slate-950 text-white py-10 px-4 sm:px-6 lg:px-8">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 border border-slate-700 text-white text-sm font-semibold px-5 py-2.5 rounded-2xl shadow-2xl animate-in fade-in duration-200">
          {toast}
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-3xl text-rose-500">♥</span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">My Wishlist</h1>
              {displayList.length > 0 && (
                <span className="bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold px-2.5 py-1 rounded-full">
                  {displayList.length} item{displayList.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              {isAuthenticated
                ? `Saved products for ${user?.name || 'Account'} · prices update live`
                : 'Guest wishlist · saved in your browser and survives page refresh'}
            </p>
          </div>

          {displayList.length > 0 && (
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/compare?ids=' + displayList.slice(0, 4).map(p => p.id || p.productId).join(','))}
                className="flex items-center gap-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-semibold px-4 py-2 rounded-xl transition-all"
              >
                📊 Compare All
              </button>
              <button
                onClick={clearAll}
                className="flex items-center gap-1.5 bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-400 text-xs font-semibold px-4 py-2 rounded-xl transition-all"
              >
                🗑️ Clear All
              </button>
            </div>
          )}
        </div>

        {/* Empty State */}
        {!loading && displayList.length === 0 && (
          <div className="text-center py-20 px-6 bg-slate-900/40 rounded-3xl border border-slate-800/80 max-w-2xl mx-auto space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-3xl">
              🛍️
            </div>
            <h2 className="text-xl font-bold text-white">Your wishlist is empty</h2>
            <p className="text-slate-400 text-sm max-w-md mx-auto leading-relaxed">
              Browse products and click the <strong className="text-rose-400">♡ Add to Wishlist</strong> heart icon to save items. When prices drop across Amazon, Flipkart, or Meesho, you&apos;ll see the savings here!
            </p>
            <div className="pt-2">
              <Link
                to="/"
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/30 text-sm"
              >
                🔍 Browse Products
              </Link>
            </div>
          </div>
        )}

        {/* Loading Skeletons */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3 animate-pulse">
                <div className="h-44 bg-slate-800 rounded-xl" />
                <div className="h-4 bg-slate-800 rounded w-3/4" />
                <div className="h-3 bg-slate-800 rounded w-1/2" />
                <div className="h-6 bg-slate-800 rounded w-1/3" />
                <div className="h-9 bg-slate-800 rounded-xl" />
              </div>
            ))}
          </div>
        )}

        {/* Wishlist Grid */}
        {!loading && displayList.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {displayList.map((product) => {
              const pid = product.id || product.productId;
              const name = product.name || product.product_name;
              const lowestPrice = product.lowestPrice || product.current_price;
              const platform = product.platform || product.listings?.[0]?.sellerName || 'Store';
              const priceChange = product.priceChange;

              return (
                <div
                  key={pid}
                  className="group relative bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 rounded-2xl overflow-hidden shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
                >
                  {/* Remove Button */}
                  <button
                    onClick={() => removeFromWishlist(pid)}
                    className="absolute top-3 right-3 z-20 w-7 h-7 rounded-full bg-slate-950/80 hover:bg-rose-600 border border-slate-700/60 hover:border-rose-500 text-slate-300 hover:text-white text-xs flex items-center justify-center transition-all shadow-md backdrop-blur-md"
                    title="Remove from wishlist"
                  >
                    ✕
                  </button>

                  <div>
                    {/* Media */}
                    <div className="relative">
                      <ProductImage
                        src={product.imageUrl || product.image_url}
                        alt={name}
                        category={product.category}
                        brand={product.brand}
                        containerClassName="relative w-full h-44 bg-slate-950 overflow-hidden flex items-center justify-center border-b border-slate-800/80"
                      />
                      <span className="absolute top-3 left-3 bg-slate-950/80 border border-slate-700/60 text-indigo-300 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md backdrop-blur-md">
                        {product.category || 'General'}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-2.5">
                      <div>
                        <h3 className="text-sm font-bold text-slate-100 line-clamp-2 leading-snug group-hover:text-indigo-200 transition-colors">
                          {name}
                        </h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {product.brand} • Best on <span className="text-indigo-300 font-semibold">{platform}</span>
                        </p>
                      </div>

                      <StarRating rating={product.rating || 4.5} />

                      {/* Price Display */}
                      <div className="pt-2 border-t border-slate-800/80 flex items-baseline justify-between">
                        <div>
                          <p className="text-[10px] text-slate-500">Current Price</p>
                          <span className="text-lg font-extrabold text-emerald-400">
                            {lowestPrice ? `₹${Number(lowestPrice).toLocaleString('en-IN')}` : 'Price unavailable'}
                          </span>
                        </div>
                      </div>

                      {/* Price Drop / Change Display Badge */}
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
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-4 pt-0 grid grid-cols-2 gap-2">
                    <Link
                      to={`/compare?ids=${pid}`}
                      className="text-center py-2 px-3 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 transition-all"
                    >
                      Compare
                    </Link>
                    <Link
                      to={`/product/${pid}`}
                      className="text-center py-2 px-3 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-600/20"
                    >
                      View Product →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
