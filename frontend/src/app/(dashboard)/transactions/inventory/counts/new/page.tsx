'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { startInventoryCount, getWarehouses } from '@/services/inventoryService';
import { InventoryCountSessionCreate } from '@/types/inventory';

const countSessionSchema = z.object({
  warehouse_id: z.number().min(1, 'Warehouse is required'),
  count_date: z.string().min(1, 'Count date is required'),
  notes: z.string().optional(),
});

type CountSessionFormData = z.infer<typeof countSessionSchema>;

export default function NewInventoryCountPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => getWarehouses(),
  });

  const createMutation = useMutation({
    mutationFn: startInventoryCount,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['inventory-count-sessions'] });
      router.push(`/transactions/inventory/counts/${data.id}`);
      router.refresh();
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CountSessionFormData>({
    resolver: zodResolver(countSessionSchema),
    defaultValues: {
      count_date: new Date().toISOString().split('T')[0],
    },
  });

  const onSubmit = async (data: CountSessionFormData) => {
    try {
      await createMutation.mutateAsync(data as InventoryCountSessionCreate);
    } catch (error) {
      console.error('Failed to start inventory count:', error);
    }
  };

  const activeWarehouses = warehouses.filter(w => w.is_active);

  return (
    <div className="container mx-auto py-6 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Start New Inventory Count</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white p-6 rounded-lg shadow">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Count Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            {...register('count_date')}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.count_date && (
            <p className="text-red-500 text-sm mt-1">{errors.count_date.message}</p>
          )}
          <p className="text-gray-500 text-sm mt-1">
            The date when the physical count will be performed
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Warehouse <span className="text-red-500">*</span>
          </label>
          <select
            {...register('warehouse_id', { valueAsNumber: true })}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a warehouse</option>
            {activeWarehouses.map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.name} {warehouse.location && `(${warehouse.location})`}
              </option>
            ))}
          </select>
          {errors.warehouse_id && (
            <p className="text-red-500 text-sm mt-1">{errors.warehouse_id.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes
          </label>
          <textarea
            {...register('notes')}
            rows={4}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter any notes about this count session..."
          />
          {errors.notes && (
            <p className="text-red-500 text-sm mt-1">{errors.notes.message}</p>
          )}
        </div>

        <div className="bg-blue-50 p-4 rounded-md">
          <h4 className="text-sm font-medium text-blue-800 mb-2">What happens when you start a count?</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• System will capture current stock levels for all items in the warehouse</li>
            <li>• Count session will be created in "Open" status</li>
            <li>• You can then record physical counts for each item</li>
            <li>• Variances will be calculated automatically</li>
            <li>• After review, adjustments will be posted to update stock levels</li>
          </ul>
        </div>

        <div className="bg-amber-50 p-4 rounded-md">
          <h4 className="text-sm font-medium text-amber-800 mb-2">Important Considerations</h4>
          <ul className="text-sm text-amber-700 space-y-1">
            <li>• Ensure all recent transactions are posted before starting count</li>
            <li>• Consider stopping warehouse operations during count</li>
            <li>• Have adequate staff and equipment for the physical count</li>
            <li>• Review and approve variances before processing</li>
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
            disabled={createMutation.isPending}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
          >
            {createMutation.isPending ? 'Starting Count...' : 'Start Inventory Count'}
          </button>
        </div>
      </form>
    </div>
  );
}
