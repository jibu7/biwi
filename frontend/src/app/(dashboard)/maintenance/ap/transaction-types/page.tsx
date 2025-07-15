'use client';


import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { apService } from '@/services/apService';
import { Table } from '@/components/ui/Table';
import { usePermissions } from '@/hooks/usePermissions';
import * as permissions from '@/lib/permissions';
import { cn } from '@/lib/utils';

export default function APTransactionTypesPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: transactionTypes = [], isLoading } = useQuery({
    queryKey: ['apTransactionTypes'],
    queryFn: () => apService.getAPTransactionTypes(),
  });

  const deleteMutation = useMutation({
    mutationFn: apService.deleteAPTransactionType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apTransactionTypes'] });
    },
  });

  const filteredTransactionTypes = transactionTypes.filter(
    (type) =>
      type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      type.base_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { header: 'Name', accessor: 'name' as keyof typeof transactionTypes[0] },
    { header: 'Base Type', accessor: 'base_type' as keyof typeof transactionTypes[0] },
    { header: 'Description', accessor: 'description' as keyof typeof transactionTypes[0] },
    { header: 'Balance Direction', accessor: 'affects_balance_direction' as keyof typeof transactionTypes[0] },
    {
      header: 'Status',
      accessor: (type: typeof transactionTypes[0]) => (
        <span
          className={cn(
            'px-2 py-1 text-xs rounded-full',
            type.is_active
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          )}
        >
          {type.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ];

  const actions = (type: typeof transactionTypes[0]) => (
    <div className="flex items-center gap-2">
      {hasPermission(permissions.AP_SETUP_MANAGE) && (
        <>
          <Link
            href={`/maintenance/ap/transaction-types/${type.id}`}
            className="text-blue-600 hover:text-blue-900"
          >
            <Pencil className="h-4 w-4" />
          </Link>
          <button
            onClick={() => {
              if (confirm('Are you sure you want to delete this transaction type?')) {
                deleteMutation.mutate(type.id);
              }
            }}
            className="text-red-600 hover:text-red-900"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </>
      )}
    </div>
  );

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AP Transaction Types</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage accounts payable transaction types
          </p>
        </div>
        {hasPermission(permissions.AP_SETUP_MANAGE) && (
          <Link
            href="/maintenance/ap/transaction-types/new"
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Transaction Type
          </Link>
        )}
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search transaction types..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <Table data={filteredTransactionTypes} columns={columns} actions={actions} />
    </div>
  );
}
