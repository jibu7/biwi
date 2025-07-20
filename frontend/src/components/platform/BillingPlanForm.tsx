'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, EnhancedSelect } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BillingPlan, CreateBillingPlan, UpdateBillingPlan } from '@/types/platform';

interface BillingPlanFormProps {
  plan?: BillingPlan | null;
  onSubmit: (data: CreateBillingPlan | UpdateBillingPlan) => void;
  onCancel: () => void;
}

export function BillingPlanForm({ plan, onSubmit, onCancel }: BillingPlanFormProps) {
  const [formData, setFormData] = useState({
    name: plan?.name || '',
    plan_type: plan?.plan_type || 'basic',
    monthly_price: plan?.monthly_price || 0,
    yearly_price: plan?.yearly_price || 0,
    max_users: plan?.max_users || '',
    max_storage_gb: plan?.max_storage_gb || '',
    features: plan?.features?.join('\n') || '',
    is_active: plan?.is_active ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      name: formData.name,
      plan_type: formData.plan_type as 'basic' | 'pro' | 'enterprise' | 'custom',
      monthly_price: Number(formData.monthly_price),
      yearly_price: formData.yearly_price ? Number(formData.yearly_price) : undefined,
      max_users: formData.max_users ? Number(formData.max_users) : undefined,
      max_storage_gb: formData.max_storage_gb ? Number(formData.max_storage_gb) : undefined,
      features: formData.features.split('\n').filter(f => f.trim()),
      is_active: formData.is_active,
    };

    onSubmit(data);
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>{plan ? 'Edit Billing Plan' : 'Create New Billing Plan'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Plan Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan_type">Plan Type</Label>
              <EnhancedSelect
                value={formData.plan_type}
                onValueChange={(value: string) => setFormData({ ...formData, plan_type: value as 'basic' | 'pro' | 'enterprise' | 'custom' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </EnhancedSelect>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="monthly_price">Monthly Price ($)</Label>
              <Input
                id="monthly_price"
                type="number"
                step="0.01"
                value={formData.monthly_price}
                onChange={(e) => setFormData({ ...formData, monthly_price: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="yearly_price">Yearly Price ($)</Label>
              <Input
                id="yearly_price"
                type="number"
                step="0.01"
                value={formData.yearly_price}
                onChange={(e) => setFormData({ ...formData, yearly_price: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="max_users">Max Users (leave empty for unlimited)</Label>
              <Input
                id="max_users"
                type="number"
                value={formData.max_users}
                onChange={(e) => setFormData({ ...formData, max_users: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_storage_gb">Max Storage (GB)</Label>
              <Input
                id="max_storage_gb"
                type="number"
                value={formData.max_storage_gb}
                onChange={(e) => setFormData({ ...formData, max_storage_gb: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="features">Features (one per line)</Label>
            <Textarea
              id="features"
              value={formData.features}
              onChange={(e) => setFormData({ ...formData, features: e.target.value })}
              rows={5}
              placeholder="Enter features, one per line"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label htmlFor="is_active">Active</Label>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">
              {plan ? 'Update Plan' : 'Create Plan'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
