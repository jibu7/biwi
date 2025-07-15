'use client';


import { useState, useEffect } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Package } from 'lucide-react';

const manufacturingOrderSchema = z.object({
  bom_header_id: z.number(),
  warehouse_id: z.number(),
  quantity_to_manufacture: z.number().positive(),
  due_date: z.string().optional(),
  notes: z.string().optional()
});

export default function NewManufacturingOrderPage() {
  const router = useRouter();
  const [selectedBOM, setSelectedBOM] = useState<any>(null);
  const [materialRequirements, setMaterialRequirements] = useState<any[]>([]);
  const [estimatedCost, setEstimatedCost] = useState(0);

  const { data: boms } = useQuery({
    queryKey: ['boms'],
    queryFn: () => bomService.getBOMHeaders()
  });

  const { data: warehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => inventoryService.getWarehouses()
  });

  const form = useForm({
    resolver: zodResolver(manufacturingOrderSchema),
    defaultValues: {
      quantity_to_manufacture: 1
    }
  });

  const createMutation = useMutation({
    mutationFn: bomService.createManufacturingOrder,
    onSuccess: () => {
      router.push('/transactions/bom/manufacturing-orders');
    }
  });

  // Calculate material requirements when BOM or quantity changes
  const calculateMaterialRequirements = useMutation({
    mutationFn: (data: { bom_header_id: number; quantity_to_produce: number; warehouse_id: number }) =>
      bomService.calculateMRP({
        bom_header_id: data.bom_header_id,
        quantity_to_produce: data.quantity_to_produce,
        warehouse_id: data.warehouse_id,
        include_phantom_items: false
      }),
    onSuccess: (data) => {
      setMaterialRequirements(data);
      // Use cost analysis for estimated cost instead
      setEstimatedCost(0); // Will be set by costAnalysis query
    }
  });

  // Get cost analysis for selected BOM
  const { data: costAnalysis } = useQuery({
    queryKey: ['bom-cost-analysis', selectedBOM?.id, form.watch('quantity_to_manufacture')],
    queryFn: () => bomService.getBOMCostAnalysis(selectedBOM.id, form.watch('quantity_to_manufacture')),
    enabled: !!selectedBOM
  });

  // Watch form values to trigger calculations
  useEffect(() => {
    const subscription = form.watch((values) => {
      if (values.bom_header_id && values.quantity_to_manufacture && values.warehouse_id) {
        const bom = boms?.find(b => b.id === values.bom_header_id);
        setSelectedBOM(bom);
        
        calculateMaterialRequirements.mutate({
          bom_header_id: values.bom_header_id,
          quantity_to_produce: values.quantity_to_manufacture,
          warehouse_id: values.warehouse_id
        });
      }
    });
    return () => subscription.unsubscribe();
  }, [boms, form.watch, calculateMaterialRequirements]);

  const onSubmit = (data: any) => {
    createMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">New Manufacturing Order</h1>
        {selectedBOM && (
          <div className="text-sm text-gray-600">
            BOM: {selectedBOM.bom_code} | Batch Size: {selectedBOM.quantity_per_batch}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Section */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Manufacturing Order Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bom_header_id">Bill of Materials</Label>
                    <Select
                      id="bom_header_id"
                      {...form.register('bom_header_id', { valueAsNumber: true })}
                    >
                      <option value="">Select BOM...</option>
                      {boms?.filter(bom => bom.is_active).map(bom => (
                        <option key={bom.id} value={bom.id}>
                          {bom.bom_code} - {bom.description}
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
                  <Textarea
                    id="notes"
                    {...form.register('notes')}
                    rows={3}
                    placeholder="Optional notes about this manufacturing order..."
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? 'Creating...' : 'Create Order'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => router.back()}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Information Panel */}
        <div className="space-y-4">
          {/* Cost Analysis */}
          {costAnalysis && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Cost Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Material Cost:</span>
                  <span className="font-semibold">${costAnalysis.total_material_cost?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Unit Cost:</span>
                  <span className="font-semibold">${costAnalysis.unit_material_cost?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Quantity:</span>
                  <span className="font-semibold">{costAnalysis.quantity_analyzed || 0}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Material Requirements */}
          {materialRequirements.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Material Requirements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {materialRequirements.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{item.item_code}</div>
                        <div className="text-xs text-gray-600 truncate">{item.description}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">
                          {item.quantity_required.toFixed(2)} {item.unit_of_measure}
                        </div>
                        <div className="text-xs flex items-center gap-1">
                          {item.quantity_short > 0 ? (
                            <>
                              <AlertCircle className="h-3 w-3 text-red-500" />
                              <span className="text-red-600">Short: {item.quantity_short.toFixed(2)}</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              <span className="text-green-600">Available</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* BOM Information */}
          {selectedBOM && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  BOM Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">BOM Code:</span>
                  <span className="font-semibold">{selectedBOM.bom_code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Revision:</span>
                  <span className="font-semibold">{selectedBOM.revision}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Batch Size:</span>
                  <span className="font-semibold">{selectedBOM.quantity_per_batch}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Components:</span>
                  <span className="font-semibold">{selectedBOM.components?.length || 0}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
