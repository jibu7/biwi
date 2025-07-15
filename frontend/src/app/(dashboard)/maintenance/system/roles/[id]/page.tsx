'use client';


import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roleService } from '@/services/roleService';
import Link from 'next/link';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import * as permissions from '@/lib/permissions';

const roleSchema = z.object({
  name: z.string().min(1, 'Role name is required'),
  description: z.string().optional(),
  permissions: z.array(z.string()).min(1, 'At least one permission must be selected'),
});

type RoleFormData = z.infer<typeof roleSchema>;

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditRolePage({ params }: PageProps) {
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);

  useEffect(() => {
    params.then(setResolvedParams);
  }, [params]);

  const router = useRouter();
  const queryClient = useQueryClient();
  const roleId = resolvedParams ? parseInt(resolvedParams.id) : 0;
  
  const { data: role, isLoading, error } = useQuery({
    queryKey: ['role', roleId],
    queryFn: () => roleService.getRole(roleId),
  enabled: roleId > 0,
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    values: role ? {
      name: role.name,
      description: role.description || '',
      permissions: role.permissions || [],
    } : undefined,
  });

  const selectedPermissions = watch('permissions');

  const updateMutation = useMutation({
    mutationFn: (data: RoleFormData) => roleService.updateRole(roleId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['role', roleId] });
      router.push('/maintenance/system/roles');
    },
  });

  const onSubmit = async (data: RoleFormData) => {
    try {
      await updateMutation.mutateAsync(data);
    } catch (error) {
      console.error('Failed to update role:', error);
    }
  };

  // Available permissions grouped by module
  const permissionGroups = {
    'User Management': [
      { key: permissions.USER_CREATE, label: 'Create Users' },
      { key: permissions.USER_READ, label: 'View Users' },
      { key: permissions.USER_UPDATE, label: 'Update Users' },
      { key: permissions.USER_DELETE, label: 'Delete Users' },
    ],
    'Role Management': [
      { key: permissions.ROLE_CREATE, label: 'Create Roles' },
      { key: permissions.ROLE_READ, label: 'View Roles' },
      { key: permissions.ROLE_UPDATE, label: 'Update Roles' },
      { key: permissions.ROLE_DELETE, label: 'Delete Roles' },
    ],
    'Company Management': [
      { key: permissions.COMPANY_READ, label: 'View Company' },
      { key: permissions.COMPANY_UPDATE, label: 'Update Company' },
    ],
    'Accounting Periods': [
      { key: permissions.ACCOUNTING_PERIOD_MANAGE, label: 'Manage Accounting Periods' },
    ],
    'General Ledger': [
      { key: permissions.GL_SETUP_MANAGE, label: 'Manage GL Setup' },
      { key: permissions.GL_JOURNAL_POST, label: 'Post Journal Entries' },
      { key: permissions.GL_REPORTS_VIEW, label: 'View GL Reports' },
    ],
    'Accounts Receivable': [
      { key: permissions.AR_SETUP_MANAGE, label: 'Manage AR Setup' },
      { key: permissions.AR_TRANSACTIONS_POST, label: 'Post AR Transactions' },
      { key: permissions.AR_REPORTS_VIEW, label: 'View AR Reports' },
    ],
    'Accounts Payable': [
      { key: permissions.AP_SETUP_MANAGE, label: 'Manage AP Setup' },
      { key: permissions.AP_TRANSACTIONS_POST, label: 'Post AP Transactions' },
      { key: permissions.AP_REPORTS_VIEW, label: 'View AP Reports' },
    ],
    'Inventory': [
      { key: permissions.INV_SETUP_MANAGE, label: 'Manage Inventory Setup' },
      { key: permissions.INV_TRANSACTIONS_ADJUST, label: 'Adjust Inventory Transactions' },
      { key: permissions.INV_REPORTS_VIEW, label: 'View Inventory Reports' },
    ],
    'Order Entry': [
      { key: permissions.OE_SETUP_MANAGE, label: 'Manage OE Setup' },
      { key: permissions.OE_SALES_ORDERS_MANAGE, label: 'Manage Sales Orders' },
      { key: permissions.OE_PURCHASE_ORDERS_MANAGE, label: 'Manage Purchase Orders' },
      { key: permissions.OE_GRV_PROCESS, label: 'Process GRV' },
      { key: permissions.OE_REPORTS_VIEW, label: 'View OE Reports' },
    ],
    'Common Setup': [
      { key: permissions.COMMON_SETUP_CURRENCIES, label: 'Manage Currencies' },
      { key: permissions.COMMON_SETUP_TAXES, label: 'Manage Tax Codes' },
      { key: permissions.COMMON_SETUP_BRANCHES, label: 'Manage Branches' },
    ],
  };

  const handlePermissionChange = (permissionKey: string, checked: boolean) => {
    const currentPermissions = selectedPermissions || [];
    if (checked) {
      setValue('permissions', [...currentPermissions, permissionKey]);
    } else {
      setValue('permissions', currentPermissions.filter(p => p !== permissionKey));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Error loading role
            </h3>
            <p className="mt-1 text-sm text-red-700">
              Unable to load role information. Please try again.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
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
          <Link href="/maintenance/system/roles" className="hover:text-gray-700">
            Roles
          </Link>
          <span className="mx-2">/</span>
          <span>Edit Role</span>
        </div>
        
        <div className="flex items-center gap-4">
          <Link
            href="/maintenance/system/roles"
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Roles
          </Link>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-900">Edit Role</h1>
          <p className="text-sm text-gray-600 mt-1">
            Update role settings and permissions
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          <div className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Role Name *
              </label>
              <input
                type="text"
                id="name"
                {...register('name')}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter role name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                {...register('description')}
                rows={3}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter role description"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Permissions *
              </label>
              {errors.permissions && (
                <p className="mb-4 text-sm text-red-600">{errors.permissions.message}</p>
              )}
              
              <div className="space-y-6">
                {Object.entries(permissionGroups).map(([groupName, groupPermissions]) => (
                  <div key={groupName} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">{groupName}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {groupPermissions.map((permission) => (
                        <label key={permission.key} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedPermissions?.includes(permission.key) || false}
                            onChange={(e) => handlePermissionChange(permission.key, e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">{permission.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-4">
            <Link
              href="/maintenance/system/roles"
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Updating...' : 'Update Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
