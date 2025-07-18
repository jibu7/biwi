import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Company } from '@/types';
import axiosInstance from '@/lib/axiosInstance';

interface CompanyContextType {
  currentCompany: Company | null;
  isLoading: boolean;
  error: string | null;
  setCurrentCompany: (company: Company | null) => void;
  fetchCompanyDetails: () => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const CompanyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isPlatformAdmin } = useAuthStore();
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const fetchCompanyDetails = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // For platform admin, the currentCompany might be the impersonated one
      // For regular users, it's always their assigned company
      const response = await axiosInstance.get('/companies/current');
      setCurrentCompany(response.data);
    } catch (err) {
      setError('Failed to fetch company details');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    if (user && !isPlatformAdmin) {
      fetchCompanyDetails();
    }
  }, [user, isPlatformAdmin]);
  
  const value = {
    currentCompany,
    isLoading,
    error,
    setCurrentCompany,
    fetchCompanyDetails,
  };
  
  return <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>;
};

export const useCompanyContext = (): CompanyContextType => {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompanyContext must be used within a CompanyProvider');
  }
  return context;
};
