'use client';


import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { createUnitOfMeasure } from '@/services/inventoryService';
import { UnitOfMeasureCreate } from '@/types/inventory';

const unitOfMeasureSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name too long'),
  abbreviation: z.string().min(1, 'Abbreviation is required').max(10, 'Abbreviation too long'),
  is_base_unit: z.boolean(),
  conversion_factor_to_base: z.number().positive('Conversion factor must be positive'),
  is_active: z.boolean(),
});

type UnitOfMeasureFormData = z.infer<typeof unitOfMeasureSchema>;

export default function NewUnitOfMeasurePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createUnitOfMeasure,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units-of-measure'] });
      router.push('/maintenance/inventory/units-of-measure');
      router.refresh();
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UnitOfMeasureFormData>({
    resolver: zodResolver(unitOfMeasureSchema),
    defaultValues: {
      conversion_factor_to_base: 1.0,
      is_active: true,
      is_base_unit: false,
    },
  });

  const onSubmit = async (data: UnitOfMeasureFormData) => {
    try {
      await createMutation.mutateAsync(data as UnitOfMeasureCreate);
    } catch (error) {
      console.error('Failed to create unit of measure:', error);
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Add New Unit of Measure</h1>

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

        <div className="flex items-center">
          <input
            type="checkbox"
            id="is_base_unit"
            {...register('is_base_unit')}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="is_base_unit" className="ml-2 block text-sm text-gray-900">
            Is Base Unit
          </label>
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
            How many of this unit equals one base unit (e.g., 12 for dozen if base is each)
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

        <div className="bg-blue-50 p-4 rounded-md">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Examples</h4>
          <div className="text-sm text-blue-700 space-y-1">
            <div className="grid grid-cols-3 gap-4 font-medium">
              <span>Name</span>
              <span>Abbreviation</span>
              <span>Conversion Factor</span>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <span>Each</span>
              <span>EA</span>
              <span>1.00</span>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <span>Dozen</span>
              <span>DZ</span>
              <span>12.00</span>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <span>Kilogram</span>
              <span>KG</span>
              <span>1.00</span>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <span>Gram</span>
              <span>G</span>
              <span>0.001</span>
            </div>
          </div>
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
            disabled={createMutation.isPending}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
          >
            {createMutation.isPending ? 'Creating...' : 'Create Unit of Measure'}
          </button>
        </div>
      </form>
    </div>
  );
}
