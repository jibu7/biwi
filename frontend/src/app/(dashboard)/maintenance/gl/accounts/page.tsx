// frontend/src/app/(dashboard)/maintenance/gl/accounts/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { glService } from '@/services/glService';
import { GLAccount } from '@/types/gl';
import { Button } from '@/components/ui/button';
import { DataTable, Column } from '@/components/ui/data-table';
import { CompanyBadge } from '@/components/ui/company-badge';
import { usePermissions } from '@/hooks/usePermissions';
import { GL_SETUP_MANAGE } from '@/lib/permissions';
import Link from 'next/link';
import { Plus, Edit, Trash2 } from 'lucide-react';

export default function GLAccountsPage() {
  const { user, company } = useAuthStore();
  const { hasPermission } = usePermissions();
  const queryClient = useQueryClient();
  const canManage = hasPermission(GL_SETUP_MANAGE);

  const { data: accounts, isLoading, error } = useQuery<GLAccount[]>({
    queryKey: ['gl-accounts', company?.id],
    queryFn: () => glService.getAccounts(),
    enabled: !!company?.id,
  });

  const deleteMutation = useMutation({
    mutationFn: glService.deleteAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gl-accounts'] });
    },
  });

  const columns: Column<GLAccount>[] = [
    {
      accessorKey: 'account_code',
      header: 'Account Code',
    },
    {
      accessorKey: 'account_name',
      header: 'Account Name',
    },
    {
      accessorKey: 'account_type',
      header: 'Type',
    },
    {
      accessorKey: 'current_balance',
      header: 'Balance',
      cell: ({ row }) => {
        const balance = row.original.current_balance;
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(balance);
      },
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ row }) => (
        <span className={row.original.is_active ? 'text-green-600' : 'text-red-600'}>
          {row.original.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex gap-2">
          {canManage && (
            <>
              <Link href={`/maintenance/gl/accounts/${row.original.id}`}>
                <Button size="sm" variant="outline">
                  <Edit className="h-4 w-4" />
                </Button>
              </Link>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDelete(row.original.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this account?')) {
      deleteMutation.mutate(id);
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="text-red-600">
          Error loading GL accounts. You may not have permission to view this data.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Chart of Accounts</h1>
          <CompanyBadge company={company} />
        </div>
        {canManage && (
          <Link href="/maintenance/gl/accounts/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Account
            </Button>
          </Link>
        )}
      </div>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <DataTable
          columns={columns}
          data={accounts || []}
        />
      )}
    </div>
  );
}
