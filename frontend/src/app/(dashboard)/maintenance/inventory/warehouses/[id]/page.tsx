'use client';


import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import { getWarehouse, updateWarehouse } from '@/services/inventoryService';
import { WarehouseUpdate } from '@/types/inventory';

const warehouseSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  warehouse_code: z.string().min(1, 'Warehouse code is required').max(20, 'Warehouse code too long'),
  location: z.string().optional(),
  is_default: z.boolean(),
  is_active: z.boolean(),
});

type WarehouseFormData = z.infer<typeof warehouseSchema>;

export default function EditWarehousePage() {
  const router = useRouter();
  const params = useParams();
  const warehouseId = params?.id ? Number(params.id) : 0;
  const queryClient = useQueryClient();

  const { data: warehouse, isLoading } = useQuery({
    queryKey: ['warehouse', warehouseId],
    queryFn: () => getWarehouse(warehouseId),
    enabled: !!warehouseId,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: WarehouseUpdate }) => updateWarehouse(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      queryClient.invalidateQueries({ queryKey: ['warehouse', warehouseId] });
      router.push('/maintenance/inventory/warehouses');
      router.refresh();
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<WarehouseFormData>({
    resolver: zodResolver(warehouseSchema),
  });

  useEffect(() => {
    if (warehouse) {
      reset({
        name: warehouse.name,
        warehouse_code: warehouse.warehouse_code,
        location: warehouse.location || '',
        is_default: warehouse.is_default,
        is_active: warehouse.is_active,
      });
    }
  }, [warehouse, reset]);

  const onSubmit = async (data: WarehouseFormData) => {
    try {
      await updateMutation.mutateAsync({ id: warehouseId, data: data as WarehouseUpdate });
    } catch (error) {
      console.error('Failed to update warehouse:', error);
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (!warehouse) return <div>Warehouse not found</div>;

  return (
    <div className="container mx-auto py-6 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Edit Warehouse</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white p-6 rounded-lg shadow">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Warehouse Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register('name')}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter warehouse name"
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Warehouse Code <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register('warehouse_code')}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter warehouse code (e.g., WH-MAIN)"
          />
          {errors.warehouse_code && (
            <p className="text-red-500 text-sm mt-1">{errors.warehouse_code.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location
          </label>
          <input
            type="text"
            {...register('location')}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter warehouse location or address"
          />
          {errors.location && (
            <p className="text-red-500 text-sm mt-1">{errors.location.message}</p>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              {...register('is_default')}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900">
              Set as default warehouse
            </label>
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
        </div>

        <div className="bg-amber-50 p-4 rounded-md">
          <h4 className="text-sm font-medium text-amber-800 mb-2">Warning</h4>
          <ul className="text-sm text-amber-700 space-y-1">
            <li>• Changing the default warehouse will affect new transactions</li>
            <li>• Deactivating a warehouse will prevent new transactions but preserve history</li>
            <li>• Ensure no pending transactions before making major changes</li>
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
            {updateMutation.isPending ? 'Updating...' : 'Update Warehouse'}
          </button>
        </div>
      </form>
    </div>
  );
}
