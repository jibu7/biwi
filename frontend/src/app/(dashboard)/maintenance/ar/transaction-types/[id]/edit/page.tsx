'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { arTransactionTypeService } from '@/services/arService';
import { glService } from '@/services/glService';
import { usePermissions } from '@/hooks/usePermissions';
import { AR_SETUP_MANAGE } from '@/lib/permissions';

const transactionTypeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  base_type: z.enum(['Invoice', 'Receipt', 'Credit Note', 'Journal']),
  default_gl_account_id: z.number().nullable(),
  default_ar_control_gl_account_id: z.number().nullable(),
  affects_balance_direction: z.enum(['Debit', 'Credit']),
  is_active: z.boolean(),
});

type TransactionTypeFormData = z.infer<typeof transactionTypeSchema>;

export default function EditARTransactionTypePage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const transactionTypeId = params ? parseInt(params.id as string) : 0;

  const { data: transactionType, isLoading, error } = useQuery({
    queryKey: ['arTransactionType', transactionTypeId],
    queryFn: () => arTransactionTypeService.getById(transactionTypeId),
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

  const updateMutation = useMutation({
    mutationFn: (data: TransactionTypeFormData) => 
      arTransactionTypeService.update(transactionTypeId, {
        ...data,
        default_gl_account_id: data.default_gl_account_id === null ? undefined : data.default_gl_account_id,
        default_ar_control_gl_account_id: data.default_ar_control_gl_account_id === null ? undefined : data.default_ar_control_gl_account_id,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['arTransactionType', transactionTypeId] });
      queryClient.invalidateQueries({ queryKey: ['arTransactionTypes'] });
      router.push('/maintenance/ar/transaction-types');
    },
    onError: (error: any) => {
      console.error('Failed to update AR transaction type:', error);
    },
  });

  useEffect(() => {
    if (transactionType) {
      reset({
        ...transactionType,
        default_gl_account_id: transactionType.default_gl_account_id || null,
        default_ar_control_gl_account_id: transactionType.default_ar_control_gl_account_id || null,
      });
    }
  }, [transactionType, reset]);

  // Check permissions - after all hooks
  if (!hasPermission(AR_SETUP_MANAGE)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
          <p className="text-gray-600 mt-2">You don't have permission to edit AR transaction types.</p>
        </div>
      </div>
    );
  }

  const onSubmit = async (data: TransactionTypeFormData) => {
    await updateMutation.mutateAsync(data);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading transaction type...</p>
        </div>
      </div>
    );
  }

  if (error || !transactionType) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Transaction Type Not Found</h2>
          <p className="text-gray-600 mt-2">The requested AR transaction type could not be found.</p>
          <button 
            onClick={() => router.push('/maintenance/ar/transaction-types')}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Back to Transaction Types
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit AR Transaction Type</h1>
            <p className="text-gray-600 mt-1">Modify AR transaction type settings</p>
          </div>
          <button
            onClick={() => router.push('/maintenance/ar/transaction-types')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Back to List
          </button>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Transaction Type Details</h3>
          </div>
          
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Base Type *
                </label>
                <select
                  {...register('base_type')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="Invoice">Invoice</option>
                  <option value="Receipt">Receipt</option>
                  <option value="Credit Note">Credit Note</option>
                  <option value="Journal">Journal</option>
                </select>
                {errors.base_type && (
                  <p className="mt-1 text-sm text-red-600">{errors.base_type.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Balance Direction *
                </label>
                <select
                  {...register('affects_balance_direction')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="Debit">Debit</option>
                  <option value="Credit">Credit</option>
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
                Default AR Control GL Account
              </label>
              <select
                {...register('default_ar_control_gl_account_id', {
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

            {/* Error Display */}
            {updateMutation.error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-sm text-red-600">
                  Failed to update transaction type. Please try again.
                </p>
              </div>
            )}

            <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.push('/maintenance/ar/transaction-types')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || updateMutation.isPending}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting || updateMutation.isPending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : null}
                {isSubmitting || updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
