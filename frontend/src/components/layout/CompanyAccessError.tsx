'use client';

import { AlertTriangle, Shield, Building2 } from 'lucide-react';

interface CompanyAccessErrorProps {
  message?: string;
  onRetry?: () => void;
}

export function CompanyAccessError({ 
  message = "You don't have access to this company's data.", 
  onRetry 
}: CompanyAccessErrorProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="max-w-md w-full bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-shrink-0">
            <Shield className="h-8 w-8 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-red-900">Access Denied</h3>
            <p className="text-sm text-red-700">Company data access violation</p>
          </div>
        </div>
        
        <div className="flex items-start gap-2 mb-4">
          <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-800">{message}</p>
        </div>
        
        <div className="flex items-center gap-2 text-xs text-red-600 mb-4">
          <Building2 className="h-4 w-4" />
          <span>Company isolation is enforced for data security</span>
        </div>
        
        {onRetry && (
          <button
            onClick={onRetry}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-medium"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}

export function CompanyDataGuard({ children, fallback }: { 
  children: React.ReactNode; 
  fallback?: React.ReactNode;
}) {
  // This component can be enhanced to check permissions and wrap sensitive data
  return <>{children}</>;
}
