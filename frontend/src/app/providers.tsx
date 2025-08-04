'use client';


import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { FeedbackWidget } from '../components/feedback';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { FormattingProvider } from '../contexts/FormattingContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  // Auth store now uses Zustand persistence, so no manual loading needed

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <FormattingProvider>
          {children}
          <Toaster />
          <FeedbackWidget />
        </FormattingProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
