'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { platformService } from '@/services/platformService';
import { FeatureFlagCard } from '@/components/platform/FeatureFlagCard';
import { NewFeatureFlagDialog } from '@/components/platform/NewFeatureFlagDialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function FeatureFlagsPage() {
  const [showNewDialog, setShowNewDialog] = useState(false);
  const queryClient = useQueryClient();

  const { data: features, isLoading } = useQuery({
    queryKey: ['feature-flags'],
    queryFn: platformService.getFeatureFlags,
  });

  const updateMutation = useMutation({
    mutationFn: ({ name, data }: { name: string; data: any }) => platformService.updateFeatureFlag(name, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
    },
  });

  if (isLoading) {
    return <div>Loading feature flags...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Feature Flags</h1>
        <Button onClick={() => setShowNewDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Feature Flag
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {features?.map((feature: any) => (
          <FeatureFlagCard
            key={feature.name}
            feature={feature}
            onUpdate={(data: any) => updateMutation.mutate({ name: feature.name, data })}
          />
        ))}
      </div>

      <NewFeatureFlagDialog
        open={showNewDialog}
        onOpenChange={setShowNewDialog}
      />
    </div>
  );
}
