"use client";

import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { commonService, CurrencyCreate } from '@/services/commonService';

const currencySchema = z.object({
  code: z.string().min(3).max(3).toUpperCase(),
  name: z.string().min(1),
  symbol: z.string().optional(),
  exchange_rate_to_base: z.number().min(0.000001).optional(),
  is_base_currency: z.boolean().optional(),
  is_active: z.boolean().optional(),
});

type CurrencyFormData = z.infer<typeof currencySchema>;

export default function NewCurrencyPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<CurrencyFormData>({
    resolver: zodResolver(currencySchema),
    defaultValues: {
      exchange_rate_to_base: 1.0,
      is_base_currency: false,
      is_active: true,
    },
  });

  const isBaseCurrency = watch('is_base_currency');

  const createMutation = useMutation({
    mutationFn: commonService.createCurrency,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currencies'] });
      router.push('/maintenance/system/currencies');
    },
  });

  const onSubmit = (data: CurrencyFormData) => {
    const currencyData: CurrencyCreate = {
      code: data.code,
      name: data.name,
      symbol: data.symbol,
      exchange_rate_to_base: data.is_base_currency ? 1.0 : data.exchange_rate_to_base,
      is_base_currency: data.is_base_currency,
      is_active: data.is_active,
    };
    createMutation.mutate(currencyData);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Add New Currency</h1>
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
                placeholder="USD"
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
                placeholder="US Dollar"
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
                placeholder="$"
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
              disabled={createMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Currency'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
