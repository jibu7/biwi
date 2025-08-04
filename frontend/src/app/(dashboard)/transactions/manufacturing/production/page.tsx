'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { bomService } from '@/services/bomService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface ProductionEntryFormData {
  manufacturing_order_id: number;
  quantity_produced: number;
  production_date: string;
  notes?: string;
}

export default function ProductionEntryPage() {
  const router = useRouter();

  const { data: orders } = useQuery({
    queryKey: ['released-manufacturing-orders'],
    queryFn: () => bomService.getManufacturingOrders({ status: 'Released' }),
  });

  const [formData, setFormData] = useState<ProductionEntryFormData>({
    manufacturing_order_id: 0,
    quantity_produced: 0,
    production_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const recordProductionMutation = useMutation({
    mutationFn: bomService.recordProduction,
    onSuccess: () => {
      toast.success('Production entry recorded successfully');
      router.push('/transactions/manufacturing/orders');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to record production');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.manufacturing_order_id || formData.quantity_produced <= 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    recordProductionMutation.mutate(formData);
  };

  const selectedOrder = orders?.find((o: any) => o.id === formData.manufacturing_order_id);

  return (
    <div className="container mx-auto py-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Production Entry</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Manufacturing Order *</label>
          <select
            value={formData.manufacturing_order_id}
            onChange={(e) => setFormData(prev => ({ ...prev, manufacturing_order_id: parseInt(e.target.value) }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select Manufacturing Order</option>
            {orders?.map((order: any) => (
              <option key={order.id} value={order.id}>
                {order.order_number} - {order.bom_header?.bom_code} (Qty: {order.quantity_to_manufacture})
              </option>
            ))}
          </select>
        </div>

        {selectedOrder && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Order Details</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Item:</strong> {selectedOrder.bom_header?.parent_item?.item_code} - {selectedOrder.bom_header?.parent_item?.description}</p>
              <p><strong>Quantity to Manufacture:</strong> {selectedOrder.quantity_to_manufacture}</p>
              <p><strong>Quantity Completed:</strong> {selectedOrder.quantity_completed}</p>
              <p><strong>Remaining:</strong> {selectedOrder.quantity_to_manufacture - selectedOrder.quantity_completed}</p>
              <p><strong>Warehouse:</strong> {selectedOrder.warehouse?.name}</p>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-2">Quantity Produced *</label>
          <Input
            type="number"
            step="0.001"
            value={formData.quantity_produced}
            onChange={(e) => setFormData(prev => ({ ...prev, quantity_produced: parseFloat(e.target.value) || 0 }))}
            required
            min="0.001"
            max={selectedOrder ? selectedOrder.quantity_to_manufacture - selectedOrder.quantity_completed : undefined}
          />
          {selectedOrder && (
            <p className="text-sm text-gray-600 mt-1">
              Maximum: {selectedOrder.quantity_to_manufacture - selectedOrder.quantity_completed}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Production Date *</label>
          <Input
            type="date"
            value={formData.production_date}
            onChange={(e) => setFormData(prev => ({ ...prev, production_date: e.target.value }))}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Notes</label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Additional notes about this production entry..."
          />
        </div>

        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={recordProductionMutation.isPending}>
            {recordProductionMutation.isPending ? 'Recording...' : 'Record Production'}
          </Button>
        </div>
      </form>
    </div>
  );
}
