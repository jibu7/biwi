'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apService } from '@/services/apService';
import { glService } from '@/services/glService';
const transactionTypeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  base_type: z.enum(['Supplier Invoice', 'Payment', 'Debit Note', 'Journal']),
  default_gl_account_id: z.number().nullable(),
  default_ap_control_gl_account_id: z.number().nullable(),
  affects_balance_direction: z.enum(['Credit', 'Debit']),
  is_active: z.boolean(),
});

type TransactionTypeFormData = z.infer<typeof transactionTypeSchema>;

export default function EditAPTransactionTypePage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const transactionTypeId = params ? parseInt(params.id as string) : 0;

  const { data: transactionType, isLoading } = useQuery({
    queryKey: ['apTransactionType', transactionTypeId],
    queryFn: () => apService.getAPTransactionType(transactionTypeId),
  enabled: transactionTypeId > 0,
  });

  const { data: glAccounts = [] } = useQuery({
    queryKey: ['glAccounts'],
    queryFn: () => glService.getGLAccounts(),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TransactionTypeFormData>({
    resolver: zodResolver(transactionTypeSchema),
  });

  useEffect(() => {
    if (transactionType) {
      reset({
        ...transactionType,
        default_gl_account_id: transactionType.default_gl_account_id || null,
        default_ap_control_gl_account_id: transactionType.default_ap_control_gl_account_id || null,
      });
    }
  }, [transactionType, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: TransactionTypeFormData) => 
      apService.updateAPTransactionType(transactionTypeId, {
        ...data,
        default_gl_account_id: data.default_gl_account_id === null ? undefined : data.default_gl_account_id,
        default_ap_control_gl_account_id: data.default_ap_control_gl_account_id === null ? undefined : data.default_ap_control_gl_account_id,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apTransactionType', transactionTypeId] });
      queryClient.invalidateQueries({ queryKey: ['apTransactionTypes'] });
      router.push('/maintenance/ap/transaction-types');
    },
  });

  const onSubmit = async (data: TransactionTypeFormData) => {
    await updateMutation.mutateAsync(data);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Edit AP Transaction Type</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Name
          </label>
          <input
            type="text"
            {...register('name')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            {...register('description')}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Base Type
            </label>
            <select
              {...register('base_type')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="Supplier Invoice">Supplier Invoice</option>
              <option value="Payment">Payment</option>
              <option value="Debit Note">Debit Note</option>
              <option value="Journal">Journal</option>
            </select>
            {errors.base_type && (
              <p className="mt-1 text-sm text-red-600">{errors.base_type.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Balance Direction
            </label>
            <select
              {...register('affects_balance_direction')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="Credit">Credit</option>
              <option value="Debit">Debit</option>
            </select>
            {errors.affects_balance_direction && (
              <p className="mt-1 text-sm text-red-600">{errors.affects_balance_direction.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Default GL Account
          </label>
          <select
            {...register('default_gl_account_id', {
              setValueAs: (v) => v === '' ? null : parseInt(v)
            })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Select Account</option>
            {glAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.account_code} - {account.account_name}
              </option>
            ))}
          </select>
        </div>

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
        </div>

        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              {...register('is_active')}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Active</span>
          </label>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isSubmitting || updateMutation.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting || updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/maintenance/ap/transaction-types')}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
