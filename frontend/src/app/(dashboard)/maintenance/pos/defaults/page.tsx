'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { posService } from '@/services/posService';
import { POSDefaults, POSDefaultsUpdate } from '@/types/pos';
import { toast } from 'sonner';

export default function POSDefaultsPage() {
  const [formData, setFormData] = useState<POSDefaultsUpdate>({
    auto_print_receipt: false,
  });

  const queryClient = useQueryClient();

  const { data: defaults, isLoading } = useQuery({
    queryKey: ['pos-defaults'],
    queryFn: () => posService.getPOSDefaults(),
  });

  useEffect(() => {
    if (defaults?.data) {
      setFormData({
        default_warehouse_id: defaults.data.default_warehouse_id,
        default_customer_id: defaults.data.default_customer_id,
        default_sale_transaction_type_id: defaults.data.default_sale_transaction_type_id,
        default_return_transaction_type_id: defaults.data.default_return_transaction_type_id,
        receipt_header: defaults.data.receipt_header || '',
        receipt_footer: defaults.data.receipt_footer || '',
        auto_print_receipt: defaults.data.auto_print_receipt,
      });
    }
  }, [defaults]);

  const updateMutation = useMutation({
    mutationFn: (data: POSDefaultsUpdate) => posService.updatePOSDefaults(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pos-defaults'] });
      toast.success('POS defaults updated successfully');
    },
    onError: () => {
      toast.error('Failed to update POS defaults');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">POS Defaults Configuration</h1>
        <p className="text-muted-foreground">
          Configure default settings for your point of sale system
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Default Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="default_warehouse_id">Default Warehouse ID</Label>
                <Input
                  id="default_warehouse_id"
                  type="number"
                  value={formData.default_warehouse_id || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    default_warehouse_id: e.target.value ? parseInt(e.target.value) : undefined 
                  })}
                />
                {defaults?.data.default_warehouse_name && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Current: {defaults.data.default_warehouse_name}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="default_customer_id">Default Customer ID</Label>
                <Input
                  id="default_customer_id"
                  type="number"
                  value={formData.default_customer_id || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    default_customer_id: e.target.value ? parseInt(e.target.value) : undefined 
                  })}
                />
                {defaults?.data.default_customer_name && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Current: {defaults.data.default_customer_name}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="default_sale_transaction_type_id">Default Sale Transaction Type ID</Label>
                <Input
                  id="default_sale_transaction_type_id"
                  type="number"
                  value={formData.default_sale_transaction_type_id || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    default_sale_transaction_type_id: e.target.value ? parseInt(e.target.value) : undefined 
                  })}
                />
                {defaults?.data.default_sale_transaction_type_name && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Current: {defaults.data.default_sale_transaction_type_name}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="default_return_transaction_type_id">Default Return Transaction Type ID</Label>
                <Input
                  id="default_return_transaction_type_id"
                  type="number"
                  value={formData.default_return_transaction_type_id || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    default_return_transaction_type_id: e.target.value ? parseInt(e.target.value) : undefined 
                  })}
                />
                {defaults?.data.default_return_transaction_type_name && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Current: {defaults.data.default_return_transaction_type_name}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="receipt_header">Receipt Header</Label>
              <Textarea
                id="receipt_header"
                value={formData.receipt_header || ''}
                onChange={(e) => setFormData({ ...formData, receipt_header: e.target.value })}
                placeholder="Enter custom header text for receipts..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="receipt_footer">Receipt Footer</Label>
              <Textarea
                id="receipt_footer"
                value={formData.receipt_footer || ''}
                onChange={(e) => setFormData({ ...formData, receipt_footer: e.target.value })}
                placeholder="Enter custom footer text for receipts..."
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="auto_print_receipt"
                checked={formData.auto_print_receipt || false}
                onCheckedChange={(checked) => setFormData({ ...formData, auto_print_receipt: checked })}
              />
              <Label htmlFor="auto_print_receipt">Auto Print Receipt</Label>
              <p className="text-sm text-muted-foreground">
                Automatically print receipts after completing transactions
              </p>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Saving...' : 'Save Defaults'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {defaults?.data && (
        <Card>
          <CardHeader>
            <CardTitle>Current Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Default Warehouse:</strong> {defaults.data.default_warehouse_name || 'Not set'}
              </div>
              <div>
                <strong>Default Customer:</strong> {defaults.data.default_customer_name || 'Not set'}
              </div>
              <div>
                <strong>Sale Transaction Type:</strong> {defaults.data.default_sale_transaction_type_name || 'Not set'}
              </div>
              <div>
                <strong>Return Transaction Type:</strong> {defaults.data.default_return_transaction_type_name || 'Not set'}
              </div>
              <div>
                <strong>Auto Print Receipt:</strong> {defaults.data.auto_print_receipt ? 'Yes' : 'No'}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
