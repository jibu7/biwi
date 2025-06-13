'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { glService } from '@/services/glService';

const accountSchema = z.object({
  account_code: z.string().min(1, 'Account code is required'),
  account_name: z.string().min(1, 'Account name is required'),
  account_type: z.enum(['Asset', 'Liability', 'Equity', 'Income', 'Expense']),
  parent_account_id: z.number().nullable(),
  is_active: z.boolean(),
  is_control_account: z.boolean(),
});

type AccountFormData = z.infer<typeof accountSchema>;

export default function EditGLAccountPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const accountId = parseInt(params.id);

  const { data: account, isLoading } = useQuery({
    queryKey: ['glAccount', accountId],
    queryFn: () => glService.getGLAccount(accountId),
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ['glAccounts'],
    queryFn: () => glService.getGLAccounts(),
  });

  const {
    register,
    handleSubmit,
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

  const updateMutation = useMutation({
    mutationFn: (data: AccountFormData) => 
      glService.updateGLAccount(accountId, {
        ...data,
        parent_account_id: data.parent_account_id || undefined,
      }),
    onSuccess: () => {
      router.push('/maintenance/gl/accounts');
    },
  });

  const onSubmit = async (data: AccountFormData) => {
    await updateMutation.mutateAsync(data);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Edit GL Account</h1>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Account Code
          </label>
          <input
            type="text"
            {...register('account_code')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          {errors.account_code && (
            <p className="mt-1 text-sm text-red-600">{errors.account_code.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Account Name
          </label>
          <input
            type="text"
            {...register('account_name')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          {errors.account_name && (
            <p className="mt-1 text-sm text-red-600">{errors.account_name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Account Type
          </label>
          <select
            {...register('account_type')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Parent Account
          </label>
          <select
            {...register('parent_account_id', { 
              valueAsNumber: true,
              setValueAs: (v) => v === '' ? null : parseInt(v)
            })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">No Parent (Top Level)</option>
            {accounts
              .filter(acc => acc.id !== accountId) // Can't be parent of itself
              .map((account) => (
                <option key={account.id} value={account.id}>
                  {account.account_code} - {account.account_name}
                </option>
              ))}
          </select>
        </div>

        <div className="space-y-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              {...register('is_active')}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Active</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              {...register('is_control_account')}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Control Account</span>
          </label>
        </div>

        <div>
          <p className="text-sm text-gray-600">
            Current Balance: {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
            }).format(account?.current_balance || 0)}
          </p>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Updating...' : 'Update Account'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/maintenance/gl/accounts')}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
