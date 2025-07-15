'use client';


import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { 
  getInventoryDefaults, 
  updateInventoryDefaults,
  getWarehouses 
} from '@/services/inventoryService';
import { glService } from '@/services/glService';
import { InventoryDefaultsUpdate } from '@/types/inventory';

const defaultsSchema = z.object({
  default_warehouse_id: z.number().optional(),
  default_inventory_gl_account_id: z.number().optional(),
  default_cogs_gl_account_id: z.number().optional(),
  default_sales_revenue_gl_account_id: z.number().optional(),
  default_inventory_adjustment_gl_account_id: z.number().optional(),
});

type DefaultsFormData = z.infer<typeof defaultsSchema>;

export default function InventoryDefaultsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: defaults, isLoading } = useQuery({
    queryKey: ['inventory-defaults'],
    queryFn: getInventoryDefaults,
  });

  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => getWarehouses(),
  });

  const { data: glAccounts = [] } = useQuery({
    queryKey: ['glAccounts'],
    queryFn: () => glService.getGLAccounts(),
  });

  const updateMutation = useMutation({
    mutationFn: updateInventoryDefaults,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-defaults'] });
      alert('Inventory defaults saved successfully!');
    },
    onError: (error: any) => {
      console.error('Failed to update defaults:', error);
      alert(`Failed to save defaults: ${error.response?.data?.detail || error.message}`);
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DefaultsFormData>({
    resolver: zodResolver(defaultsSchema),
  });

  useEffect(() => {
    if (defaults) {
      reset({
        default_warehouse_id: defaults.default_warehouse_id || undefined,
        default_inventory_gl_account_id: defaults.default_inventory_gl_account_id || undefined,
        default_cogs_gl_account_id: defaults.default_cogs_gl_account_id || undefined,
        default_sales_revenue_gl_account_id: defaults.default_sales_revenue_gl_account_id || undefined,
        default_inventory_adjustment_gl_account_id: defaults.default_inventory_adjustment_gl_account_id || undefined,
      });
    }
  }, [defaults, reset]);

  const onSubmit = async (data: DefaultsFormData) => {
    try {
      console.log('Form data submitted:', data);
      // Convert undefined to null for API
      const cleanData = Object.fromEntries(
        Object.entries(data).map(([key, value]) => [key, value || null])
      );
      console.log('Clean data for API:', cleanData);
      await updateMutation.mutateAsync(cleanData as InventoryDefaultsUpdate);
    } catch (error) {
      console.error('Failed to update defaults:', error);
      alert(`Error: ${error}`);
    }
  };

  // Filter GL accounts by type
  const assetAccounts = glAccounts.filter(acc => acc.account_type === 'Asset');
  const expenseAccounts = glAccounts.filter(acc => acc.account_type === 'Expense');
  const revenueAccounts = glAccounts.filter(acc => acc.account_type === 'Income');

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Inventory Defaults</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 bg-white p-6 rounded-lg shadow">
        {/* Warehouse Defaults */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Warehouse Defaults</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Warehouse
            </label>
            <select
              {...register('default_warehouse_id', { 
                setValueAs: (value) => value === '' ? undefined : Number(value)
              })}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select default warehouse</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </option>
              ))}
            </select>
            <p className="text-gray-500 text-sm mt-1">
              This warehouse will be selected by default in new transactions
            </p>
          </div>
        </div>

        {/* GL Account Defaults */}
        <div>
          <h2 className="text-xl font-semibold mb-4">General Ledger Account Defaults</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Inventory Asset Account
              </label>
              <select
                {...register('default_inventory_gl_account_id', { 
                  setValueAs: (value) => value === '' ? undefined : Number(value)
                })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select inventory account</option>
                {assetAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.account_code} - {account.account_name}
                  </option>
                ))}
              </select>
              <p className="text-gray-500 text-sm mt-1">
                Account for inventory asset value
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Cost of Goods Sold Account
              </label>
              <select
                {...register('default_cogs_gl_account_id', { 
                  setValueAs: (value) => value === '' ? undefined : Number(value)
                })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select COGS account</option>
                {expenseAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.account_code} - {account.account_name}
                  </option>
                ))}
              </select>
              <p className="text-gray-500 text-sm mt-1">
                Account for cost of goods sold
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Sales Revenue Account
              </label>
              <select
                {...register('default_sales_revenue_gl_account_id', { 
                  setValueAs: (value) => value === '' ? undefined : Number(value)
                })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select sales revenue account</option>
                {revenueAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.account_code} - {account.account_name}
                  </option>
                ))}
              </select>
              <p className="text-gray-500 text-sm mt-1">
                Account for sales revenue
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Inventory Adjustment Account
              </label>
              <select
                {...register('default_inventory_adjustment_gl_account_id', { 
                  setValueAs: (value) => value === '' ? undefined : Number(value)
                })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select adjustment account</option>
                {[...assetAccounts, ...expenseAccounts].map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.account_code} - {account.account_name}
                  </option>
                ))}
              </select>
              <p className="text-gray-500 text-sm mt-1">
                Account for inventory adjustments
              </p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-md">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Information</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• These defaults will be used when creating new inventory items</li>
            <li>• You can override these defaults for specific items</li>
            <li>• Changes here will not affect existing inventory items</li>
            <li>• All GL accounts should be properly configured before setting up defaults</li>
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
            disabled={updateMutation.isPending}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
          >
            {updateMutation.isPending ? 'Saving...' : 'Save Defaults'}
          </button>
        </div>
      </form>
    </div>
  );
}
