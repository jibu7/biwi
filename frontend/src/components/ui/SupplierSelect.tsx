import React, { forwardRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apService } from '@/services/apService';
import { useAuthStore } from '@/store/authStore';
import { Supplier } from '@/types/ap';

interface SupplierSelectProps {
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  name?: string;
  className?: string;
  disabled?: boolean;
  includeInactive?: boolean;
}

export const SupplierSelect = forwardRef<HTMLSelectElement, SupplierSelectProps>(
  ({ value, onChange, onBlur, name, className = '', disabled = false, includeInactive = false }, ref) => {
    const { selectedCompanyId } = useAuthStore();
    
    const { data: suppliers = [], isLoading } = useQuery({
      queryKey: ['suppliers', selectedCompanyId, includeInactive],
      queryFn: () => apService.getSuppliers(includeInactive),
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
          {!selectedCompanyId ? 'Select Company First' : 'Select Supplier'}
        </option>
        {suppliers.map((supplier: Supplier) => (
          <option key={supplier.id} value={supplier.id}>
            {supplier.name} ({supplier.supplier_code})
          </option>
        ))}
      </select>
    );
  }
);

SupplierSelect.displayName = 'SupplierSelect';
