import React, { forwardRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { customerService } from '@/services/arService';

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
    const { data: customers = [], isLoading } = useQuery({
      queryKey: ['customers'],
      queryFn: customerService.getAll,
    });

    return (
      <select
        ref={ref}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onBlur={onBlur}
        name={name}
        className={`form-select w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${className}`}
        disabled={disabled || isLoading}
      >
        <option value="">Select Customer</option>
        {customers.map((customer) => (
          <option key={customer.id} value={customer.id}>
            {customer.name} ({customer.customer_code})
          </option>
        ))}
      </select>
    );
  }
);

CustomerSelect.displayName = 'CustomerSelect';
