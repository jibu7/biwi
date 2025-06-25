'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { bomService } from '@/services/bomService';
import { inventoryService } from '@/services/inventoryService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { BOMHeaderCreate } from '@/types/bom';

export default function NewBOMPage() {
  const router = useRouter();
  const [selectedParentItem, setSelectedParentItem] = useState<any>(null);

  const { data: items } = useQuery({
    queryKey: ['inventory-items'],
    queryFn: () => inventoryService.getItems()
  });

  const { data: uoms } = useQuery({
    queryKey: ['units-of-measure'],
    queryFn: () => inventoryService.getUnitsOfMeasure()
  });

  const form = useForm<BOMHeaderCreate>({
    defaultValues: {
      parent_item_id: 0,
      bom_code: '',
      revision: '1.0',
      effective_date: new Date().toISOString().split('T')[0],
      quantity_per_batch: 1,
      unit_of_measure_id: 0,
      is_active: true,
      components: [
        {
          component_item_id: 0,
          quantity_required: 1,
          unit_of_measure_id: 0,
          scrap_percentage: 0,
          sequence_number: 10,
          is_phantom: false
        }
      ]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'components'
  });

  const createMutation = useMutation({
    mutationFn: bomService.createBOMHeader,
    onSuccess: () => {
      router.push('/maintenance/bom/bills');
    }
  });

  const onSubmit = form.handleSubmit((data: BOMHeaderCreate) => {
    createMutation.mutate(data);
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">New Bill of Materials</h1>

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="parent_item_id">Parent Item</Label>
            <Select
              id="parent_item_id"
              {...form.register('parent_item_id', { valueAsNumber: true })}
              onChange={(e) => {
                const item = items?.find(i => i.id === parseInt(e.target.value));
                setSelectedParentItem(item);
                if (item) {
                  form.setValue('unit_of_measure_id', item.unit_of_measure_id);
                }
              }}
            >
              <option value="">Select item...</option>
              {items?.map(item => (
                <option key={item.id} value={item.id}>
                  {item.item_code} - {item.description}
                </option>
              ))}
            </Select>
            {form.formState.errors.parent_item_id && (
              <p className="text-red-500 text-sm">{form.formState.errors.parent_item_id.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="bom_code">BOM Code</Label>
            <Input
              id="bom_code"
              {...form.register('bom_code')}
              placeholder="e.g., BOM-001"
            />
            {form.formState.errors.bom_code && (
              <p className="text-red-500 text-sm">{form.formState.errors.bom_code.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              {...form.register('description')}
            />
          </div>

          <div>
            <Label htmlFor="revision">Revision</Label>
            <Input
              id="revision"
              {...form.register('revision')}
            />
          </div>

          <div>
            <Label htmlFor="effective_date">Effective Date</Label>
            <Input
              id="effective_date"
              type="date"
              {...form.register('effective_date')}
            />
          </div>

          <div>
            <Label htmlFor="quantity_per_batch">Quantity Per Batch</Label>
            <Input
              id="quantity_per_batch"
              type="number"
              step="0.01"
              {...form.register('quantity_per_batch', { valueAsNumber: true })}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Components</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({
                component_item_id: 0,
                quantity_required: 1,
                unit_of_measure_id: 0,
                scrap_percentage: 0,
                sequence_number: (fields.length + 1) * 10,
                is_phantom: false
              })}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Component
            </Button>
          </div>

          <div className="space-y-2">
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-5 gap-2 p-4 border rounded">
                <Select
                  {...form.register(`components.${index}.component_item_id`, { valueAsNumber: true })}
                >
                  <option value="">Select component...</option>
                  {items?.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.item_code} - {item.description}
                    </option>
                  ))}
                </Select>

                <Input
                  type="number"
                  step="0.01"
                  placeholder="Quantity"
                  {...form.register(`components.${index}.quantity_required`, { valueAsNumber: true })}
                />

                <Select
                  {...form.register(`components.${index}.unit_of_measure_id`, { valueAsNumber: true })}
                >
                  <option value="">UoM...</option>
                  {uoms?.map(uom => (
                    <option key={uom.id} value={uom.id}>
                      {uom.abbreviation}
                    </option>
                  ))}
                </Select>

                <Input
                  type="number"
                  step="0.01"
                  placeholder="Scrap %"
                  {...form.register(`components.${index}.scrap_percentage`, { valueAsNumber: true })}
                />

                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Creating...' : 'Create BOM'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
