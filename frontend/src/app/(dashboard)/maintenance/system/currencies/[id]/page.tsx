"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { commonService, CurrencyUpdate } from '@/services/commonService';

const currencyUpdateSchema = z.object({
  code: z.string()
    .min(1, "Currency code is required")
    .refine(val => val.length === 3, "Currency code must be exactly 3 characters")
    .optional(),
  name: z.string().min(1, "Currency name is required").optional(),
  symbol: z.string().optional(),
  exchange_rate_to_base: z.number()
    .min(0.000001, "Exchange rate must be greater than 0")
    .max(999999, "Exchange rate seems too high")
    .optional(),
  is_base_currency: z.boolean().optional(),
  is_active: z.boolean().optional(),
});

type CurrencyUpdateFormData = z.infer<typeof currencyUpdateSchema>;

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
  
  return 'An unexpected error occurred while updating the currency. Please try again.';
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditCurrencyPage({ params }: PageProps) {
  const [resolvedParams, setResolvedParams] = React.useState<{ id: string } | null>(null);

  React.useEffect(() => {
    params.then(setResolvedParams);
  }, [params]);

  const router = useRouter();
  const queryClient = useQueryClient();
  const currencyId = resolvedParams ? parseInt(resolvedParams.id) : 0;

  const { data: currency, isLoading } = useQuery({
    queryKey: ['currency', currencyId],
    queryFn: () => commonService.getCurrency(currencyId),
  enabled: currencyId > 0,
  });
  // Fetch all currencies to validate base currency uniqueness
  const { data: allCurrencies } = useQuery({
    queryKey: ['currencies'],
    queryFn: () => commonService.getCurrencies(),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
    setError,
    setValue,
  } = useForm<CurrencyUpdateFormData>({
    resolver: zodResolver(currencyUpdateSchema),
  });

  const isBaseCurrency = watch('is_base_currency');
  // Auto-set exchange rate to 1.0 when base currency is checked
  React.useEffect(() => {
    if (isBaseCurrency) {
      setValue('exchange_rate_to_base', 1.0, { shouldValidate: true });
    }
  }, [isBaseCurrency, setValue]);

  // Check if another base currency already exists
  const baseExists = allCurrencies?.some(c => c.is_base_currency && c.id !== currencyId);

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
    onError: (error: any) => {
      console.error('Error updating currency:', error);
      // The error will be displayed in the JSX error block
    },
  });

  const onSubmit = (data: CurrencyUpdateFormData) => {
    // Prevent setting a new base currency if one already exists
    if (data.is_base_currency) {
      const exists = allCurrencies?.some(c => c.is_base_currency && c.id !== currencyId);
      if (exists) {
        setError('is_base_currency', { type: 'manual', message: 'A base currency already exists for this company' });
        return;
      }
    }
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
        {updateMutation.error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Error Updating Currency
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{parseApiError(updateMutation.error)}</p>
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
                {...register('is_base_currency', {
                  validate: value =>
                    value && baseExists
                      ? 'A base currency already exists for this company'
                      : true,
                })}
                type="checkbox"
                className="h-4 w-4 text-blue-600"
              />
              <label className="ml-2 block text-sm text-gray-900">
                Base Currency
              </label>
            </div>
            {errors.is_base_currency && (
              <p className="text-red-500 text-sm mt-1">{errors.is_base_currency.message}</p>
            )}

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
