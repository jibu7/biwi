'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { platformService } from '@/services/platformService';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface NewFeatureFlagDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewFeatureFlagDialog({ open, onOpenChange }: NewFeatureFlagDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_enabled_globally: false,
    rollout_percentage: 0,
  });

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: platformService.createFeatureFlag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
      onOpenChange(false);
      setFormData({
        name: '',
        description: '',
        is_enabled_globally: false,
        rollout_percentage: 0,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: string | boolean | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Feature Flag</DialogTitle>
          <p className="text-sm text-gray-600 mt-2">
            Add a new feature flag to control feature rollouts across your platform.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Feature Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Feature Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g., advanced_analytics"
              required
            />
            <p className="text-xs text-gray-500">
              Use lowercase letters and underscores only
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe what this feature does..."
              rows={3}
            />
          </div>

          {/* Global Enable */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="global-enable">Enable Globally</Label>
              <p className="text-xs text-gray-500">
                Enable this feature for all companies immediately
              </p>
            </div>
            <Switch
              id="global-enable"
              checked={formData.is_enabled_globally}
              onCheckedChange={(checked) => handleInputChange('is_enabled_globally', checked)}
            />
          </div>

          {/* Rollout Percentage */}
          {!formData.is_enabled_globally && (
            <div className="space-y-2">
              <Label htmlFor="rollout">Initial Rollout Percentage</Label>
              <div className="space-y-2">
                <input
                  type="range"
                  id="rollout"
                  min="0"
                  max="100"
                  step="5"
                  value={formData.rollout_percentage}
                  onChange={(e) => handleInputChange('rollout_percentage', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>0%</span>
                  <span className="font-medium">{formData.rollout_percentage}%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!formData.name || createMutation.isPending}
            >
              {createMutation.isPending ? 'Creating...' : 'Create Feature Flag'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
