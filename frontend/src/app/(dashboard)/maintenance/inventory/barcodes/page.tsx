'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Package, Barcode, Search, Edit } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { INV_SETUP_MANAGE } from '@/lib/permissions';

import { 
  getInventoryItems,
  getItemBarcodes,
  createItemBarcode,
  deleteItemBarcode,
  getUnitsOfMeasure
} from '@/services/inventoryService';
import { ItemBarcode, ItemBarcodeCreate, InventoryItem, UnitOfMeasure } from '@/types/inventory';

interface BarcodeFormData {
  item_id: number;
  barcode: string;
  unit_of_measure_id: number | null;
  quantity_in_uom: number | '';
}

export default function InventoryBarcodesPage() {
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState<BarcodeFormData>({
    item_id: 0,
    barcode: '',
    unit_of_measure_id: null,
    quantity_in_uom: 1
  });
  const [formErrors, setFormErrors] = useState<string>('');

  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();

  // Fetch inventory items
  const { data: items = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['inventoryItems'],
    queryFn: () => getInventoryItems()
  });

  // Fetch units of measure
  const { data: unitsOfMeasure = [] } = useQuery({
    queryKey: ['unitsOfMeasure'],
    queryFn: () => getUnitsOfMeasure()
  });

  // Fetch barcodes for selected item
  const { data: barcodes = [], isLoading: barcodesLoading } = useQuery({
    queryKey: ['itemBarcodes', selectedItemId],
    queryFn: () => getItemBarcodes(selectedItemId!),
    enabled: !!selectedItemId
  });

  // Create barcode mutation
  const createMutation = useMutation({
    mutationFn: ({ itemId, data }: { itemId: number; data: ItemBarcodeCreate }) =>
      createItemBarcode(itemId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itemBarcodes', selectedItemId] });
      setIsFormOpen(false);
      resetForm();
      setFormErrors('Barcode created successfully');
    },
    onError: (error: any) => {
      setFormErrors(`Failed to create barcode: ${error.response?.data?.detail || error.message}`);
    }
  });

  // Delete barcode mutation
  const deleteMutation = useMutation({
    mutationFn: deleteItemBarcode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itemBarcodes', selectedItemId] });
      setFormErrors('Barcode deleted successfully');
    },
    onError: (error: any) => {
      setFormErrors(`Failed to delete barcode: ${error.response?.data?.detail || error.message}`);
    }
  });

  // Check permissions
  if (!hasPermission(INV_SETUP_MANAGE)) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don&apos;t have permission to manage inventory barcodes.</p>
        </div>
      </div>
    );
  }

  const resetForm = () => {
    setFormData({
      item_id: selectedItemId || 0,
      barcode: '',
      unit_of_measure_id: null,
      quantity_in_uom: 1
    });
    setFormErrors('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedItemId || !formData.barcode) {
      setFormErrors('Please select an item and enter a barcode');
      return;
    }

    if (formData.quantity_in_uom === '' || formData.quantity_in_uom <= 0) {
      setFormErrors('Please enter a valid quantity greater than 0');
      return;
    }

    const submitData: ItemBarcodeCreate = {
      item_id: selectedItemId,
      barcode: formData.barcode,
      unit_of_measure_id: formData.unit_of_measure_id || undefined,
      quantity_in_uom: typeof formData.quantity_in_uom === 'string' ? parseFloat(formData.quantity_in_uom) : formData.quantity_in_uom
    };

    createMutation.mutate({ itemId: selectedItemId, data: submitData });
  };

  const handleDelete = (barcodeId: number) => {
    if (confirm('Are you sure you want to delete this barcode?')) {
      deleteMutation.mutate(barcodeId);
    }
  };

  const getUnitOfMeasureName = (uomId: number | undefined) => {
    if (!uomId) return 'N/A';
    const uom = unitsOfMeasure.find(u => u.id === uomId);
    return uom ? `${uom.name} (${uom.abbreviation})` : 'Unknown';
  };

  const filteredItems = items.filter(item =>
    item.item_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedItem = items.find(item => item.id === selectedItemId);

  if (itemsLoading) {
    return (
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold tracking-tight">Inventory Barcodes</h1>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Inventory Barcodes</h1>
        <p className="text-muted-foreground">
          Manage item barcodes and scanning configurations
        </p>
      </div>

      {/* Error/Success Messages */}
      {formErrors && (
        <div className={`p-4 rounded-lg border ${
          formErrors.includes('successfully') 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center justify-between">
            <span>{formErrors}</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setFormErrors('')}
              className="h-6 w-6 p-0"
            >
              ×
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Item Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span>Select Item</span>
            </CardTitle>
            <CardDescription>
              Choose an inventory item to manage its barcodes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItemId(item.id)}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedItemId === item.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium">{item.item_code}</div>
                    <div className="text-sm text-gray-600">{item.description}</div>
                    <div className="text-xs text-gray-500">
                      Type: {item.item_type} | UoM: {item.unit_of_measure?.name}
                    </div>
                  </div>
                ))}
              </div>

              {filteredItems.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  No items found matching "{searchTerm}"
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Barcode Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Barcode className="h-5 w-5" />
                <span>Barcodes</span>
              </div>
              {selectedItemId && (
                <Button
                  size="sm"
                  onClick={() => {
                    resetForm();
                    setIsFormOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Barcode
                </Button>
              )}
            </CardTitle>
            <CardDescription>
              {selectedItem 
                ? `Manage barcodes for ${selectedItem.item_code}`
                : 'Select an item to manage its barcodes'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedItemId ? (
              <div className="text-center py-8 text-gray-500">
                <Barcode className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Select an item from the left to manage its barcodes</p>
              </div>
            ) : barcodesLoading ? (
              <div className="text-center py-4">Loading barcodes...</div>
            ) : barcodes.length === 0 ? (
              <div className="text-center py-8">
                <Barcode className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500 mb-4">No barcodes configured for this item</p>
                <Button onClick={() => { resetForm(); setIsFormOpen(true); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Barcode
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {barcodes.map((barcode) => (
                  <div
                    key={barcode.id}
                    className="p-3 border rounded-lg flex items-center justify-between"
                  >
                    <div>
                      <div className="font-mono font-medium">{barcode.barcode}</div>
                      <div className="text-sm text-gray-600">
                        UoM: {getUnitOfMeasureName(barcode.unit_of_measure_id)} | 
                        Qty: {barcode.quantity_in_uom}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(barcode.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Barcode Form Modal */}
      {isFormOpen && (
        <Card className="border-2 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Add Barcode - {selectedItem?.item_code}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsFormOpen(false)}
                className="h-8 w-8 p-0"
              >
                ×
              </Button>
            </CardTitle>
            <CardDescription>
              Create a new barcode for {selectedItem?.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="barcode">Barcode *</Label>
                <Input
                  id="barcode"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  placeholder="e.g., 123456789012"
                  required
                />
              </div>

              <div>
                <Label htmlFor="unit_of_measure">Unit of Measure</Label>
                <Select
                  value={formData.unit_of_measure_id?.toString() || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    unit_of_measure_id: e.target.value ? parseInt(e.target.value) : null 
                  })}
                >
                  <option value="">Select UoM</option>
                  {unitsOfMeasure.map((uom) => (
                    <option key={uom.id} value={uom.id.toString()}>
                      {uom.name} ({uom.abbreviation})
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <Label htmlFor="quantity">Quantity in UoM *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="Enter quantity (e.g., 1, 12)"
                  value={formData.quantity_in_uom}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    quantity_in_uom: e.target.value === '' ? '' : parseFloat(e.target.value) || 0
                  })}
                  required
                />
              </div>

              <div className="flex space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsFormOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Barcode'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Setup Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Barcode Setup Guide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Example Setup for WIDGET-001:</h4>
            <div className="space-y-2 text-sm text-blue-800">
              <div>
                <strong>Barcode 1:</strong> 123456789012 → Each (1 unit)
              </div>
              <div>
                <strong>Barcode 2:</strong> 987654321098 → Box (12 units)
              </div>
            </div>
            <div className="mt-3 space-y-1 text-sm text-blue-700">
              <div>✅ Multiple barcodes per item supported</div>
              <div>✅ Different UoMs and quantities for each barcode</div>
              <div>✅ Automatic scanning integration</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
