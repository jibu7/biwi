'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import { purchaseOrderService } from '@/services/oeService';
import { apService } from '@/services/apService';
import { getInventoryItems } from '@/services/inventoryService';
import { PurchaseOrderCreate } from '@/types/oe';

const purchaseOrderLineSchema = z.object({
  item_id: z.number().min(1, 'Item is required'),
  quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
  unit_price: z.number().min(0, 'Unit price must be non-negative'),
  discount_percentage: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
});

const purchaseOrderSchema = z.object({
  supplier_id: z.number().min(1, 'Supplier is required'),
  supplier_reference: z.string().optional(),
  order_date: z.string().min(1, 'Order date is required'),
  currency_code: z.string().min(1, 'Currency is required'),
  exchange_rate: z.number().min(0.01, 'Exchange rate must be greater than 0').optional(),
  notes: z.string().optional(),
  lines: z.array(purchaseOrderLineSchema).min(1, 'At least one line item is required'),
});

type PurchaseOrderFormData = z.infer<typeof purchaseOrderSchema>;

export default function NewPurchaseOrderPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => apService.getSuppliers(),
  });

  const { data: items = [] } = useQuery({
    queryKey: ['inventoryItems'],
    queryFn: () => getInventoryItems(),
  });

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<PurchaseOrderFormData>({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: {
      order_date: new Date().toISOString().split('T')[0],
      currency_code: 'USD',
      exchange_rate: 1.0,
      lines: [{ item_id: 0, quantity: 1, unit_price: 0, discount_percentage: 0, notes: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lines',
  });

  const createMutation = useMutation({
    mutationFn: purchaseOrderService.create,
    onSuccess: (data) => {
      router.push(`/transactions/oe/purchase-orders/${data.id}`);
    },
  });

  const watchedLines = watch('lines');

  // Calculate totals
  const calculateLineTotal = (line: any) => {
    const subtotal = line.quantity * line.unit_price;
    const discount = subtotal * (line.discount_percentage || 0) / 100;
    return subtotal - discount;
  };

  const subtotal = watchedLines.reduce((sum, line) => sum + calculateLineTotal(line), 0);
  const taxAmount = subtotal * 0.1; // Assuming 10% tax
  const totalAmount = subtotal + taxAmount;

  const onSubmit = async (data: PurchaseOrderFormData) => {
    setIsSubmitting(true);
    try {
      await createMutation.mutateAsync(data);
    } catch (error) {
      console.error('Error creating purchase order:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addLine = () => {
    append({ item_id: 0, quantity: 1, unit_price: 0, discount_percentage: 0, notes: '' });
  };

  const removeLine = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900">New Purchase Order</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Header Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Order Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Supplier *</label>
              <select
                {...register('supplier_id', { valueAsNumber: true })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a supplier</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
              {errors.supplier_id && (
                <p className="mt-1 text-sm text-red-600">{errors.supplier_id.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Order Date *</label>
              <input
                type="date"
                {...register('order_date')}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.order_date && (
                <p className="mt-1 text-sm text-red-600">{errors.order_date.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Supplier Reference</label>
              <input
                type="text"
                {...register('supplier_reference')}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="Supplier reference number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Currency *</label>
              <select
                {...register('currency_code')}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
              {errors.currency_code && (
                <p className="mt-1 text-sm text-red-600">{errors.currency_code.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Exchange Rate</label>
              <input
                type="number"
                step="0.0001"
                {...register('exchange_rate', { valueAsNumber: true })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.exchange_rate && (
                <p className="mt-1 text-sm text-red-600">{errors.exchange_rate.message}</p>
              )}
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              {...register('notes')}
              rows={3}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Additional notes for the purchase order"
            />
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">Line Items</h2>
            <button
              type="button"
              onClick={addLine}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Line
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item *
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity *
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit Price *
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Discount %
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Line Total
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {fields.map((field, index) => (
                  <tr key={field.id}>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <select
                        {...register(`lines.${index}.item_id`, { valueAsNumber: true })}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      >
                        <option value="">Select item</option>
                        {items.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.item_code} - {item.description}
                          </option>
                        ))}
                      </select>
                      {errors.lines?.[index]?.item_id && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.lines[index]?.item_id?.message}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        step="0.01"
                        {...register(`lines.${index}.quantity`, { valueAsNumber: true })}
                        className="block w-20 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                      {errors.lines?.[index]?.quantity && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.lines[index]?.quantity?.message}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        step="0.01"
                        {...register(`lines.${index}.unit_price`, { valueAsNumber: true })}
                        className="block w-24 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                      {errors.lines?.[index]?.unit_price && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.lines[index]?.unit_price?.message}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        step="0.01"
                        {...register(`lines.${index}.discount_percentage`, { valueAsNumber: true })}
                        className="block w-20 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${calculateLineTotal(watchedLines[index]).toFixed(2)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <input
                        type="text"
                        {...register(`lines.${index}.notes`)}
                        className="block w-32 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Notes"
                      />
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => removeLine(index)}
                        disabled={fields.length === 1}
                        className="text-red-600 hover:text-red-900 disabled:text-gray-400 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {errors.lines && (
            <p className="mt-2 text-sm text-red-600">At least one line item is required</p>
          )}
        </div>

        {/* Totals */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Subtotal:</span>
                <span className="text-sm font-medium">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Tax (10%):</span>
                <span className="text-sm font-medium">${taxAmount.toFixed(2)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between">
                <span className="text-base font-medium">Total:</span>
                <span className="text-base font-bold">${totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Creating...' : 'Create Purchase Order'}
          </button>
        </div>
      </form>
    </div>
  );
}
