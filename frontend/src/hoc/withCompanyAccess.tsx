import React from 'react';
import { useRequireCompanyAccess } from '@/hooks/useCompanyAccess';
import { CompanyAccessError } from '@/components/layout/CompanyAccessError';

interface WithCompanyAccessOptions {
  fallback?: React.ComponentType;
  loadingComponent?: React.ComponentType;
}

export function withCompanyAccess<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: WithCompanyAccessOptions = {}
) {
  const WithCompanyAccessComponent = (props: P) => {
    const { hasAccess, isLoading, currentCompanyName } = useRequireCompanyAccess();

    if (isLoading) {
      if (options.loadingComponent) {
        const LoadingComponent = options.loadingComponent;
        return <LoadingComponent />;
      }
      return (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (!hasAccess) {
      if (options.fallback) {
        const FallbackComponent = options.fallback;
        return <FallbackComponent />;
      }
      return (
        <CompanyAccessError 
          message={`You don't have access to GL data${currentCompanyName ? ` for ${currentCompanyName}` : ''}.`}
        />
      );
    }

    return <WrappedComponent {...props} />;
  };

  WithCompanyAccessComponent.displayName = 
    `withCompanyAccess(${WrappedComponent.displayName || WrappedComponent.name})`;

  return WithCompanyAccessComponent;
}

// Example usage:
// export default withCompanyAccess(GLAccountsList);
// 
// Or with custom options:
// export default withCompanyAccess(GLAccountsList, {
//   fallback: CustomAccessDeniedComponent,
//   loadingComponent: CustomLoadingComponent
// });
