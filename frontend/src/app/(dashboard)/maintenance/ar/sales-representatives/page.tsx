'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Mail, Phone, User } from 'lucide-react';
import { salesRepService } from '@/services/arService';
import { SalesRepresentative } from '@/types/ar';
import { DataTable, Column } from '@/components/ui/data-table';
import { usePermissions } from '@/hooks/usePermissions';
import { AR_SETUP_MANAGE } from '@/lib/permissions';
import { cn } from '@/lib/utils';

export default function SalesRepresentativesPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();

  const { data: salesReps = [], isLoading, error } = useQuery({
    queryKey: ['salesRepresentatives'],
    queryFn: () => salesRepService.getAll(),
  });

  const deleteMutation = useMutation({
    mutationFn: salesRepService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salesRepresentatives'] });
    },
    onError: (error: any) => {
      console.error('Failed to delete sales representative:', error);
    },
  });

  const columns: Column<SalesRepresentative>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <div className="flex items-center">
          <User className="h-4 w-4 text-gray-400 mr-2" />
          <span className="font-medium">{row.original.name}</span>
        </div>
      ),
    },
    {
      header: 'Contact Information',
      cell: ({ row }) => (
        <div className="text-sm space-y-1">
          {row.original.contact_info?.email && (
            <div className="flex items-center text-gray-600">
              <Mail className="h-3 w-3 mr-1" />
              {row.original.contact_info.email}
            </div>
          )}
          {row.original.contact_info?.phone && (
            <div className="flex items-center text-gray-600">
              <Phone className="h-3 w-3 mr-1" />
              {row.original.contact_info.phone}
            </div>
          )}
          {!row.original.contact_info?.email && !row.original.contact_info?.phone && (
            <span className="text-gray-400">No contact info</span>
          )}
        </div>
      ),
    },
    {
      header: 'Commission Rate',
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.commission_rate ? `${row.original.commission_rate}%` : 'Not set'}
        </span>
      ),
    },
    {
      header: 'Status',
      cell: ({ row }) => (
        <span
          className={cn(
            'px-2 py-1 text-xs rounded-full font-medium',
            row.original.is_active
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          )}
        >
          {row.original.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {hasPermission(AR_SETUP_MANAGE) && (
            <>
              <Link
                href={`/maintenance/ar/sales-representatives/${row.original.id}/edit`}
                className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                title="Edit"
              >
                <Pencil className="h-4 w-4" />
              </Link>
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to delete this sales representative?')) {
                    deleteMutation.mutate(row.original.id);
                  }
                }}
                className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  // Check permissions - after all hooks
  if (!hasPermission(AR_SETUP_MANAGE)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
          <p className="text-gray-600 mt-2">You don't have permission to manage sales representatives.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading sales representatives...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Error Loading Data</h2>
          <p className="text-gray-600 mt-2">Failed to load sales representatives. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sales Representatives</h1>
            <p className="text-gray-600 mt-1">Manage your sales team and track performance</p>
          </div>
          <Link
            href="/maintenance/ar/sales-representatives/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Sales Representative
          </Link>
        </div>

        <div className="bg-white shadow rounded-lg">
          <DataTable data={salesReps} columns={columns} />
        </div>
      </div>
    </div>
  );
}
