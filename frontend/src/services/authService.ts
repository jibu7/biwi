import axiosInstance from '@/lib/axiosInstance';
import { User, UserLogin, Token } from '@/types';
import { useAuthStore } from '@/store/authStore';

interface LoginResponse {
  access_token: string;
  token_type: string;
  is_platform_admin: boolean;
}

interface PlatformLoginCredentials extends UserLogin {
  otp_code?: string;
}

export const authService = {
  async login(credentials: UserLogin): Promise<Token> {
    const formData = new FormData();
    formData.append('username', credentials.email);
    formData.append('password', credentials.password);
    
    const response = await axiosInstance.post<Token>('/auth/login', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    
    return response.data;
  },

  async platformLogin(credentials: PlatformLoginCredentials): Promise<LoginResponse> {
    try {
      const response = await axiosInstance.post<LoginResponse>(
        '/platform-login',
        credentials
      );
      
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        // Check for MFA required header
        if (error.response.headers['x-mfa-required']) {
          throw new Error('MFA_REQUIRED');
        }
        throw new Error('Invalid email or password');
      }
      throw error;
    }
  },

  async getCurrentUser(): Promise<User> {
    const response = await axiosInstance.get<User>('/auth/me');
    return response.data;
  },

  async getCurrentCompany() {
    const response = await axiosInstance.get('/companies/current');
    return response.data;
  },

  logout() {
    useAuthStore.getState().logout();
  },

  async impersonateCompany(companyId: number) {
    // Set the X-Target-Company-ID header for this request
    const response = await axiosInstance.post(
      `/platform/companies/${companyId}/impersonate`
    );
    
    return response.data;
  },

  async stopImpersonating() {
    const response = await axiosInstance.post('/platform/stop-impersonation');
    return response.data;
  },

  async getMe(): Promise<User> {
    const response = await axiosInstance.get<User>('/auth/me');
    return response.data;
  }
};
