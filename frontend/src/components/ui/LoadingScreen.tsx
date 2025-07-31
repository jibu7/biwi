'use client';

import React from 'react';
import { Logo } from '@/components/ui/Logo';

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = 'Loading...' }: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
      <div className="text-center">
        <div className="mb-6">
          <Logo size="xl" textSize="3xl" showText={false} />
        </div>
        <div className="flex items-center justify-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="text-gray-600 text-lg">{message}</span>
        </div>
      </div>
    </div>
  );
}

export default LoadingScreen;
