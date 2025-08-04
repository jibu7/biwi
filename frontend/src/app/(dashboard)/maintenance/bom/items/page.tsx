'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Calculator, Share2 } from 'lucide-react';
import { bomService } from '@/services/bomService';
import { inventoryService } from '@/services/inventoryService';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function BOMListPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedItem, setSelectedItem] = useState<number | null>(null);

  const { data: boms, isLoading } = useQuery({
    queryKey: ['boms'],
    queryFn: () => bomService.getBOMs(),
  });

  const calculateCostMutation = useMutation({
    mutationFn: (bomId: number) => bomService.calculateBOMCost(bomId),
    onSuccess: () => {
      toast.success("Cost calculation completed");
      queryClient.invalidateQueries({ queryKey: ['boms'] });
    },
  });

  const columns = [
    {
      accessorKey: 'item_code',
      header: 'Item Code',
    },
    {
      accessorKey: 'item_description',
      header: 'Description',
    },
    {
      accessorKey: 'version',
      header: 'Version',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: any) => (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
          row.original.status === 'Active' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-gray-100 text-gray-800'
        }`}>
          {row.original.status}
        </span>
      ),
    },
    {
      accessorKey: 'total_cost',
      header: 'Total Cost',
      cell: ({ row }: any) => `$${row.original.total_cost?.toFixed(2) || '0.00'}`,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: any) => (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push(`/maintenance/bom/items/${row.original.id}`)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => calculateCostMutation.mutate(row.original.id)}
          >
            <Calculator className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push(`/maintenance/bom/items/${row.original.id}/explode`)}
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Bill of Materials</h1>
        <Button onClick={() => router.push('/maintenance/bom/items/new')}>
          <Plus className="mr-2 h-4 w-4" />
          New BOM
        </Button>
      </div>

      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <DataTable columns={columns} data={boms || []} />
      )}
    </div>
  );
}
