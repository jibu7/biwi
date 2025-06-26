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
  inventoryService,
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
  const [submitError, setSubmitError] = useState<string | null>(null);

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
      setSubmitError(null);
      router.push('/transactions/inventory/adjustments');
      router.refresh();
    },
    onError: (error: any) => {
      // Extract meaningful error message
      let errorMessage = 'Failed to process adjustment. Please try again.';
      
      if (error?.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      setSubmitError(errorMessage);
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
  const selectedWarehouseId = watch('warehouse_id');

  const { data: stockQuantities = [] } = useQuery({
    queryKey: ['stock-quantities', selectedWarehouseId],
    queryFn: () => inventoryService.getStockQuantities(selectedWarehouseId),
    enabled: !!selectedWarehouseId,
  });

  const onSubmit = async (data: AdjustmentFormData) => {
    setSubmitError(null); // Clear any previous errors
    try {
      await adjustmentMutation.mutateAsync(data as InventoryAdjustmentCreate);
    } catch (error) {
      // Error is already handled by the mutation's onError callback
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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">New Inventory Adjustment</h1>
              <p className="text-gray-600 mt-1">Adjust inventory quantities and values for accurate stock management</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Main Form Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Card Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900">Adjustment Details</h2>
              <p className="text-sm text-gray-600 mt-1">Enter the details for the inventory adjustment</p>
            </div>

            {/* Card Content */}
            <div className="p-6 space-y-6">
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
                      <h3 className="text-sm font-medium text-red-800">Adjustment Failed</h3>
                      <p className="mt-1 text-sm text-red-700">{submitError}</p>
                      {submitError.includes('Insufficient stock') && (
                        <p className="mt-2 text-sm text-red-600">
                          <strong>Tip:</strong> Check the current stock level for this item in the selected warehouse. 
                          You cannot decrease inventory below zero.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Transaction Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Transaction Date
                  </span>
                </label>
                <input
                  type="date"
                  {...register('transaction_date')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                {errors.transaction_date && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.transaction_date.message}
                  </p>
                )}
              </div>

              {/* Item Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    Item <span className="text-red-500">*</span>
                  </span>
                </label>
                <select
                  {...register('item_id', { valueAsNumber: true })}
                  onChange={(e) => handleItemChange(Number(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="">Select an item</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.item_code} - {item.description}
                    </option>
                  ))}
                </select>
                {errors.item_id && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.item_id.message}
                  </p>
                )}
              </div>

              {/* Warehouse and Adjustment Type Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      Warehouse <span className="text-red-500">*</span>
                    </span>
                  </label>
                  <select
                    {...register('warehouse_id', { valueAsNumber: true })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <option value="">Select a warehouse</option>
                    {warehouses.map((warehouse) => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                      </option>
                    ))}
                  </select>
                  {errors.warehouse_id && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.warehouse_id.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                      </svg>
                      Adjustment Type <span className="text-red-500">*</span>
                    </span>
                  </label>
                  <select
                    {...register('inventory_transaction_type_id', { valueAsNumber: true })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <option value="">Select a transaction type</option>
                    {adjustmentTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name} ({type.affects_quantity_direction})
                      </option>
                    ))}
                  </select>
                  {errors.inventory_transaction_type_id && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.inventory_transaction_type_id.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Quantity and Unit Cost Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                      </svg>
                      Quantity <span className="text-red-500">*</span>
                    </span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('quantity', { valueAsNumber: true })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="0.00"
                  />
                  {errors.quantity && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.quantity.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                      Unit Cost
                    </span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('unit_cost', { valueAsNumber: true })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder={selectedItem ? `Current: ${safeCurrency(typeof selectedItem.average_cost === 'number' ? selectedItem.average_cost : null, '')}` : 'Enter unit cost'}
                  />
                  {errors.unit_cost && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.unit_cost.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                    Reason <span className="text-red-500">*</span>
                  </span>
                </label>
                <textarea
                  {...register('reason')}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  placeholder="Enter the reason for this adjustment..."
                />
                {errors.reason && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.reason.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Item Information Card */}
          {selectedItem && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-blue-50">
                <h3 className="text-lg font-semibold text-blue-900 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Item Information
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Current Average Cost</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {safeCurrency(typeof selectedItem.average_cost === 'number' ? selectedItem.average_cost : null)}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Item Type</div>
                    <div className="text-lg font-semibold text-gray-900">{selectedItem.item_type}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Unit of Measure</div>
                    <div className="text-lg font-semibold text-gray-900">{selectedItem.unit_of_measure?.name}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col sm:flex-row justify-end gap-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={adjustmentMutation.isPending}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center justify-center gap-2 min-w-[140px]"
              >
                {adjustmentMutation.isPending ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  'Process Adjustment'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
