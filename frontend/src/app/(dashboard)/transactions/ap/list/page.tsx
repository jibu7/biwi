'use client';


import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Eye, Filter } from 'lucide-react';
import { apService } from '@/services/apService';
import { DataTable, Column } from '@/components/ui/data-table';
import { cn } from '@/lib/utils';

export default function APTransactionsListPage() {
  const [filters, setFilters] = useState({
    supplier_id: '',
    transaction_type_id: '',
    start_date: '',
    end_date: '',
  });

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['apTransactions', filters],
    queryFn: () => apService.getAPTransactions({
      supplier_id: filters.supplier_id ? parseInt(filters.supplier_id) : undefined,
      transaction_type_id: filters.transaction_type_id ? parseInt(filters.transaction_type_id) : undefined,
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

  const columns: Column<typeof transactions[0]>[] = [
    {
      accessorKey: 'document_number',
      header: 'Document #',
    },
    { 
      header: 'Supplier', 
      cell: ({ row }) => {
        const supplier = suppliers.find(s => s.id === row.original.supplier_id);
        return supplier ? `${supplier.supplier_code} - ${supplier.name}` : 'Unknown';
      }
    },
    { 
      header: 'Type', 
      cell: ({ row }) => {
        const type = transactionTypes.find(t => t.id === row.original.ap_transaction_type_id);
        return type?.name || 'Unknown';
      }
    },
    { 
      header: 'Date', 
      cell: ({ row }) => 
        new Date(row.original.transaction_date).toLocaleDateString()
    },
    { 
      header: 'Due Date', 
      cell: ({ row }) => 
        row.original.due_date ? new Date(row.original.due_date).toLocaleDateString() : '-'
    },
    {
      header: 'Total Amount',
      cell: ({ row }) => (
        <span className={row.original.total_amount < 0 ? 'text-green-600' : 'text-red-600'}>
          {new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
          }).format(Math.abs(row.original.total_amount))}
        </span>
      ),
    },
    {
      header: 'Open Amount',
      cell: ({ row }) => (
        <span className={row.original.open_amount < 0 ? 'text-green-600' : 'text-red-600'}>
          {new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
          }).format(Math.abs(row.original.open_amount))}
        </span>
      ),
    },
    {
      header: 'Status',
      cell: ({ row }) => (
        <span
          className={cn(
            'px-2 py-1 text-xs rounded-full',
            row.original.status === 'Open'
              ? 'bg-yellow-100 text-yellow-800'
              : row.original.status === 'Paid'
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          )}
        >
          {row.original.status}
        </span>
      ),
    },
    {
      accessorKey: 'reference',
      header: 'Reference',
    },
    {
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              // Navigate to transaction detail view
              console.log('View transaction:', row.original.id);
            }}
            className="text-blue-600 hover:text-blue-900"
          >
            <Eye className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({
      supplier_id: '',
      transaction_type_id: '',
      start_date: '',
      end_date: '',
    });
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">AP Transactions</h1>
        <p className="mt-1 text-sm text-gray-600">
          View and manage accounts payable transactions
        </p>
      </div>

      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center mb-4">
          <Filter className="h-5 w-5 text-gray-400 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Filters</h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Supplier
            </label>
            <select
              value={filters.supplier_id}
              onChange={(e) => handleFilterChange('supplier_id', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
            <label className="block text-sm font-medium text-gray-700">
              Transaction Type
            </label>
            <select
              value={filters.transaction_type_id}
              onChange={(e) => handleFilterChange('transaction_type_id', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              {transactionTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Start Date
            </label>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => handleFilterChange('start_date', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              End Date
            </label>
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => handleFilterChange('end_date', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mt-4">
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Clear Filters
          </button>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-600">
          Showing {transactions.length} transactions
        </p>
      </div>

      <DataTable data={transactions} columns={columns} />
    </div>
  );
}
