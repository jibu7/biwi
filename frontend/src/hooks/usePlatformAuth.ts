import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { platformAuthService } from '@/services/platformAuthService';
import { PlatformUser } from '@/types/platform';
import Cookies from 'js-cookie';

interface PlatformAuthState {
  platformUser: PlatformUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const usePlatformAuth = create<PlatformAuthState>()(
  persist(
    (set, get) => ({
      platformUser: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const { access_token } = await platformAuthService.login({ email, password });
          
          // Token is automatically stored in cookies by the service
          // Get user details
          const user = await platformAuthService.getMe();
          
          set({
            token: access_token,
            platformUser: user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        platformAuthService.logout(); // This will remove the cookie
        set({
          platformUser: null,
          token: null,
          isAuthenticated: false,
        });
      },

      checkAuth: async () => {
        set({ isLoading: true });
        const token = Cookies.get('platform_access_token');
        if (!token) {
          set({ isAuthenticated: false, isLoading: false });
          return;
        }

        try {
          const user = await platformAuthService.getMe();
          set({
            platformUser: user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          Cookies.remove('platform_access_token');
          set({
            platformUser: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },
    }),
    {
      name: 'platform-auth',
      partialize: (state) => ({ 
        token: state.token, 
        platformUser: state.platformUser,
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);
