'use client';


import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { apService } from '@/services/apService';
import { glService } from '@/services/glService';

const defaultsSchema = z.object({
  default_ap_control_gl_account_id: z.number().nullable(),
  default_expense_gl_account_id: z.number().nullable(),
  default_payment_gl_account_id: z.number().nullable(),
  default_purchase_discount_gl_account_id: z.number().nullable(),
});

type DefaultsFormData = z.infer<typeof defaultsSchema>;

export default function APDefaultsPage() {
  const router = useRouter();

  const { data: defaults, isLoading } = useQuery({
    queryKey: ['apDefaults'],
    queryFn: () => apService.getDefaults(),
  });

  const { data: glAccounts = [] } = useQuery({
    queryKey: ['glAccounts'],
    queryFn: () => glService.getGLAccounts(),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<DefaultsFormData>({
    resolver: zodResolver(defaultsSchema),
  });

  useEffect(() => {
    if (defaults) {
      reset({
        default_ap_control_gl_account_id: defaults.default_ap_control_gl_account_id || null,
        default_expense_gl_account_id: defaults.default_expense_gl_account_id || null,
        default_payment_gl_account_id: defaults.default_payment_gl_account_id || null,
        default_purchase_discount_gl_account_id: defaults.default_purchase_discount_gl_account_id || null,
      });
    }
  }, [defaults, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: DefaultsFormData) => 
      apService.updateDefaults({
        default_ap_control_gl_account_id: data.default_ap_control_gl_account_id === null ? undefined : data.default_ap_control_gl_account_id,
        default_expense_gl_account_id: data.default_expense_gl_account_id === null ? undefined : data.default_expense_gl_account_id,
        default_payment_gl_account_id: data.default_payment_gl_account_id === null ? undefined : data.default_payment_gl_account_id,
        default_purchase_discount_gl_account_id: data.default_purchase_discount_gl_account_id === null ? undefined : data.default_purchase_discount_gl_account_id,
      }),
    onSuccess: () => {
      router.push('/maintenance/ap');
    },
  });

  const onSubmit = async (data: DefaultsFormData) => {
    await updateMutation.mutateAsync(data);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">AP Defaults</h1>
      <p className="text-gray-600 mb-8">
        Configure default GL accounts for accounts payable transactions.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Default AP Control GL Account
          </label>
          <select
            {...register('default_ap_control_gl_account_id', {
              setValueAs: (v) => v === '' ? null : parseInt(v)
            })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Select Account</option>
            {glAccounts
              .filter(acc => acc.account_type === 'Liability')
              .map((account) => (
                <option key={account.id} value={account.id}>
                  {account.account_code} - {account.account_name}
                </option>
              ))}
          </select>
          <p className="mt-1 text-sm text-gray-500">
            Default liability account for accounts payable control
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Default Expense GL Account
          </label>
          <select
            {...register('default_expense_gl_account_id', {
              setValueAs: (v) => v === '' ? null : parseInt(v)
            })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Select Account</option>
            {glAccounts
              .filter(acc => acc.account_type === 'Expense')
              .map((account) => (
                <option key={account.id} value={account.id}>
                  {account.account_code} - {account.account_name}
                </option>
              ))}
          </select>
          <p className="mt-1 text-sm text-gray-500">
            Default expense account for supplier invoices
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Default Payment GL Account
          </label>
          <select
            {...register('default_payment_gl_account_id', {
              setValueAs: (v) => v === '' ? null : parseInt(v)
            })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Select Account</option>
            {glAccounts
              .filter(acc => acc.account_type === 'Asset')
              .map((account) => (
                <option key={account.id} value={account.id}>
                  {account.account_code} - {account.account_name}
                </option>
              ))}
          </select>
          <p className="mt-1 text-sm text-gray-500">
            Default bank/cash account for payments
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Default Purchase Discount GL Account
          </label>
          <select
            {...register('default_purchase_discount_gl_account_id', {
              setValueAs: (v) => v === '' ? null : parseInt(v)
            })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Select Account</option>
            {glAccounts
              .filter(acc => acc.account_type === 'Income')
              .map((account) => (
                <option key={account.id} value={account.id}>
                  {account.account_code} - {account.account_name}
                </option>
              ))}
          </select>
          <p className="mt-1 text-sm text-gray-500">
            Default account for purchase discounts received
          </p>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isSubmitting || updateMutation.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting || updateMutation.isPending ? 'Saving...' : 'Save Defaults'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/maintenance/ap')}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
