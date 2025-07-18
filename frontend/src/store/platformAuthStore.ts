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
  isLoading: false,

  initAuth: async () => {
    try {
      const token = Cookies.get('platform_access_token');
      if (token) {
        // For now, just validate that the token exists
        // TODO: Add JWT token validation or a separate validate endpoint
        set({
          token,
          user: {
            id: 0,
            email: 'platform@vinea.com', // We could decode this from JWT if needed
            full_name: null,
            user_type: 'platform_admin',
            is_active: true,
            is_superuser: false,
            company_id: null,
            created_at: new Date().toISOString()
          },
          isAuthenticated: true,
          isLoading: false,
        });
        return;
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
    set({ isLoading: true });
    try {
      const tokenData = await platformAuthService.login(credentials);
      
      // Create a platform user object from the login response
      // Since the backend already verified this is a platform admin, we can trust it
      const platformUser: PlatformUser = {
        id: 0, // We'll get this from the JWT if needed
        email: credentials.email,
        full_name: null,
        user_type: 'platform_admin',
        is_active: true,
        is_superuser: false,
        company_id: null, // Platform admins don't belong to a specific company
        created_at: new Date().toISOString()
      };
      
      set({
        token: tokenData.access_token,
        user: platformUser,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      set({ isAuthenticated: false, user: null, token: null, isLoading: false });
      
      // Handle different types of errors
      if (error.response?.status === 401) {
        throw new Error('Invalid email or password');
      } else if (error.response?.status === 403) {
        throw new Error('Not authorized for platform access');
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('Login failed. Please try again.');
      }
    }
  },

  logout: () => {
    platformAuthService.logout();
    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
  },
}));

export const usePlatformAuth = () => usePlatformAuthStore();
