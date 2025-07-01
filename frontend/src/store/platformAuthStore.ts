import { create } from 'zustand';
import { platformAuthService } from '@/services/platformAuthService';
import { PlatformUser } from '@/types/platform';

interface PlatformAuthState {
  user: PlatformUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  login: (credentials: UserLogin) => Promise<void>;
  logout: () => void;
}

export const usePlatformAuthStore = create<PlatformAuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

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
      });
    } catch (error) {
      set({ isAuthenticated: false, user: null, token: null });
      throw error;
    }
  },

  logout: () => {
    platformAuthService.logout();
    set({ user: null, token: null });
  },
}));

export const usePlatformAuth = () => usePlatformAuthStore();
