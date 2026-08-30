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

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Main User Site Routes */}
          <Route path="/" element={<Layout />}>
            {/* Public Auth Routes */}
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />

            {/* Public Browsing & Landing Pages */}
            <Route index element={<HomePage />} />
            <Route path="compare" element={<ComparePage />} />
            <Route path="scrape" element={<ScraperPage />} />
            <Route path="product/:id" element={<ProductDetailPage />} />

            {/* Protected Account Pages (Require Login) */}
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
