import { useAuthStore } from '@/store/authStore';

export const useAuth = () => {
  const user = useAuthStore((state) => state.user);
  const company = useAuthStore((state) => state.company);
  const selectedCompanyId = useAuthStore((state) => state.selectedCompanyId);
  const token = useAuthStore((state) => state.token);
  const isPlatformAdmin = useAuthStore((state) => state.isPlatformAdmin);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const login = useAuthStore((state) => state.login);
  const platformLogin = useAuthStore((state) => state.platformLogin);
  const logout = useAuthStore((state) => state.logout);
  const setTargetCompany = useAuthStore((state) => state.setTargetCompany);
  const setSelectedCompanyId = useAuthStore((state) => state.setSelectedCompanyId);
  const refreshUser = useAuthStore((state) => state.refreshUser);

  return {
    user,
    company,
    selectedCompanyId,
    token,
    isPlatformAdmin,
    isAuthenticated,
    isLoading,
    login,
    platformLogin,
    logout,
    setTargetCompany,
    setSelectedCompanyId,
    refreshUser,
  };
};
