import platformAxiosInstance from '@/lib/platformAxiosInstance';
import { UserLogin, Token } from '@/types';
import { PlatformUser } from '@/types/platform';
import Cookies from 'js-cookie';

export const platformAuthService = {
  async login(credentials: UserLogin): Promise<Token> {
    const formData = new FormData();
    formData.append('username', credentials.email);
    formData.append('password', credentials.password);
    
    const response = await platformAxiosInstance.post<Token>('/platform/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    
    // Store token in a separate cookie for platform admins
    Cookies.set('platform_access_token', response.data.access_token, { 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    return response.data;
  },  async getMe(): Promise<PlatformUser> {
    const response = await platformAxiosInstance.get<PlatformUser>('/platform/me');
    return response.data;
  },

  logout() {
    Cookies.remove('platform_access_token');
  }
};
