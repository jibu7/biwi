'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import { salesOrderService } from '@/services/oeService';
import { customerService, salesRepService } from '@/services/arService';
import { getInventoryItems } from '@/services/inventoryService';
import { SalesOrderCreate } from '@/types/oe';

const salesOrderLineSchema = z.object({
  item_id: z.number().min(1, 'Item is required'),
  quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
  unit_price: z.number().min(0, 'Unit price must be non-negative'),
  discount_percentage: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
});

const salesOrderSchema = z.object({
  customer_id: z.number().min(1, 'Customer is required'),
  reference: z.string().optional(),
  sales_representative_id: z.number().optional(),
  order_date: z.string().min(1, 'Order date is required'),
  notes: z.string().optional(),
  lines: z.array(salesOrderLineSchema).min(1, 'At least one line item is required'),
});

type SalesOrderFormData = z.infer<typeof salesOrderSchema>;

export default function NewSalesOrderPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customerService.getAll(),
  });

  const { data: salesReps = [] } = useQuery({
    queryKey: ['salesRepresentatives'],
    queryFn: () => salesRepService.getAll(),
  });

  const { data: items = [] } = useQuery({
    queryKey: ['inventoryItems'],
    queryFn: () => getInventoryItems(),
  });

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SalesOrderFormData>({
    resolver: zodResolver(salesOrderSchema),
    defaultValues: {
      order_date: new Date().toISOString().split('T')[0],
      lines: [{ item_id: 0, quantity: 1, unit_price: 0, discount_percentage: 0, notes: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lines',
  });

  const watchedLines = watch('lines');

  // Calculate totals
  const lineCalculations = watchedLines.map(line => {
    const subtotal = line.quantity * line.unit_price;
    const discountAmount = subtotal * (line.discount_percentage || 0) / 100;
    const lineTotal = subtotal - discountAmount;
    return { subtotal, discountAmount, lineTotal };
  });

  const orderSubtotal = lineCalculations.reduce((sum, calc) => sum + calc.lineTotal, 0);
  const taxAmount = 0; // Tax calculation will be handled by backend based on configured tax types
  const orderTotal = orderSubtotal + taxAmount;

  const createMutation = useMutation({
    mutationFn: salesOrderService.create,
    onSuccess: (data) => {
      router.push(`/transactions/oe/sales-orders/${data.id}`);
    },
    onError: (error) => {
      console.error('Failed to create sales order:', error);
    },
  });

  const onSubmit = async (data: SalesOrderFormData) => {
    setIsSubmitting(true);
    try {
      const salesOrderData: SalesOrderCreate = {
        customer_id: data.customer_id,
        order_date: data.order_date,
        sales_representative_id: data.sales_representative_id || undefined,
        reference: data.reference || undefined,
        notes: data.notes || undefined,
        lines: data.lines.map((line) => ({
          item_id: line.item_id,
          description: items.find(item => item.id === line.item_id)?.description || `Item ${line.item_id}`,
          quantity_ordered: line.quantity,
          unit_price: line.unit_price,
          discount_percentage: line.discount_percentage || 0,
        })),
      };
      
      await createMutation.mutateAsync(salesOrderData);
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

  const handleItemChange = (index: number, itemId: number) => {
    const selectedItem = items.find(item => item.id === itemId);
    if (selectedItem) {
      setValue(`lines.${index}.unit_price`, selectedItem.selling_price || 0);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </button>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">New Sales Order</h1>
        <p className="mt-2 text-sm text-gray-700">
          Create a new sales order for a customer.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Header Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium mb-4">Order Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Customer *
              </label>
              <select
                {...register('customer_id', { valueAsNumber: true })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value={0}>Select Customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.customer_code} - {customer.name}
                  </option>
                ))}
              </select>
              {errors.customer_id && (
                <p className="mt-1 text-sm text-red-600">{errors.customer_id.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Order Date *
              </label>
              <input
                type="date"
                {...register('order_date')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.order_date && (
                <p className="mt-1 text-sm text-red-600">{errors.order_date.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Customer PO Reference
              </label>
              <input
                type="text"
                {...register('reference')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Customer's PO number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Sales Representative
              </label>
              <select
                {...register('sales_representative_id', { valueAsNumber: true })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value={0}>Select Sales Rep</option>
                {salesReps.map((rep) => (
                  <option key={rep.id} value={rep.id}>
                    {rep.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700">
              Notes
            </label>
            <textarea
              {...register('notes')}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Additional notes for this order..."
            />
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Line Items</h2>
            <button
              type="button"
              onClick={addLine}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Line
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-2">
                    Item *
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-2">
                    Quantity *
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-2">
                    Unit Price *
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-2">
                    Discount %
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-2">
                    Line Total
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-2">
                    Notes
                  </th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody className="space-y-2">
                {fields.map((field, index) => (
                  <tr key={field.id} className="border-b border-gray-100">
                    <td className="py-2 pr-2">
                      <select
                        {...register(`lines.${index}.item_id`, { valueAsNumber: true })}
                        onChange={(e) => handleItemChange(index, Number(e.target.value))}
                        className="block w-full min-w-[200px] rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                      >
                        <option value={0}>Select Item</option>
                        {items.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.item_code} - {item.description}
                          </option>
                        ))}
                      </select>
                      {errors.lines?.[index]?.item_id && (
                        <p className="mt-1 text-xs text-red-600">{errors.lines[index]?.item_id?.message}</p>
                      )}
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        type="number"
                        step="0.01"
                        {...register(`lines.${index}.quantity`, { valueAsNumber: true })}
                        className="block w-full min-w-[100px] rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                        placeholder="1.00"
                      />
                      {errors.lines?.[index]?.quantity && (
                        <p className="mt-1 text-xs text-red-600">{errors.lines[index]?.quantity?.message}</p>
                      )}
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        type="number"
                        step="0.01"
                        {...register(`lines.${index}.unit_price`, { valueAsNumber: true })}
                        className="block w-full min-w-[120px] rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                        placeholder="0.00"
                      />
                      {errors.lines?.[index]?.unit_price && (
                        <p className="mt-1 text-xs text-red-600">{errors.lines[index]?.unit_price?.message}</p>
                      )}
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        {...register(`lines.${index}.discount_percentage`, { valueAsNumber: true })}
                        className="block w-full min-w-[80px] rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                        placeholder="0.00"
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <div className="text-sm font-medium text-gray-900 min-w-[100px]">
                        ${lineCalculations[index]?.lineTotal.toFixed(2) || '0.00'}
                      </div>
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        type="text"
                        {...register(`lines.${index}.notes`)}
                        className="block w-full min-w-[150px] rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                        placeholder="Notes..."
                      />
                    </td>
                    <td className="py-2">
                      {fields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeLine(index)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {errors.lines && (
            <p className="mt-2 text-sm text-red-600">{errors.lines.message}</p>
          )}
        </div>

        {/* Order Totals */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium mb-4">Order Totals</h2>
          
          <div className="flex justify-end">
            <div className="w-80">
              <div className="flex justify-between py-2">
                <span className="text-sm text-gray-600">Subtotal:</span>
                <span className="text-sm font-medium">${orderSubtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-sm text-gray-600">Tax:</span>
                <span className="text-sm font-medium">${taxAmount.toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-200 pt-2">
                <div className="flex justify-between py-2">
                  <span className="text-lg font-medium">Total:</span>
                  <span className="text-lg font-bold text-blue-600">${orderTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isSubmitting || createMutation.isPending}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting || createMutation.isPending ? 'Creating...' : 'Create Sales Order'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>

        {createMutation.isError && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-800">
              Failed to create sales order. Please check your input and try again.
            </p>
          </div>
        )}
      </form>
    </div>
  );
}
