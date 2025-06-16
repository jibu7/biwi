'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { glService } from '@/services/glService';
import { usePermissions } from '@/hooks/usePermissions';
import * as permissions from '@/lib/permissions';

const accountSchema = z.object({
  account_code: z.string().min(1, 'Account code is required'),
  account_name: z.string().min(1, 'Account name is required'),
  account_type: z.enum(['Asset', 'Liability', 'Equity', 'Income', 'Expense']),
  parent_account_id: z.number().nullable().optional(),
  is_active: z.boolean(),
  is_control_account: z.boolean(),
});

type AccountFormData = z.infer<typeof accountSchema>;

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditGLAccountPage({ params }: PageProps) {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);

  useEffect(() => {
    params.then(setResolvedParams);
  }, [params]);

  const accountId = resolvedParams ? parseInt(resolvedParams.id) : 0;

  const { data: account, isLoading } = useQuery({
    queryKey: ['glAccount', accountId],
    queryFn: () => glService.getGLAccount(accountId),
    enabled: accountId > 0,
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ['glAccounts'],
    queryFn: () => glService.getGLAccounts(true), // Include inactive for full list
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    values: account ? {
      account_code: account.account_code,
      account_name: account.account_name,
      account_type: account.account_type,
      parent_account_id: account.parent_account_id || null,
      is_active: account.is_active,
      is_control_account: account.is_control_account,
    } : undefined,
  });

  const selectedAccountType = watch('account_type');

  const updateMutation = useMutation({
    mutationFn: (data: AccountFormData) => 
      glService.updateGLAccount(accountId, {
        ...data,
        parent_account_id: data.parent_account_id || undefined,
      }),
    onSuccess: () => {
      router.push('/maintenance/gl/accounts');
    },
    onError: (error) => {
      console.error('Failed to update account:', error);
      alert('Failed to update account. Please try again.');
    },
  });

  // Check permissions after hooks
  if (!hasPermission(permissions.GL_SETUP_MANAGE)) {
    router.push('/maintenance/gl/accounts');
    return null;
  }

  const onSubmit = async (data: AccountFormData) => {
    await updateMutation.mutateAsync(data);
  };

  // Filter parent accounts by type and exclude self and descendants
  const getDescendantIds = (parentId: number, accountList: typeof accounts): number[] => {
    const descendants: number[] = [];
    const children = accountList.filter(acc => acc.parent_account_id === parentId);
    
    children.forEach(child => {
      descendants.push(child.id);
      descendants.push(...getDescendantIds(child.id, accountList));
    });
    
    return descendants;
  };

  const eligibleParentAccounts = accounts.filter(acc => {
    if (acc.id === accountId) return false; // Can't be parent of itself
    if (selectedAccountType && acc.account_type !== selectedAccountType) return false; // Must be same type
    if (!acc.is_active) return false; // Must be active
    
    // Can't be a descendant (prevent circular references)
    const descendants = getDescendantIds(accountId, accounts);
    if (descendants.includes(acc.id)) return false;
    
    return true;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">Account not found</h3>
          <p className="mt-1 text-sm text-gray-500">
            The account you&apos;re looking for doesn&apos;t exist.
          </p>
          <button
            onClick={() => router.push('/maintenance/gl/accounts')}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-indigo-100 hover:bg-indigo-200"
          >
            Back to Accounts
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Edit GL Account</h1>
          <p className="mt-1 text-sm text-gray-600">
            Update account information for {account.account_code} - {account.account_name}
          </p>
        </div>

        {/* Account Info Summary */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Current Balance</dt>
              <dd className="text-sm text-gray-900 font-mono">
                {formatCurrency(account.current_balance)}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Account ID</dt>
              <dd className="text-sm text-gray-900">#{account.id}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Company ID</dt>
              <dd className="text-sm text-gray-900">#{account.company_id}</dd>
            </div>
          </dl>
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
              {eligibleParentAccounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.account_code} - {acc.account_name}
                </option>
              ))}
            </select>
            {selectedAccountType && eligibleParentAccounts.length === 0 && (
              <p className="mt-1 text-sm text-gray-500">
                No eligible parent accounts available for {selectedAccountType} type
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
              {isSubmitting ? 'Updating...' : 'Update Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
