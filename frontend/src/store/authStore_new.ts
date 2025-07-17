import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Company } from '@/types';

interface AuthState {
  user: User | null;
  company: Company | null;
  selectedCompanyId: number | null;
  token: string | null;
  isPlatformAdmin: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  login: (email: string, password: string) => Promise<void>;
  platformLogin: (email: string, password: string, otpCode?: string) => Promise<void>;
  logout: () => void;
  setTargetCompany: (companyId: number | null) => void;
  refreshUser: () => Promise<void>;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      company: null,
      selectedCompanyId: null,
      token: null,
      isPlatformAdmin: false,
      isAuthenticated: false,
      isLoading: false,
      
      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const formData = new FormData();
          formData.append('username', email);
          formData.append('password', password);
          
          const response = await fetch('/api/v1/auth/login', {
            method: 'POST',
            body: formData,
          });
          
          if (!response.ok) {
            throw new Error('Login failed');
          }
          
          const data = await response.json();
          
          // Get user details
          const userResponse = await fetch('/api/v1/auth/me', {
            headers: {
              'Authorization': `Bearer ${data.access_token}`,
            },
          });
          
          if (!userResponse.ok) {
            throw new Error('Failed to get user details');
          }
          
          const user = await userResponse.json();
          
          set({
            token: data.access_token,
            user,
            company: user.company,
            isPlatformAdmin: data.is_platform_admin || false,
            isAuthenticated: true,
            selectedCompanyId: user.company_id,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },
      
      platformLogin: async (email: string, password: string, otpCode?: string) => {
        set({ isLoading: true });
        try {
          let payload: FormData | string;
          let headers: Record<string, string> = {};
          
          if (otpCode) {
            payload = JSON.stringify({ username: email, password, otp_code: otpCode });
            headers['Content-Type'] = 'application/json';
          } else {
            payload = new FormData();
            (payload as FormData).append('username', email);
            (payload as FormData).append('password', password);
          }
          
          const response = await fetch(
            otpCode ? '/api/v1/platform/auth/login-mfa' : '/api/v1/platform/auth/login',
            {
              method: 'POST',
              headers,
              body: payload,
            }
          );
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Platform login failed');
          }
          
          const data = await response.json();
          
          // Get user details
          const userResponse = await fetch('/api/v1/auth/me', {
            headers: {
              'Authorization': `Bearer ${data.access_token}`,
            },
          });
          
          if (!userResponse.ok) {
            throw new Error('Failed to get user details');
          }
          
          const user = await userResponse.json();
          
          set({
            token: data.access_token,
            user,
            isPlatformAdmin: true,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },
      
      logout: () => {
        set({
          user: null,
          company: null,
          selectedCompanyId: null,
          token: null,
          isPlatformAdmin: false,
          isAuthenticated: false,
          isLoading: false,
        });
      },
      
      setTargetCompany: (companyId: number | null) => {
        set({ selectedCompanyId: companyId });
      },
      
      refreshUser: async () => {
        const { token } = get();
        if (!token) return;
        
        try {
          const response = await fetch('/api/v1/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          
          if (response.ok) {
            const user = await response.json();
            set({ user, company: user.company });
          }
        } catch (error) {
          console.error('Failed to refresh user:', error);
        }
      },
      
      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        company: state.company,
        selectedCompanyId: state.selectedCompanyId,
        isPlatformAdmin: state.isPlatformAdmin,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
