import axios from 'axios';
import { getLoggedInUser } from './authSession';

const BASE_URL = 'http://s1102464823.onlinehome.us/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor — attaches user ID from SQLite session
api.interceptors.request.use(
  async (config) => {
    try {
      const user = await getLoggedInUser();
      if (user?.id) {
        config.headers['X-User-Id'] = user.id;
      }
    } catch (err) {
      // Silently fail — requests without user ID will be treated as guest
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
          // Handle unauthorized
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
