'use client';


import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Settings } from 'lucide-react';
import { bomService } from '@/services/bomService';
import { glService } from '@/services/glService';

const defaultsSchema = z.object({
  default_wip_gl_account_id: z.number().nullable(),
  default_material_usage_gl_account_id: z.number().nullable(),
  default_manufacturing_overhead_gl_account_id: z.number().nullable(),
  default_scrap_gl_account_id: z.number().nullable(),
});

type DefaultsFormData = z.infer<typeof defaultsSchema>;

export default function BOMDefaultsPage() {
  const router = useRouter();

  const { data: defaults, isLoading } = useQuery({
    queryKey: ['bomDefaults'],
    queryFn: () => bomService.getBOMDefaults(),
  });

  const { data: glAccounts = [] } = useQuery({
    queryKey: ['glAccounts'],
    queryFn: () => glService.getGLAccounts(),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DefaultsFormData>({
    resolver: zodResolver(defaultsSchema),
  });

  useEffect(() => {
    if (defaults) {
      reset({
        default_wip_gl_account_id: defaults.default_wip_gl_account_id || null,
        default_material_usage_gl_account_id: defaults.default_material_usage_gl_account_id || null,
        default_manufacturing_overhead_gl_account_id: defaults.default_manufacturing_overhead_gl_account_id || null,
        default_scrap_gl_account_id: defaults.default_scrap_gl_account_id || null,
      });
    }
  }, [defaults, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: DefaultsFormData) => 
      bomService.updateBOMDefaults({
        default_wip_gl_account_id: data.default_wip_gl_account_id === null ? undefined : data.default_wip_gl_account_id,
        default_material_usage_gl_account_id: data.default_material_usage_gl_account_id === null ? undefined : data.default_material_usage_gl_account_id,
        default_manufacturing_overhead_gl_account_id: data.default_manufacturing_overhead_gl_account_id === null ? undefined : data.default_manufacturing_overhead_gl_account_id,
        default_scrap_gl_account_id: data.default_scrap_gl_account_id === null ? undefined : data.default_scrap_gl_account_id,
      }),
    onSuccess: () => {
      router.push('/maintenance/bom');
    },
  });

  const onSubmit = async (data: DefaultsFormData) => {
    await updateMutation.mutateAsync(data);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to BOM Setup
        </button>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="text-purple-600" />
          BOM Default Settings
        </h1>
        <p className="text-gray-600 mt-1">
          Configure default general ledger accounts for manufacturing operations
        </p>
      </div>

      {/* Form */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Default Accounts</h2>
          <p className="text-sm text-gray-500 mt-1">
            These accounts will be used as defaults for manufacturing transactions
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Work in Progress Account */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Work in Progress GL Account
            </label>
            <select
              {...register('default_wip_gl_account_id', { valueAsNumber: true })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Select account...</option>
              {glAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.account_code} - {account.account_name}
                </option>
              ))}
            </select>
            {errors.default_wip_gl_account_id && (
              <p className="mt-1 text-sm text-red-600">{errors.default_wip_gl_account_id.message}</p>
            )}
          </div>

          {/* Material Usage Account */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Material Usage GL Account
            </label>
            <select
              {...register('default_material_usage_gl_account_id', { valueAsNumber: true })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Select account...</option>
              {glAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.account_code} - {account.account_name}
                </option>
              ))}
            </select>
            {errors.default_material_usage_gl_account_id && (
              <p className="mt-1 text-sm text-red-600">{errors.default_material_usage_gl_account_id.message}</p>
            )}
          </div>

          {/* Manufacturing Overhead Account */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Manufacturing Overhead GL Account
            </label>
            <select
              {...register('default_manufacturing_overhead_gl_account_id', { valueAsNumber: true })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Select account...</option>
              {glAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.account_code} - {account.account_name}
                </option>
              ))}
            </select>
            {errors.default_manufacturing_overhead_gl_account_id && (
              <p className="mt-1 text-sm text-red-600">{errors.default_manufacturing_overhead_gl_account_id.message}</p>
            )}
          </div>

          {/* Scrap Account */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Scrap/Waste GL Account
            </label>
            <select
              {...register('default_scrap_gl_account_id', { valueAsNumber: true })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Select account...</option>
              {glAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.account_code} - {account.account_name}
                </option>
              ))}
            </select>
            {errors.default_scrap_gl_account_id && (
              <p className="mt-1 text-sm text-red-600">{errors.default_scrap_gl_account_id.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Settings size={16} />
                  Save Defaults
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
