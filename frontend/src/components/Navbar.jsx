import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo */}
          <div className="flex items-center flex-shrink-0">
            <Link to="/" className="flex items-center space-x-2.5 group">
              <span className="text-2xl transition-transform group-hover:scale-110">🛍️</span>
              <span className="font-extrabold text-lg sm:text-xl bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent tracking-tight">
                ShopWise AI
              </span>
            </Link>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-sm hidden lg:block">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder="Search products & deals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-800/90 text-xs text-slate-100 placeholder-slate-400 pl-9 pr-4 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
              <span className="absolute left-3 top-2.5 text-xs text-slate-400">🔍</span>
            </form>
          </div>

          {/* Navigation Links & Auth Actions */}
          <div className="flex items-center gap-6 sm:gap-8">
            {/* Nav Menu */}
            <div className="flex items-center space-x-4 sm:space-x-6">
              <Link
                to="/"
                className="text-slate-300 hover:text-white transition-colors text-sm font-medium hover:underline underline-offset-4"
              >
                Home
              </Link>

              <Link
                to="/scrape"
                className="flex items-center gap-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 hover:text-indigo-200 border border-indigo-500/30 px-3 py-1.5 rounded-xl transition-all text-xs font-semibold"
              >
                <span>⚡</span> Compare URL
              </Link>

              <Link
                to="/compare"
                className="flex items-center gap-1 text-slate-300 hover:text-white transition-colors text-sm font-medium hover:underline underline-offset-4"
              >
                <span>📊</span> Compare
              </Link>

              {isAuthenticated && (
                <Link
                  to="/alerts"
                  className="text-slate-300 hover:text-white transition-colors text-sm font-medium"
                >
                  Price Alerts
                </Link>
              )}
            </div>

            {/* Vertical Divider */}
            <div className="h-5 w-px bg-slate-700/80 hidden sm:block" />

            {/* Auth State Buttons */}
            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-750 px-3 py-1.5 rounded-xl border border-slate-700 transition-colors text-sm focus:outline-none"
                  >
                    <span className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-xs uppercase text-white shadow-sm">
                      {user?.name?.charAt(0)}
                    </span>
                    <span className="hidden md:inline font-medium text-slate-200 text-xs">{user?.name}</span>
                    <span className="text-[10px] text-slate-400">▼</span>
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl py-1 z-50 animate-in fade-in duration-150">
                      <Link
                        to="/profile"
                        onClick={() => setDropdownOpen(false)}
                        className="block px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                      >
                        👤 My Profile
                      </Link>
                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setDropdownOpen(false)}
                          className="block px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                        >
                          ⚙️ Admin Dashboard
                        </Link>
                      )}
                      <div className="border-t border-slate-700/60 my-1" />
                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          logout();
                        }}
                        className="w-full text-left block px-4 py-2 text-xs font-medium text-rose-400 hover:bg-slate-700/60 transition-colors"
                      >
                        🚪 Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link
                    to="/login"
                    className="text-slate-300 hover:text-white transition-colors text-sm font-medium px-2 py-1"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-lg shadow-indigo-600/20"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </nav>
  );
};

export default Navbar;
