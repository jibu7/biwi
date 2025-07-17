'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePlatformAuthStore } from '@/store/platformAuthStore';
import { PlatformSidebar } from '@/components/platform/PlatformSidebar';
import { PlatformNavbar } from '@/components/platform/PlatformNavbar';
import { CompanySelector } from '@/components/platform/CompanySelector';

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, user, isLoading, initAuth } = usePlatformAuthStore();
  const router = useRouter();
  
  useEffect(() => {
    initAuth();
  }, []);
  
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.user_type !== 'platform_admin')) {
      router.push('/platform-login');
    }
  }, [isLoading, isAuthenticated, user, router]);
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (!isAuthenticated || user?.user_type !== 'platform_admin') {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <PlatformSidebar />
      <div className="flex-1 flex flex-col">
        <PlatformNavbar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-4">
            <CompanySelector />
          </div>
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
