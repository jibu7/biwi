import axiosInstance from '@/lib/axiosInstance';
import { User, UserLogin, Token } from '@/types';
import Cookies from 'js-cookie';

export const platformAuthService = {
  async login(credentials: UserLogin): Promise<Token> {
    const formData = new FormData();
    formData.append('username', credentials.email);
    formData.append('password', credentials.password);
    
    const response = await axiosInstance.post<Token>('/auth/login', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    
    // Store token in a separate cookie for platform admins
    Cookies.set('platform_access_token', response.data.access_token, { 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    
    return response.data;
  },

  async getMe(): Promise<User> {
    const response = await axiosInstance.get<User>('/auth/me');
    return response.data;
  },

  logout() {
    Cookies.remove('platform_access_token');
  }
};
