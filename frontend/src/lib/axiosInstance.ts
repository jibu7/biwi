import axios from 'axios';
import Cookies from 'js-cookie';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const token = Cookies.get('access_token');
    console.log('🔍 DEBUG: Cookie Check:', {
      tokenExists: !!token,
      tokenLength: token?.length || 0,
      allCookies: document.cookie
    });
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('🔍 DEBUG: Axios Request:', {
      method: config.method,
      url: config.url,
      baseURL: config.baseURL,
      fullUrl: `${config.baseURL}${config.url}`,
      hasAuth: !!config.headers.Authorization,
      authHeader: config.headers.Authorization
    });
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    console.log('🔍 DEBUG: Axios Response:', {
      status: response.status,
      url: response.config.url,
      method: response.config.method
    });
    return response;
  },
  async (error) => {
    console.error('🔍 DEBUG: Axios Error Details:', error);
    console.error('🔍 DEBUG: Axios Error Summary:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method,
      message: error.message,
      data: error.response?.data,
      code: error.code,
      isAxiosError: error.isAxiosError
    });
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      Cookies.remove('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
