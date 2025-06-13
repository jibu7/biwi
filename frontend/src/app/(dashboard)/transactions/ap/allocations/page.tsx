'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Eye, Filter, Plus, ArrowRight } from 'lucide-react';
import { apService } from '@/services/apService';
import { Table } from '@/components/ui/Table';
import { cn } from '@/lib/utils';

export default function APAllocationsPage() {
  const [filters, setFilters] = useState({
    supplier_id: '',
  });

  const { data: allocations = [], isLoading } = useQuery({
    queryKey: ['apAllocations', filters],
    queryFn: () => apService.getAPAllocations({
      supplier_id: filters.supplier_id ? parseInt(filters.supplier_id) : undefined,
    }),
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => apService.getSuppliers(),
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['apTransactions'],
    queryFn: () => apService.getAPTransactions(),
  });

  // Helper function to get transaction details
  const getTransactionDetails = (transactionId: number) => {
    return transactions.find(t => t.id === transactionId);
  };

  const columns = [
    { header: 'Allocation #', accessor: 'id' as keyof typeof allocations[0] },
    { 
      header: 'Date', 
      accessor: (allocation: typeof allocations[0]) => {
        return new Date(allocation.allocation_date).toLocaleDateString();
      }
    },
    { 
      header: 'Supplier', 
      accessor: (allocation: typeof allocations[0]) => {
        const supplier = suppliers.find(s => s.id === allocation.supplier_id);
        return supplier ? `${supplier.supplier_code} - ${supplier.name}` : 'Unknown';
      }
    },
    { 
      header: 'Allocations', 
      accessor: (allocation: typeof allocations[0]) => {
        return (
          <div className="space-y-1">
            {allocation.lines.map((line, index) => {
              const creditTransaction = getTransactionDetails(line.credit_transaction_id);
              const debitTransaction = getTransactionDetails(line.debit_transaction_id);
              
              return (
                <div key={index} className="flex items-center space-x-2 text-xs">
                  <span className="text-blue-600 font-mono">
                    {creditTransaction?.document_number || 'N/A'}
                  </span>
                  <ArrowRight className="h-3 w-3 text-gray-400" />
                  <span className="text-green-600 font-mono">
                    {debitTransaction?.document_number || 'N/A'}
                  </span>
                  <span className="text-gray-600">
                    ({new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD'
                    }).format(line.allocated_amount)})
                  </span>
                </div>
              );
            })}
          </div>
        );
      }
    },
    { 
      header: 'Total Amount', 
      accessor: (allocation: typeof allocations[0]) => {
        const totalAmount = allocation.lines.reduce((sum, line) => sum + line.allocated_amount, 0);
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(totalAmount);
      }
    },
    { 
      header: 'Line Count', 
      accessor: (allocation: typeof allocations[0]) => {
        return allocation.lines.length;
      }
    },
    {
      header: 'Actions',
      accessor: (allocation: typeof allocations[0]) => (
        <div className="flex space-x-2">
          <Link href={`/transactions/ap/allocations/${allocation.id}`}>
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
  const totalAllocations = allocations.length;
  const totalAmount = allocations.reduce((sum, allocation) => 
    sum + allocation.lines.reduce((lineSum, line) => lineSum + line.allocated_amount, 0), 0
  );
  const totalLines = allocations.reduce((sum, allocation) => sum + allocation.lines.length, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">AP Allocations</h1>
            <p className="text-gray-600 mt-2">
              Manage allocations of payments to invoices and other transactions
            </p>
          </div>
          <Link href="/transactions/ap/allocations/new">
            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
              <Plus className="h-4 w-4 mr-2" />
              New Allocation
            </button>
          </Link>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Total Allocations</p>
                <p className="text-2xl font-bold text-gray-900">{totalAllocations}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Total Amount Allocated</p>
                <p className="text-2xl font-bold text-purple-600">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD'
                  }).format(totalAmount)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Total Allocation Lines</p>
                <p className="text-2xl font-bold text-gray-900">{totalLines}</p>
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
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
              >
                <option value="">All Suppliers</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.supplier_code} - {supplier.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                About Allocations
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Allocations link payments to invoices and other transactions. Each allocation shows:
                </p>
                <ul className="mt-1 list-disc list-inside space-y-1">
                  <li><span className="text-blue-600 font-mono">Blue numbers</span> represent credit transactions (typically invoices)</li>
                  <li><span className="text-green-600 font-mono">Green numbers</span> represent debit transactions (typically payments)</li>
                  <li>The arrow shows the direction of allocation from credit to debit</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Allocations Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Allocations ({allocations.length})
            </h3>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                <p className="mt-2 text-gray-600">Loading allocations...</p>
              </div>
            ) : allocations.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No allocations found.</p>
                <p className="text-gray-500 text-sm mt-1">
                  Create allocations to match payments with invoices and other transactions.
                </p>
                <Link href="/transactions/ap/allocations/new">
                  <button className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Allocation
                  </button>
                </Link>
              </div>
            ) : (
              <Table 
                data={allocations} 
                columns={columns}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
