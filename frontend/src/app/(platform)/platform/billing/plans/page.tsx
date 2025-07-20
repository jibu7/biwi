'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { platformService } from '@/services/platformService';
import { BillingPlanForm } from '@/components/platform/BillingPlanForm';
import { BillingPlan } from '@/types/platform';
import { Plus } from 'lucide-react';

export default function BillingPlansPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<BillingPlan | null>(null);
  const queryClient = useQueryClient();

  const { data: plans, isLoading } = useQuery({
    queryKey: ['billing-plans'],
    queryFn: platformService.getBillingPlans,
  });

  const createMutation = useMutation({
    mutationFn: platformService.createBillingPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing-plans'] });
      setShowForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      platformService.updateBillingPlan(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing-plans'] });
      setEditingPlan(null);
    },
  });

  const columns = [
    {
      accessorKey: 'name',
      header: 'Plan Name',
    },
    {
      accessorKey: 'plan_type',
      header: 'Type',
    },
    {
      accessorKey: 'monthly_price',
      header: 'Monthly Price',
      cell: ({ row }: { row: { original: BillingPlan } }) => `$${row.original.monthly_price}`,
    },
    {
      accessorKey: 'max_users',
      header: 'User Limit',
      cell: ({ row }: { row: { original: BillingPlan } }) => row.original.max_users || 'Unlimited',
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ row }: { row: { original: BillingPlan } }) => (
        <span className={row.original.is_active ? 'text-green-600' : 'text-gray-500'}>
          {row.original.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: { row: { original: BillingPlan } }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setEditingPlan(row.original)}
        >
          Edit
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Billing Plans</h1>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Plan
        </Button>
      </div>

      {(showForm || editingPlan) && (
        <BillingPlanForm
          plan={editingPlan}
          onSubmit={(data: any) => {
            if (editingPlan) {
              updateMutation.mutate({ id: editingPlan.id, data });
            } else {
              createMutation.mutate(data);
            }
          }}
          onCancel={() => {
            setShowForm(false);
            setEditingPlan(null);
          }}
        />
      )}

      <DataTable
        columns={columns}
        data={plans || []}
      />
    </div>
  );
}
