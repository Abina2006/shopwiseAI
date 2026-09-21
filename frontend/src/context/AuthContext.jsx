import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import api, { API_BASE_URL } from '../services/api';

const AuthContext = createContext(null);

// Derive the /health URL from the API base (strip /api suffix)
const HEALTH_URL = API_BASE_URL.replace(/\/api\/?$/, '') + '/health';

// Poll /health every 5s until server responds, up to maxWaitMs
const waitForServer = async (onTick, maxWaitMs = 60000) => {
  const start = Date.now();
  const interval = 5000;
  while (Date.now() - start < maxWaitMs) {
    try {
      const res = await fetch(HEALTH_URL, { signal: AbortSignal.timeout(4000) });
      if (res.ok) return true; // server is up
    } catch (_) {
      // still sleeping — keep polling
    }
    const elapsed = Date.now() - start;
    const remaining = Math.ceil((maxWaitMs - elapsed) / 1000);
    onTick(remaining > 0 ? remaining : 0);
    await new Promise((r) => setTimeout(r, interval));
  }
  return false;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [serverWaking, setServerWaking] = useState(false);
  const [wakeCountdown, setWakeCountdown] = useState(0);
  const warmupRan = useRef(false);

  useEffect(() => {
    // Load persisted session on application start
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('accessToken');
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);

    // Silently warm up the backend on page load (best-effort)
    if (!warmupRan.current) {
      warmupRan.current = true;
      fetch(HEALTH_URL, { signal: AbortSignal.timeout(60000) }).catch(() => {});
    }
  }, []);

  // Helper: if the first attempt fails with a network error, poll until server
  // is back up (max 60s), then retry the original request automatically.
  const callWithRetry = async (fn) => {
    try {
      return await fn();
    } catch (error) {
      const isNetworkError = error.message === 'Network Error' || !error.response;
      if (!isNetworkError) throw error;

      // Server is sleeping — start polling with countdown
      setServerWaking(true);
      setWakeCountdown(60);

      const serverUp = await waitForServer((remaining) => {
        setWakeCountdown(remaining);
      }, 60000);

      setServerWaking(false);
      setWakeCountdown(0);

      if (!serverUp) throw new Error('TIMEOUT');

      // Server is up — retry the original request
      return await fn();
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
      const isNetworkError =
        error.message === 'Network Error' ||
        error.message === 'TIMEOUT' ||
        !error.response;
      const message =
        error.response?.data?.message ||
        (isNetworkError
          ? 'Server took too long to wake up. Please try again.'
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
      const isNetworkError =
        error.message === 'Network Error' ||
        error.message === 'TIMEOUT' ||
        !error.response;
      const message =
        error.response?.data?.message ||
        (isNetworkError
          ? 'Server took too long to wake up. Please try again.'
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
    wakeCountdown,
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
