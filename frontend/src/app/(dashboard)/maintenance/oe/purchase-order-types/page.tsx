'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';

// Mock service - in real app, this would be in services
const purchaseOrderTypesService = {
  getAll: async () => {
    // Mock data - replace with actual API call
    return [
      {
        id: 1,
        name: 'Standard Purchase Order',
        code: 'STD',
        description: 'Standard purchase order for regular procurement',
        requires_approval: false,
        approval_limit: null,
        default_payment_terms: 'Net 30',
        auto_create_grv: true,
        is_active: true,
      },
      {
        id: 2,
        name: 'Capital Equipment',
        code: 'CAPEX',
        description: 'Purchase order for capital equipment and major purchases',
        requires_approval: true,
        approval_limit: 50000,
        default_payment_terms: 'Net 60',
        auto_create_grv: false,
        is_active: true,
      },
    ];
  },
  create: async (data: any) => {
    // Mock create - replace with actual API call
    return { id: Date.now(), ...data };
  },
  update: async (id: number, data: any) => {
    // Mock update - replace with actual API call
    return { id, ...data };
  },
  delete: async (id: number) => {
    // Mock delete - replace with actual API call
    return { success: true };
  },
};

const purchaseOrderTypeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required').max(10, 'Code must be 10 characters or less'),
  description: z.string().optional(),
  requires_approval: z.boolean(),
  approval_limit: z.number().nullable().optional(),
  default_payment_terms: z.string().optional(),
  auto_create_grv: z.boolean(),
  is_active: z.boolean(),
});

type PurchaseOrderTypeFormData = z.infer<typeof purchaseOrderTypeSchema>;

export default function PurchaseOrderTypesPage() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);

  const { data: purchaseOrderTypes = [], isLoading } = useQuery({
    queryKey: ['purchaseOrderTypes'],
    queryFn: () => purchaseOrderTypesService.getAll(),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<PurchaseOrderTypeFormData>({
    resolver: zodResolver(purchaseOrderTypeSchema),
    defaultValues: {
      requires_approval: false,
      auto_create_grv: true,
      is_active: true,
    },
  });

  const requiresApproval = watch('requires_approval');

  const createMutation = useMutation({
    mutationFn: purchaseOrderTypesService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrderTypes'] });
      setShowForm(false);
      reset();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => purchaseOrderTypesService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrderTypes'] });
      setEditingId(null);
      reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: purchaseOrderTypesService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrderTypes'] });
    },
  });

  const onSubmit = async (data: PurchaseOrderTypeFormData) => {
    const submitData = {
      ...data,
      approval_limit: data.requires_approval ? data.approval_limit : null,
    };

    if (editingId) {
      await updateMutation.mutateAsync({ id: editingId, data: submitData });
    } else {
      await createMutation.mutateAsync(submitData);
    }
  };

  const handleEdit = (purchaseOrderType: any) => {
    setEditingId(purchaseOrderType.id);
    setShowForm(true);
    reset({
      name: purchaseOrderType.name,
      code: purchaseOrderType.code,
      description: purchaseOrderType.description || '',
      requires_approval: purchaseOrderType.requires_approval,
      approval_limit: purchaseOrderType.approval_limit,
      default_payment_terms: purchaseOrderType.default_payment_terms || '',
      auto_create_grv: purchaseOrderType.auto_create_grv,
      is_active: purchaseOrderType.is_active,
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setShowForm(false);
    reset();
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this purchase order type?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Purchase Order Types</h1>
          <p className="mt-2 text-sm text-gray-700">
            Configure purchase order types and their processing rules.
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Purchase Order Type
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            {editingId ? 'Edit Purchase Order Type' : 'New Purchase Order Type'}
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name *</label>
                <input
                  type="text"
                  {...register('name')}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Code *</label>
                <input
                  type="text"
                  {...register('code')}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.code && (
                  <p className="mt-1 text-sm text-red-600">{errors.code.message}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Default Payment Terms</label>
                <select
                  {...register('default_payment_terms')}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select payment terms</option>
                  <option value="Net 30">Net 30</option>
                  <option value="Net 60">Net 60</option>
                  <option value="Net 90">Net 90</option>
                  <option value="Net 15">Net 15</option>
                  <option value="Net 7">Net 7</option>
                  <option value="Due on Receipt">Due on Receipt</option>
                  <option value="Cash on Delivery">Cash on Delivery</option>
                </select>
              </div>

              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('requires_approval')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    Requires Approval
                  </label>
                </div>

                {requiresApproval && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Approval Limit</label>
                    <input
                      type="number"
                      step="0.01"
                      {...register('approval_limit', { valueAsNumber: true })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                )}

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('auto_create_grv')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    Auto-create GRV on receipt
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('is_active')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    Active
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <X className="h-4 w-4 mr-2 inline" />
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <Save className="h-4 w-4 mr-2 inline" />
                {editingId ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Purchase Order Types</h2>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-sm text-gray-500">Loading purchase order types...</div>
          </div>
        ) : purchaseOrderTypes.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-sm text-gray-500">No purchase order types found.</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Terms
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Approval Required
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Auto GRV
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {purchaseOrderTypes.map((type) => (
                  <tr key={type.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{type.name}</div>
                        <div className="text-sm text-gray-500">{type.description}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {type.code}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {type.default_payment_terms || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {type.requires_approval ? (
                        <span className="text-orange-600">
                          Yes {type.approval_limit && `($${type.approval_limit.toLocaleString()})`}
                        </span>
                      ) : (
                        <span className="text-gray-500">No</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        type.auto_create_grv 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {type.auto_create_grv ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        type.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {type.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEdit(type)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(type.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
