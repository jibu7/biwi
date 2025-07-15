'use client';


import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Eye, Filter, Plus } from 'lucide-react';
import { apService } from '@/services/apService';
import { Table } from '@/components/ui/Table';
import { cn } from '@/lib/utils';

export default function SupplierPaymentsPage() {
  const [filters, setFilters] = useState({
    supplier_id: '',
    start_date: '',
    end_date: '',
  });

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['supplierPayments', filters],
    queryFn: () => apService.getAPTransactions({
      supplier_id: filters.supplier_id ? parseInt(filters.supplier_id) : undefined,
      start_date: filters.start_date || undefined,
      end_date: filters.end_date || undefined,
    }),
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => apService.getSuppliers(),
  });

  const { data: transactionTypes = [] } = useQuery({
    queryKey: ['apTransactionTypes'],
    queryFn: () => apService.getAPTransactionTypes(),
  });

  // Filter to only show payments
  const paymentTypes = transactionTypes.filter(t => t.base_type === 'Payment');
  const paymentTypeIds = paymentTypes.map(t => t.id);
  const supplierPayments = transactions.filter(t => paymentTypeIds.includes(t.ap_transaction_type_id));

  const columns = [
    { header: 'Payment #', accessor: 'document_number' as keyof typeof supplierPayments[0] },
    { 
      header: 'Supplier', 
      accessor: (transaction: typeof supplierPayments[0]) => {
        const supplier = suppliers.find(s => s.id === transaction.supplier_id);
        return supplier ? `${supplier.supplier_code} - ${supplier.name}` : 'Unknown';
      }
    },
    { 
      header: 'Payment Date', 
      accessor: (transaction: typeof supplierPayments[0]) => {
        return new Date(transaction.transaction_date).toLocaleDateString();
      }
    },
    { 
      header: 'Reference', 
      accessor: (transaction: typeof supplierPayments[0]) => {
        return transaction.reference || '-';
      }
    },
    { 
      header: 'Amount', 
      accessor: (transaction: typeof supplierPayments[0]) => {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(transaction.total_amount);
      }
    },
    { 
      header: 'Status', 
      accessor: (transaction: typeof supplierPayments[0]) => {
        const isAllocated = transaction.open_amount <= 0;
        return (
          <span className={cn(
            'px-2 py-1 rounded-full text-xs font-medium',
            isAllocated 
              ? 'bg-green-100 text-green-800' 
              : 'bg-orange-100 text-orange-800'
          )}>
            {isAllocated ? 'Fully Allocated' : 'Unallocated'}
          </span>
        );
      }
    },
    { 
      header: 'Open Amount', 
      accessor: (transaction: typeof supplierPayments[0]) => {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(transaction.open_amount);
      }
    },
    {
      header: 'Actions',
      accessor: (transaction: typeof supplierPayments[0]) => (
        <div className="flex space-x-2">
          <Link href={`/transactions/ap/payments/${transaction.id}`}>
            <button className="p-1 text-gray-400 hover:text-gray-600">
              <Eye className="h-4 w-4" />
            </button>
          </Link>
        </div>
      )
    }
  ];

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Calculate totals
  const totalPayments = supplierPayments.reduce((sum, payment) => sum + payment.total_amount, 0);
  const totalUnallocated = supplierPayments.reduce((sum, payment) => sum + payment.open_amount, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Supplier Payments</h1>
            <p className="text-gray-600 mt-2">
              Manage and track payments made to suppliers
            </p>
          </div>
          <Link href="/transactions/ap/payments/new">
            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
              <Plus className="h-4 w-4 mr-2" />
              New Payment
            </button>
          </Link>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Total Payments</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD'
                  }).format(totalPayments)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Unallocated Amount</p>
                <p className="text-2xl font-bold text-orange-600">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD'
                  }).format(totalUnallocated)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Payment Count</p>
                <p className="text-2xl font-bold text-gray-900">{supplierPayments.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center space-x-2 mb-4">
            <Filter className="h-5 w-5 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900">Filters</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="supplier" className="block text-sm font-medium text-gray-700">
                Supplier
              </label>
              <select
                id="supplier"
                value={filters.supplier_id}
                onChange={(e) => handleFilterChange('supplier_id', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
              >
                <option value="">All Suppliers</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.supplier_code} - {supplier.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">
                From Date
              </label>
              <input
                type="date"
                id="start_date"
                value={filters.start_date}
                onChange={(e) => handleFilterChange('start_date', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">
                To Date
              </label>
              <input
                type="date"
                id="end_date"
                value={filters.end_date}
                onChange={(e) => handleFilterChange('end_date', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
              />
            </div>
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Supplier Payments ({supplierPayments.length})
            </h3>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                <p className="mt-2 text-gray-600">Loading payments...</p>
              </div>
            ) : supplierPayments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No payments found.</p>
                <Link href="/transactions/ap/payments/new">
                  <button className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Record First Payment
                  </button>
                </Link>
              </div>
            ) : (
              <Table 
                data={supplierPayments} 
                columns={columns}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
