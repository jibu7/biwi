'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { glService } from '@/services/glService';
import { GLDefaultsUpdate } from '@/types/gl';

const defaultsSchema = z.object({
  retained_earnings_account_id: z.number().nullable().optional(),
  default_cash_account_id: z.number().nullable().optional(),
  default_ar_control_account_id: z.number().nullable().optional(),
  default_ap_control_account_id: z.number().nullable().optional(),
});

type DefaultsFormData = z.infer<typeof defaultsSchema>;

export default function GLDefaultsPage() {
  const queryClient = useQueryClient();

  const { data: defaults } = useQuery({
    queryKey: ['glDefaults'],
    queryFn: () => glService.getGLDefaults(),
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ['glAccounts'],
    queryFn: () => glService.getGLAccounts(),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<DefaultsFormData>({
    resolver: zodResolver(defaultsSchema),
  });

  // Reset form when data loads
  if (defaults && !errors.retained_earnings_account_id) {
    reset({
      retained_earnings_account_id: defaults.retained_earnings_account_id || null,
      default_cash_account_id: defaults.default_cash_account_id || null,
      default_ar_control_account_id: defaults.default_ar_control_account_id || null,
      default_ap_control_account_id: defaults.default_ap_control_account_id || null,
    });
  }

  const updateMutation = useMutation({
    mutationFn: glService.updateGLDefaults,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['glDefaults'] });
    },
  });

  const onSubmit = async (data: DefaultsFormData) => {
    const submitData: GLDefaultsUpdate = {
      ...data,
      retained_earnings_account_id: data.retained_earnings_account_id || undefined,
      default_cash_account_id: data.default_cash_account_id || undefined,
      default_ar_control_account_id: data.default_ar_control_account_id || undefined,
      default_ap_control_account_id: data.default_ap_control_account_id || undefined,
    };
    await updateMutation.mutateAsync(submitData);
  };

  const assetAccounts = accounts.filter(account => account.account_type === 'Asset');
  const liabilityAccounts = accounts.filter(account => account.account_type === 'Liability');
  const equityAccounts = accounts.filter(account => account.account_type === 'Equity');

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">GL Defaults</h1>
        <p className="mt-2 text-sm text-gray-700">
          Configure default GL accounts for automated transactions.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium mb-4">Default Accounts</h2>
          
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Retained Earnings Account
              </label>
              <select
                {...register('retained_earnings_account_id', { valueAsNumber: true })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Select Account</option>
                {equityAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.account_code} - {account.account_name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Used for year-end closing entries
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Default Cash Account
              </label>
              <select
                {...register('default_cash_account_id', { valueAsNumber: true })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Select Account</option>
                {assetAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.account_code} - {account.account_name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Used as default for cash transactions
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Accounts Receivable Control Account
              </label>
              <select
                {...register('default_ar_control_account_id', { valueAsNumber: true })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Select Account</option>
                {assetAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.account_code} - {account.account_name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Used for customer transactions
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Accounts Payable Control Account
              </label>
              <select
                {...register('default_ap_control_account_id', { valueAsNumber: true })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Select Account</option>
                {liabilityAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.account_code} - {account.account_name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Used for supplier transactions
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {updateMutation.isPending ? 'Saving...' : 'Save Defaults'}
          </button>
        </div>

        {updateMutation.isSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <p className="text-sm text-green-800">
              GL defaults saved successfully!
            </p>
          </div>
        )}
      </form>
    </div>
  );
}
