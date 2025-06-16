'use client';

import { useState, useEffect } from 'react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import { getUnitOfMeasure, updateUnitOfMeasure } from '@/services/inventoryService';
import { UnitOfMeasureUpdate } from '@/types/inventory';

const unitOfMeasureSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name too long'),
  abbreviation: z.string().min(1, 'Abbreviation is required').max(10, 'Abbreviation too long'),
  conversion_factor_to_base: z.number().positive('Conversion factor must be positive'),
  is_active: z.boolean(),
});

type UnitOfMeasureFormData = z.infer<typeof unitOfMeasureSchema>;

export default function EditUnitOfMeasurePage() {
  const router = useRouter();
  const params = useParams();
  const unitId = resolvedParams ? Number(resolvedParams.id) : 0;
  const queryClient = useQueryClient();

  const { data: unit, isLoading } = useQuery({
    queryKey: ['unit-of-measure', unitId],
    queryFn: () => getUnitOfMeasure(unitId),
    enabled: !!unitId,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UnitOfMeasureUpdate }) => updateUnitOfMeasure(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units-of-measure'] });
      queryClient.invalidateQueries({ queryKey: ['unit-of-measure', unitId] });
      router.push('/maintenance/inventory/units-of-measure');
      router.refresh();
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UnitOfMeasureFormData>({
    resolver: zodResolver(unitOfMeasureSchema),
  });

  useEffect(() => {
    if (unit) {
      reset({
        name: unit.name,
        abbreviation: unit.abbreviation,
        conversion_factor_to_base: unit.conversion_factor_to_base,
        is_active: unit.is_active,
      });
    }
  }, [unit, reset]);

  const onSubmit = async (data: UnitOfMeasureFormData) => {
    try {
      await updateMutation.mutateAsync({ id: unitId, data: data as UnitOfMeasureUpdate });
    } catch (error) {
      console.error('Failed to update unit of measure:', error);
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (!unit) return <div>Unit of measure not found</div>;

  return (
    <div className="container mx-auto py-6 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Edit Unit of Measure</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white p-6 rounded-lg shadow">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register('name')}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Each, Kilogram, Meter"
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Abbreviation <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register('abbreviation')}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., EA, KG, M"
          />
          {errors.abbreviation && (
            <p className="text-red-500 text-sm mt-1">{errors.abbreviation.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Conversion Factor to Base <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            step="0.01"
            {...register('conversion_factor_to_base', { valueAsNumber: true })}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="1.00"
          />
          {errors.conversion_factor_to_base && (
            <p className="text-red-500 text-sm mt-1">{errors.conversion_factor_to_base.message}</p>
          )}
          <p className="text-gray-500 text-sm mt-1">
            How many of this unit equals one base unit
          </p>
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

        <div className="bg-amber-50 p-4 rounded-md">
          <h4 className="text-sm font-medium text-amber-800 mb-2">Warning</h4>
          <ul className="text-sm text-amber-700 space-y-1">
            <li>• Changing the conversion factor may affect inventory calculations</li>
            <li>• Deactivating a unit of measure will prevent it from being used in new items</li>
            <li>• Existing items using this unit will continue to work normally</li>
          </ul>
        </div>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
          >
            {updateMutation.isPending ? 'Updating...' : 'Update Unit of Measure'}
          </button>
        </div>
      </form>
    </div>
  );
}
