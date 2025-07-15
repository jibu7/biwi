'use client';


import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { roleService } from '@/services/roleService';
import { Table } from '@/components/ui/Table';
import { usePermissions } from '@/hooks/usePermissions';
import * as permissions from '@/lib/permissions';
import { cn } from '@/lib/utils';

export default function RolesPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: roles = [], isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: () => roleService.getRoles(),
  });

  const deleteMutation = useMutation({
    mutationFn: roleService.deleteRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });

  const filteredRoles = roles.filter(
    (role) =>
      role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (role.description && role.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const columns = [
    { header: 'Role Name', accessor: 'name' as keyof typeof roles[0] },
    { header: 'Description', accessor: 'description' as keyof typeof roles[0] },
    {
      header: 'Permissions Count',
      accessor: (role: typeof roles[0]) => (
        <span className="text-gray-600">
          {role.permissions ? role.permissions.length : 0} permissions
        </span>
      ),
    },
    {
      header: 'Company',
      accessor: (role: typeof roles[0]) => (
        <span className="text-gray-600">
          Company ID: {role.company_id}
        </span>
      ),
    },
  ];

  const actions = (role: typeof roles[0]) => (
    <div className="flex items-center gap-2">
      {hasPermission(permissions.ROLE_UPDATE) && (
        <Link
          href={`/maintenance/system/roles/${role.id}`}
          className="text-blue-600 hover:text-blue-900"
        >
          <Pencil className="h-4 w-4" />
        </Link>
      )}
      {hasPermission(permissions.ROLE_DELETE) && (
        <button
          onClick={() => {
            if (confirm('Are you sure you want to delete this role?')) {
              deleteMutation.mutate(role.id);
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
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading roles...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center text-sm text-gray-500 mb-2">
          <Link href="/maintenance" className="hover:text-gray-700">
            Maintenance
          </Link>
          <span className="mx-2">/</span>
          <Link href="/maintenance/system" className="hover:text-gray-700">
            System & Company
          </Link>
          <span className="mx-2">/</span>
          <span>Roles</span>
        </div>
      </div>

      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Roles</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage user roles and their permissions
          </p>
        </div>
        {hasPermission(permissions.ROLE_CREATE) && (
          <Link
            href="/maintenance/system/roles/new"
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Role
          </Link>
        )}
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search roles..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {filteredRoles.length > 0 ? (
        <Table data={filteredRoles} columns={columns} actions={actions} />
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Pencil className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No roles found
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm ? 'No roles match your search criteria.' : 'Get started by creating your first role.'}
          </p>
          {hasPermission(permissions.ROLE_CREATE) && !searchTerm && (
            <Link
              href="/maintenance/system/roles/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Role
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
