import axios from 'axios';
import { getAuthToken } from './authSession';
import { signRequest } from './requestSigning';

const BASE_URL = 'http://s1102464823.onlinehome.us/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor — attaches Bearer token + HMAC signature
api.interceptors.request.use(
  async (config) => {
    // ─── Auth Token ──────────────────────────────────────────────────────
    try {
      const token = await getAuthToken();
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    } catch (err) {
      // Silently fail — requests without token will get 401 from protected routes
    }

    // ─── HMAC Request Signature ──────────────────────────────────────────
    try {
      const method = config.method?.toUpperCase() || 'GET';
      // Build the full path (without baseURL host)
      const path = '/api' + (config.url?.startsWith('/') ? config.url : `/${config.url}`);
      const body = config.data ? (typeof config.data === 'string' ? config.data : JSON.stringify(config.data)) : '';

      const signedHeaders = signRequest(method, path, body);
      config.headers['X-Timestamp'] = signedHeaders['X-Timestamp'];
      config.headers['X-Signature'] = signedHeaders['X-Signature'];
    } catch (err) {
      // Silently fail — server will reject if signing key isn't configured
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // Token expired or invalid — user should re-login
          break;
        case 403:
          // Signature invalid — possible tampered request or clock drift
          break;
        case 429:
          // Rate limited — retry after delay
          break;
        case 500:
          // Handle server error
          break;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
