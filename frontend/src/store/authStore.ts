import { create } from 'zustand';
import { User, Company, UserLogin } from '@/types';
import { authService } from '@/services/authService';
import { companyService } from '@/services/companyService';
import Cookies from 'js-cookie';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  company: Company | null;
  selectedCompanyId: string | null;
  
  login: (credentials: UserLogin) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  loadAuthData: () => Promise<void>;
  setSelectedCompanyId: (companyId: string) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  company: null,
  selectedCompanyId: null,

  login: async (credentials) => {
    try {
      const tokenData = await authService.login(credentials);
      const user = await authService.getMe();
      const company = await companyService.getCurrentCompany();
      
      set({
        token: tokenData.access_token,
        user,
        company,
        isAuthenticated: true,
        selectedCompanyId: user.company_id.toString(),
      });
      
      localStorage.setItem('selectedCompanyId', user.company_id.toString());
    } catch (error) {
      set({ isAuthenticated: false, user: null, token: null });
      throw error;
    }
  },

  logout: () => {
    authService.logout();
    localStorage.removeItem('selectedCompanyId');
    set({
      user: null,
      token: null,
      company: null,
      isAuthenticated: false,
      selectedCompanyId: null,
    });
  },

  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),

  loadAuthData: async () => {
    set({ isLoading: true });
    try {
      const token = Cookies.get('access_token');
      if (token) {
        const user = await authService.getMe();
        const company = await companyService.getCurrentCompany();
        const savedCompanyId = localStorage.getItem('selectedCompanyId');
        
        set({
          token,
          user,
          company,
          isAuthenticated: true,
          selectedCompanyId: savedCompanyId || user.company_id.toString(),
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      set({ isLoading: false, isAuthenticated: false });
    }
  },

  setSelectedCompanyId: (companyId) => {
    localStorage.setItem('selectedCompanyId', companyId);
    set({ selectedCompanyId: companyId });
  },
}));

export const useAuth = () => useAuthStore();
