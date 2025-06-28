"use client";

import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { commonService, TaxTypeCreate } from '@/services/commonService';

const taxTypeSchema = z.object({
  tax_code: z.string().min(1, 'Tax code is required').optional(),
  name: z.string().min(1, 'Name is required'),
  tax_nature: z.enum(['Sales', 'Purchases', 'Exempt', 'ZeroRated']),
  rate_percentage: z.number()
    .min(0, "Tax rate cannot be negative")
    .max(200, "Tax rate cannot exceed 200%")
    .refine(val => val >= 0, "Tax rate must be 0 or greater"),
  tax_authority_gl_account_id: z.number().optional(),
  is_active: z.boolean().optional(),
});

type TaxTypeFormData = z.infer<typeof taxTypeSchema>;

// Helper function to parse API errors for tax types
const parseApiError = (error: any): string => {
  if (error?.response?.status === 400) {
    const detail = error.response?.data?.detail;
    if (typeof detail === 'string') {
      if (detail.includes('Tax type name already exists')) {
        return 'A tax type with this name already exists for your company. Please use a different name.';
      }
      return detail;
    }
  }
  
  if (error?.message) {
    return error.message;
  }
  
  return 'An unexpected error occurred while creating the tax type. Please try again.';
};

export default function NewTaxTypePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TaxTypeFormData>({
    resolver: zodResolver(taxTypeSchema),
    defaultValues: {
      rate_percentage: 0 as number,
      is_active: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: commonService.createTaxType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxTypes'] });
      router.push('/maintenance/system/tax-types');
    },
    onError: (error: any) => {
      console.error('Error creating tax type:', error);
      // The error will be displayed in the JSX error block
    },
  });

  const onSubmit = (data: TaxTypeFormData) => {
    const taxTypeData: TaxTypeCreate = {
      tax_code: data.tax_code,
      name: data.name,
      tax_nature: data.tax_nature,
      rate_percentage: data.rate_percentage,
      tax_authority_gl_account_id: data.tax_authority_gl_account_id,
      is_active: data.is_active,
    };
    createMutation.mutate(taxTypeData);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Add New Tax Type</h1>
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
                  Error Creating Tax Type
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
                Tax Code
              </label>
              <input
                {...register('tax_code')}
                type="text"
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="VAT10"
              />
              {errors.tax_code && (
                <p className="text-red-500 text-sm mt-1">{errors.tax_code.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tax Name *
              </label>
              <input
                {...register('name')}
                type="text"
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="Value Added Tax 10%"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tax Nature *
              </label>
              <select
                {...register('tax_nature')}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">Select tax nature</option>
                <option value="Sales">Sales</option>
                <option value="Purchases">Purchases</option>
                <option value="Exempt">Exempt</option>
                <option value="ZeroRated">Zero Rated</option>
              </select>
              {errors.tax_nature && (
                <p className="text-red-500 text-sm mt-1">{errors.tax_nature.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Percentage *
              </label>
              <input
                {...register('rate_percentage', { valueAsNumber: true })}
                type="number"
                step="0.01"
                min="0"
                max="200"
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="10.00"
              />
              {errors.rate_percentage && (
                <p className="text-red-500 text-sm mt-1">{errors.rate_percentage.message}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Enter tax rate as a percentage (e.g., 10.00 for 10%). Negative values are not allowed. High rates above 200% will require confirmation.
              </p>
            </div>
          </div>

          <div className="flex items-center">
            <input
              {...register('is_active')}
              type="checkbox"
              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-700">
              Active
            </label>
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
              {createMutation.isPending ? 'Creating...' : 'Create Tax Type'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
