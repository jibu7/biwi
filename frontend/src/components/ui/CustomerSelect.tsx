import React, { forwardRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { arService } from '@/services/arService';
import { useAuthStore } from '@/store/authStore';
import { Customer } from '@/types/ar';

interface CustomerSelectProps {
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  name?: string;
  className?: string;
  disabled?: boolean;
}

export const CustomerSelect = forwardRef<HTMLSelectElement, CustomerSelectProps>(
  ({ value, onChange, onBlur, name, className = '', disabled = false }, ref) => {
    const { selectedCompanyId } = useAuthStore();
    
    const { data: customers = [], isLoading } = useQuery({
      queryKey: ['customers', selectedCompanyId],
      queryFn: () => arService.getCustomers(),
      enabled: !!selectedCompanyId
    });

    return (
      <select
        ref={ref}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onBlur={onBlur}
        name={name}
        className={`form-select w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${className}`}
        disabled={disabled || isLoading || !selectedCompanyId}
      >
        <option value="">
          {!selectedCompanyId ? 'Select Company First' : 'Select Customer'}
        </option>
        {customers.map((customer: Customer) => (
          <option key={customer.id} value={customer.id}>
            {customer.name} ({customer.customer_code})
          </option>
        ))}
      </select>
    );
  }
);

CustomerSelect.displayName = 'CustomerSelect';
