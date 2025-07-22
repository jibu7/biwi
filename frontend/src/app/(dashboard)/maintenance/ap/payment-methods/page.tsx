'use client';


import { useState } from 'react';
import Link from 'next/link';
import { Plus, Pencil, Trash2, CreditCard, Search } from 'lucide-react';
import { Table } from '@/components/ui/Table';
import { usePermissions } from '@/hooks/usePermissions';
import * as permissions from '@/lib/permissions';
import { cn } from '@/lib/utils';
// Temporary interface until backend implementation
interface PaymentMethod {
  id: number;
  company_id: number;
  code: string;
  name: string;
  description?: string;
  method_type: 'Cash' | 'Check' | 'Bank Transfer' | 'Credit Card' | 'Electronic' | 'Other';
  default_gl_account_id?: number;
  requires_reference: boolean;
  is_active: boolean;
}
// Mock data for development - will be replaced with API calls
const mockPaymentMethods: PaymentMethod[] = [
  {
    id: 1,
    company_id: 1,
    code: 'CASH',
    name: 'Cash Payment',
    description: 'Cash payments to suppliers',
    method_type: 'Cash',
    default_gl_account_id: 1001,
    requires_reference: false,
    is_active: true,
  },
  {
    id: 2,
    company_id: 1,
    code: 'CHECK',
    name: 'Check Payment',
    description: 'Check payments to suppliers',
    method_type: 'Check',
    default_gl_account_id: 1002,
    requires_reference: true,
    is_active: true,
  },
  {
    id: 3,
    company_id: 1,
    code: 'WIRE',
    name: 'Wire Transfer',
    description: 'Bank wire transfers',
    method_type: 'Bank Transfer',
    default_gl_account_id: 1003,
    requires_reference: true,
    is_active: true,
  },
  {
    id: 4,
    company_id: 1,
    code: 'ACH',
    name: 'ACH Transfer',
    description: 'Electronic ACH payments',
    method_type: 'Electronic',
    default_gl_account_id: 1004,
    requires_reference: true,
    is_active: true,
  },
];
export default function PaymentMethodsPage() {
  const { hasPermission } = usePermissions();
  const [searchTerm, setSearchTerm] = useState('');
  // Mock queries - will be replaced with actual API calls

  // Use mock data for now
  const currentPaymentMethods = mockPaymentMethods;

  const filteredPaymentMethods = currentPaymentMethods.filter(
    (method) =>
      method.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      method.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      method.method_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getMethodTypeColor = (methodType: string) => {
    switch (methodType) {
      case 'Cash':
        return 'bg-green-100 text-green-800';
      case 'Check':
        return 'bg-blue-100 text-blue-800';
      case 'Bank Transfer':
        return 'bg-purple-100 text-purple-800';
      case 'Credit Card':
        return 'bg-orange-100 text-orange-800';
      case 'Electronic':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const columns = [
    { header: 'Code', accessor: 'code' as keyof PaymentMethod },
    { header: 'Name', accessor: 'name' as keyof PaymentMethod },
    { 
      header: 'Method Type', 
      accessor: (method: PaymentMethod) => (
        <span className={cn('px-2 py-1 text-xs rounded-full', getMethodTypeColor(method.method_type))}>
          {method.method_type}
        </span>
      )
    },
    { header: 'Description', accessor: 'description' as keyof PaymentMethod },
    {
      header: 'Requires Reference',
      accessor: (method: PaymentMethod) => (
        <span className={cn(
          'px-2 py-1 text-xs rounded-full',
          method.requires_reference 
            ? 'bg-yellow-100 text-yellow-800' 
            : 'bg-gray-100 text-gray-800'
        )}>
          {method.requires_reference ? 'Yes' : 'No'}
        </span>
      )
    },
    {
      header: 'Status',
      accessor: (method: PaymentMethod) => (
        <span
          className={cn(
            'px-2 py-1 text-xs rounded-full',
            method.is_active
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          )}
        >
          {method.is_active ? 'Active' : 'Inactive'}
        </span>
      )
    },
    {
      header: 'Actions',
      accessor: (method: PaymentMethod) => (
        <div className="flex space-x-2">
          <Link href={`/maintenance/ap/payment-methods/${method.id}`}>
            <button 
              className="p-1 text-blue-600 hover:text-blue-800"
              disabled={!hasPermission(permissions.AP_SETUP_MANAGE)}
            >
              <Pencil className="h-4 w-4" />
            </button>
          </Link>
          <button
            onClick={() => handleDelete(method.id)}
            className="p-1 text-red-600 hover:text-red-800 disabled:text-gray-400"
            disabled={!hasPermission(permissions.AP_SETUP_MANAGE)}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this payment method?')) {
      // TODO: Implement delete when backend is ready
      console.log('Delete payment method:', id);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Payment Methods</h1>
            <p className="text-gray-600 mt-2">
              Manage payment methods for supplier transactions
            </p>
          </div>
          <Link href="/maintenance/ap/payment-methods/new">
            <button 
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
              disabled={!hasPermission(permissions.AP_SETUP_MANAGE)}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Payment Method
            </button>
          </Link>
        </div>

        {/* Development Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <CreditCard className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Development Notice
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  Payment methods functionality is currently under development. 
                  The data shown below is sample data for demonstration purposes.
                  Full functionality will be available once the backend implementation is complete.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search payment methods..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Total Methods</p>
                <p className="text-2xl font-bold text-gray-900">{currentPaymentMethods.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">
                  {currentPaymentMethods.filter(m => m.is_active).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Electronic</p>
                <p className="text-2xl font-bold text-indigo-600">
                  {currentPaymentMethods.filter(m => m.method_type === 'Electronic' || m.method_type === 'Bank Transfer').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Manual</p>
                <p className="text-2xl font-bold text-orange-600">
                  {currentPaymentMethods.filter(m => m.method_type === 'Cash' || m.method_type === 'Check').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Methods Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Payment Methods ({filteredPaymentMethods.length})
            </h3>
            {filteredPaymentMethods.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No payment methods found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm ? 'Try adjusting your search terms.' : 'Get started by creating a new payment method.'}
                </p>
                {!searchTerm && hasPermission(permissions.AP_SETUP_MANAGE) && (
                  <div className="mt-6">
                    <Link href="/maintenance/ap/payment-methods/new">
                      <button className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                        <Plus className="h-4 w-4 mr-2" />
                        New Payment Method
                      </button>
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <Table 
                data={filteredPaymentMethods} 
                columns={columns}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
