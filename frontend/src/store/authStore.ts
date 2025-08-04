import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Company } from '@/types';

interface FormattingConfig {
  dateFormat: string;
  timeFormat: '12h' | '24h';
  decimalSeparator: string;
  thousandSeparator: string;
  currencyCode: string;
  currencySymbol: string;
  currencyPosition: 'prefix' | 'suffix';
  currencyDecimalPlaces: number;
  locale: string;
  timezone: string;
}

interface AuthState {
  user: User | null;
  company: Company | null;
  selectedCompanyId: number | null;
  token: string | null;
  isPlatformAdmin: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  formattingConfig: FormattingConfig | null;
  
  login: (email: string, password: string) => Promise<void>;
  platformLogin: (email: string, password: string, otpCode?: string) => Promise<void>;
  logout: () => void;
  setTargetCompany: (companyId: number | null) => void;
  setSelectedCompanyId: (companyId: number | null) => void;
  refreshUser: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  initAuth: () => Promise<void>;
  updateFormattingConfig: (config: FormattingConfig) => void;
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
      isLoading: true,
      formattingConfig: null,
      
      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const formData = new FormData();
          formData.append('username', email);
          formData.append('password', password);
          
          const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';
          const response = await fetch(`${backendUrl}/auth/login`, {
            method: 'POST',
            body: formData,
          });
          
          if (!response.ok) {
            throw new Error('Login failed');
          }
          
          const data = await response.json();
          
          // Get user details
          const userResponse = await fetch(`${backendUrl}/auth/me`, {
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
            formattingConfig: user.formatting_config,
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
          const headers: Record<string, string> = {};
          
          if (otpCode) {
            payload = JSON.stringify({ username: email, password, otp_code: otpCode });
            headers['Content-Type'] = 'application/json';
          } else {
            payload = new FormData();
            (payload as FormData).append('username', email);
            (payload as FormData).append('password', password);
          }
          
          const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';
          const response = await fetch(
            otpCode ? `${backendUrl}/platform/auth/login-mfa` : `${backendUrl}/platform/auth/login`,
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
          const userResponse = await fetch(`${backendUrl}/auth/me`, {
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
            formattingConfig: user.formatting_config,
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
          formattingConfig: null,
          isLoading: false,
        });
      },
      
      setTargetCompany: (companyId: number | null) => {
        set({ selectedCompanyId: companyId });
      },
      
      setSelectedCompanyId: (companyId: number | null) => {
        set({ selectedCompanyId: companyId });
      },
      
      refreshUser: async () => {
        const { token } = get();
        if (!token) return;
        
        try {
          const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';
          const response = await fetch(`${backendUrl}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          
          if (response.ok) {
            const user = await response.json();
            set({ 
              user, 
              company: user.company,
              formattingConfig: user.formatting_config 
            });
          }
        } catch (error) {
          console.error('Failed to refresh user:', error);
        }
      },
      
      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
      
      initAuth: async () => {
        const { token } = get();
        if (!token) {
          set({ isAuthenticated: false, isLoading: false });
          return;
        }

        set({ isLoading: true });
        try {
          // Validate token by calling /me endpoint
          const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';
          const response = await fetch(`${backendUrl}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const user = await response.json();
            set({
              user,
              company: user.company,
              selectedCompanyId: user.company_id,
              formattingConfig: user.formatting_config,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            // Token is invalid, clear auth state
            set({
              user: null,
              company: null,
              selectedCompanyId: null,
              token: null,
              isPlatformAdmin: false,
              isAuthenticated: false,
              formattingConfig: null,
              isLoading: false,
            });
          }
        } catch (error) {
          console.error('Auth validation failed:', error);
          // Token is invalid, clear auth state
          set({
            user: null,
            company: null,
            selectedCompanyId: null,
            token: null,
            isPlatformAdmin: false,
            isAuthenticated: false,
            formattingConfig: null,
            isLoading: false,
          });
        }
      },

      updateFormattingConfig: (config) => set({ formattingConfig: config }),
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
        formattingConfig: state.formattingConfig,
      }),
    }
  )
);
