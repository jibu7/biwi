'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  processWarehouseTransfer,
  getInventoryItems,
  getWarehouses,
} from '@/services/inventoryService';
import { WarehouseTransferCreate } from '@/types/inventory';

const transferSchema = z.object({
  item_id: z.number().min(1, 'Item is required'),
  from_warehouse_id: z.number().min(1, 'From warehouse is required'),
  to_warehouse_id: z.number().min(1, 'To warehouse is required'),
  quantity: z.number().positive('Quantity must be positive'),
  unit_cost: z.number().optional(),
  transfer_date: z.string().optional(),
  notes: z.string().optional(),
}).refine((data) => data.from_warehouse_id !== data.to_warehouse_id, {
  message: "From and To warehouses must be different",
  path: ["to_warehouse_id"],
});

type TransferFormData = z.infer<typeof transferSchema>;

export default function NewWarehouseTransferPage() {
  const router = useRouter();
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const { data: items = [] } = useQuery({
    queryKey: ['inventory-items'],
    queryFn: () => getInventoryItems(),
  });

  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => getWarehouses(),
  });

  const transferMutation = useMutation({
    mutationFn: processWarehouseTransfer,
    onSuccess: () => {
      router.push('/transactions/inventory/transfers');
      router.refresh();
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TransferFormData>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      transfer_date: new Date().toISOString().split('T')[0],
    },
  });

  const selectedItemId = watch('item_id');
  const fromWarehouseId = watch('from_warehouse_id');

  const onSubmit = async (data: TransferFormData) => {
    try {
      await transferMutation.mutateAsync(data as WarehouseTransferCreate);
    } catch (error) {
      console.error('Failed to process transfer:', error);
    }
  };

  // Update selected item details
  const handleItemChange = (itemId: number) => {
    const item = items.find((i) => i.id === itemId);
    setSelectedItem(item);
    if (item && !watch('unit_cost')) {
      setValue('unit_cost', item.average_cost);
    }
  };

  // Filter active warehouses
  const activeWarehouses = warehouses.filter(w => w.is_active);

  return (
    <div className="container mx-auto py-6 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">New Warehouse Transfer</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white p-6 rounded-lg shadow">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Transfer Date
          </label>
          <input
            type="date"
            {...register('transfer_date')}
            className="w-full px-3 py-2 border rounded-md"
          />
          {errors.transfer_date && (
            <p className="text-red-500 text-sm mt-1">{errors.transfer_date.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Item <span className="text-red-500">*</span>
          </label>
          <select
            {...register('item_id', { valueAsNumber: true })}
            onChange={(e) => handleItemChange(Number(e.target.value))}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="">Select an item</option>
            {items.filter(item => item.item_type === 'Stock' && item.is_active).map((item) => (
              <option key={item.id} value={item.id}>
                {item.item_code} - {item.description}
              </option>
            ))}
          </select>
          {errors.item_id && (
            <p className="text-red-500 text-sm mt-1">{errors.item_id.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              From Warehouse <span className="text-red-500">*</span>
            </label>
            <select
              {...register('from_warehouse_id', { valueAsNumber: true })}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="">Select source warehouse</option>
              {activeWarehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </option>
              ))}
            </select>
            {errors.from_warehouse_id && (
              <p className="text-red-500 text-sm mt-1">{errors.from_warehouse_id.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              To Warehouse <span className="text-red-500">*</span>
            </label>
            <select
              {...register('to_warehouse_id', { valueAsNumber: true })}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="">Select destination warehouse</option>
              {activeWarehouses.filter(w => w.id !== fromWarehouseId).map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </option>
              ))}
            </select>
            {errors.to_warehouse_id && (
              <p className="text-red-500 text-sm mt-1">{errors.to_warehouse_id.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantity <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              {...register('quantity', { valueAsNumber: true })}
              className="w-full px-3 py-2 border rounded-md"
            />
            {errors.quantity && (
              <p className="text-red-500 text-sm mt-1">{errors.quantity.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Unit Cost
            </label>
            <input
              type="number"
              step="0.01"
              {...register('unit_cost', { valueAsNumber: true })}
              className="w-full px-3 py-2 border rounded-md"
              placeholder={selectedItem ? `Current: $${selectedItem.average_cost.toFixed(2)}` : ''}
            />
            {errors.unit_cost && (
              <p className="text-red-500 text-sm mt-1">{errors.unit_cost.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes
          </label>
          <textarea
            {...register('notes')}
            rows={3}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="Enter any notes about this transfer..."
          />
          {errors.notes && (
            <p className="text-red-500 text-sm mt-1">{errors.notes.message}</p>
          )}
        </div>

        {selectedItem && (
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="font-medium mb-2">Item Information</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Current Average Cost:</div>
              <div>${selectedItem.average_cost.toFixed(2)}</div>
              <div>Item Type:</div>
              <div>{selectedItem.item_type}</div>
              <div>UoM:</div>
              <div>{selectedItem.unit_of_measure?.name}</div>
            </div>
          </div>
        )}

        <div className="bg-blue-50 p-4 rounded-md">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Transfer Process</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• This will decrease stock in the source warehouse</li>
            <li>• And increase stock in the destination warehouse</li>
            <li>• Both transactions will be recorded with the same reference</li>
            <li>• GL entries will be created if accounts are configured</li>
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
            disabled={transferMutation.isPending}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
          >
            {transferMutation.isPending ? 'Processing...' : 'Process Transfer'}
          </button>
        </div>
      </form>
    </div>
  );
}
