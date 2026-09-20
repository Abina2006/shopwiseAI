import React, { useState, useEffect, useTransition } from 'react';
import { useSearchParams, Link } from 'react-router-dom';

const POPULAR_QUERIES = [
  'wireless headphones',
  'smart watch',
  'bluetooth speaker',
  'gaming mouse',
  'noise cancelling headphones',
  'sneakers',
];

const PLATFORM_ICONS = {
  amazon: '🛒',
  flipkart: '🛍️',
  meesho: '📦',
};

const PLATFORM_COLORS = {
  amazon: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  flipkart: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  meesho: 'bg-pink-500/10 text-pink-400 border-pink-500/30',
};

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [sortBy, setSortBy] = useState('lowest_price');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'comparison'
  const [, startTransition] = useTransition();

  const handleSearch = async (searchTerm) => {
    const q = (searchTerm !== undefined ? searchTerm : query).trim();
    if (!q) return;

    setLoading(true);
    setError(null);
    setSearchParams({ q });

    try {
      const res = await fetch(`${API}/products/search?q=${encodeURIComponent(q)}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to search across platforms.');
      }
      setData(json.data);
    } catch (err) {
      setError(err.message || 'An error occurred while fetching product data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      handleSearch(initialQuery);
    }
  }, [initialQuery]);

  // Flattened products with platform filter & sort
  const getFilteredProducts = () => {
    if (!data || !data.products) return [];
    let list = [...data.products];

    if (selectedPlatform !== 'all') {
      list = list.filter(
        p => (p.platform || '').toLowerCase() === selectedPlatform.toLowerCase()
      );
    }

    if (sortBy === 'lowest_price') {
      list.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sortBy === 'highest_price') {
      list.sort((a, b) => Number(b.price) - Number(a.price));
    } else if (sortBy === 'highest_rating') {
      list.sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));
    } else if (sortBy === 'biggest_discount') {
      list.sort((a, b) => (Number(b.discount_percentage) || 0) - (Number(a.discount_percentage) || 0));
    }

    return list;
  };

  const filteredProducts = getFilteredProducts();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header Hero */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold tracking-wide uppercase">
            ⚡ Multi-Store Real-Time Aggregator
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Compare Across{' '}
            <span className="bg-gradient-to-r from-amber-400 via-blue-400 to-pink-400 bg-clip-text text-transparent">
              Amazon, Flipkart & Meesho
            </span>
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-sm sm:text-base">
            Search any product to aggregate normalized pricing, stock status, ratings, and delivery estimates across top Indian marketplaces — completely compliant with zero illegal scraping.
          </p>
        </div>

        {/* Search Input Box */}
        <div className="max-w-3xl mx-auto">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="relative flex items-center shadow-2xl rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-900/90 backdrop-blur-md focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/40 transition-all"
          >
            <span className="pl-4 text-slate-400 text-lg">🔍</span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. wireless headphones, smart watch, bluetooth speaker..."
              className="w-full bg-transparent px-4 py-4 text-slate-100 placeholder-slate-500 text-base focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="px-2 text-slate-500 hover:text-slate-300 text-sm"
              >
                ✕
              </button>
            )}
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="m-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-white text-sm shadow-lg shadow-indigo-500/25 transition-all flex items-center gap-2"
            >
              {loading ? (
                <>
                  <span className="animate-spin text-sm">⏳</span> Searching...
                </>
              ) : (
                <>Compare Prices 🚀</>
              )}
            </button>
          </form>

          {/* Quick Filter Tags */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-xs">
            <span className="text-slate-400 font-medium">Try searching:</span>
            {POPULAR_QUERIES.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => {
                  setQuery(tag);
                  handleSearch(tag);
                }}
                className="px-3 py-1 rounded-lg bg-slate-800/80 hover:bg-indigo-600/20 text-slate-300 hover:text-indigo-300 border border-slate-700/70 hover:border-indigo-500/40 transition-all"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Provider Live Status Bar */}
        {data?.sources && (
          <div className="max-w-3xl mx-auto flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
            <div className="flex items-center gap-2 text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Supported Marketplaces:</span>
            </div>
            <div className="flex items-center gap-4">
              {Object.entries(data.sources)
                .filter(([platform]) => data.products.some(p => p.platform.toLowerCase() === platform.toLowerCase()))
                .map(([platform, status]) => (
                <div key={platform} className="flex items-center gap-1.5 capitalize font-medium">
                  <span>{PLATFORM_ICONS[platform.toLowerCase()] || '🏬'}</span>
                  <span className="text-slate-200">{platform}</span>
                  {status === 'success' || status === 'ready' ? (
                    <span className="text-emerald-400 text-[11px] bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                      ✓ Connected
                    </span>
                  ) : (
                    <span className="text-rose-400 text-[11px] bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                      Offline
                    </span>
                  )}
                </div>
              ))}
            </div>
            <div className="text-slate-400">
              Found <strong className="text-indigo-400">{data.totalResults}</strong> listings
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="max-w-3xl mx-auto p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="font-semibold">Search Error</p>
              <p className="text-xs text-rose-400/90">{error}</p>
            </div>
          </div>
        )}

        {/* Filter & View Mode Bar */}
        {data && data.products && data.products.length > 0 && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
            {/* Platform Filter Buttons */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              <span className="text-xs text-slate-400 font-medium mr-1">Platform:</span>
              {['all', ...Array.from(new Set(data.products.map(p => p.platform.toLowerCase())))].map((plat) => (
                <button
                  key={plat}
                  type="button"
                  onClick={() => setSelectedPlatform(plat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                    selectedPlatform === plat
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 border border-slate-700/60'
                  }`}
                >
                  {plat === 'all' ? 'All Stores' : plat}
                </button>
              ))}
            </div>

            {/* Sort & View Mode controls */}
            <div className="flex items-center gap-3 self-end sm:self-auto">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-slate-800 text-xs text-slate-200 border border-slate-700 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500"
              >
                <option value="lowest_price">Price: Low to High</option>
                <option value="highest_price">Price: High to Low</option>
                <option value="highest_rating">Highest Rated</option>
                <option value="biggest_discount">Biggest Discount</option>
              </select>

              <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-xs">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    viewMode === 'grid' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Card Grid View"
                >
                  ▦ Grid
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('comparison')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    viewMode === 'comparison' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Side-by-Side Comparison Table"
                >
                  ☵ Compare Table
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Side-by-Side Comparison Groups View */}
        {data && data.groups && data.groups.length > 0 && viewMode === 'comparison' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <span>⚖️</span> Direct Cross-Platform Side-by-Side Comparison
              </h2>
              <span className="text-xs text-slate-400">
                {data.groups.length} distinct product{data.groups.length > 1 ? 's' : ''} matched across stores
              </span>
            </div>

            {data.groups.map((grp, idx) => {
              const lowestPrice = Math.min(...grp.listings.map(l => Number(l.price)));
              const highestPrice = Math.max(...grp.listings.map(l => Number(l.price)));
              const maxSavings = highestPrice - lowestPrice;

              return (
                <div
                  key={idx}
                  className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          {grp.canonical.brand || 'Verified'}
                        </span>
                        <h3 className="text-lg font-bold text-slate-100">
                          {grp.canonical.name}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Available on {grp.listings.length} marketplace{grp.listings.length > 1 ? 's' : ''}
                      </p>
                    </div>

                    {maxSavings > 0 && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold self-start sm:self-auto">
                        <span>💰</span> Save up to ₹{Math.round(maxSavings).toLocaleString('en-IN')} by picking the best store!
                      </div>
                    )}
                  </div>

                  {/* Horizontal Marketplace Comparison Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                          <th className="pb-3 pl-2">Platform</th>
                          <th className="pb-3">Price & Savings</th>
                          <th className="pb-3">Rating & Reviews</th>
                          <th className="pb-3">Delivery Speed</th>
                          <th className="pb-3">Stock Status</th>
                          <th className="pb-3 text-right pr-2">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {grp.listings.map((item, lIdx) => {
                          const isLowest = Number(item.price) === lowestPrice;
                          const diff = Number(item.price) - lowestPrice;

                          return (
                            <tr
                              key={lIdx}
                              className={`hover:bg-slate-800/40 transition-colors ${
                                isLowest ? 'bg-emerald-500/5' : ''
                              }`}
                            >
                              <td className="py-3.5 pl-2 font-medium">
                                <div className="flex items-center gap-2">
                                  <span className="text-base">{PLATFORM_ICONS[item.platform.toLowerCase()] || '🏬'}</span>
                                  <span className="capitalize font-semibold text-slate-200">{item.platform}</span>
                                  {isLowest && (
                                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950">
                                      ★ Lowest Price
                                    </span>
                                  )}
                                </div>
                              </td>

                              <td className="py-3.5">
                                <div className="space-y-0.5">
                                  <div className="text-sm font-bold text-slate-100">
                                    ₹{Math.round(Number(item.price)).toLocaleString('en-IN')}
                                  </div>
                                  {item.discount_percentage > 0 && (
                                    <span className="text-[11px] font-semibold text-emerald-400">
                                      {item.discount_percentage}% off
                                    </span>
                                  )}
                                  {diff > 0 && (
                                    <div className="text-[10px] text-rose-400">
                                      +₹{Math.round(diff).toLocaleString('en-IN')} higher
                                    </div>
                                  )}
                                </div>
                              </td>

                              <td className="py-3.5">
                                <div className="flex items-center gap-1">
                                  <span className="text-amber-400">★</span>
                                  <span className="font-semibold text-slate-200">{item.rating || '4.0'}</span>
                                  <span className="text-slate-500 text-[11px]">
                                    ({Number(item.review_count || 0).toLocaleString('en-IN')})
                                  </span>
                                </div>
                              </td>

                              <td className="py-3.5 text-slate-300">
                                🚚 {item.delivery_info || '2-4 Days'}
                              </td>

                              <td className="py-3.5">
                                {item.in_stock ? (
                                  <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> In Stock
                                  </span>
                                ) : (
                                  <span className="text-rose-400 font-medium">Out of Stock</span>
                                )}
                              </td>

                              <td className="py-3.5 text-right pr-2">
                                <a
                                  href={item.product_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                    isLowest
                                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30'
                                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                                  }`}
                                >
                                  View on {item.platform} ↗
                                </a>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Product Cards Grid View */}
        {data && filteredProducts.length > 0 && viewMode === 'grid' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((p, index) => {
              const platformKey = (p.platform || '').toLowerCase();
              const badgeStyle = PLATFORM_COLORS[platformKey] || 'bg-slate-800 text-slate-300 border-slate-700';

              return (
                <div
                  key={index}
                  className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all hover:shadow-xl hover:shadow-indigo-500/5 flex flex-col justify-between group"
                >
                  <div className="space-y-4">
                    {/* Image & Platform Badges */}
                    <div className="relative aspect-video sm:aspect-square w-full rounded-xl bg-slate-800/60 overflow-hidden flex items-center justify-center border border-slate-800">
                      {p.image_url ? (
                        <img
                          src={p.image_url}
                          alt={p.name}
                          className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      ) : (
                        <span className="text-4xl text-slate-600">📦</span>
                      )}

                      {/* Store Badge */}
                      <div className={`absolute top-3 left-3 px-2.5 py-1 rounded-lg text-xs font-bold border capitalize flex items-center gap-1.5 shadow-md ${badgeStyle}`}>
                        <span>{PLATFORM_ICONS[platformKey] || '🏬'}</span>
                        <span>{p.platform}</span>
                      </div>

                      {/* Discount Badge */}
                      {p.discount_percentage > 0 && (
                        <div className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-emerald-500 text-slate-950 text-xs font-black shadow-md">
                          {p.discount_percentage}% OFF
                        </div>
                      )}
                    </div>

                    {/* Title & Brand */}
                    <div>
                      {p.brand && (
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400">
                          {p.brand}
                        </span>
                      )}
                      <h3 className="font-semibold text-slate-100 text-sm line-clamp-2 mt-0.5 leading-snug">
                        {p.name}
                      </h3>
                    </div>

                    {/* Rating & Stock */}
                    <div className="flex items-center justify-between text-xs pt-1">
                      <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded text-amber-400 font-semibold">
                        <span>★</span>
                        <span>{p.rating || '4.2'}</span>
                        <span className="text-slate-500 font-normal">
                          ({Number(p.review_count || 0).toLocaleString('en-IN')})
                        </span>
                      </div>

                      <div className="text-slate-400 text-xs flex items-center gap-1">
                        🚚 {p.delivery_info || '2-3 Days'}
                      </div>
                    </div>
                  </div>

                  {/* Price & Action Button */}
                  <div className="pt-5 mt-4 border-t border-slate-800 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xl font-extrabold text-slate-100">
                        ₹{Math.round(Number(p.price)).toLocaleString('en-IN')}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {p.currency || 'INR'} • Best Price
                      </div>
                    </div>

                    <a
                      href={p.product_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-600/20 flex items-center gap-1"
                    >
                      Buy on {p.platform} ↗
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State when searched but nothing returned */}
        {data && filteredProducts.length === 0 && !loading && (
          <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-slate-800 space-y-3">
            <span className="text-4xl">🔍</span>
            <h3 className="text-lg font-bold text-slate-200">No products found</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              We couldn't find matching products for &quot;{query}&quot; on {selectedPlatform === 'all' ? 'any platform' : selectedPlatform}. Try searching for generic items like &quot;headphones&quot;, &quot;mouse&quot;, or &quot;watch&quot;.
            </p>
          </div>
        )}

        {/* Initial Empty State before user searches */}
        {!data && !loading && (
          <div className="py-16 text-center space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 text-left space-y-2">
                <span className="text-3xl">🛡️</span>
                <h4 className="font-bold text-slate-100 text-sm">Compliant & Legal</h4>
                <p className="text-xs text-slate-400">
                  Zero aggressive scraping or CAPTCHA bypass. Uses authorized affiliate APIs and clean mock adapters.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 text-left space-y-2">
                <span className="text-3xl">⚡</span>
                <h4 className="font-bold text-slate-100 text-sm">Parallel Fan-Out</h4>
                <p className="text-xs text-slate-400">
                  Queries Amazon, Flipkart, and Meesho simultaneously in milliseconds using Promise.allSettled.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 text-left space-y-2">
                <span className="text-3xl">📊</span>
                <h4 className="font-bold text-slate-100 text-sm">Normalized Structure</h4>
                <p className="text-xs text-slate-400">
                  Every product from all stores is deduplicated and standardized for instant side-by-side comparison.
                </p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
