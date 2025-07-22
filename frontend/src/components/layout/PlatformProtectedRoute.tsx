'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePlatformAuth } from '@/hooks/usePlatformAuth';

export function PlatformProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, checkAuth, platformUser } = usePlatformAuth();
  const router = useRouter();
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  useEffect(() => {
    const performAuthCheck = async () => {
      await checkAuth();
      setHasCheckedAuth(true);
    };
    
    performAuthCheck();
  }, [checkAuth]);

  useEffect(() => {
    // Only redirect after we've completed the initial auth check
    if (hasCheckedAuth && !isLoading && !isAuthenticated) {
      router.replace('/platform-login');
    }
  }, [isAuthenticated, isLoading, hasCheckedAuth]); // Remove router from dependencies

  // Show loading while checking authentication or haven't completed initial check
  if (isLoading || !hasCheckedAuth) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading platform...</p>
        </div>
      </div>
    );
  }

  // Don't render anything while redirecting
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
