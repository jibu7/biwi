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
        
        // Add a small delay to ensure cookies are properly loaded
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const token = Cookies.get('platform_access_token');
        const state = get();
        
        // If we have persisted auth state and token matches, consider user authenticated
        if (token && state.isAuthenticated && state.platformUser && state.token === token) {
          set({ isLoading: false });
          return;
        }
        
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
        } catch (error: any) {
          console.warn('Platform auth check failed:', error);
          // Don't immediately clear auth - might be a temporary network issue
          // Only clear if it's a 401 (unauthorized) or 403 (forbidden)
          if (error?.response?.status === 401 || error?.response?.status === 403) {
            Cookies.remove('platform_access_token');
            set({
              platformUser: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
            });
          } else {
            // For other errors (network issues, etc), keep current state but stop loading
            set({ isLoading: false });
          }
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
      // Reset version to 0 to avoid migration issues
      version: 0,
      // Add error handling for corrupted storage
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.warn('Platform auth rehydration failed:', error);
          // Clear localStorage if there's an error
          localStorage.removeItem('platform-auth');
        }
      },
    }
  )
);
