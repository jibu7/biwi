'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { oeDefaultsService } from '@/services/oeService';
import { salesRepService } from '@/services/arService';
import { getWarehouses } from '@/services/inventoryService';
import { OrderDefaultsUpdate } from '@/types/oe';

const defaultsSchema = z.object({
  default_currency_code: z.string().min(1, 'Default currency is required'),
  default_payment_terms: z.string().optional(),
  default_sales_representative_id: z.number().nullable().optional(),
  default_warehouse_id: z.number().nullable().optional(),
  auto_generate_order_numbers: z.boolean(),
  sales_order_number_prefix: z.string().optional(),
  purchase_order_number_prefix: z.string().optional(),
  grv_number_prefix: z.string().optional(),
  require_approval_for_orders: z.boolean(),
  order_approval_limit: z.number().nullable().optional(),
});

type DefaultsFormData = z.infer<typeof defaultsSchema>;

export default function OEDefaultsPage() {
  const queryClient = useQueryClient();

  const { data: defaults } = useQuery({
    queryKey: ['oeDefaults'],
    queryFn: () => oeDefaultsService.get(),
  });

  const { data: salesReps = [] } = useQuery({
    queryKey: ['salesRepresentatives'],
    queryFn: () => salesRepService.getAll(),
  });

  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => getWarehouses(),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<DefaultsFormData>({
    resolver: zodResolver(defaultsSchema),
  });

  const requireApproval = watch('require_approval_for_orders');

  // Reset form when data loads
  useEffect(() => {
    if (defaults) {
      reset({
        default_currency_code: defaults.default_currency_code || 'USD',
        default_payment_terms: defaults.default_payment_terms || '',
        default_sales_representative_id: defaults.default_sales_representative_id || null,
        default_warehouse_id: defaults.default_warehouse_id || null,
        auto_generate_order_numbers: defaults.auto_generate_order_numbers ?? true,
        sales_order_number_prefix: defaults.sales_order_number_prefix || 'SO-',
        purchase_order_number_prefix: defaults.purchase_order_number_prefix || 'PO-',
        grv_number_prefix: defaults.grv_number_prefix || 'GRV-',
        require_approval_for_orders: defaults.require_approval_for_orders ?? false,
        order_approval_limit: defaults.order_approval_limit || null,
      });
    }
  }, [defaults, reset]);

  const updateMutation = useMutation({
    mutationFn: oeDefaultsService.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['oeDefaults'] });
    },
  });

  const onSubmit = async (data: DefaultsFormData) => {
    const submitData: OrderDefaultsUpdate = {
      ...data,
      default_sales_representative_id: data.default_sales_representative_id || undefined,
      default_warehouse_id: data.default_warehouse_id || undefined,
      order_approval_limit: data.order_approval_limit || undefined,
    };
    await updateMutation.mutateAsync(submitData);
  };

  const currencies = [
    { code: 'USD', name: 'US Dollar' },
    { code: 'EUR', name: 'Euro' },
    { code: 'GBP', name: 'British Pound' },
    { code: 'CAD', name: 'Canadian Dollar' },
    { code: 'AUD', name: 'Australian Dollar' },
  ];

  const paymentTerms = [
    'Net 30',
    'Net 15',
    'Net 10',
    'Due on Receipt',
    '2/10 Net 30',
    'COD',
  ];

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Order Entry Defaults</h1>
        <p className="mt-2 text-sm text-gray-700">
          Configure default settings for order entry operations.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* General Settings */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium mb-4">General Settings</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Default Currency *
              </label>
              <select
                {...register('default_currency_code')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                {currencies.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.code} - {currency.name}
                  </option>
                ))}
              </select>
              {errors.default_currency_code && (
                <p className="mt-1 text-sm text-red-600">{errors.default_currency_code.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Default Payment Terms
              </label>
              <select
                {...register('default_payment_terms')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Select Payment Terms</option>
                {paymentTerms.map((term) => (
                  <option key={term} value={term}>
                    {term}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Default Sales Representative
              </label>
              <select
                {...register('default_sales_representative_id', { valueAsNumber: true })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Select Sales Rep</option>
                {salesReps.map((rep) => (
                  <option key={rep.id} value={rep.id}>
                    {rep.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Default Warehouse
              </label>
              <select
                {...register('default_warehouse_id', { valueAsNumber: true })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Select Warehouse</option>
                {warehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Numbering Settings */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium mb-4">Numbering Settings</h2>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                {...register('auto_generate_order_numbers')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">
                Auto-generate order numbers
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Sales Order Prefix
                </label>
                <input
                  type="text"
                  {...register('sales_order_number_prefix')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="SO-"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Purchase Order Prefix
                </label>
                <input
                  type="text"
                  {...register('purchase_order_number_prefix')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="PO-"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  GRV Prefix
                </label>
                <input
                  type="text"
                  {...register('grv_number_prefix')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="GRV-"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Approval Settings */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium mb-4">Approval Settings</h2>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                {...register('require_approval_for_orders')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">
                Require approval for orders
              </label>
            </div>

            {requireApproval && (
              <div className="max-w-sm">
                <label className="block text-sm font-medium text-gray-700">
                  Order Approval Limit
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('order_approval_limit', { valueAsNumber: true })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="0.00"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Orders above this amount require approval
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {updateMutation.isPending ? 'Saving...' : 'Save Defaults'}
          </button>
        </div>

        {updateMutation.isSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <p className="text-sm text-green-800">
              Order defaults saved successfully!
            </p>
          </div>
        )}

        {updateMutation.isError && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-800">
              Failed to save order defaults. Please try again.
            </p>
          </div>
        )}
      </form>
    </div>
  );
}
