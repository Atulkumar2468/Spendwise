import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check current session from backend ONLY if current session was authenticated
  const checkAuth = async () => {
    // If not authenticated in this session, do not auto-login; redirect to /login
    const isSessionActive = sessionStorage.getItem('spendwise_session_active');
    if (!isSessionActive) {
      setUser(null);
      setLoading(false);
      localStorage.removeItem('spendwise_user');
      localStorage.removeItem('spendwise_token');
      return;
    }

    try {
      const res = await API.get('/auth/me');
      if (res.data?.success && res.data?.user) {
        setUser(res.data.user);
      } else {
        setUser(null);
        sessionStorage.removeItem('spendwise_session_active');
        sessionStorage.removeItem('spendwise_token');
      }
    } catch (err) {
      setUser(null);
      sessionStorage.removeItem('spendwise_session_active');
      sessionStorage.removeItem('spendwise_token');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();

    const handleUnauthorized = () => {
      setUser(null);
      sessionStorage.removeItem('spendwise_session_active');
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = async (email, password) => {
    const res = await API.post('/auth/login', { email, password });
    if (res.data?.success) {
      setUser(res.data.user);
      sessionStorage.setItem('spendwise_session_active', 'true');
      if (res.data.token) {
        sessionStorage.setItem('spendwise_token', res.data.token);
      }
      return res.data;
    }
    throw new Error(res.data?.message || 'Login failed');
  };

  const register = async (userData) => {
    const res = await API.post('/auth/register', userData);
    if (res.data?.success) {
      setUser(res.data.user);
      sessionStorage.setItem('spendwise_session_active', 'true');
      if (res.data.token) {
        sessionStorage.setItem('spendwise_token', res.data.token);
      }
      return res.data;
    }
    throw new Error(res.data?.message || 'Registration failed');
  };

  const logout = async () => {
    try {
      await API.post('/auth/logout');
    } catch (err) {
      console.warn('Logout API error:', err.message);
    } finally {
      setUser(null);
      sessionStorage.removeItem('spendwise_session_active');
      sessionStorage.removeItem('spendwise_token');
      localStorage.removeItem('spendwise_user');
      localStorage.removeItem('spendwise_token');
    }
  };

  const updateProfile = async (profileData) => {
    const res = await API.put('/auth/profile', profileData);
    if (res.data?.success) {
      setUser(res.data.user);
      return res.data.user;
    }
    throw new Error(res.data?.message || 'Update failed');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateProfile,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
