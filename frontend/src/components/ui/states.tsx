import React from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';

interface LoadingStateProps {
  text?: string;
}

export function LoadingState({ text = 'Loading...' }: LoadingStateProps) {
  return (
    <div className="p-6">
      <div className="flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <span className="ml-2 text-sm text-gray-600">{text}</span>
      </div>
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  children?: React.ReactNode;
}

export function ErrorState({ 
  title = 'Something went wrong',
  message = 'An error occurred while loading the data.',
  onRetry,
  children
}: ErrorStateProps) {
  return (
    <div className="p-6">
      <div className="text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-500 mb-4">{message}</p>
        
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Try Again
          </button>
        )}
        
        {children}
      </div>
    </div>
  );
}

interface EmptyStateProps {
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export function EmptyState({ 
  title = 'No data found',
  message = 'There are no items to display.',
  actionLabel,
  onAction,
  icon
}: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      {icon && <div className="mb-4">{icon}</div>}
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 mb-4">{message}</p>
      
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
