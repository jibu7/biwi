import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { customerService } from '@/services/arService';
import { Search, X } from 'lucide-react';

interface Customer {
  id: number;
  customer_code: string;
  name: string;
  contact_info?: any;
}

interface CustomerSearchProps {
  selectedCustomer: Customer | null;
  onSelectCustomer: (customer: Customer | null) => void;
}

export function CustomerSearch({ selectedCustomer, onSelectCustomer }: CustomerSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showResults, setShowResults] = useState(false);

  const { data: allCustomers, isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customerService.getAll(),
  });

  // Filter customers based on search term
  const searchResults = searchTerm.length > 1 
    ? allCustomers?.filter((customer: any) => 
        customer.customer_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.name.toLowerCase().includes(searchTerm.toLowerCase())
      ) || []
    : [];

  const handleSelectCustomer = (customer: any) => {
    onSelectCustomer({
      id: customer.id,
      customer_code: customer.customer_code,
      name: customer.name,
      contact_info: customer.contact_info
    });
    setSearchTerm('');
    setShowResults(false);
  };

  const clearCustomer = () => {
    onSelectCustomer(null);
    setSearchTerm('');
    setShowResults(false);
  };

  if (selectedCustomer) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
          <div>
            <div className="font-medium">{selectedCustomer.name}</div>
            <div className="text-sm text-gray-600">{selectedCustomer.customer_code}</div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={clearCustomer}
            className="p-1 h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search customers..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setShowResults(e.target.value.length > 1);
          }}
          className="pl-10"
        />
      </div>

      {showResults && searchTerm.length > 1 && (
        <div className="max-h-48 overflow-y-auto border rounded-md bg-white">
          {isLoading ? (
            <div className="p-3 text-center text-gray-500">Loading...</div>
          ) : searchResults.length > 0 ? (
            <div className="divide-y">
              {searchResults.map((customer: any) => (
                <div
                  key={customer.id}
                  className="p-3 hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleSelectCustomer(customer)}
                >
                  <div className="font-medium">{customer.name}</div>
                  <div className="text-sm text-gray-600">{customer.customer_code}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 text-center text-gray-500">No customers found</div>
          )}
        </div>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={() => onSelectCustomer(null)}
        className="w-full"
      >
        Walk-in Customer
      </Button>
    </div>
  );
}
