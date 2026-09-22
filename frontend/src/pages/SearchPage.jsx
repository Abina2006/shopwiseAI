import React, { useState, useEffect, useTransition } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';

const POPULAR_QUERIES = [
  'iPhone 15',
  'MacBook Air',
  'Sony WH-1000XM5',
  'boAt Airdopes',
  'Samsung S24 Ultra',
  'Smart Watch'
];

const PLATFORM_ICONS = {
  amazon: '🛒',
  flipkart: '🛍️',
  meesho: '📦',
  croma: '🏪'
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
  const [sortBy, setSortBy] = useState('relevance');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'comparison'
  const [activeBrands, setActiveBrands] = useState([]);
  const [activeSpecs, setActiveSpecs] = useState([]);
  const [maxPriceFilter, setMaxPriceFilter] = useState(null);
  const [visibleCount, setVisibleCount] = useState(20);
  const [, startTransition] = useTransition();

  const handleSearch = async (searchTerm) => {
    const q = (searchTerm !== undefined ? searchTerm : query).trim();
    if (!q) return;

    setLoading(true);
    setError(null);
    setSearchParams({ q });
    setActiveBrands([]);
    setActiveSpecs([]);
    setMaxPriceFilter(null);
    setVisibleCount(20);

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

  // Transform grouped product results for ProductCard consumption
  const getDisplayProducts = () => {
    if (!data) return [];

    // If groups exist, map each group into a full ProductCard object
    if (data.groups && data.groups.length > 0) {
      return data.groups.map(g => {
        const canonical = g.canonical || {};
        const listings = (g.dbListings || g.listings || []).map(l => ({
          sellerName: l.platform || l.sellerName || 'Store',
          price: l.price,
          originalPrice: l.original_price || l.originalPrice,
          discount: l.discount,
          rating: l.rating,
          reviewCount: l.review_count || l.reviewCount,
          sellerUrl: l.product_url || l.sellerUrl,
          availability: l.availability || 'In Stock'
        })).filter(l => !isNaN(parseFloat(l.price)) && parseFloat(l.price) > 0);

        const prices = listings.map(l => parseFloat(l.price)).filter(p => !isNaN(p) && p > 0);
        const lowestPrice = prices.length ? Math.min(...prices) : (canonical.price || null);

        return {
          id: g.dbProduct?.id || canonical.id || canonical.product_name || canonical.name,
          name: canonical.product_name || canonical.name || query,
          brand: canonical.brand || 'Generic',
          category: canonical.category || 'General',
          imageUrl: canonical.image_url || canonical.imageUrl,
          price: lowestPrice,
          platform: listings[0]?.sellerName || 'Store',
          listings
        };
      });
    }

    // Fallback if individual products are returned
    if (data.products && data.products.length > 0) {
      return data.products.map(p => ({
        id: p.id || p.product_name || p.name,
        name: p.product_name || p.name,
        brand: p.brand || 'Generic',
        category: p.category || 'General',
        imageUrl: p.image_url || p.imageUrl,
        price: p.price,
        platform: p.platform,
        listings: [
          {
            sellerName: p.platform || 'Store',
            price: p.price,
            originalPrice: p.original_price,
            discount: p.discount,
            rating: p.rating,
            reviewCount: p.review_count,
            sellerUrl: p.product_url,
            availability: p.availability
          }
        ]
      }));
    }

    return [];
  };

  const displayProducts = getDisplayProducts().filter(p => p.listings && p.listings.length > 0);

  // Extract dynamic filters from all available results
  const filterMetadata = React.useMemo(() => {
    const brands = new Set();
    const specs = new Set();
    let maxP = 0;

    displayProducts.forEach(p => {
      if (p.brand && p.brand !== 'Generic') brands.add(p.brand);
      if (p.price && p.price > maxP) maxP = p.price;
      
      const tokens = (p.name || '').toUpperCase().split(/[\s,]+/);
      tokens.forEach(t => {
        if (t.match(/^\d+(GB|TB|MB)$/) || t === '5G' || t === '4G') {
          specs.add(t);
        }
      });
    });

    return {
      brands: Array.from(brands).sort(),
      specs: Array.from(specs).sort(),
      maxPrice: Math.ceil(maxP)
    };
  }, [displayProducts]);

  // Filter & sort
  const filteredProducts = displayProducts.filter(p => {
    // 1. Platform filter
    if (selectedPlatform !== 'all') {
      const hasPlatform = (p.listings || []).some(
        l => (l.sellerName || '').toLowerCase() === selectedPlatform.toLowerCase()
      );
      if (!hasPlatform) return false;
    }

    // 2. Brand filter
    if (activeBrands.length > 0 && !activeBrands.includes(p.brand)) {
      return false;
    }

    // 3. Specs filter
    if (activeSpecs.length > 0) {
      const pName = (p.name || '').toUpperCase();
      const hasSpec = activeSpecs.some(spec => pName.includes(spec));
      if (!hasSpec) return false;
    }

    // 4. Price filter
    if (maxPriceFilter !== null && p.price > maxPriceFilter) {
      return false;
    }

    return true;
  }).sort((a, b) => {
    if (sortBy === 'relevance') return 0; // Default backend order
    if (sortBy === 'lowest_price') return (Number(a.price) || 0) - (Number(b.price) || 0);
    if (sortBy === 'highest_price') return (Number(b.price) || 0) - (Number(a.price) || 0);
    
    // Sort by rating (using the highest rating among listings)
    if (sortBy === 'highest_rating') {
      const getHighestRating = (p) => Math.max(0, ...p.listings.map(l => Number(l.rating) || 0));
      return getHighestRating(b) - getHighestRating(a);
    }

    // Sort by reviews (using the sum of reviews across listings)
    if (sortBy === 'most_reviews') {
      const getTotalReviews = (p) => p.listings.reduce((sum, l) => sum + (Number(l.reviewCount) || 0), 0);
      return getTotalReviews(b) - getTotalReviews(a);
    }

    // Sort by price drop (discount percentage)
    if (sortBy === 'biggest_drop') {
      const getHighestDiscount = (p) => Math.max(0, ...p.listings.map(l => parseInt((l.discount || '0').replace(/\D/g, '')) || 0));
      return getHighestDiscount(b) - getHighestDiscount(a);
    }

    return 0;
  });

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
            Search any product and discover real products from Amazon, Flipkart, and Meesho. Compare prices, ratings, availability, and offers in one place.
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
              placeholder="e.g. iPhone 15, MacBook Air, Sony headphones, boAt earbuds..."
              className="w-full bg-transparent px-4 py-4 text-slate-100 placeholder-slate-500 text-base focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="m-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-bold text-sm transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2 whitespace-nowrap"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Searching...
                </>
              ) : (
                <>Compare Prices 🚀</>
              )}
            </button>
          </form>

          {/* Quick Filter Tags */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-xs">
            <span className="text-slate-400 font-medium">Popular:</span>
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

        {/* Loading State with Progressive Status and Skeleton Cards */}
        {loading && (
          <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
            <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-center space-y-2.5 shadow-xl">
              <div className="flex items-center justify-center gap-2 text-indigo-300 font-bold text-sm">
                <span className="animate-spin">🔄</span>
                <span>Searching marketplaces for &quot;{query}&quot;...</span>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  Searching Amazon...
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                  Searching Flipkart...
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="w-2 h-2 rounded-full bg-pink-400 animate-ping" />
                  Searching Meesho...
                </span>
              </div>
            </div>

            {/* Skeleton Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((idx) => (
                <div key={idx} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-4 animate-pulse">
                  <div className="w-full h-48 bg-slate-800 rounded-xl" />
                  <div className="h-4 bg-slate-800 rounded w-4/5" />
                  <div className="h-3 bg-slate-800 rounded w-1/2" />
                  <div className="h-7 bg-slate-800 rounded w-1/3" />
                  <div className="h-16 bg-slate-800/60 rounded-xl" />
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <div className="h-9 bg-slate-800 rounded-xl" />
                    <div className="h-9 bg-slate-800 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Provider Live Status Bar */}
        {!loading && data?.sources && (
          <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
            <div className="flex items-center gap-2 text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Marketplaces Status:</span>
            </div>
            <div className="flex items-center gap-4">
              {Object.entries(data.sources).map(([platform, status]) => (
                <div key={platform} className="flex items-center gap-1.5 capitalize font-medium">
                  <span>{PLATFORM_ICONS[platform.toLowerCase()] || '🏬'}</span>
                  <span className="text-slate-200">{platform}</span>
                  {status === 'success' || status === 'ready' ? (
                    <span className="text-emerald-400 text-[11px] bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                      ✓ Active
                    </span>
                  ) : (
                    <span className="text-slate-400 text-[11px] bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                      Unavailable
                    </span>
                  )}
                </div>
              ))}
            </div>
            <div className="text-slate-400 font-medium">
              Found <strong className="text-indigo-400">{displayProducts.length}</strong> matched product{displayProducts.length !== 1 ? 's' : ''}
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="max-w-3xl mx-auto p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="font-semibold">Search Notice</p>
              <p className="text-xs text-rose-400/90">{error}</p>
            </div>
          </div>
        )}

        {/* Filter & View Mode Bar */}
        {!loading && displayProducts.length > 0 && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
            {/* Platform Filter Buttons */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              <span className="text-xs text-slate-400 font-medium mr-1">Filter Store:</span>
              {['all', 'Amazon', 'Flipkart', 'Meesho', 'Croma'].map((plat) => (
                <button
                  key={plat}
                  type="button"
                  onClick={() => setSelectedPlatform(plat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                    selectedPlatform.toLowerCase() === plat.toLowerCase()
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 border border-slate-700/60'
                  }`}
                >
                  {plat === 'all' ? 'All Stores' : plat}
                </button>
              ))}
            </div>

            {/* Sort controls */}
            <div className="flex items-center gap-3 self-end sm:self-auto">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-slate-800 text-xs text-slate-200 border border-slate-700 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500"
              >
                <option value="relevance">Sort by: Relevance</option>
                <option value="lowest_price">Price: Low to High</option>
                <option value="highest_price">Price: High to Low</option>
                <option value="highest_rating">Highest Rating</option>
                <option value="most_reviews">Most Reviews</option>
                <option value="biggest_drop">Biggest Price Drop</option>
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
                  ▦ Cards
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('comparison')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    viewMode === 'comparison' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Side-by-Side Comparison Table"
                >
                  ☵ Table
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Category Filters */}
        {!loading && displayProducts.length > 0 && (filterMetadata.brands.length > 0 || filterMetadata.specs.length > 0) && (
          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-semibold text-slate-300">Refine Search</h3>
            
            {filterMetadata.brands.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-slate-400 font-medium">Brands</p>
                <div className="flex flex-wrap gap-2">
                  {filterMetadata.brands.map(brand => (
                    <label key={brand} className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700 cursor-pointer hover:bg-slate-700 transition-colors">
                      <input 
                        type="checkbox" 
                        checked={activeBrands.includes(brand)}
                        onChange={(e) => {
                          if (e.target.checked) setActiveBrands([...activeBrands, brand]);
                          else setActiveBrands(activeBrands.filter(b => b !== brand));
                        }}
                        className="rounded border-slate-600 bg-slate-700 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-slate-800"
                      />
                      {brand}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {filterMetadata.specs.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-slate-400 font-medium">Specifications</p>
                <div className="flex flex-wrap gap-2">
                  {filterMetadata.specs.map(spec => (
                    <label key={spec} className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700 cursor-pointer hover:bg-slate-700 transition-colors">
                      <input 
                        type="checkbox" 
                        checked={activeSpecs.includes(spec)}
                        onChange={(e) => {
                          if (e.target.checked) setActiveSpecs([...activeSpecs, spec]);
                          else setActiveSpecs(activeSpecs.filter(s => s !== spec));
                        }}
                        className="rounded border-slate-600 bg-slate-700 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-slate-800"
                      />
                      {spec}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Side-by-Side Comparison Groups View */}
        {!loading && displayProducts.length > 0 && viewMode === 'comparison' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <span>⚖️</span> Multi-Marketplace Side-by-Side Comparison Table
              </h2>
            </div>

            {filteredProducts.slice(0, visibleCount).map((prod, idx) => (
              <div key={idx} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {prod.brand}
                    </span>
                    <h3 className="text-base font-bold text-slate-100 mt-1">{prod.name}</h3>
                  </div>
                  <Link
                    to={`/product/${prod.id}`}
                    className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 underline self-start sm:self-auto"
                  >
                    View Full Product Details →
                  </Link>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                        <th className="pb-2.5 pl-2">Marketplace</th>
                        <th className="pb-2.5">Live Price</th>
                        <th className="pb-2.5">Rating</th>
                        <th className="pb-2.5">Availability</th>
                        <th className="pb-2.5 text-right pr-2">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {(prod.listings || []).map((item, lIdx) => {
                        const itemPrice = parseFloat(item.price);
                        const isLowest = !isNaN(itemPrice) && itemPrice === prod.price;

                        return (
                          <tr key={lIdx} className={isLowest ? 'bg-emerald-500/5 font-semibold' : ''}>
                            <td className="py-3 pl-2 font-medium flex items-center gap-2">
                              <span>{PLATFORM_ICONS[item.sellerName?.toLowerCase()] || '🏬'}</span>
                              <span className="text-slate-200">{item.sellerName}</span>
                              {isLowest && (
                                <span className="text-[9px] bg-emerald-500 text-slate-950 px-1.5 py-0.5 rounded-full font-extrabold uppercase">
                                  ★ Lowest
                                </span>
                              )}
                            </td>
                            <td className="py-3">
                              {!isNaN(itemPrice) && itemPrice > 0 ? (
                                <span className={isLowest ? 'text-emerald-400 text-sm font-bold' : 'text-slate-200'}>
                                  ₹{itemPrice.toLocaleString('en-IN')}
                                </span>
                              ) : (
                                <span className="text-slate-500">Price unavailable</span>
                              )}
                            </td>
                            <td className="py-3 text-slate-300">
                              ⭐ {item.rating || '4.4'}
                            </td>
                            <td className="py-3 text-slate-300">
                              {item.availability || 'In Stock'}
                            </td>
                            <td className="py-3 text-right pr-2">
                              {item.sellerUrl ? (
                                <a
                                  href={item.sellerUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-1 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 text-white font-semibold text-[11px] transition-all"
                                >
                                  Visit Store ↗
                                </a>
                              ) : (
                                <span className="text-slate-600 text-[11px]">N/A</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Product Cards Grid View */}
        {!loading && filteredProducts.length > 0 && viewMode === 'grid' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.slice(0, visibleCount).map((p, index) => (
              <ProductCard
                key={p.id || index}
                product={p}
                showComparison={true}
              />
            ))}
          </div>
        )}

        {/* Load More Button */}
        {!loading && filteredProducts.length > visibleCount && (
          <div className="text-center pt-8 pb-4">
            <button
              onClick={() => setVisibleCount(prev => prev + 20)}
              className="px-6 py-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm transition-colors border border-slate-700"
            >
              Load More Products ({filteredProducts.length - visibleCount} remaining)
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && data && filteredProducts.length === 0 && (
          <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-slate-800 space-y-3">
            <span className="text-4xl">🔍</span>
            <h3 className="text-lg font-bold text-slate-200">No matching products found.</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              We couldn&apos;t find matching products for &quot;{query}&quot; on {selectedPlatform === 'all' ? 'the selected marketplaces' : selectedPlatform}. Try searching for &quot;iPhone 15&quot;, &quot;Sony headphones&quot;, or &quot;boAt&quot;.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
