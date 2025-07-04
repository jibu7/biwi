import axios from 'axios';
import Cookies from 'js-cookie';

const isServer = typeof window === 'undefined';

// Default to an API prefix matching the Next.js rewrite for client, and backend URL for server
const DEFAULT_SERVER_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000/api/v1';
const DEFAULT_CLIENT_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  (typeof window !== 'undefined'
    ? `${window.location.origin}/api/v1`
    : '');

// Use the server-side URL when on the server, and the public one for the client
const API_BASE_URL = isServer
  ? DEFAULT_SERVER_BASE_URL
  : DEFAULT_CLIENT_BASE_URL;

const platformAxiosInstance = axios.create({
  baseURL: API_BASE_URL,
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
    // Handle 401 error only on the client-side - redirect to platform login
    if (!isServer && error.response?.status === 401) {
      Cookies.remove('platform_access_token');
      window.location.href = '/platform-login';
    }
    return Promise.reject(error);
  }
);

export default platformAxiosInstance;
