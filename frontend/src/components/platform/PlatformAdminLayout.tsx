import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { CompanySelector } from './CompanySelector';
import { PlatformNavbar } from './PlatformNavbar';
import { PlatformSidebar } from './PlatformSidebar';

interface PlatformAdminLayoutProps {
  children: React.ReactNode;
}

export const PlatformAdminLayout: React.FC<PlatformAdminLayoutProps> = ({ children }) => {
  const { isPlatformAdmin, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();
  
  React.useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isPlatformAdmin)) {
      router.push('/platform-login');
    }
  }, [isLoading, isAuthenticated, isPlatformAdmin]); // Remove router from dependencies
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (!isAuthenticated || !isPlatformAdmin) {
    return null;
  }
  
  return (
    <div className="min-h-screen bg-gray-100">
      <PlatformNavbar />
      <div className="flex">
        <PlatformSidebar />
        <main className="flex-1 p-6">
          <div className="mb-4">
            <CompanySelector />
          </div>
          {children}
        </main>
      </div>
    </div>
  );
};
