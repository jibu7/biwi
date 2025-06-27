'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Trash2, ArrowLeft, AlertTriangle, Package, Truck, CreditCard } from 'lucide-react';
import { purchaseOrderService } from '@/services/oeService';
import { apService } from '@/services/apService';
import { getInventoryItems, getWarehouses } from '@/services/inventoryService';
import { PurchaseOrderCreate } from '@/types/oe';
import { Warehouse } from '@/types/inventory';

const purchaseOrderLineSchema = z.object({
  item_id: z.number().min(1, 'Item is required'),
  description: z.string().min(1, 'Description is required'),
  quantity_ordered: z.number().min(0.01, 'Quantity must be greater than 0'),
  unit_price: z.number().min(0, 'Unit price must be non-negative'),
  discount_percentage: z.number().min(0).max(100).optional(),
  tax_type_id: z.number().optional(),
  tax_amount: z.number().optional(),
  line_total: z.number().min(0, 'Line total is required'),
  notes: z.string().optional(),
});

const purchaseOrderSchema = z.object({
  supplier_id: z.number().min(1, 'Supplier is required'),
  order_date: z.string().min(1, 'Order date is required'),
  expected_delivery_date: z.string().optional(),
  reference: z.string().optional(),
  status: z.string().optional(),
  total_amount: z.number().min(0, 'Total amount is required'),
  notes: z.string().optional(),
  delivery_address_warehouse_id: z.number().min(1, 'Delivery warehouse is required'),
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

  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => getWarehouses(),
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
      status: 'Draft',
      total_amount: 0,
      delivery_address_warehouse_id: 0, // Will be set when warehouses load
      lines: [{ 
        item_id: 0, 
        description: '', 
        quantity_ordered: 1, 
        unit_price: 0, 
        discount_percentage: 0, 
        tax_amount: 0,
        line_total: 0,
        notes: '' 
      }],
    },
  });

  // Set default warehouse when warehouses are loaded
  React.useEffect(() => {
    if (warehouses.length > 0 && !watch('delivery_address_warehouse_id')) {
      const defaultWarehouse = warehouses.find(w => w.is_default) || warehouses[0];
      setValue('delivery_address_warehouse_id', defaultWarehouse.id);
    }
  }, [warehouses, setValue, watch]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lines',
  });

  const createMutation = useMutation({
    mutationFn: purchaseOrderService.create,
    onSuccess: (data) => {
      toast.success(`Purchase Order ${data.order_number} created successfully`);
      router.push(`/transactions/oe/purchase-orders/${data.id}`);
    },
  });

  // subscribe to changes in line items for totals
  const watchedLines = useWatch({ control, name: 'lines' });

  // Calculate totals
  const calculateLineTotal = (line: any) => {
    const subtotal = line.quantity_ordered * line.unit_price;
    const discount = subtotal * (line.discount_percentage || 0) / 100;
    return subtotal - discount + (line.tax_amount || 0);
  };

  const subtotal = watchedLines.reduce((sum, line) => sum + calculateLineTotal(line), 0);
  const taxAmount = watchedLines.reduce((sum, line) => sum + (line.tax_amount || 0), 0);
  const totalAmount = subtotal;

  const onSubmit = async (data: PurchaseOrderFormData) => {
    setIsSubmitting(true);
    try {
      // Calculate line totals and update total_amount before submitting
      const updatedLines = data.lines.map(line => ({
        ...line,
        line_total: calculateLineTotal(line)
      }));
      
      const updatedData = {
        ...data,
        lines: updatedLines,
        total_amount: updatedLines.reduce((sum, line) => sum + line.line_total, 0)
      };
      
      await createMutation.mutateAsync(updatedData);
    } catch (error) {
      console.error('Error creating purchase order:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addLine = () => {
    append({ 
      item_id: 0, 
      description: '', 
      quantity_ordered: 1, 
      unit_price: 0, 
      discount_percentage: 0, 
      tax_amount: 0,
      line_total: 0,
      notes: '' 
    });
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

      {/* Procurement Process Guide */}
      <div className="rounded-lg border p-4 bg-blue-50">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-3 w-3 text-blue-600" />
            </div>
          </div>
          <div className="text-sm">
            <p className="font-medium text-blue-900">Step 4.1: Create Purchase Order - Inventory Replenishment</p>
            <div className="text-blue-800 mt-1 space-y-1">
              <p><strong>Purpose:</strong> Order inventory from suppliers when stock is low</p>
              <p><strong>Process:</strong> Fill in supplier details → Add line items → Save → Status becomes "Open"</p>
              <p><strong>Next Steps:</strong> After saving → Receive goods (GRV) → Convert to AP Invoice</p>
            </div>
            <div className="mt-2 flex space-x-4 text-xs">
              <div className="flex items-center space-x-1">
                <Package className="h-3 w-3 text-blue-600" />
                <span>Current: Create PO</span>
              </div>
              <div className="flex items-center space-x-1 opacity-50">
                <Truck className="h-3 w-3" />
                <span>Next: Receive Goods</span>
              </div>
              <div className="flex items-center space-x-1 opacity-50">
                <CreditCard className="h-3 w-3" />
                <span>Last: AP Invoice</span>
              </div>
            </div>
            <div className="mt-2 p-2 bg-blue-100 rounded-md">
              <p className="text-xs font-semibold text-blue-900">💡 Example:</p>
              <p className="text-xs text-blue-800">
                Supplier: Tech Suppliers Inc | Item: Laptop Intel i3 | Qty: 5 | Unit Cost: $299 | Total: $1,495
              </p>
            </div>
          </div>
        </div>
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
              <label className="block text-sm font-medium text-gray-700">Reference</label>
              <input
                type="text"
                {...register('reference')}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="Internal reference number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Expected Delivery Date</label>
              <input
                type="date"
                {...register('expected_delivery_date')}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Delivery Warehouse *</label>
              <select
                {...register('delivery_address_warehouse_id', { valueAsNumber: true })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select warehouse</option>
                {warehouses.map((warehouse: Warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </option>
                ))}
              </select>
              {errors.delivery_address_warehouse_id && (
                <p className="mt-1 text-sm text-red-600">{errors.delivery_address_warehouse_id.message}</p>
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
                    Description *
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
                        {...register(`lines.${index}.item_id`, { 
                          valueAsNumber: true,
                          onChange: (e) => {
                            const selectedItem = items.find(item => item.id === parseInt(e.target.value));
                            if (selectedItem) {
                              setValue(`lines.${index}.description`, selectedItem.description || selectedItem.item_code);
                              setValue(`lines.${index}.unit_price`, (selectedItem as any).cost_price || 0);
                            }
                          }
                        })}
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
                        type="text"
                        {...register(`lines.${index}.description`)}
                        className="block w-48 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Item description"
                      />
                      {errors.lines?.[index]?.description && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.lines[index]?.description?.message}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        step="0.01"
                        {...register(`lines.${index}.quantity_ordered`, { valueAsNumber: true })}
                        className="block w-20 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                      {errors.lines?.[index]?.quantity_ordered && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.lines[index]?.quantity_ordered?.message}
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
                <span className="text-sm text-gray-600">Tax:</span>
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
