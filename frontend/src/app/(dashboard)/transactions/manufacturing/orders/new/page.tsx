'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { bomService } from '@/services/bomService';
import { inventoryService } from '@/services/inventoryService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface ManufacturingOrderFormData {
  bom_header_id: number;
  warehouse_id: number;
  quantity_to_manufacture: number;
  due_date?: string;
  notes?: string;
}

export default function NewManufacturingOrderPage() {
  const router = useRouter();

  const { data: boms } = useQuery({
    queryKey: ['active-boms'],
    queryFn: () => bomService.getBOMs({ status: 'Active' }),
  });

  const { data: warehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => inventoryService.getWarehouses(),
  });

  const [formData, setFormData] = useState<ManufacturingOrderFormData>({
    bom_header_id: 0,
    warehouse_id: 0,
    quantity_to_manufacture: 1,
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: '',
  });

  const createOrderMutation = useMutation({
    mutationFn: bomService.createManufacturingOrder,
    onSuccess: () => {
      toast.success('Manufacturing order created successfully');
      router.push('/transactions/manufacturing/orders');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to create manufacturing order');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.bom_header_id || !formData.warehouse_id || formData.quantity_to_manufacture <= 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    createOrderMutation.mutate(formData);
  };

  // Find selected BOM details
  const selectedBOM = boms?.find((b: any) => b.id === formData.bom_header_id);

  return (
    <div className="container mx-auto py-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">New Manufacturing Order</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Bill of Materials *</label>
          <select
            value={formData.bom_header_id}
            onChange={(e) => setFormData(prev => ({ ...prev, bom_header_id: parseInt(e.target.value) }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select BOM</option>
            {boms?.map((bom: any) => (
              <option key={bom.id} value={bom.id}>
                {bom.bom_code} - {bom.description || 'No description'} (Rev: {bom.revision})
              </option>
            ))}
          </select>
        </div>

        {selectedBOM && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">BOM Details</h3>
            <div className="text-sm text-gray-600">
              <p><strong>Item:</strong> {selectedBOM.parent_item?.item_code} - {selectedBOM.parent_item?.description}</p>
              <p><strong>Batch Quantity:</strong> {selectedBOM.quantity_per_batch}</p>
              <p><strong>Status:</strong> {selectedBOM.is_active ? 'Active' : 'Inactive'}</p>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-2">Production Warehouse *</label>
          <select
            value={formData.warehouse_id}
            onChange={(e) => setFormData(prev => ({ ...prev, warehouse_id: parseInt(e.target.value) }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select Warehouse</option>
            {warehouses?.map((warehouse: any) => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.name} - {warehouse.location || 'No location'}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Quantity to Manufacture *</label>
          <Input
            type="number"
            step="0.001"
            value={formData.quantity_to_manufacture}
            onChange={(e) => setFormData(prev => ({ ...prev, quantity_to_manufacture: parseFloat(e.target.value) || 0 }))}
            required
            min="0.001"
          />
          {selectedBOM && (
            <p className="text-sm text-gray-600 mt-1">
              This will produce {(formData.quantity_to_manufacture / selectedBOM.quantity_per_batch).toFixed(2)} batches
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Due Date</label>
          <Input
            type="date"
            value={formData.due_date}
            onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Notes</label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Additional notes for this manufacturing order..."
          />
        </div>

        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={createOrderMutation.isPending}>
            {createOrderMutation.isPending ? 'Creating...' : 'Create Order'}
          </Button>
        </div>
      </form>
    </div>
  );
}
