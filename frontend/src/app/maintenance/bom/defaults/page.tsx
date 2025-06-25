'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { bomService } from '@/services/bomService';
import { glService } from '@/services/glService';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { usePermissions } from '@/hooks/usePermissions';
import { BOM_SETUP_MANAGE } from '@/lib/permissions';
import { BOMDefaultsUpdate, GLAccount } from '@/types';

export default function BOMDefaultsPage() {
  const { hasPermission } = usePermissions();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  const { data: bomDefaults, isLoading: defaultsLoading } = useQuery({
    queryKey: ['bom-defaults'],
    queryFn: () => bomService.getBOMDefaults()
  });

  const { data: glAccounts = [] } = useQuery({
    queryKey: ['gl-accounts'],
    queryFn: () => glService.getGLAccounts()
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<BOMDefaultsUpdate>();

  const updateMutation = useMutation({
    mutationFn: (data: BOMDefaultsUpdate) => bomService.updateBOMDefaults(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bom-defaults'] });
      setIsEditing(false);
      alert('BOM defaults updated successfully');
    },
    onError: (error: any) => {
      alert(`Error updating defaults: ${error.response?.data?.detail || error.message}`);
    }
  });

  const onSubmit = (data: BOMDefaultsUpdate) => {
    // Convert empty strings to undefined for optional fields
    const cleanData = {
      ...data,
      default_wip_gl_account_id: data.default_wip_gl_account_id || undefined,
      default_material_usage_gl_account_id: data.default_material_usage_gl_account_id || undefined,
      default_manufacturing_overhead_gl_account_id: data.default_manufacturing_overhead_gl_account_id || undefined,
      default_scrap_gl_account_id: data.default_scrap_gl_account_id || undefined,
    };
    updateMutation.mutate(cleanData);
  };

  const handleEdit = () => {
    if (bomDefaults) {
      reset({
        default_wip_gl_account_id: bomDefaults.default_wip_gl_account_id || undefined,
        default_material_usage_gl_account_id: bomDefaults.default_material_usage_gl_account_id || undefined,
        default_manufacturing_overhead_gl_account_id: bomDefaults.default_manufacturing_overhead_gl_account_id || undefined,
        default_scrap_gl_account_id: bomDefaults.default_scrap_gl_account_id || undefined,
      });
    }
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    reset();
  };

  if (defaultsLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">BOM Defaults</h1>
        {hasPermission(BOM_SETUP_MANAGE) && !isEditing && (
          <Button onClick={handleEdit}>Edit Defaults</Button>
        )}
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Work in Progress GL Account */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Work in Progress GL Account
              </label>
              {isEditing ? (
                <select
                  {...register('default_wip_gl_account_id')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Account</option>
                  {glAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.account_code} - {account.account_name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                  {bomDefaults?.default_wip_gl_account_id ? 
                    glAccounts.find(acc => acc.id === bomDefaults.default_wip_gl_account_id)?.account_name || 'Unknown Account'
                    : 'Not set'
                  }
                </div>
              )}
            </div>

            {/* Material Usage GL Account */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Material Usage GL Account
              </label>
              {isEditing ? (
                <select
                  {...register('default_material_usage_gl_account_id')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Account</option>
                  {glAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.account_code} - {account.account_name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                  {bomDefaults?.default_material_usage_gl_account_id ? 
                    glAccounts.find(acc => acc.id === bomDefaults.default_material_usage_gl_account_id)?.account_name || 'Unknown Account'
                    : 'Not set'
                  }
                </div>
              )}
            </div>

            {/* Manufacturing Overhead GL Account */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Manufacturing Overhead GL Account
              </label>
              {isEditing ? (
                <select
                  {...register('default_manufacturing_overhead_gl_account_id')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Account</option>
                  {glAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.account_code} - {account.account_name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                  {bomDefaults?.default_manufacturing_overhead_gl_account_id ? 
                    glAccounts.find(acc => acc.id === bomDefaults.default_manufacturing_overhead_gl_account_id)?.account_name || 'Unknown Account'
                    : 'Not set'
                  }
                </div>
              )}
            </div>

            {/* Scrap GL Account */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Scrap GL Account
              </label>
              {isEditing ? (
                <select
                  {...register('default_scrap_gl_account_id')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Account</option>
                  {glAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.account_code} - {account.account_name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                  {bomDefaults?.default_scrap_gl_account_id ? 
                    glAccounts.find(acc => acc.id === bomDefaults.default_scrap_gl_account_id)?.account_name || 'Unknown Account'
                    : 'Not set'
                  }
                </div>
              )}
            </div>

            {/* Next MO Number (Read-only) */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Next Manufacturing Order Number
              </label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                MO{String(bomDefaults?.next_mo_number || 1000).padStart(6, '0')}
              </div>
            </div>
          </div>

          {isEditing && (
            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          )}
        </form>
      </Card>
    </div>
  );
}
