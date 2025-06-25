'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit, Plus, ArrowUp, ArrowDown, Minus, CheckCircle, AlertCircle, X } from 'lucide-react';

import { 
  getInventoryTransactionTypes, 
  createInventoryTransactionType, 
  updateInventoryTransactionType, 
  deleteInventoryTransactionType 
} from '@/services/inventoryService';
import { glService } from '@/services/glService';
import { InventoryTransactionType, InventoryTransactionTypeCreate, InventoryTransactionTypeUpdate } from '@/types/inventory';
import { GLAccount } from '@/types/gl';
import { usePermissions } from '@/hooks/usePermissions';
import { INV_SETUP_MANAGE } from '@/lib/permissions';

interface TransactionTypeFormData {
  name: string;
  description: string;
  base_type: string;
  affects_quantity_direction: 'Increase' | 'Decrease' | 'None';
  default_offsetting_gl_account_id: number | null;
}

const BASE_TYPES = [
  'AdjustmentIncrease',
  'AdjustmentDecrease',
  'WarehouseTransferIn',
  'WarehouseTransferOut',
  'PurchaseReceipt',
  'SalesShipment',
  'ProductionInput',
  'ProductionOutput'
];

const DIRECTION_ICONS = {
  Increase: <ArrowUp className="h-4 w-4 text-green-600" />,
  Decrease: <ArrowDown className="h-4 w-4 text-red-600" />,
  None: <Minus className="h-4 w-4 text-gray-600" />
};

const DIRECTION_COLORS = {
  Increase: 'bg-green-100 text-green-800',
  Decrease: 'bg-red-100 text-red-800', 
  None: 'bg-gray-100 text-gray-800'
};

export default function InventoryTransactionTypesPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingType, setEditingType] = useState<InventoryTransactionType | null>(null);
  const [formData, setFormData] = useState<TransactionTypeFormData>({
    name: '',
    description: '',
    base_type: '',
    affects_quantity_direction: 'None',
    default_offsetting_gl_account_id: null
  });
  const [formErrors, setFormErrors] = useState<string>('');

  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();

  // Check permissions
  if (!hasPermission(INV_SETUP_MANAGE)) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don&apos;t have permission to manage inventory transaction types.</p>
        </div>
      </div>
    );
  }

  // Fetch transaction types
  const { data: transactionTypes = [], isLoading, error } = useQuery({
    queryKey: ['inventoryTransactionTypes'],
    queryFn: () => getInventoryTransactionTypes()
  });

  // Fetch GL accounts
  const { data: glAccounts = [] } = useQuery({
    queryKey: ['glAccounts'],
    queryFn: () => glService.getGLAccounts()
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: createInventoryTransactionType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventoryTransactionTypes'] });
      setIsFormOpen(false);
      resetForm();
      setFormErrors('Transaction type created successfully');
    },
    onError: (error: any) => {
      setFormErrors(`Failed to create transaction type: ${error.response?.data?.detail || error.message}`);
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: InventoryTransactionTypeUpdate }) =>
      updateInventoryTransactionType(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventoryTransactionTypes'] });
      setIsFormOpen(false);
      setEditingType(null);
      resetForm();
      setFormErrors('Transaction type updated successfully');
    },
    onError: (error: any) => {
      setFormErrors(`Failed to update transaction type: ${error.response?.data?.detail || error.message}`);
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteInventoryTransactionType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventoryTransactionTypes'] });
      setFormErrors('Transaction type deleted successfully');
    },
    onError: (error: any) => {
      setFormErrors(`Failed to delete transaction type: ${error.response?.data?.detail || error.message}`);
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      base_type: '',
      affects_quantity_direction: 'None',
      default_offsetting_gl_account_id: null
    });
    setFormErrors('');
  };

  const handleEdit = (type: InventoryTransactionType) => {
    setEditingType(type);
    setFormData({
      name: type.name,
      description: type.description || '',
      base_type: type.base_type,
      affects_quantity_direction: type.affects_quantity_direction,
      default_offsetting_gl_account_id: type.default_offsetting_gl_account_id || null
    });
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.base_type) {
      setFormErrors('Please fill in all required fields');
      return;
    }

    const submitData = {
      ...formData,
      default_offsetting_gl_account_id: formData.default_offsetting_gl_account_id || undefined
    };

    if (editingType) {
      updateMutation.mutate({ id: editingType.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this transaction type?')) {
      deleteMutation.mutate(id);
    }
  };

  const getGLAccountName = (accountId: number | undefined) => {
    if (!accountId) return 'Not Set';
    const account = glAccounts.find(acc => acc.id === accountId);
    return account ? `${account.account_code} - ${account.account_name}` : 'Unknown Account';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory Transaction Types</h1>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory Transaction Types</h1>
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
              <span className="text-red-800">
                Failed to load transaction types: {(error as any).message}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory Transaction Types</h1>
          <p className="text-muted-foreground">
            Configure inventory transaction types and their GL account mappings
          </p>
        </div>
        <Button onClick={() => { setEditingType(null); resetForm(); setIsFormOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Transaction Type
        </Button>
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
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {isFormOpen && (
        <Card className="border-2 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {editingType ? 'Edit Transaction Type' : 'Create Transaction Type'}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsFormOpen(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
            <CardDescription>
              {editingType ? 'Update the transaction type details' : 'Create a new inventory transaction type'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Stock Increase"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g., Increase stock levels"
                />
              </div>

              <div>
                <Label htmlFor="base_type">Base Type *</Label>
                <Select
                  value={formData.base_type}
                  onChange={(e) => setFormData({ ...formData, base_type: e.target.value })}
                  required
                >
                  <option value="">Select base type</option>
                  {BASE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <Label htmlFor="direction">Direction *</Label>
                <Select
                  value={formData.affects_quantity_direction}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    affects_quantity_direction: e.target.value as 'Increase' | 'Decrease' | 'None'
                  })}
                  required
                >
                  <option value="Increase">Increase</option>
                  <option value="Decrease">Decrease</option>
                  <option value="None">None</option>
                </Select>
              </div>

              <div>
                <Label htmlFor="gl_account">GL Account</Label>
                <Select
                  value={formData.default_offsetting_gl_account_id?.toString() || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    default_offsetting_gl_account_id: e.target.value ? parseInt(e.target.value) : null 
                  })}
                >
                  <option value="">No GL Account</option>
                  {glAccounts.map((account) => (
                    <option key={account.id} value={account.id.toString()}>
                      {account.account_code} - {account.account_name}
                    </option>
                  ))}
                </Select>
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
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending ? 'Saving...' : (editingType ? 'Update' : 'Create')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Setup Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Setup Guide - Section 1.3</CardTitle>
          <CardDescription>
            Create the following transaction types as specified in your inventory setup requirements:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="grid gap-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Stock Increase</span>
                <span>AdjustmentIncrease → Increase → Inventory Adjustment</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Stock Decrease</span>
                <span>AdjustmentDecrease → Decrease → Inventory Adjustment</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Damage Write-off</span>
                <span>AdjustmentDecrease → Decrease → Inventory Adjustment</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Found Stock</span>
                <span>AdjustmentIncrease → Increase → Inventory Adjustment</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Types Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction Types</CardTitle>
          <CardDescription>
            Manage inventory transaction types and their configurations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactionTypes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No transaction types configured yet.</p>
              <p className="text-sm text-muted-foreground mt-1">
                Click "Add Transaction Type" to create your first transaction type.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Base Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Direction
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      GL Account
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactionTypes.map((type) => (
                    <tr key={type.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-medium text-gray-900">{type.name}</div>
                          {type.description && (
                            <div className="text-sm text-gray-500">{type.description}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="outline">{type.base_type}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {DIRECTION_ICONS[type.affects_quantity_direction]}
                          <Badge className={DIRECTION_COLORS[type.affects_quantity_direction]}>
                            {type.affects_quantity_direction}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {getGLAccountName(type.default_offsetting_gl_account_id)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(type)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(type.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expected Output Checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span>Expected Output</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">All transaction types listed</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">Direction arrows indicate increase (↑) or decrease (↓)</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">GL accounts displayed</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
