"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useParams } from 'next/navigation';
import { commonService, TaxTypeUpdate } from '@/services/commonService';

const taxTypeSchema = z.object({
  tax_code: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  tax_nature: z.enum(['Sales', 'Purchases', 'Exempt', 'ZeroRated']),
  rate_percentage: z.number().min(0, 'Rate must be 0 or greater').max(100, 'Rate must be 100 or less'),
  tax_authority_gl_account_id: z.number().nullable().optional(),
  is_active: z.boolean().optional(),
});

type TaxTypeFormData = z.infer<typeof taxTypeSchema>;

export default function EditTaxTypePage() {
  const router = useRouter();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const taxTypeId = id ? Number(id) : 0;

  const { data: taxType, isLoading } = useQuery({
    queryKey: ['taxType', taxTypeId],
    queryFn: () => commonService.getTaxType(taxTypeId),
  enabled: taxTypeId > 0,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<TaxTypeFormData>({
    resolver: zodResolver(taxTypeSchema),
  });

  // Debug form errors
  React.useEffect(() => {
    if (Object.keys(errors).length > 0) {
      console.log('Form validation errors:', errors);
    }
  }, [errors]);

  // Reset form when tax type data is loaded
  React.useEffect(() => {
    if (taxType) {
      reset({
        tax_code: taxType.tax_code || '',
        name: taxType.name,
        tax_nature: taxType.tax_nature,
        // ensure numeric type for Zod validation
        rate_percentage: Number(taxType.rate_percentage),
        tax_authority_gl_account_id: taxType.tax_authority_gl_account_id,
        is_active: taxType.is_active,
      });
    }
  }, [taxType, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: TaxTypeUpdate) => commonService.updateTaxType(taxTypeId, data),
    onSuccess: () => {
      console.log('Update successful');
      queryClient.invalidateQueries({ queryKey: ['taxTypes'] });
      queryClient.invalidateQueries({ queryKey: ['taxType', taxTypeId] });
      router.push('/maintenance/system/tax-types');
    },
    onError: (error) => {
      console.error('Update failed:', error);
    },
  });

  const onSubmit = (data: TaxTypeFormData) => {
    console.log('Form data:', data);
    console.log('Tax type ID:', taxTypeId);
    const taxTypeData: TaxTypeUpdate = {
      tax_code: data.tax_code,
      name: data.name,
      tax_nature: data.tax_nature,
      rate_percentage: data.rate_percentage,
      tax_authority_gl_account_id: data.tax_authority_gl_account_id,
      is_active: data.is_active,
    };
    console.log('Sending update:', taxTypeData);
    updateMutation.mutate(taxTypeData);
  };

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!taxType) {
    return <div className="p-6">Tax type not found</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Edit Tax Type</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6">        <form onSubmit={(e) => {
          console.log('Form submit event triggered');
          handleSubmit(onSubmit)(e);
        }} className="space-y-6">

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
                max="100"
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="10.00"
              />
              {errors.rate_percentage && (
                <p className="text-red-500 text-sm mt-1">{errors.rate_percentage.message}</p>
              )}
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
              disabled={updateMutation.isPending}
              onClick={() => console.log('Update button clicked')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {updateMutation.isPending ? 'Updating...' : 'Update Tax Type'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
