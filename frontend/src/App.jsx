import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ScraperPage from './pages/ScraperPage';
import ComparePage from './pages/ComparePage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import NotFoundPage from './pages/NotFoundPage';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import PriceAlertsPage from './pages/PriceAlertsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import WishlistPage from './pages/WishlistPage';
import SearchPage from './pages/SearchPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Main User Site Routes */}
          <Route path="/" element={<Layout />}>
            {/* Index Route — Landing / About ShopWise AI Page */}
            <Route index element={<HomePage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />

            {/* Full Product Catalog */}
            <Route path="catalog" element={<SearchPage />} />

            {/* Multi-Store Real-Time Product Search */}
            <Route path="search" element={<SearchPage />} />

            {/* Product detail */}
            <Route path="product/:id" element={<ProductDetailPage />} />

            {/* Wishlist page */}
            <Route path="wishlist" element={<WishlistPage />} />

            {/* Protected App Pages (Require Login) */}
            <Route
              path="compare"
              element={
                <ProtectedRoute>
                  <ComparePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="scrape"
              element={
                <ProtectedRoute>
                  <ScraperPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="alerts"
              element={
                <ProtectedRoute>
                  <PriceAlertsPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFoundPage />} />
          </Route>

          {/* Completely Separated Admin Portal Routes */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route index element={<AdminDashboardPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
