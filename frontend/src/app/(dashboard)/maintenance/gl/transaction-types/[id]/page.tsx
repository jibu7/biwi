'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { glService } from '@/services/glService';
import { GLTransactionTypeUpdate } from '@/types/gl';

const transactionTypeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  default_debit_account_id: z.number().nullable().optional(),
  default_credit_account_id: z.number().nullable().optional(),
  is_active: z.boolean(),
});

type TransactionTypeFormData = z.infer<typeof transactionTypeSchema>;

export default function EditTransactionTypePage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const id = resolvedParams ? Number(resolvedParams.id) : 0;

  const { data: transactionType } = useQuery({
    queryKey: ['glTransactionType', id],
    queryFn: () => glService.getGLTransactionType(id),
  enabled: id > 0,
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
  } = useForm<TransactionTypeFormData>({
    resolver: zodResolver(transactionTypeSchema),
  });

  // Reset form when data loads
  if (transactionType && !errors.name) {
    reset({
      name: transactionType.name,
      description: transactionType.description || '',
      default_debit_account_id: transactionType.default_debit_account_id || null,
      default_credit_account_id: transactionType.default_credit_account_id || null,
      is_active: transactionType.is_active,
    });
  }

  const updateMutation = useMutation({
    mutationFn: (data: GLTransactionTypeUpdate) => glService.updateGLTransactionType(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['glTransactionType', id] });
      queryClient.invalidateQueries({ queryKey: ['glTransactionTypes'] });
      router.push('/maintenance/gl/transaction-types');
    },
  });

  const onSubmit = async (data: TransactionTypeFormData) => {
    const submitData: GLTransactionTypeUpdate = {
      ...data,
      default_debit_account_id: data.default_debit_account_id || undefined,
      default_credit_account_id: data.default_credit_account_id || undefined,
    };
    await updateMutation.mutateAsync(submitData);
  };

  if (!transactionType) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Edit Transaction Type</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium mb-4">Transaction Type Details</h2>
          
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Name *
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

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Default Debit Account
              </label>
              <select
                {...register('default_debit_account_id', { valueAsNumber: true })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Select Account</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.account_code} - {account.account_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Default Credit Account
              </label>
              <select
                {...register('default_credit_account_id', { valueAsNumber: true })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Select Account</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.account_code} - {account.account_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                {...register('is_active')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">
                Active
              </label>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {updateMutation.isPending ? 'Updating...' : 'Update Transaction Type'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/maintenance/gl/transaction-types')}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
