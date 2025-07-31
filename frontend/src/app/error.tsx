'use client';

import React from 'react';
import { Logo } from '@/components/ui/Logo';
import { RefreshCcw, Home } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <Logo size="xl" textSize="3xl" />
        </div>
        
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Oops!</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Something went wrong</h2>
          <p className="text-gray-600 mb-4">
            We encountered an unexpected error. Don't worry, our team has been notified and we're working to fix it.
          </p>
          {process.env.NODE_ENV === 'development' && (
            <details className="text-left text-sm text-gray-500 bg-gray-100 p-4 rounded-lg mb-4">
              <summary className="cursor-pointer font-medium">Error Details</summary>
              <pre className="mt-2 whitespace-pre-wrap">{error.message}</pre>
            </details>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCcw className="h-4 w-4 mr-2" />
            Try Again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
          >
            <Home className="h-4 w-4 mr-2" />
            Go Home
          </a>
        </div>
      </div>
    </div>
  );
}
