'use client';


import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { glService } from '@/services/glService';
import { usePermissions } from '@/hooks/usePermissions';
import * as permissions from '@/lib/permissions';
import { useEffect } from 'react';

const accountSchema = z.object({
  account_code: z.string().min(1, 'Account code is required'),
  account_name: z.string().min(1, 'Account name is required'),
  account_type: z.enum(['Asset', 'Liability', 'Equity', 'Income', 'Expense']),
  parent_account_id: z.number().nullable().optional(),
  is_active: z.boolean(),
  is_control_account: z.boolean(),
});

type AccountFormData = z.infer<typeof accountSchema>;

export default function NewGLAccountPage() {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  
  const { data: accounts = [] } = useQuery({
    queryKey: ['glAccounts'],
    queryFn: () => glService.getAccounts({ isActive: false }), // Include inactive for full list
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      is_active: true,
      is_control_account: false,
      parent_account_id: null,
    },
  });

  const selectedAccountType = watch('account_type');

  const createMutation = useMutation({
    mutationFn: glService.createAccount,
    onSuccess: () => {
      router.push('/maintenance/gl/accounts');
    },
    onError: (error) => {
      console.error('Failed to create account:', error);
      alert('Failed to create account. Please try again.');
    },
  });

  // Check permissions in useEffect to avoid calling router.push during render
  useEffect(() => {
    if (!hasPermission(permissions.GL_SETUP_MANAGE)) {
      router.push('/maintenance/gl/accounts');
    }
  }, [hasPermission, router]);

  // Don't render anything if no permission
  if (!hasPermission(permissions.GL_SETUP_MANAGE)) {
    return null;
  }

  const onSubmit = async (data: AccountFormData) => {
    const submitData = {
      ...data,
      parent_account_id: data.parent_account_id || undefined,
    };
    await createMutation.mutateAsync(submitData);
  };

  // Filter parent accounts by type - only show accounts of the same type
  const eligibleParentAccounts = accounts.filter((account: any) => 
    account.account_type === selectedAccountType && account.is_active
  );

  return (
    <div className="p-6">
      <div className="max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Create New GL Account</h1>
          <p className="mt-1 text-sm text-gray-600">
            Add a new account to your chart of accounts
          </p>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="account_code" className="block text-sm font-medium text-gray-700">
                Account Code *
              </label>
              <input
                type="text"
                id="account_code"
                {...register('account_code')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="e.g., 1000"
              />
              {errors.account_code && (
                <p className="mt-1 text-sm text-red-600">{errors.account_code.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="account_type" className="block text-sm font-medium text-gray-700">
                Account Type *
              </label>
              <select
                id="account_type"
                {...register('account_type')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">Select Type</option>
                <option value="Asset">Asset</option>
                <option value="Liability">Liability</option>
                <option value="Equity">Equity</option>
                <option value="Income">Income</option>
                <option value="Expense">Expense</option>
              </select>
              {errors.account_type && (
                <p className="mt-1 text-sm text-red-600">{errors.account_type.message}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="account_name" className="block text-sm font-medium text-gray-700">
              Account Name *
            </label>
            <input
              type="text"
              id="account_name"
              {...register('account_name')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="e.g., Cash in Bank"
            />
            {errors.account_name && (
              <p className="mt-1 text-sm text-red-600">{errors.account_name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="parent_account_id" className="block text-sm font-medium text-gray-700">
              Parent Account
            </label>
            <select
              id="parent_account_id"
              {...register('parent_account_id', { 
                valueAsNumber: true,
                setValueAs: (v) => v === '' || v === 'null' ? null : parseInt(v)
              })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">No Parent (Top Level Account)</option>
              {eligibleParentAccounts.map((account: any) => (
                <option key={account.id} value={account.id}>
                  {account.account_code} - {account.account_name}
                </option>
              ))}
            </select>
            {selectedAccountType && eligibleParentAccounts.length === 0 && (
              <p className="mt-1 text-sm text-gray-500">
                No parent accounts available for {selectedAccountType} type
              </p>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center">
              <input
                id="is_active"
                type="checkbox"
                {...register('is_active')}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                Active
              </label>
            </div>

            <div className="flex items-center">
              <input
                id="is_control_account"
                type="checkbox"
                {...register('is_control_account')}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="is_control_account" className="ml-2 block text-sm text-gray-700">
                Control Account
              </label>
              <p className="ml-2 text-xs text-gray-500">
                (Control accounts typically have sub-accounts)
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6">
            <button
              type="button"
              onClick={() => router.push('/maintenance/gl/accounts')}
              className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
