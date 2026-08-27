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

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Main User Site Routes */}
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            
            <Route path="scrape" element={<ScraperPage />} />
            <Route path="compare" element={<ComparePage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />

            {/* User Profile Route */}
            <Route
              path="profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            
            {/* Gated User Routes */}
            <Route
              path="alerts"
              element={
                <ProtectedRoute>
                  <div className="text-white text-center py-12">
                    <span className="text-4xl">🔔</span>
                    <h2 className="text-2xl font-bold mt-2">Your Price Alerts</h2>
                    <p className="text-slate-400 mt-1">Configure drop notifications for your watched products.</p>
                  </div>
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
