'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { salesRepService } from '@/services/arService';
import { usePermissions } from '@/hooks/usePermissions';
import { AR_SETUP_MANAGE } from '@/lib/permissions';

const salesRepSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required').optional().or(z.literal('')),
  phone: z.string().optional(),
  employee_id: z.string().optional(),
  commission_rate: z.number().min(0, 'Commission rate must be 0 or greater').max(100, 'Commission rate cannot exceed 100%').optional(),
  is_active: z.boolean(),
});

type SalesRepFormData = z.infer<typeof salesRepSchema>;

export default function EditSalesRepresentativePage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const salesRepId = params ? parseInt(params.id as string) : 0;

  const { data: salesRep, isLoading, error } = useQuery({
    queryKey: ['salesRepresentative', salesRepId],
    queryFn: () => salesRepService.getById(salesRepId),
    enabled: salesRepId > 0,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SalesRepFormData>({
    resolver: zodResolver(salesRepSchema),
  });

  const updateMutation = useMutation({
    mutationFn: (data: SalesRepFormData) => {
      const submitData = {
        name: data.name,
        contact_info: {
          email: data.email || undefined,
          phone: data.phone || undefined,
        },
        employee_id: data.employee_id || undefined,
        commission_rate: data.commission_rate || undefined,
        is_active: data.is_active,
      };
      return salesRepService.update(salesRepId, submitData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salesRepresentative', salesRepId] });
      queryClient.invalidateQueries({ queryKey: ['salesRepresentatives'] });
      router.push('/maintenance/ar/sales-representatives');
    },
    onError: (error: any) => {
      console.error('Failed to update sales representative:', error);
    },
  });

  useEffect(() => {
    if (salesRep) {
      reset({
        name: salesRep.name || '',
        email: salesRep.contact_info?.email || '',
        phone: salesRep.contact_info?.phone || '',
        employee_id: salesRep.employee_id || '',
        commission_rate: salesRep.commission_rate || undefined,
        is_active: salesRep.is_active,
      });
    }
  }, [salesRep, reset]);

  // Check permissions - after all hooks
  if (!hasPermission(AR_SETUP_MANAGE)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
          <p className="text-gray-600 mt-2">You don't have permission to edit sales representatives.</p>
        </div>
      </div>
    );
  }

  const onSubmit = async (data: SalesRepFormData) => {
    await updateMutation.mutateAsync(data);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading sales representative...</p>
        </div>
      </div>
    );
  }

  if (error || !salesRep) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Sales Representative Not Found</h2>
          <p className="text-gray-600 mt-2">The requested sales representative could not be found.</p>
          <button 
            onClick={() => router.push('/maintenance/ar/sales-representatives')}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Back to Sales Representatives
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
            <h1 className="text-2xl font-bold text-gray-900">Edit Sales Representative</h1>
            <p className="text-gray-600 mt-1">Modify sales representative details</p>
          </div>
          <button
            onClick={() => router.push('/maintenance/ar/sales-representatives')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Back to List
          </button>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Sales Representative Details</h3>
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
                placeholder="e.g., Michael Park"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  {...register('email')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="e.g., michael.park@techmart.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Phone
                </label>
                <input
                  type="tel"
                  {...register('phone')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="e.g., +1-555-0123"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Employee ID
                </label>
                <input
                  type="text"
                  {...register('employee_id')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="e.g., EMP001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Commission Rate (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  {...register('commission_rate', {
                    setValueAs: (v) => v === '' ? undefined : parseFloat(v)
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="e.g., 5.00"
                />
                {errors.commission_rate && (
                  <p className="mt-1 text-sm text-red-600">{errors.commission_rate.message}</p>
                )}
              </div>
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
              <p className="mt-1 text-sm text-gray-500">
                Inactive sales representatives won't be available for new customer assignments
              </p>
            </div>

            {/* Error Display */}
            {updateMutation.error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-sm text-red-600">
                  Failed to update sales representative. Please try again.
                </p>
              </div>
            )}

            <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.push('/maintenance/ar/sales-representatives')}
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
