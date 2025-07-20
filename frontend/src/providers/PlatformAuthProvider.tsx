'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePlatformAuthStore } from '@/store/platformAuthStore';
import { useRouter } from 'next/navigation';

const PlatformAuthContext = createContext({});

export const PlatformAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user, isLoading, initAuth } = usePlatformAuthStore();
  const router = useRouter();
  
  useEffect(() => {
    initAuth();
  }, [initAuth]);
  
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.user_type !== 'platform_admin')) {
      router.push('/platform-login');
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading || !isAuthenticated || user?.user_type !== 'platform_admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <PlatformAuthContext.Provider value={{}}>
      {children}
    </PlatformAuthContext.Provider>
  );
};

export const usePlatformAuth = () => useContext(PlatformAuthContext);
