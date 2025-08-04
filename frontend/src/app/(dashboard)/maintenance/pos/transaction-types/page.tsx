'use client';

import { useState } from 'react';
import { DataTable, Column } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { posService } from '@/services/posService';
import { Plus, Edit } from 'lucide-react';
import { POSTransactionType, POSTransactionTypeCreate, POSTransactionTypeUpdate } from '@/types/pos';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

export default function TransactionTypesPage() {
  const [editingType, setEditingType] = useState<POSTransactionType | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<POSTransactionTypeCreate>({
    type_code: '',
    name: '',
    is_sale: true,
    is_return: false,
    is_active: true,
  });

  const queryClient = useQueryClient();

  const { data: transactionTypes, isLoading } = useQuery({
    queryKey: ['pos-transaction-types'],
    queryFn: () => posService.getTransactionTypes(),
  });

  const createMutation = useMutation({
    mutationFn: (data: POSTransactionTypeCreate) => posService.createTransactionType(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pos-transaction-types'] });
      toast.success('Transaction type created successfully');
      setDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast.error('Failed to create transaction type');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: POSTransactionTypeUpdate }) => 
      posService.updateTransactionType(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pos-transaction-types'] });
      toast.success('Transaction type updated successfully');
      setDialogOpen(false);
      setEditingType(null);
      resetForm();
    },
    onError: () => {
      toast.error('Failed to update transaction type');
    },
  });

  const handleEdit = (type: POSTransactionType) => {
    setEditingType(type);
    setFormData({
      type_code: type.type_code,
      name: type.name,
      is_sale: type.is_sale,
      is_return: type.is_return,
      gl_revenue_account_id: type.gl_revenue_account_id,
      gl_cost_account_id: type.gl_cost_account_id,
      is_active: type.is_active,
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingType) {
      updateMutation.mutate({ id: editingType.id, data: formData as POSTransactionTypeUpdate });
    } else {
      createMutation.mutate(formData);
    }
  };

  const resetForm = () => {
    setFormData({
      type_code: '',
      name: '',
      is_sale: true,
      is_return: false,
      is_active: true,
    });
  };

  const handleOpenDialog = () => {
    setEditingType(null);
    resetForm();
    setDialogOpen(true);
  };

  const columns: Column<POSTransactionType>[] = [
    { accessorKey: 'type_code', header: 'Code' },
    { accessorKey: 'name', header: 'Name' },
    { 
      accessorKey: 'is_sale', 
      header: 'Sale',
      cell: ({ row }) => (
        <span className={`px-2 py-1 rounded-full text-xs ${
          row.original.is_sale ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {row.original.is_sale ? 'Yes' : 'No'}
        </span>
      )
    },
    { 
      accessorKey: 'is_return', 
      header: 'Return',
      cell: ({ row }) => (
        <span className={`px-2 py-1 rounded-full text-xs ${
          row.original.is_return ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {row.original.is_return ? 'Yes' : 'No'}
        </span>
      )
    },
    { accessorKey: 'gl_revenue_account_name', header: 'Revenue Account' },
    { accessorKey: 'gl_cost_account_name', header: 'Cost Account' },
    { 
      accessorKey: 'is_active', 
      header: 'Status',
      cell: ({ row }) => (
        <span className={`px-2 py-1 rounded-full text-xs ${
          row.original.is_active 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {row.original.is_active ? 'Active' : 'Inactive'}
        </span>
      )
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => handleEdit(row.original)}
          >
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">Transaction Types</h1>
        <Button onClick={handleOpenDialog}>
          <Plus className="mr-2 h-4 w-4" />
          New Transaction Type
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingType ? 'Edit Transaction Type' : 'Create New Transaction Type'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="type_code">Type Code</Label>
              <Input
                id="type_code"
                value={formData.type_code}
                onChange={(e) => setFormData({ ...formData, type_code: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_sale"
                  checked={formData.is_sale || false}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_sale: checked })}
                />
                <Label htmlFor="is_sale">Is Sale</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_return"
                  checked={formData.is_return || false}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_return: checked })}
                />
                <Label htmlFor="is_return">Is Return</Label>
              </div>
            </div>
            <div>
              <Label htmlFor="gl_revenue_account_id">Revenue GL Account ID</Label>
              <Input
                id="gl_revenue_account_id"
                type="number"
                value={formData.gl_revenue_account_id || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  gl_revenue_account_id: e.target.value ? parseInt(e.target.value) : undefined 
                })}
              />
            </div>
            <div>
              <Label htmlFor="gl_cost_account_id">Cost GL Account ID</Label>
              <Input
                id="gl_cost_account_id"
                type="number"
                value={formData.gl_cost_account_id || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  gl_cost_account_id: e.target.value ? parseInt(e.target.value) : undefined 
                })}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active || false}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingType ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <DataTable
        columns={columns}
        data={transactionTypes?.data || []}
      />
    </div>
  );
}
