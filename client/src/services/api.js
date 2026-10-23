import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true, // Crucial for HTTP-only cookie authentication
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add Authorization Bearer token as fallback
API.interceptors.request.use(
  (config) => {
    const token =
      sessionStorage.getItem('spendwise_token') ||
      localStorage.getItem('spendwise_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling errors & 401 unauthenticated
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      console.error('SpendWise Network Error:', error);
      const detail = error.message || error.code || 'Network Error';
      const target = `${error.config?.baseURL || ''}${error.config?.url || ''}`;
      error.message = `Unable to connect to SpendWise server (${detail}) at ${target}. Please check connection.`;
      return Promise.reject(error);
    }

    if (error.response.status === 401) {
      // Don't auto-redirect if we are already on login or register or checking /me
      const isAuthUrl =
        error.config.url.includes('/auth/login') ||
        error.config.url.includes('/auth/register') ||
        error.config.url.includes('/auth/me');
      if (!isAuthUrl) {
        sessionStorage.removeItem('spendwise_session_active');
        sessionStorage.removeItem('spendwise_token');
        localStorage.removeItem('spendwise_token');
        localStorage.removeItem('spendwise_user');
        window.dispatchEvent(new Event('auth:unauthorized'));
      }
    }
    return Promise.reject(error);
  }
);

export default API;
