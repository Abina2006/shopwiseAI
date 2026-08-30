import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import PlatformAdvisorCard from '../components/PlatformAdvisorCard';
import { sanitizeStoreUrl } from '../utils/urlHelper';

const API = import.meta.env.VITE_API_BASE_URL || 'https://shopwiseai-pys5.onrender.com/api';

function StarRating({ rating = 0 }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <span className="flex gap-0.5 items-center">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={`text-sm ${i < full ? 'text-yellow-400' : i === full && half ? 'text-yellow-300' : 'text-slate-600'}`}>
          {i < full ? '★' : i === full && half ? '⭐' : '☆'}
        </span>
      ))}
      <span className="text-xs text-slate-300 font-semibold ml-1.5">{Number(rating || 0).toFixed(1)}</span>
    </span>
  );
}

const ComparePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [availableProducts, setAvailableProducts] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [comparedData, setComparedData] = useState([]);
  const [activeAdvisorIndex, setActiveAdvisorIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch all available products to allow adding to comparison
  useEffect(() => {
    fetch(`${API}/products`)
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data) {
          setAvailableProducts(json.data);
          
          // If query param 'ids' exists, use it and auto-pair related products if only 1 ID is provided
          const idsFromParam = searchParams.get('ids');
          if (idsFromParam) {
            const parsed = idsFromParam.split(',').map(s => s.trim()).filter(Boolean);
            if (parsed.length === 1 && json.data.length > 1) {
              const target = json.data.find(p => p.id === parsed[0]);
              const sameCat = json.data.filter(p => p.id !== parsed[0] && (target ? p.category === target.category : true));
              const related = (sameCat.length > 0 ? sameCat : json.data.filter(p => p.id !== parsed[0])).slice(0, 2).map(p => p.id);
              setSelectedIds([parsed[0], ...related]);
            } else {
              setSelectedIds(parsed);
            }
          } else if (json.data.length >= 2) {
            setSelectedIds(json.data.slice(0, 3).map(p => p.id));
          }
        }
      })
      .catch(() => {});
  }, []);

  // Fetch compared data whenever selectedIds change
  useEffect(() => {
    if (selectedIds.length === 0) {
      setComparedData([]);
      return;
    }

    setLoading(true);
    fetch(`${API}/products/compare?ids=${selectedIds.join(',')}`)
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          setComparedData(json.data);
          if (activeAdvisorIndex >= json.data.length) {
            setActiveAdvisorIndex(0);
          }
        }
      })
      .finally(() => setLoading(false));

    setSearchParams({ ids: selectedIds.join(',') });
  }, [selectedIds]);

  const handleToggleProduct = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(item => item !== id));
    } else {
      if (selectedIds.length >= 4) {
        alert('You can compare up to 4 products at a time.');
        return;
      }
      setSelectedIds([...selectedIds, id]);
    }
  };

  const currentAdvisorProduct = comparedData[activeAdvisorIndex] || comparedData[0];

  return (
    <div className="space-y-10 py-4 max-w-7xl mx-auto px-4">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-indigo-500/10 text-indigo-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-3 border border-indigo-500/20">
          <span>🤖</span> Powered by AI Platform Advisor & Multi-Seller Matrix
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Product Price & Platform Comparison
        </h1>
        <p className="text-slate-400 mt-2 text-sm leading-relaxed">
          AI-driven platform advisor analyzes category, seller reliability, and price drops to recommend the single best store to purchase from.
        </p>
      </div>

      {/* Product Selector Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Select products to compare (Selected: {selectedIds.length}/4)
          </span>
          {selectedIds.length > 0 && (
            <button
              onClick={() => setSelectedIds([])}
              className="text-xs text-rose-400 hover:text-rose-300 transition-colors"
            >
              Clear all
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {availableProducts.map(prod => {
            const isSelected = selectedIds.includes(prod.id);
            return (
              <button
                key={prod.id}
                onClick={() => handleToggleProduct(prod.id)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all border ${
                  isSelected
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20'
                    : 'bg-slate-800 hover:bg-slate-750 border-slate-700 text-slate-300'
                }`}
              >
                <span>{isSelected ? '✓' : '+'}</span>
                <span className="truncate max-w-[180px]">{prod.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── AI Platform Advisor Section ── */}
      {comparedData.length > 0 && currentAdvisorProduct && (
        <section className="space-y-3">
          {comparedData.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1">
                View AI Advisor for:
              </span>
              {comparedData.map((p, idx) => (
                <button
                  key={p.id}
                  onClick={() => setActiveAdvisorIndex(idx)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border whitespace-nowrap ${
                    activeAdvisorIndex === idx
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}

          <PlatformAdvisorCard product={currentAdvisorProduct} listings={currentAdvisorProduct.listings} />
        </section>
      )}

      {/* Comparison Grid & Table */}
      {loading ? (
        <div className="text-center py-20">
          <div className="inline-block animate-spin text-3xl mb-3">⚙️</div>
          <p className="text-indigo-400 text-sm font-medium">Computing price differentials & comparison metrics…</p>
        </div>
      ) : comparedData.length === 0 ? (
        <div className="text-center py-24 border border-dashed border-slate-800 rounded-3xl">
          <span className="text-5xl block mb-3">🔍</span>
          <p className="text-lg font-semibold text-slate-400">No products selected for comparison</p>
          <p className="text-xs text-slate-600 mt-1">Select at least two products from the selector above</p>
        </div>
      ) : (
        <div className="overflow-x-auto pb-6">
          <div className="min-w-[800px] bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900">
                  <th className="p-5 w-48 text-xs font-bold uppercase tracking-wider text-slate-500">Feature / Metric</th>
                  {comparedData.map(p => (
                    <th key={p.id} className="p-5 text-left border-l border-slate-800/80">
                      <div className="space-y-3">
                        <div className="relative h-32 w-full bg-slate-800 rounded-xl overflow-hidden">
                          <img
                            src={p.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=400'}
                            alt={p.name}
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute top-2 left-2 bg-indigo-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                            {p.category}
                          </span>
                        </div>
                        <div>
                          <h4 className="text-white font-bold text-sm leading-snug line-clamp-2">{p.name}</h4>
                          <span className="text-xs text-slate-400">{p.brand}</span>
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800/60 text-sm">
                {/* Best Price */}
                <tr className="hover:bg-slate-800/20">
                  <td className="p-5 font-semibold text-slate-400 text-xs uppercase tracking-wider">Best Price</td>
                  {comparedData.map(p => (
                    <td key={p.id} className="p-5 border-l border-slate-800/80">
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-extrabold text-emerald-400">
                          ₹{Number(p.minPrice || 0).toLocaleString('en-IN')}
                        </span>
                        {p.savingsPercent > 0 && (
                          <span className="text-[11px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
                            Save {p.savingsPercent}%
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        Lowest on {p.bestDealListing?.sellerName || 'Direct'}
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Rating & Reviews */}
                <tr className="hover:bg-slate-800/20">
                  <td className="p-5 font-semibold text-slate-400 text-xs uppercase tracking-wider">User Rating</td>
                  {comparedData.map(p => (
                    <td key={p.id} className="p-5 border-l border-slate-800/80">
                      <StarRating rating={p.avgRating || p.bestDealListing?.rating || 0} />
                      <span className="text-xs text-slate-500 block mt-1">
                        Based on {Number(p.totalReviews || 0).toLocaleString()} reviews
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Available Sellers & Multi-store Prices */}
                <tr className="hover:bg-slate-800/20">
                  <td className="p-5 font-semibold text-slate-400 text-xs uppercase tracking-wider">Seller Options</td>
                  {comparedData.map(p => (
                    <td key={p.id} className="p-5 border-l border-slate-800/80 space-y-2">
                      {p.listings && p.listings.length > 0 ? (
                        p.listings.map(l => (
                          <div key={l.id} className="flex items-center justify-between bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50 text-xs">
                            <span className="font-semibold text-slate-200">🏪 {l.sellerName}</span>
                            <div className="text-right">
                              <span className="font-bold text-indigo-300">₹{Number(l.price).toLocaleString('en-IN')}</span>
                              <a
                                href={sanitizeStoreUrl(l.sellerUrl, p.name, l.sellerName)}
                                target="_blank"
                                rel="noreferrer noopener"
                                referrerPolicy="no-referrer"
                                className="block text-[10px] text-indigo-400 hover:text-indigo-300 underline font-semibold"
                              >
                                Store ↗
                              </a>
                            </div>
                          </div>
                        ))
                      ) : (
                        <span className="text-xs text-slate-500">No sellers listed</span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Description */}
                <tr className="hover:bg-slate-800/20">
                  <td className="p-5 font-semibold text-slate-400 text-xs uppercase tracking-wider">Key Details</td>
                  {comparedData.map(p => (
                    <td key={p.id} className="p-5 border-l border-slate-800/80 text-xs text-slate-400 leading-relaxed">
                      {p.description || 'No detailed specifications provided.'}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComparePage;
