'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { salesRepService } from '@/services/arService';
import { SalesRepresentative } from '@/types/ar';
import { Table } from '@/components/ui/Table';
import { usePermissions } from '@/hooks/usePermissions';
import * as permissions from '@/lib/permissions';
import { cn } from '@/lib/utils';

export default function SalesRepsPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();

  const { data: salesReps = [], isLoading } = useQuery({
    queryKey: ['salesReps'],
    queryFn: () => salesRepService.getAll(),
  });

  const deleteMutation = useMutation({
    mutationFn: salesRepService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salesReps'] });
    },
  });

  const columns = [
    { header: 'Name', accessor: 'name' as keyof SalesRepresentative },
    {
      header: 'Contact Info',
      accessor: (rep: SalesRepresentative) => (
        <div className="text-sm">
          {rep.contact_info?.phone && <div>Phone: {rep.contact_info.phone}</div>}
          {rep.contact_info?.email && <div>Email: {rep.contact_info.email}</div>}
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: (rep: SalesRepresentative) => (
        <span
          className={cn(
            'px-2 py-1 text-xs rounded-full',
            rep.is_active
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          )}
        >
          {rep.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ];

  const actions = (rep: SalesRepresentative) => (
    <div className="flex items-center gap-2">
      {hasPermission(permissions.AR_SETUP_MANAGE) && (
        <>
          <Link
            href={`/maintenance/ar/sales-reps/${rep.id}`}
            className="text-blue-600 hover:text-blue-900"
          >
            <Pencil className="h-4 w-4" />
          </Link>
          <button
            onClick={() => {
              if (confirm('Are you sure you want to delete this sales representative?')) {
                deleteMutation.mutate(rep.id);
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
          <h1 className="text-2xl font-bold text-gray-900">Sales Representatives</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your sales team
          </p>
        </div>
        {hasPermission(permissions.AR_SETUP_MANAGE) && (
          <Link
            href="/maintenance/ar/sales-reps/new"
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Sales Rep
          </Link>
        )}
      </div>

      <Table data={salesReps} columns={columns} actions={actions} />
    </div>
  );
}
