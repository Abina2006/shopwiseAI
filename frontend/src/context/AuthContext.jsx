import React, { createContext, useContext, useState, useEffect } from 'react';
import api, { API_BASE_URL } from '../services/api';

const AuthContext = createContext(null);

// Wake up the Render backend (free tier sleeps after inactivity)
const warmupBackend = async () => {
  try {
    // /health lives at root, not under /api
    const healthUrl = API_BASE_URL.replace(/\/api\/?$/, '') + '/health';
    await fetch(healthUrl, { signal: AbortSignal.timeout(60000) });
  } catch (_) {
    // Ignore — warmup is best-effort
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [serverWaking, setServerWaking] = useState(false);

  useEffect(() => {
    // Load persisted session on application start
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('accessToken');

    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);

    // Kick the backend awake in the background on page load
    warmupBackend();
  }, []);

  // Helper: call fn, retry once on network error (server may be waking up)
  const callWithRetry = async (fn) => {
    try {
      return await fn();
    } catch (error) {
      const isNetworkError = error.message === 'Network Error' || !error.response;
      if (isNetworkError) {
        setServerWaking(true);
        // Wait up to 8s for the server to wake, then retry once
        await new Promise((r) => setTimeout(r, 8000));
        setServerWaking(false);
        return await fn();
      }
      throw error;
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await callWithRetry(() =>
        api.post('/auth/login', { email, password })
      );
      const { user: userData, accessToken, refreshToken } = response.data.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(userData));

      setUser(userData);
      return { success: true };
    } catch (error) {
      const isNetworkError = error.message === 'Network Error' || !error.response;
      const message =
        error.response?.data?.message ||
        (isNetworkError
          ? 'Server is still starting up. Please wait a moment and try again.'
          : 'Login failed. Please try again.');
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const registerUserAction = async (name, email, password) => {
    setLoading(true);
    try {
      const response = await callWithRetry(() =>
        api.post('/auth/register', { name, email, password })
      );
      const { user: userData, accessToken, refreshToken } = response.data.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(userData));

      setUser(userData);
      return { success: true };
    } catch (error) {
      const isNetworkError = error.message === 'Network Error' || !error.response;
      const message =
        error.response?.data?.message ||
        (isNetworkError
          ? 'Server is still starting up. Please wait a moment and try again.'
          : 'Registration failed. Please try again.');
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error on backend:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setUser(null);
      setLoading(false);
    }
  };

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'ADMIN';

  const value = {
    user,
    loading,
    serverWaking,
    isAuthenticated,
    isAdmin,
    login,
    registerUserAction,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
