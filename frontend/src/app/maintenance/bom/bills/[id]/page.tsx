'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { bomService } from '@/services/bomService';
import { inventoryService } from '@/services/inventoryService';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { usePermissions } from '@/hooks/usePermissions';
import { BOM_SETUP_MANAGE } from '@/lib/permissions';
import { BOMHeaderCreate, BOMHeaderUpdate, BOMComponent, InventoryItem } from '@/types';
import { Trash2, Plus, Save, ArrowLeft } from 'lucide-react';

interface BOMFormData {
  item_id: number;
  bom_name: string;
  version: string;
  effective_date: string;
  notes?: string;
  components: {
    component_item_id: number;
    quantity_required: number;
    scrap_percentage: number;
    sequence_number: number;
    notes?: string;
  }[];
}

export default function BOMDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { hasPermission } = usePermissions();
  const queryClient = useQueryClient();
  const bomId = params.id as string;
  const isNew = bomId === 'new';

  const [isEditing, setIsEditing] = useState(isNew);

  // Check permissions
  const canManage = hasPermission(BOM_SETUP_MANAGE);
  
  if (!canManage) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <p className="text-red-600">You don't have permission to manage BOMs.</p>
      </div>
    );
  }

  // Fetch BOM data (if editing existing)
  const { data: bom, isLoading: bomLoading } = useQuery({
    queryKey: ['bom', bomId],
    queryFn: () => bomService.getBOMHeader(Number(bomId)),
    enabled: !isNew
  });

  // Fetch BOM components (if editing existing)
  const { data: components = [], isLoading: componentsLoading } = useQuery({
    queryKey: ['bom-components', bomId],
    queryFn: () => bomService.getBOMComponents(Number(bomId)),
    enabled: !isNew
  });

  // Fetch inventory items for dropdowns
  const { data: inventoryItems = [] } = useQuery({
    queryKey: ['inventory-items'],
    queryFn: () => inventoryService.getInventoryItems()
  });

  // Form setup
  const { register, control, handleSubmit, setValue, watch, formState: { errors } } = useForm<BOMFormData>({
    defaultValues: {
      item_id: 0,
      bom_name: '',
      version: '1.0',
      effective_date: new Date().toISOString().split('T')[0],
      notes: '',
      components: []
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'components'
  });

  // Set form values when BOM data loads
  React.useEffect(() => {
    if (bom && components) {
      setValue('item_id', bom.item_id);
      setValue('bom_name', bom.bom_name);
      setValue('version', bom.version);
      setValue('effective_date', bom.effective_date);
      setValue('notes', bom.notes || '');
      setValue('components', components.map(comp => ({
        component_item_id: comp.component_item_id,
        quantity_required: comp.quantity_required,
        scrap_percentage: comp.scrap_percentage || 0,
        sequence_number: comp.sequence_number,
        notes: comp.notes || ''
      })));
    }
  }, [bom, components, setValue]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: BOMHeaderCreate) => bomService.createBOMHeader(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bom-headers'] });
      router.push('/maintenance/bom/bills');
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: BOMHeaderUpdate) => bomService.updateBOMHeader(Number(bomId), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bom', bomId] });
      queryClient.invalidateQueries({ queryKey: ['bom-headers'] });
      setIsEditing(false);
    }
  });

  const onSubmit = async (data: BOMFormData) => {
    try {
      if (isNew) {
        // Create new BOM
        const bomData: BOMHeaderCreate = {
          item_id: data.item_id,
          bom_name: data.bom_name,
          version: data.version,
          effective_date: data.effective_date,
          notes: data.notes
        };
        const newBom = await createMutation.mutateAsync(bomData);
        
        // Create components
        for (const comp of data.components) {
          await bomService.createBOMComponent({
            bom_header_id: newBom.id,
            component_item_id: comp.component_item_id,
            quantity_required: comp.quantity_required,
            scrap_percentage: comp.scrap_percentage,
            sequence_number: comp.sequence_number,
            notes: comp.notes
          });
        }
      } else {
        // Update existing BOM
        const bomData: BOMHeaderUpdate = {
          bom_name: data.bom_name,
          version: data.version,
          effective_date: data.effective_date,
          notes: data.notes
        };
        await updateMutation.mutateAsync(bomData);
        
        // Note: Component updates would require more complex logic
        // to handle adds/updates/deletes - simplified for now
      }
    } catch (error) {
      console.error('Error saving BOM:', error);
    }
  };

  const addComponent = () => {
    append({
      component_item_id: 0,
      quantity_required: 1,
      scrap_percentage: 0,
      sequence_number: fields.length + 1,
      notes: ''
    });
  };

  if (!isNew && (bomLoading || componentsLoading)) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <p>Loading BOM...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">
            {isNew ? 'Create BOM' : `BOM: ${bom?.bom_name}`}
          </h1>
        </div>
        
        {!isNew && !isEditing && (
          <Button onClick={() => setIsEditing(true)}>
            Edit BOM
          </Button>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">BOM Header</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Item */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Item <span className="text-red-500">*</span>
              </label>
              {isEditing ? (
                <select
                  {...register('item_id', { required: 'Item is required' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Item</option>
                  {inventoryItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.item_code} - {item.item_name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                  {inventoryItems.find(item => item.id === bom?.item_id)?.item_name || 'Unknown Item'}
                </div>
              )}
              {errors.item_id && (
                <p className="text-red-500 text-sm mt-1">{errors.item_id.message}</p>
              )}
            </div>

            {/* BOM Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                BOM Name <span className="text-red-500">*</span>
              </label>
              {isEditing ? (
                <input
                  type="text"
                  {...register('bom_name', { required: 'BOM Name is required' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                  {bom?.bom_name}
                </div>
              )}
              {errors.bom_name && (
                <p className="text-red-500 text-sm mt-1">{errors.bom_name.message}</p>
              )}
            </div>

            {/* Version */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Version <span className="text-red-500">*</span>
              </label>
              {isEditing ? (
                <input
                  type="text"
                  {...register('version', { required: 'Version is required' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                  {bom?.version}
                </div>
              )}
              {errors.version && (
                <p className="text-red-500 text-sm mt-1">{errors.version.message}</p>
              )}
            </div>

            {/* Effective Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Effective Date <span className="text-red-500">*</span>
              </label>
              {isEditing ? (
                <input
                  type="date"
                  {...register('effective_date', { required: 'Effective Date is required' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                  {bom?.effective_date}
                </div>
              )}
              {errors.effective_date && (
                <p className="text-red-500 text-sm mt-1">{errors.effective_date.message}</p>
              )}
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              {isEditing ? (
                <textarea
                  {...register('notes')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md min-h-[76px]">
                  {bom?.notes || 'No notes'}
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Components */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Components</h2>
            {isEditing && (
              <Button type="button" onClick={addComponent} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Component
              </Button>
            )}
          </div>

          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 border border-gray-200 rounded-md">
                {/* Component Item */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Component Item
                  </label>
                  <select
                    {...register(`components.${index}.component_item_id` as const)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                  >
                    <option value="">Select Component</option>
                    {inventoryItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.item_code} - {item.item_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quantity Required */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register(`components.${index}.quantity_required` as const)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                  />
                </div>

                {/* Scrap Percentage */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Scrap %
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register(`components.${index}.scrap_percentage` as const)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                  />
                </div>

                {/* Sequence */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sequence
                  </label>
                  <input
                    type="number"
                    {...register(`components.${index}.sequence_number` as const)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                  />
                </div>

                {/* Actions */}
                <div className="flex items-end">
                  {isEditing && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => remove(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {fields.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No components added yet.
                {isEditing && ' Click "Add Component" to get started.'}
              </div>
            )}
          </div>
        </Card>

        {/* Actions */}
        {isEditing && (
          <div className="flex justify-end gap-4">
            {!isNew && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {isNew ? 'Create BOM' : 'Save Changes'}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
