interface ApiErrorDisplayProps {
  error: any;
  title?: string;
}

export const ApiErrorDisplay = ({ error, title = "Error" }: ApiErrorDisplayProps) => {
  if (!error) return null;

  const parseApiError = (error: any): string => {
    if (error?.response?.status === 400) {
      const detail = error.response?.data?.detail;
      if (typeof detail === 'string') {
        // Common error patterns
        if (detail.includes('Currency code already exists')) {
          return 'A currency with this code already exists for your company. Please use a different currency code.';
        }
        if (detail.includes('base currency already exists')) {
          return 'A base currency already exists for your company. Only one base currency is allowed per company.';
        }
        if (detail.includes('Tax type name already exists')) {
          return 'A tax type with this name already exists for your company. Please use a different name.';
        }
        return detail;
      }
    }
    
    if (error?.response?.status === 422) {
      // Validation errors
      const detail = error.response?.data?.detail;
      if (Array.isArray(detail) && detail.length > 0) {
        const firstError = detail[0];
        if (firstError.msg) {
          return `${firstError.loc?.join(' ')}: ${firstError.msg}`;
        }
      }
      return 'Please check your input values and try again.';
    }
    
    if (error?.message) {
      return error.message;
    }
    
    return 'An unexpected error occurred. Please try again.';
  };

  return (
    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path 
              fillRule="evenodd" 
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
              clipRule="evenodd" 
            />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">
            {title}
          </h3>
          <div className="mt-2 text-sm text-red-700">
            <p>{parseApiError(error)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
