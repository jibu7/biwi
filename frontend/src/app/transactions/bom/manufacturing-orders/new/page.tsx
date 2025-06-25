'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { bomService } from '@/services/bomService';
import { inventoryService } from '@/services/inventoryService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';

const manufacturingOrderSchema = z.object({
  bom_header_id: z.number().min(1, "BOM is required"),
  warehouse_id: z.number().min(1, "Warehouse is required"),
  quantity_to_manufacture: z.number().positive("Quantity must be positive"),
  due_date: z.string().optional(),
  notes: z.string().optional()
});

type ManufacturingOrderFormData = z.infer<typeof manufacturingOrderSchema>;

export default function NewManufacturingOrderPage() {
  const router = useRouter();

  const { data: boms } = useQuery({
    queryKey: ['bom-headers'],
    queryFn: () => bomService.getBOMHeaders()
  });

  const { data: warehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => inventoryService.getWarehouses()
  });

  const form = useForm<ManufacturingOrderFormData>({
    resolver: zodResolver(manufacturingOrderSchema),
    defaultValues: {
      bom_header_id: 0,
      warehouse_id: 0,
      quantity_to_manufacture: 1,
      due_date: '',
      notes: ''
    }
  });

  const createMutation = useMutation({
    mutationFn: bomService.createManufacturingOrder,
    onSuccess: () => {
      router.push('/transactions/bom/manufacturing-orders');
    }
  });

  const onSubmit = (data: any) => {
    // Convert string dates to proper format if needed
    const submitData = {
      ...data,
      due_date: data.due_date || undefined
    };
    createMutation.mutate(submitData as ManufacturingOrderFormData);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">New Manufacturing Order</h1>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="bom_header_id">Bill of Materials</Label>
            <Select
              id="bom_header_id"
              {...form.register('bom_header_id', { valueAsNumber: true })}
            >
              <option value="">Select BOM...</option>
              {boms?.map(bom => (
                <option key={bom.id} value={bom.id}>
                  {bom.bom_code} - {bom.parent_item?.item_code}
                </option>
              ))}
            </Select>
            {form.formState.errors.bom_header_id && (
              <p className="text-red-500 text-sm">{form.formState.errors.bom_header_id.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="warehouse_id">Warehouse</Label>
            <Select
              id="warehouse_id"
              {...form.register('warehouse_id', { valueAsNumber: true })}
            >
              <option value="">Select warehouse...</option>
              {warehouses?.map(warehouse => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </option>
              ))}
            </Select>
            {form.formState.errors.warehouse_id && (
              <p className="text-red-500 text-sm">{form.formState.errors.warehouse_id.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="quantity_to_manufacture">Quantity to Manufacture</Label>
            <Input
              id="quantity_to_manufacture"
              type="number"
              step="0.01"
              {...form.register('quantity_to_manufacture', { valueAsNumber: true })}
            />
            {form.formState.errors.quantity_to_manufacture && (
              <p className="text-red-500 text-sm">{form.formState.errors.quantity_to_manufacture.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="due_date">Due Date</Label>
            <Input
              id="due_date"
              type="date"
              {...form.register('due_date')}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="notes">Notes</Label>
          <Input
            id="notes"
            {...form.register('notes')}
            placeholder="Optional notes..."
          />
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Creating...' : 'Create Manufacturing Order'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
