'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { userService } from '@/services/userService';
import { Table } from '@/components/ui/Table';
import { usePermissions } from '@/hooks/usePermissions';
import * as permissions from '@/lib/permissions';
import { cn } from '@/lib/utils';

export default function UsersPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getUsers(),
  });

  const deleteMutation = useMutation({
    mutationFn: userService.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { header: 'Email', accessor: 'email' as keyof typeof users[0] },
    { header: 'Full Name', accessor: 'full_name' as keyof typeof users[0] },
    {
      header: 'Status',
      accessor: (user: typeof users[0]) => (
        <span
          className={cn(
            'px-2 py-1 text-xs rounded-full',
            user.is_active
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          )}
        >
          {user.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      header: 'Type',
      accessor: (user: typeof users[0]) =>
        user.is_superuser ? (
          <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
            Superuser
          </span>
        ) : (
          <span className="text-gray-500">Regular</span>
        ),
    },
  ];

  const actions = (user: typeof users[0]) => (
    <div className="flex items-center gap-2">
      {hasPermission(permissions.USER_UPDATE) && (
        <Link
          href={`/maintenance/system/users/${user.id}`}
          className="text-blue-600 hover:text-blue-900"
        >
          <Pencil className="h-4 w-4" />
        </Link>
      )}
      {hasPermission(permissions.USER_DELETE) && (
        <button
          onClick={() => {
            if (confirm('Are you sure you want to delete this user?')) {
              deleteMutation.mutate(user.id);
            }
          }}
          className="text-red-600 hover:text-red-900"
        >
          <Trash2 className="h-4 w-4" />
        </button>
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
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage system users and their access
          </p>
        </div>
        {hasPermission(permissions.USER_CREATE) && (
          <Link
            href="/maintenance/system/users/new"
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Link>
        )}
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <Table data={filteredUsers} columns={columns} actions={actions} />
    </div>
  );
}
