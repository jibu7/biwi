'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Eye, Filter, Plus } from 'lucide-react';
import { apService } from '@/services/apService';
import { Table } from '@/components/ui/Table';
import { cn } from '@/lib/utils';

export default function SupplierInvoicesPage() {
  const [filters, setFilters] = useState({
    supplier_id: '',
    start_date: '',
    end_date: '',
  });

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['supplierInvoices', filters],
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

  // Filter to only show supplier invoices
  const invoiceTypes = transactionTypes.filter(t => t.base_type === 'Supplier Invoice');
  const invoiceTypeIds = invoiceTypes.map(t => t.id);
  const supplierInvoices = transactions.filter(t => invoiceTypeIds.includes(t.ap_transaction_type_id));

  const columns = [
    { header: 'Invoice #', accessor: 'document_number' as keyof typeof supplierInvoices[0] },
    { 
      header: 'Supplier', 
      accessor: (transaction: typeof supplierInvoices[0]) => {
        const supplier = suppliers.find(s => s.id === transaction.supplier_id);
        return supplier ? `${supplier.supplier_code} - ${supplier.name}` : 'Unknown';
      }
    },
    { 
      header: 'Date', 
      accessor: (transaction: typeof supplierInvoices[0]) => {
        return new Date(transaction.transaction_date).toLocaleDateString();
      }
    },
    { 
      header: 'Due Date', 
      accessor: (transaction: typeof supplierInvoices[0]) => {
        return transaction.due_date ? new Date(transaction.due_date).toLocaleDateString() : '-';
      }
    },
    { 
      header: 'Amount', 
      accessor: (transaction: typeof supplierInvoices[0]) => {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(transaction.total_amount);
      }
    },
    { 
      header: 'Status', 
      accessor: (transaction: typeof supplierInvoices[0]) => {
        const isPaid = transaction.open_amount <= 0;
        return (
          <span className={cn(
            'px-2 py-1 rounded-full text-xs font-medium',
            isPaid 
              ? 'bg-green-100 text-green-800' 
              : 'bg-yellow-100 text-yellow-800'
          )}>
            {isPaid ? 'Paid' : 'Outstanding'}
          </span>
        );
      }
    },
    {
      header: 'Actions',
      accessor: (transaction: typeof supplierInvoices[0]) => (
        <div className="flex space-x-2">
          <Link href={`/transactions/ap/invoices/${transaction.id}`}>
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Supplier Invoices</h1>
            <p className="text-gray-600 mt-2">
              Manage and track supplier invoices
            </p>
          </div>
          <Link href="/transactions/ap/invoices/new">
            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <Plus className="h-4 w-4 mr-2" />
              New Invoice
            </button>
          </Link>
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
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
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
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
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
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Supplier Invoices ({supplierInvoices.length})
            </h3>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Loading invoices...</p>
              </div>
            ) : supplierInvoices.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No supplier invoices found.</p>
                <Link href="/transactions/ap/invoices/new">
                  <button className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Invoice
                  </button>
                </Link>
              </div>
            ) : (
              <Table 
                data={supplierInvoices} 
                columns={columns}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
