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

export default function SuppliersPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const [searchTerm, setSearchTerm] = useState('');
  const [includeInactive, setIncludeInactive] = useState(false);

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ['suppliers', includeInactive],
    queryFn: () => apService.getSuppliers(includeInactive),
  });

  const deleteMutation = useMutation({
    mutationFn: apService.deleteSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });

  const filteredSuppliers = suppliers.filter(
    (supplier) =>
      supplier.supplier_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { header: 'Code', accessor: 'supplier_code' as keyof typeof suppliers[0] },
    { header: 'Name', accessor: 'name' as keyof typeof suppliers[0] },
    { header: 'Payment Terms', accessor: 'payment_terms' as keyof typeof suppliers[0] },
    {
      header: 'Balance',
      accessor: (supplier: typeof suppliers[0]) => (
        <span className={supplier.current_balance > 0 ? 'text-red-600' : ''}>
          {new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
          }).format(supplier.current_balance)}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: (supplier: typeof suppliers[0]) => (
        <span
          className={cn(
            'px-2 py-1 text-xs rounded-full',
            supplier.is_active
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          )}
        >
          {supplier.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ];

  const actions = (supplier: typeof suppliers[0]) => (
    <div className="flex items-center gap-2">
      {hasPermission(permissions.AP_SETUP_MANAGE) && (
        <>
          <Link
            href={`/maintenance/ap/suppliers/${supplier.id}`}
            className="text-blue-600 hover:text-blue-900"
          >
            <Pencil className="h-4 w-4" />
          </Link>
          <button
            onClick={() => {
              if (confirm('Are you sure you want to delete this supplier?')) {
                deleteMutation.mutate(supplier.id);
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
          <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your supplier accounts
          </p>
        </div>
        {hasPermission(permissions.AP_SETUP_MANAGE) && (
          <Link
            href="/maintenance/ap/suppliers/new"
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Supplier
          </Link>
        )}
      </div>

      <div className="mb-4 flex gap-4">
        <input
          type="text"
          placeholder="Search suppliers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        />
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={includeInactive}
            onChange={(e) => setIncludeInactive(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="ml-2 text-sm text-gray-700">Show inactive</span>
        </label>
      </div>

      <Table data={filteredSuppliers} columns={columns} actions={actions} />
    </div>
  );
}
