'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { bomService } from '@/services/bomService';
import { inventoryService } from '@/services/inventoryService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface MRPFormData {
  bom_header_id: number;
  quantity_to_produce: number;
  warehouse_id: number;
  include_phantom_items: boolean;
}

interface MRPResultItem {
  item_id: number;
  item_code: string;
  description: string;
  quantity_required: number;
  quantity_available: number;
  quantity_short: number;
  unit_of_measure: string;
  level: number;
}

export default function MRPPage() {
  const [formData, setFormData] = useState<MRPFormData>({
    bom_header_id: 0,
    quantity_to_produce: 1,
    warehouse_id: 0,
    include_phantom_items: false,
  });

  const [mrpResults, setMRPResults] = useState<MRPResultItem[]>([]);

  const { data: boms } = useQuery({
    queryKey: ['active-boms'],
    queryFn: () => bomService.getBOMs({ status: 'Active' }),
  });

  const { data: warehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => inventoryService.getWarehouses(),
  });

  const runMRPMutation = useMutation({
    mutationFn: bomService.runMRP,
    onSuccess: (data) => {
      setMRPResults(data);
      toast.success('MRP calculation completed');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to run MRP');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.bom_header_id || !formData.warehouse_id || formData.quantity_to_produce <= 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    runMRPMutation.mutate(formData);
  };

  const selectedBOM = boms?.find((b: any) => b.id === formData.bom_header_id);

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Material Requirements Planning (MRP)</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">About MRP</h3>
            <p className="text-sm text-blue-700">
              MRP calculates the materials needed to produce a specific quantity of finished goods. 
              It shows what materials are required, what's available, and what needs to be purchased.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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
              <div className="bg-gray-50 p-3 rounded-lg text-sm">
                <p><strong>Item:</strong> {selectedBOM.parent_item?.item_code} - {selectedBOM.parent_item?.description}</p>
                <p><strong>Batch Quantity:</strong> {selectedBOM.quantity_per_batch}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">Quantity to Produce *</label>
              <Input
                type="number"
                step="0.001"
                value={formData.quantity_to_produce}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity_to_produce: parseFloat(e.target.value) || 0 }))}
                required
                min="0.001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Warehouse *</label>
              <select
                value={formData.warehouse_id}
                onChange={(e) => setFormData(prev => ({ ...prev, warehouse_id: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Warehouse</option>
                {warehouses?.map((warehouse: any) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.include_phantom_items}
                  onChange={(e) => setFormData(prev => ({ ...prev, include_phantom_items: e.target.checked }))}
                />
                <span className="text-sm font-medium">Include Phantom Items</span>
              </label>
            </div>

            <Button 
              type="submit" 
              disabled={runMRPMutation.isPending}
              className="w-full"
            >
              {runMRPMutation.isPending ? 'Calculating...' : 'Run MRP'}
            </Button>
          </form>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">MRP Results</h2>
          
          {mrpResults.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No MRP results yet. Run an MRP calculation to see material requirements.
            </div>
          ) : (
            <div className="space-y-2">
              {mrpResults.map((item, index) => (
                <div 
                  key={index} 
                  className={`border rounded-lg p-3 ${
                    item.quantity_short > 0 ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'
                  }`}
                  style={{ marginLeft: `${item.level * 20}px` }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{item.item_code}</p>
                      <p className="text-sm text-gray-600">{item.description}</p>
                    </div>
                    <div className="text-right text-sm">
                      <p><strong>Required:</strong> {item.quantity_required} {item.unit_of_measure}</p>
                      <p><strong>Available:</strong> {item.quantity_available} {item.unit_of_measure}</p>
                      {item.quantity_short > 0 && (
                        <p className="text-red-600 font-medium">
                          <strong>Short:</strong> {item.quantity_short} {item.unit_of_measure}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                <h3 className="font-medium mb-2">Summary</h3>
                <div className="text-sm space-y-1">
                  <p><strong>Total Items:</strong> {mrpResults.length}</p>
                  <p><strong>Items Short:</strong> {mrpResults.filter(item => item.quantity_short > 0).length}</p>
                  <p><strong>Items Available:</strong> {mrpResults.filter(item => item.quantity_short === 0).length}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
