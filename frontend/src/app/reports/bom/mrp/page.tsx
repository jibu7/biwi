'use client';

import { useState } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';

const mrpSchema = z.object({
  bom_header_id: z.number(),
  quantity_to_produce: z.number().positive(),
  warehouse_id: z.number(),
  include_phantom_items: z.boolean()
});

interface MRPFormData {
  bom_header_id: number;
  quantity_to_produce: number;
  warehouse_id: number;
  include_phantom_items: boolean;
}

export default function MRPPage() {
  const [results, setResults] = useState<any[]>([]);

  const { data: boms } = useQuery({
    queryKey: ['boms'],
    queryFn: () => bomService.getBOMHeaders()
  });

  const { data: warehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => inventoryService.getWarehouses()
  });

  const form = useForm<MRPFormData>({
    resolver: zodResolver(mrpSchema),
    defaultValues: {
      bom_header_id: 0,
      quantity_to_produce: 1,
      warehouse_id: 0,
      include_phantom_items: false
    }
  });

  const calculateMutation = useMutation({
    mutationFn: bomService.calculateMRP,
    onSuccess: (data) => {
      setResults(data);
    }
  });

  const onSubmit = (data: MRPFormData) => {
    calculateMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Material Requirements Planning</h1>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                  {bom.bom_code} - {bom.description}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label htmlFor="quantity_to_produce">Quantity to Produce</Label>
            <Input
              id="quantity_to_produce"
              type="number"
              step="0.01"
              {...form.register('quantity_to_produce', { valueAsNumber: true })}
            />
          </div>

          <div>
            <Label htmlFor="warehouse_id">Warehouse</Label>
            <Select
              id="warehouse_id"
              {...form.register('warehouse_id', { valueAsNumber: true })}
            >
              <option value="">Select warehouse...</option>
              {warehouses?.map(wh => (
                <option key={wh.id} value={wh.id}>
                  {wh.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="include_phantom_items"
              {...form.register('include_phantom_items')}
            />
            <Label htmlFor="include_phantom_items">Include phantom items</Label>
          </div>
        </div>

        <Button type="submit" disabled={calculateMutation.isPending}>
          {calculateMutation.isPending ? 'Calculating...' : 'Calculate Requirements'}
        </Button>
      </form>

      {results.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Material Requirements</h2>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Required
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Available
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Short
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  UoM
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {results.map((item, index) => (
                <tr key={index} className={item.level > 0 ? `pl-${item.level * 4}` : ''}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {'  '.repeat(item.level)}{item.level}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {item.item_code}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {item.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {item.quantity_required.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {item.quantity_available.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                    {item.quantity_short > 0 ? item.quantity_short.toFixed(2) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {item.unit_of_measure}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
