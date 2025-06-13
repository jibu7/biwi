'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import { grvService, purchaseOrderService } from '@/services/oeService';
import { apService } from '@/services/apService';
import { getInventoryItems } from '@/services/inventoryService';
import { GoodsReceivedVoucherCreate } from '@/types/oe';

const grvLineSchema = z.object({
  item_id: z.number().min(1, 'Item is required'),
  quantity_received: z.number().min(0.01, 'Quantity must be greater than 0'),
  unit_price: z.number().min(0, 'Unit price must be non-negative'),
  notes: z.string().optional(),
});

const grvSchema = z.object({
  supplier_id: z.number().min(1, 'Supplier is required'),
  purchase_order_id: z.number().optional(),
  grv_date: z.string().min(1, 'GRV date is required'),
  supplier_delivery_note: z.string().optional(),
  notes: z.string().optional(),
  lines: z.array(grvLineSchema).min(1, 'At least one line item is required'),
});

type GRVFormData = z.infer<typeof grvSchema>;

function NewGRVPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPOId, setSelectedPOId] = useState<number | null>(null);

  // Check if we're creating from a PO
  const poIdFromQuery = searchParams.get('po');

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => apService.getSuppliers(),
  });

  const { data: purchaseOrders = [] } = useQuery({
    queryKey: ['purchaseOrders'],
    queryFn: () => purchaseOrderService.getAll(),
  });

  const { data: items = [] } = useQuery({
    queryKey: ['inventoryItems'],
    queryFn: () => getInventoryItems(),
  });

  // Load PO details if creating from PO
  const { data: selectedPO } = useQuery({
    queryKey: ['purchaseOrder', selectedPOId],
    queryFn: () => purchaseOrderService.getById(selectedPOId!),
    enabled: !!selectedPOId,
  });

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<GRVFormData>({
    resolver: zodResolver(grvSchema),
    defaultValues: {
      grv_date: new Date().toISOString().split('T')[0],
      lines: [{ item_id: 0, quantity_received: 1, unit_price: 0, notes: '' }],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: 'lines',
  });

  const createMutation = useMutation({
    mutationFn: grvService.create,
    onSuccess: (data) => {
      router.push(`/transactions/oe/grvs/${data.id}`);
    },
  });

  const watchedLines = watch('lines');

  // Initialize from PO if provided
  useEffect(() => {
    if (poIdFromQuery) {
      const poId = Number(poIdFromQuery);
      setSelectedPOId(poId);
    }
  }, [poIdFromQuery]);

  // Populate form when PO is selected
  useEffect(() => {
    if (selectedPO) {
      setValue('supplier_id', selectedPO.supplier_id);
      setValue('purchase_order_id', selectedPO.id);
      
      // Populate lines with outstanding quantities
      const outstandingLines = selectedPO.lines?.filter((line: any) => 
        line.quantity_received < line.quantity
      ).map((line: any) => ({
        item_id: line.item_id,
        quantity_received: line.quantity - line.quantity_received,
        unit_price: line.unit_price,
        notes: '',
      })) || [];

      if (outstandingLines.length > 0) {
        replace(outstandingLines);
      }
    }
  }, [selectedPO, setValue, replace]);

  const calculateLineTotal = (line: any) => {
    return line.quantity_received * line.unit_price;
  };

  const totalAmount = watchedLines.reduce((sum, line) => sum + calculateLineTotal(line), 0);

  const onSubmit = async (data: GRVFormData) => {
    setIsSubmitting(true);
    try {
      await createMutation.mutateAsync(data);
    } catch (error) {
      console.error('Error creating GRV:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addLine = () => {
    append({ item_id: 0, quantity_received: 1, unit_price: 0, notes: '' });
  };

  const removeLine = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  const handlePOChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const poId = Number(e.target.value);
    if (poId > 0) {
      setSelectedPOId(poId);
    } else {
      setSelectedPOId(null);
      setValue('supplier_id', 0);
      setValue('purchase_order_id', undefined);
      replace([{ item_id: 0, quantity_received: 1, unit_price: 0, notes: '' }]);
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
        <h1 className="text-2xl font-bold text-gray-900">New Goods Received Voucher</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Header Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">GRV Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Purchase Order (Optional)</label>
              <select
                value={selectedPOId || ''}
                onChange={handlePOChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Create standalone GRV</option>
                {purchaseOrders
                  .filter(po => po.status === 'CONFIRMED')
                  .map((po) => (
                    <option key={po.id} value={po.id}>
                      {po.order_number} - {po.supplier_name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Supplier *</label>
              <select
                {...register('supplier_id', { valueAsNumber: true })}
                disabled={!!selectedPOId}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
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
              <label className="block text-sm font-medium text-gray-700">GRV Date *</label>
              <input
                type="date"
                {...register('grv_date')}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.grv_date && (
                <p className="mt-1 text-sm text-red-600">{errors.grv_date.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Supplier Delivery Note</label>
              <input
                type="text"
                {...register('supplier_delivery_note')}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="Delivery note reference"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              {...register('notes')}
              rows={3}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Additional notes for the GRV"
            />
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">Items Received</h2>
            <button
              type="button"
              onClick={addLine}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Item
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
                    Quantity Received *
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit Price *
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
                        {...register(`lines.${index}.quantity_received`, { valueAsNumber: true })}
                        className="block w-20 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                      {errors.lines?.[index]?.quantity_received && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.lines[index]?.quantity_received?.message}
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
              <div className="border-t pt-2 flex justify-between">
                <span className="text-base font-medium">Total Value:</span>
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
            {isSubmitting ? 'Creating...' : 'Create GRV'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NewGRVPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewGRVPageContent />
    </Suspense>
  );
}
