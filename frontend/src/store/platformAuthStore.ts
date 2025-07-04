import { create } from 'zustand';
import { platformAuthService } from '@/services/platformAuthService';
import { PlatformUser } from '@/types/platform';
import { UserLogin } from '@/types';
import Cookies from 'js-cookie';

interface PlatformAuthState {
  user: PlatformUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  login: (credentials: UserLogin) => Promise<void>;
  logout: () => void;
  initAuth: () => Promise<void>;
}

export const usePlatformAuthStore = create<PlatformAuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  initAuth: async () => {
    try {
      const token = Cookies.get('platform_access_token');
      if (token) {
        const user = await platformAuthService.getMe();
        if (user.user_type === 'platform_admin') {
          set({
            token,
            user,
            isAuthenticated: true,
            isLoading: false,
          });
          return;
        }
      }
    } catch (error) {
      // Token is invalid, remove it
      Cookies.remove('platform_access_token');
    }
    
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  login: async (credentials) => {
    try {
      const tokenData = await platformAuthService.login(credentials);
      const user = await platformAuthService.getMe();
      
      if (user.user_type !== 'platform_admin') {
        throw new Error('User is not a platform administrator.');
      }
      
      set({
        token: tokenData.access_token,
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isAuthenticated: false, user: null, token: null, isLoading: false });
      throw error;
    }
  },

  logout: () => {
    platformAuthService.logout();
    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
  },
}));

export const usePlatformAuth = () => usePlatformAuthStore();
