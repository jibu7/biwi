'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  processInventoryAdjustment,
  getInventoryItems,
  getWarehouses,
  getInventoryTransactionTypes,
} from '@/services/inventoryService';
import { InventoryAdjustmentCreate } from '@/types/inventory';
import { safeCurrency } from '@/lib/formatters';

const adjustmentSchema = z.object({
  item_id: z.number().min(1, 'Item is required'),
  warehouse_id: z.number().min(1, 'Warehouse is required'),
  quantity: z.number().positive('Quantity must be positive'),
  unit_cost: z.number().optional(),
  inventory_transaction_type_id: z.number().min(1, 'Transaction type is required'),
  reason: z.string().min(1, 'Reason is required'),
  transaction_date: z.string().optional(),
});

type AdjustmentFormData = z.infer<typeof adjustmentSchema>;

export default function NewInventoryAdjustmentPage() {
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

  const { data: transactionTypes = [] } = useQuery({
    queryKey: ['inventory-transaction-types'],
    queryFn: () => getInventoryTransactionTypes(),
  });

  const adjustmentMutation = useMutation({
    mutationFn: processInventoryAdjustment,
    onSuccess: () => {
      router.push('/transactions/inventory/adjustments');
      router.refresh();
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AdjustmentFormData>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: {
      transaction_date: new Date().toISOString().split('T')[0],
    },
  });

  const selectedItemId = watch('item_id');
  const selectedTransactionTypeId = watch('inventory_transaction_type_id');

  const onSubmit = async (data: AdjustmentFormData) => {
    try {
      await adjustmentMutation.mutateAsync(data as InventoryAdjustmentCreate);
    } catch (error) {
      console.error('Failed to process adjustment:', error);
    }
  };

  // Filter transaction types for adjustments only
  const adjustmentTypes = transactionTypes.filter(
    (type) =>
      type.base_type === 'AdjustmentIncrease' || type.base_type === 'AdjustmentDecrease'
  );

  // Update selected item details
  const handleItemChange = (itemId: number) => {
    const item = items.find((i) => i.id === itemId);
    setSelectedItem(item);
    if (item && !watch('unit_cost')) {
      setValue('unit_cost', item.average_cost);
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">New Inventory Adjustment</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white p-6 rounded-lg shadow">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Transaction Date
          </label>
          <input
            type="date"
            {...register('transaction_date')}
            className="w-full px-3 py-2 border rounded-md"
          />
          {errors.transaction_date && (
            <p className="text-red-500 text-sm mt-1">{errors.transaction_date.message}</p>
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
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.item_code} - {item.description}
              </option>
            ))}
          </select>
          {errors.item_id && (
            <p className="text-red-500 text-sm mt-1">{errors.item_id.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Warehouse <span className="text-red-500">*</span>
          </label>
          <select
            {...register('warehouse_id', { valueAsNumber: true })}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="">Select a warehouse</option>
            {warehouses.map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.name}
              </option>
            ))}
          </select>
          {errors.warehouse_id && (
            <p className="text-red-500 text-sm mt-1">{errors.warehouse_id.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Adjustment Type <span className="text-red-500">*</span>
          </label>
          <select
            {...register('inventory_transaction_type_id', { valueAsNumber: true })}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="">Select a transaction type</option>
            {adjustmentTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name} ({type.affects_quantity_direction})
              </option>
            ))}
          </select>
          {errors.inventory_transaction_type_id && (
            <p className="text-red-500 text-sm mt-1">
              {errors.inventory_transaction_type_id.message}
            </p>
          )}
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
              placeholder={selectedItem ? `Current: ${safeCurrency(typeof selectedItem.average_cost === 'number' ? selectedItem.average_cost : null, '')}` : ''}
            />
            {errors.unit_cost && (
              <p className="text-red-500 text-sm mt-1">{errors.unit_cost.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reason <span className="text-red-500">*</span>
          </label>
          <textarea
            {...register('reason')}
            rows={3}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="Enter the reason for this adjustment..."
          />
          {errors.reason && (
            <p className="text-red-500 text-sm mt-1">{errors.reason.message}</p>
          )}
        </div>

        {selectedItem && (
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="font-medium mb-2">Item Information</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Current Average Cost:</div>
              <div>{safeCurrency(typeof selectedItem.average_cost === 'number' ? selectedItem.average_cost : null)}</div>
              <div>Item Type:</div>
              <div>{selectedItem.item_type}</div>
              <div>UoM:</div>
              <div>{selectedItem.unit_of_measure?.name}</div>
            </div>
          </div>
        )}

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
            disabled={adjustmentMutation.isPending}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
          >
            {adjustmentMutation.isPending ? 'Processing...' : 'Process Adjustment'}
          </button>
        </div>
      </form>
    </div>
  );
}
