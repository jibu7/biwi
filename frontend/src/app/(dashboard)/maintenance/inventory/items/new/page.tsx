'use client';


import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createInventoryItem, getUnitsOfMeasure } from '@/services/inventoryService';
import { glService } from '@/services/glService';
import { InventoryItemCreate } from '@/types/inventory';
import { GLAccount } from '@/types/gl';

const inventoryItemSchema = z.object({
  item_code: z.string().min(1, 'Item code is required').max(50, 'Item code too long'),
  description: z.string().min(1, 'Description is required').max(200, 'Description too long'),
  item_type: z.enum(['Stock', 'Service', 'NonStock']),
  unit_of_measure_id: z.number().min(1, 'Unit of measure is required'),
  costing_method: z.string().optional(),
  standard_cost: z.number().min(0, 'Standard cost cannot be negative').optional(),
  selling_price: z.number().min(0, 'Selling price cannot be negative').optional(),
  is_active: z.boolean(),
  notes: z.string().optional(),
  reorder_level: z.number().min(0, 'Reorder level cannot be negative').optional(),
  reorder_quantity: z.number().min(0, 'Reorder quantity cannot be negative').optional(),
  default_inventory_gl_account_id: z.number().optional(),
  default_cogs_gl_account_id: z.number().optional(),
  default_sales_gl_account_id: z.number().optional(),
});

type InventoryItemFormData = z.infer<typeof inventoryItemSchema>;

export default function NewInventoryItemPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState<string>('');

  const { data: unitsOfMeasure = [], isLoading: loadingUOMs } = useQuery({
    queryKey: ['units-of-measure'],
    queryFn: () => getUnitsOfMeasure(),
  });

  const { data: glAccounts = [], isLoading: loadingAccounts } = useQuery({
    queryKey: ['gl-accounts'],
    queryFn: () => glService.getGLAccounts(),
  });

  const createMutation = useMutation({
    mutationFn: createInventoryItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      router.push('/maintenance/inventory/items');
      router.refresh();
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.detail || 'Failed to create inventory item';
      setSubmitError(errorMessage);
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<InventoryItemFormData>({
    resolver: zodResolver(inventoryItemSchema),
    defaultValues: {
      is_active: true,
      item_type: 'Stock',
      costing_method: 'WEIGHTED_AVERAGE',
      standard_cost: 0,
      selling_price: 0,
    },
  });

  const itemType = watch('item_type');

  const onSubmit = async (data: InventoryItemFormData) => {
    try {
      setSubmitError(''); // Clear any previous error
      await createMutation.mutateAsync(data as InventoryItemCreate);
    } catch (error) {
      console.error('Failed to create inventory item:', error);
    }
  };

  if (loadingUOMs || loadingAccounts) return <div>Loading...</div>;

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Add New Inventory Item</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white p-6 rounded-lg shadow">
        {/* Error Display */}
        {submitError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error Creating Item</h3>
                <p className="mt-1 text-sm text-red-700">{submitError}</p>
                {submitError.includes('Item code already exists') && (
                  <p className="mt-2 text-sm text-red-600">
                    <strong>Tip:</strong> Please choose a different item code. Item codes must be unique within your company.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Item Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('item_code')}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter item code"
            />
            {errors.item_code && (
              <p className="text-red-500 text-sm mt-1">{errors.item_code.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Item Type <span className="text-red-500">*</span>
            </label>
            <select
              {...register('item_type')}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Stock">Stock Item</option>
              <option value="Service">Service</option>
              <option value="NonStock">Non-Stock Item</option>
            </select>
            {errors.item_type && (
              <p className="text-red-500 text-sm mt-1">{errors.item_type.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register('description')}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter item description"
          />
          {errors.description && (
            <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Unit of Measure <span className="text-red-500">*</span>
            </label>
            <select
              {...register('unit_of_measure_id', { valueAsNumber: true })}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select unit of measure</option>
              {unitsOfMeasure.map((uom) => (
                <option key={uom.id} value={uom.id}>
                  {uom.name} ({uom.abbreviation})
                </option>
              ))}
            </select>
            {errors.unit_of_measure_id && (
              <p className="text-red-500 text-sm mt-1">{errors.unit_of_measure_id.message}</p>
            )}
          </div>

          {itemType === 'Stock' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Costing Method
              </label>
              <select
                {...register('costing_method')}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="WEIGHTED_AVERAGE">Weighted Average</option>
                <option value="FIFO">First In, First Out (FIFO)</option>
                <option value="LIFO">Last In, First Out (LIFO)</option>
                <option value="STANDARD">Standard Cost</option>
              </select>
            </div>
          )}
        </div>

        {/* Pricing Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Standard Cost
            </label>
            <input
              type="number"
              step="0.01"
              {...register('standard_cost', { valueAsNumber: true })}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
            />
            {errors.standard_cost && (
              <p className="text-red-500 text-sm mt-1">{errors.standard_cost.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selling Price
            </label>
            <input
              type="number"
              step="0.01"
              {...register('selling_price', { valueAsNumber: true })}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
            />
            {errors.selling_price && (
              <p className="text-red-500 text-sm mt-1">{errors.selling_price.message}</p>
            )}
          </div>
        </div>

        {/* Inventory Control */}
        {itemType === 'Stock' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reorder Level
              </label>
              <input
                type="number"
                {...register('reorder_level', { valueAsNumber: true })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
              {errors.reorder_level && (
                <p className="text-red-500 text-sm mt-1">{errors.reorder_level.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reorder Quantity
              </label>
              <input
                type="number"
                {...register('reorder_quantity', { valueAsNumber: true })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
              {errors.reorder_quantity && (
                <p className="text-red-500 text-sm mt-1">{errors.reorder_quantity.message}</p>
              )}
            </div>
          </div>
        )}

        {/* GL Account Assignments */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {itemType === 'Stock' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Inventory GL Account
              </label>
              <select
                {...register('default_inventory_gl_account_id', { valueAsNumber: true })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select account</option>
                {glAccounts.filter((acc: GLAccount) => acc.account_type === 'Asset').map((account: GLAccount) => (
                  <option key={account.id} value={account.id}>
                    {account.account_code} - {account.account_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cost of Goods Sold GL Account
            </label>
            <select
              {...register('default_cogs_gl_account_id', { valueAsNumber: true })}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select account</option>
              {glAccounts.filter((acc: GLAccount) => acc.account_type === 'Expense').map((account: GLAccount) => (
                <option key={account.id} value={account.id}>
                  {account.account_code} - {account.account_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sales GL Account
            </label>
            <select
              {...register('default_sales_gl_account_id', { valueAsNumber: true })}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select account</option>
              {glAccounts.filter((acc: GLAccount) => acc.account_type === 'Income').map((account: GLAccount) => (
                <option key={account.id} value={account.id}>
                  {account.account_code} - {account.account_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes
          </label>
          <textarea
            {...register('notes')}
            rows={3}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter any additional notes about this item"
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            {...register('is_active')}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label className="ml-2 block text-sm text-gray-900">
            Item is active
          </label>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
          >
            {createMutation.isPending ? 'Creating...' : 'Create Item'}
          </button>
        </div>
      </form>
    </div>
  );
}
