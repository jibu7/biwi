"use client";

import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { commonService, CurrencyCreate } from '@/services/commonService';

const currencySchema = z.object({
  code: z.string()
    .min(1, "Currency code is required")
    .refine(val => val.length === 3, "Currency code must be exactly 3 characters")
    .transform(val => val.toUpperCase()),
  name: z.string().min(1, "Currency name is required"),
  symbol: z.string().optional(),
  exchange_rate_to_base: z.number()
    .min(0.000001, "Exchange rate must be greater than 0")
    .max(999999, "Exchange rate seems too high")
    .optional(),
  is_base_currency: z.boolean().optional(),
  is_active: z.boolean().optional(),
});

type CurrencyFormData = z.infer<typeof currencySchema>;

// Helper function to parse API errors
const parseApiError = (error: any): string => {
  if (error?.response?.status === 400) {
    const detail = error.response?.data?.detail;
    if (typeof detail === 'string') {
      if (detail.includes('Currency code already exists')) {
        return 'A currency with this code already exists for your company. Please use a different currency code.';
      }
      if (detail.includes('base currency already exists')) {
        return 'A base currency already exists for your company. Only one base currency is allowed per company.';
      }
      return detail;
    }
  }
  
  if (error?.message) {
    return error.message;
  }
  
  return 'An unexpected error occurred while creating the currency. Please try again.';
};

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
    onError: (error: any) => {
      console.error('Error creating currency:', error);
      // The error will be displayed in the JSX error block
    },
  });

  const onSubmit = (data: CurrencyFormData) => {
    console.log('Form data:', data);
    const currencyData: CurrencyCreate = {
      code: data.code,
      name: data.name,
      symbol: data.symbol,
      exchange_rate_to_base: (data.is_base_currency ? '1.000000' : (typeof data.exchange_rate_to_base === 'number' && !isNaN(data.exchange_rate_to_base) ? data.exchange_rate_to_base.toFixed(6) : '1.000000')),
      is_base_currency: !!data.is_base_currency,
      is_active: !!data.is_active,
    };
    console.log('Currency data to send:', currencyData);
    createMutation.mutate(currencyData);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Add New Currency</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        {createMutation.error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Error Creating Currency
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{parseApiError(createMutation.error)}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
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
                style={{ textTransform: 'uppercase' }}
              />
              {errors.code && (
                <p className="text-red-500 text-sm mt-1">{errors.code.message}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Enter a 3-letter ISO currency code (e.g., USD, EUR, GBP)
              </p>
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
                min="0.000001"
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                disabled={isBaseCurrency}
              />
              {errors.exchange_rate_to_base && (
                <p className="text-red-500 text-sm mt-1">{errors.exchange_rate_to_base.message}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                {isBaseCurrency 
                  ? "Base currency always has exchange rate of 1.0" 
                  : "Enter the exchange rate relative to your base currency"}
              </p>
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
