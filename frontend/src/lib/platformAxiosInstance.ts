import axios from 'axios';
import Cookies from 'js-cookie';

const isServer = typeof window === 'undefined';

// Use the proxied API endpoint for client-side requests
const API_BASE_URL = isServer
  ? process.env.API_BASE_URL || 'http://localhost:8000/api/v1'
  : '/api/v1';

const platformAxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for platform admin
platformAxiosInstance.interceptors.request.use(
  (config) => {
    // Handle platform token only on the client-side where cookies are available
    if (!isServer) {
      const token = Cookies.get('platform_access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for platform admin
platformAxiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // Handle HTML error responses (like 500 Internal Server Error)
    if (error.response?.data && typeof error.response.data === 'string' && error.response.data.includes('<html>')) {
      // Extract error message from HTML or provide a generic one
      const errorMessage = error.response.status === 500 
        ? 'Internal server error. Please check backend logs.'
        : `Server error (${error.response.status})`;
      
      return Promise.reject(new Error(errorMessage));
    }
    
    // Handle 401 error only on the client-side - redirect to platform login
    if (!isServer && error.response?.status === 401) {
      Cookies.remove('platform_access_token');
      window.location.href = '/platform-login';
    }
    
    return Promise.reject(error);
  }
);

export default platformAxiosInstance;
