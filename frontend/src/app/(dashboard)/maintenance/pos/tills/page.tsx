'use client';

import { useState } from 'react';
import { DataTable, Column } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { posService } from '@/services/posService';
import Link from 'next/link';
import { Plus, Edit } from 'lucide-react';
import { Till, TillCreate, TillUpdate } from '@/types/pos';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

export default function TillsPage() {
  const [editingTill, setEditingTill] = useState<Till | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<TillCreate>({
    till_code: '',
    name: '',
    warehouse_id: 0,
    gl_cash_account_id: 0,
    is_active: true,
  });

  const queryClient = useQueryClient();

  const { data: tills, isLoading } = useQuery({
    queryKey: ['pos-tills'],
    queryFn: () => posService.getTills(),
  });

  const createMutation = useMutation({
    mutationFn: (data: TillCreate) => posService.createTill(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pos-tills'] });
      toast.success('Till created successfully');
      setDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast.error('Failed to create till');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: TillUpdate }) => 
      posService.updateTill(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pos-tills'] });
      toast.success('Till updated successfully');
      setDialogOpen(false);
      setEditingTill(null);
      resetForm();
    },
    onError: () => {
      toast.error('Failed to update till');
    },
  });

  const handleEdit = (till: Till) => {
    setEditingTill(till);
    setFormData({
      till_code: till.till_code,
      name: till.name,
      warehouse_id: till.warehouse_id,
      gl_cash_account_id: till.gl_cash_account_id,
      is_active: till.is_active,
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTill) {
      updateMutation.mutate({ id: editingTill.id, data: formData as TillUpdate });
    } else {
      createMutation.mutate(formData);
    }
  };

  const resetForm = () => {
    setFormData({
      till_code: '',
      name: '',
      warehouse_id: 0,
      gl_cash_account_id: 0,
      is_active: true,
    });
  };

  const handleOpenDialog = () => {
    setEditingTill(null);
    resetForm();
    setDialogOpen(true);
  };

  const columns: Column<Till>[] = [
    { accessorKey: 'till_code', header: 'Till Code' },
    { accessorKey: 'name', header: 'Till Name' },
    { accessorKey: 'warehouse_name', header: 'Warehouse' },
    { accessorKey: 'gl_cash_account_name', header: 'Cash Account' },
    { 
      accessorKey: 'is_active', 
      header: 'Active',
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
        <h1 className="text-2xl font-bold">Tills</h1>
        <Button onClick={handleOpenDialog}>
          <Plus className="mr-2 h-4 w-4" />
          New Till
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTill ? 'Edit Till' : 'Create New Till'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="till_code">Till Code</Label>
              <Input
                id="till_code"
                value={formData.till_code}
                onChange={(e) => setFormData({ ...formData, till_code: e.target.value })}
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
            <div>
              <Label htmlFor="warehouse_id">Warehouse ID</Label>
              <Input
                id="warehouse_id"
                type="number"
                value={formData.warehouse_id}
                onChange={(e) => setFormData({ ...formData, warehouse_id: parseInt(e.target.value) || 0 })}
                required
              />
            </div>
            <div>
              <Label htmlFor="gl_cash_account_id">Cash GL Account ID</Label>
              <Input
                id="gl_cash_account_id"
                type="number"
                value={formData.gl_cash_account_id}
                onChange={(e) => setFormData({ ...formData, gl_cash_account_id: parseInt(e.target.value) || 0 })}
                required
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
                {editingTill ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <DataTable
        columns={columns}
        data={tills?.data || []}
      />
    </div>
  );
}
