import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1',
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const { token, selectedCompanyId } = useAuthStore.getState();
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add company context header for superadmins
    if (selectedCompanyId) {
      config.headers['X-Company-ID'] = selectedCompanyId;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Clear auth and redirect to login
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    
    if (error.response?.status === 403) {
      // Handle permission errors
      console.error('Permission denied:', error.response.data.detail);
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;
export { axiosInstance };
