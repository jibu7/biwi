'use client';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  DollarSign,
  User,
  Phone,
  Mail,
  Building2
} from 'lucide-react';
import { Customer } from '@/types/ar';
import { customerService } from '@/services/arService';
import { usePermissions } from '@/hooks/usePermissions';
import { AR_SETUP_MANAGE } from '@/lib/permissions';

export default function CustomersPage() {
  const { hasPermission } = usePermissions();
  const [searchTerm, setSearchTerm] = useState('');

  // Permission check
  const canManageCustomers = useMemo(() => hasPermission(AR_SETUP_MANAGE), [hasPermission]);

  const { data: customers = [], isLoading, error, refetch } = useQuery({
    queryKey: ['customers'],
    queryFn: customerService.getAll,
    enabled: canManageCustomers,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  // Filter customers based on search term
  const filteredCustomers = useMemo(() => {
    if (!customers?.length) return [];
    
    if (!searchTerm.trim()) return customers;
    
    return customers.filter((customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.customer_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.contact_info?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.contact_info?.phone?.includes(searchTerm)
    );
  }, [customers, searchTerm]);

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
      try {
        await customerService.delete(id);
        refetch();
      } catch (error: unknown) {
        let errorMessage = 'Failed to delete customer';
        if (typeof error === 'object' && error !== null && 'response' in error) {
          errorMessage = ((error as { response?: { data?: { detail?: string } } }).response?.data?.detail) || errorMessage;
        }
        alert(errorMessage);
      }
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Permission check
  if (!canManageCustomers) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-600">You don&apos;t have permission to manage customers.</p>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
            <p className="text-gray-600">Manage your customer database</p>
          </div>
          <Link
            href="/maintenance/ar/customers/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Customer
          </Link>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading customers</h3>
            <p className="mt-1 text-sm text-gray-500">
              {error instanceof Error ? error.message : 'There was a problem loading the customer data. Please try again.'}
            </p>
            <div className="mt-6 space-x-4">
              <button
                onClick={() => refetch()}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Try Again
              </button>
              <Link
                href="/maintenance/ar/customers/new"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Customer
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600">Manage your customer database</p>
        </div>
        <Link
          href="/maintenance/ar/customers/new"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Customer
        </Link>
      </div>

      {/* Search and Filter */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="mb-6">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
            Search Customers
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              id="search"
              placeholder="Search by customer name, code, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Customers Table */}
        {filteredCustomers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact Info
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Balance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Credit Limit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sales Rep
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-indigo-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {customer.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            Code: {customer.customer_code}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {customer.contact_info?.email && (
                          <div className="flex items-center mb-1">
                            <Mail className="h-3 w-3 mr-1 text-gray-400" />
                            <span className="truncate max-w-[150px]">{customer.contact_info.email}</span>
                          </div>
                        )}
                        {customer.contact_info?.phone && (
                          <div className="flex items-center mb-1">
                            <Phone className="h-3 w-3 mr-1 text-gray-400" />
                            {customer.contact_info.phone}
                          </div>
                        )}
                        {customer.payment_terms && (
                          <div className="text-xs text-gray-500">
                            Terms: {customer.payment_terms}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-1 text-gray-400" />
                        <span className={`text-sm font-medium ${
                          customer.current_balance > 0 
                            ? 'text-red-600' 
                            : customer.current_balance < 0 
                              ? 'text-green-600' 
                              : 'text-gray-900'
                        }`}>
                          {formatCurrency(customer.current_balance || 0)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(customer.credit_limit || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {customer.sales_representative_name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        customer.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {customer.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/maintenance/ar/customers/${customer.id}`}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/maintenance/ar/customers/${customer.id}/edit`}
                          className="text-gray-600 hover:text-gray-900"
                          title="Edit Customer"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(customer.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete Customer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center">
              <Building2 className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {searchTerm ? 'No customers found' : 'No customers yet'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm 
                ? 'Try adjusting your search terms or check the spelling.' 
                : 'Get started by creating your first customer.'
              }
            </p>
            {!searchTerm && (
              <div className="mt-6">
                <Link
                  href="/maintenance/ar/customers/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Customer
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {filteredCustomers.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900">{filteredCustomers.length}</div>
              <div className="text-sm text-gray-600">Total Customers</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">
                {filteredCustomers.filter(c => c.is_active).length}
              </div>
              <div className="text-sm text-gray-600">Active Customers</div>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(filteredCustomers.reduce((sum, c) => sum + (c.current_balance || 0), 0))}
              </div>
              <div className="text-sm text-gray-600">Total Outstanding</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(filteredCustomers.reduce((sum, c) => sum + (c.credit_limit || 0), 0))}
              </div>
              <div className="text-sm text-gray-600">Total Credit Limit</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
