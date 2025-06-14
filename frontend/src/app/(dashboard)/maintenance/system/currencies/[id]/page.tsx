"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { commonService, CurrencyUpdate } from '@/services/commonService';

const currencyUpdateSchema = z.object({
  code: z.string().min(3).max(3).optional(),
  name: z.string().min(1).optional(),
  symbol: z.string().optional(),
  exchange_rate_to_base: z.number().min(0.000001).optional(),
  is_base_currency: z.boolean().optional(),
  is_active: z.boolean().optional(),
});

type CurrencyUpdateFormData = z.infer<typeof currencyUpdateSchema>;

export default function EditCurrencyPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const currencyId = parseInt(params.id);

  const { data: currency, isLoading } = useQuery({
    queryKey: ['currency', currencyId],
    queryFn: () => commonService.getCurrency(currencyId),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<CurrencyUpdateFormData>({
    resolver: zodResolver(currencyUpdateSchema),
  });

  const isBaseCurrency = watch('is_base_currency');

  // Reset form when currency data loads
  React.useEffect(() => {
    if (currency) {
      reset(currency);
    }
  }, [currency, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: CurrencyUpdate) => commonService.updateCurrency(currencyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currencies'] });
      queryClient.invalidateQueries({ queryKey: ['currency', currencyId] });
      router.push('/maintenance/system/currencies');
    },
  });

  const onSubmit = (data: CurrencyUpdateFormData) => {
    const updateData: CurrencyUpdate = { ...data };
    if (data.is_base_currency) {
      updateData.exchange_rate_to_base = 1.0;
    }
    updateMutation.mutate(updateData);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!currency) {
    return <div>Currency not found</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Edit Currency</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Currency Code *
              </label>
              <input
                {...register('code')}
                type="text"
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                maxLength={3}
              />
              {errors.code && (
                <p className="text-red-500 text-sm mt-1">{errors.code.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Currency Name *
              </label>
              <input
                {...register('name')}
                type="text"
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Symbol
              </label>
              <input
                {...register('symbol')}
                type="text"
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                maxLength={5}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Exchange Rate to Base
              </label>
              <input
                {...register('exchange_rate_to_base', { valueAsNumber: true })}
                type="number"
                step="0.000001"
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                disabled={isBaseCurrency}
              />
              {errors.exchange_rate_to_base && (
                <p className="text-red-500 text-sm mt-1">{errors.exchange_rate_to_base.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center">
              <input
                {...register('is_base_currency')}
                type="checkbox"
                className="h-4 w-4 text-blue-600"
              />
              <label className="ml-2 block text-sm text-gray-900">
                Base Currency
              </label>
            </div>

            <div className="flex items-center">
              <input
                {...register('is_active')}
                type="checkbox"
                className="h-4 w-4 text-blue-600"
              />
              <label className="ml-2 block text-sm text-gray-900">
                Active
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {updateMutation.isPending ? 'Updating...' : 'Update Currency'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
