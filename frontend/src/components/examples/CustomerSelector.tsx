import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { arService } from '@/services/arService';
import { useAuthStore } from '@/store/authStore';
import { CustomerSelect } from '@/components/ui/CustomerSelect';
import { Customer } from '@/types/ar';

interface CustomerSelectorProps {
  onSelect: (customerId: number | null) => void;
  value?: number | null;
}

export const CustomerSelector: React.FC<CustomerSelectorProps> = ({ onSelect, value }) => {
  const { selectedCompanyId } = useAuthStore();
  
  const { data: customers, isLoading } = useQuery({
    queryKey: ['customers', selectedCompanyId],
    queryFn: () => arService.getCustomers(),
    enabled: !!selectedCompanyId
  });

  const handleSelectionChange = (customerId: string) => {
    if (customerId === '') {
      onSelect(null);
    } else {
      onSelect(parseInt(customerId, 10));
    }
  };

  if (!selectedCompanyId) {
    return (
      <div className="p-4 bg-yellow-100 border border-yellow-400 rounded-md">
        <p className="text-yellow-800">Please select a company first to view customers.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <span className="text-gray-600">Loading customers...</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label htmlFor="customer-select" className="block text-sm font-medium text-gray-700">
        Customer
      </label>
      <CustomerSelect
        value={value?.toString() || ''}
        onChange={handleSelectionChange}
        name="customer-select"
        className="max-w-md"
      />
      {value && customers && (
        <div className="text-sm text-gray-600">
          Selected: {customers.find((c: Customer) => c.id === value)?.name}
        </div>
      )}
    </div>
  );
};

export default CustomerSelector;
