'use client';


import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Play, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { bomService } from '@/services/bomService';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Select } from '@/components/ui/select';

export default function ManufacturingOrdersPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const queryClient = useQueryClient();

  const { data: orders, isLoading } = useQuery({
    queryKey: ['manufacturing-orders', statusFilter],
    queryFn: () => bomService.getManufacturingOrders(statusFilter || undefined)
  });

  const releaseMutation = useMutation({
    mutationFn: bomService.releaseManufacturingOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manufacturing-orders'] });
    }
  });

  const processMutation = useMutation({
    mutationFn: bomService.processManufacturingOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manufacturing-orders'] });
    }
  });

  const columns = [
    {
      accessorKey: 'order_number',
      header: 'Order Number',
    },
    {
      accessorKey: 'bom_header.bom_code',
      header: 'BOM Code',
    },
    {
      accessorKey: 'quantity_to_manufacture',
      header: 'Qty to Manufacture',
    },
    {
      accessorKey: 'quantity_completed',
      header: 'Qty Completed',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: { row: { original: any } }) => (
        <span className={`px-2 py-1 rounded text-xs ${
          row.original.status === 'Completed' ? 'bg-green-100 text-green-800' :
          row.original.status === 'Released' ? 'bg-blue-100 text-blue-800' :
          row.original.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {row.original.status}
        </span>
      )
    },
    {
      accessorKey: 'due_date',
      header: 'Due Date',
      cell: ({ row }: { row: { original: any } }) => row.original.due_date ? 
        new Date(row.original.due_date).toLocaleDateString() : '-'
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: { row: { original: any } }) => (
        <div className="flex gap-2">
          {row.original.status === 'Planned' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => releaseMutation.mutate(row.original.id)}
              disabled={releaseMutation.isPending}
            >
              <Play className="h-4 w-4" />
              Release
            </Button>
          )}
          {row.original.status === 'Released' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => processMutation.mutate(row.original.id)}
              disabled={processMutation.isPending}
            >
              <CheckCircle className="h-4 w-4" />
              Process
            </Button>
          )}
        </div>
      )
    }
  ];

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Manufacturing Orders</h1>
        <div className="flex gap-4">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="Planned">Planned</option>
            <option value="Released">Released</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </Select>
          <Link href="/transactions/bom/manufacturing-orders/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Order
            </Button>
          </Link>
        </div>
      </div>

      <DataTable columns={columns} data={orders || []} />
    </div>
  );
}
