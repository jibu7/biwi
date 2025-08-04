'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Plus, Eye, Play, Square, Trash2 } from 'lucide-react';
import { bomService } from '@/services/bomService';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { toast } from 'sonner';

export default function ManufacturingOrdersPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('');

  const { data: orders, isLoading } = useQuery({
    queryKey: ['manufacturing-orders', statusFilter],
    queryFn: () => bomService.getManufacturingOrders({ 
      status: statusFilter || undefined 
    }),
  });

  const releaseOrderMutation = useMutation({
    mutationFn: (orderId: number) => bomService.releaseManufacturingOrder(orderId),
    onSuccess: () => {
      toast.success('Manufacturing order released successfully');
      queryClient.invalidateQueries({ queryKey: ['manufacturing-orders'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to release order');
    },
  });

  const processOrderMutation = useMutation({
    mutationFn: (orderId: number) => bomService.processManufacturingOrder(orderId),
    onSuccess: () => {
      toast.success('Manufacturing order processed successfully');
      queryClient.invalidateQueries({ queryKey: ['manufacturing-orders'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to process order');
    },
  });

  const cancelOrderMutation = useMutation({
    mutationFn: (orderId: number) => bomService.cancelManufacturingOrder(orderId),
    onSuccess: () => {
      toast.success('Manufacturing order cancelled successfully');
      queryClient.invalidateQueries({ queryKey: ['manufacturing-orders'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to cancel order');
    },
  });

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      'Draft': 'bg-gray-100 text-gray-800',
      'Released': 'bg-blue-100 text-blue-800',
      'In Progress': 'bg-yellow-100 text-yellow-800',
      'Completed': 'bg-green-100 text-green-800',
      'Cancelled': 'bg-red-100 text-red-800',
    };
    
    const colorClass = statusColors[status] || 'bg-gray-100 text-gray-800';
    
    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClass}`}>
        {status}
      </span>
    );
  };

  const columns = [
    {
      accessorKey: 'order_number',
      header: 'Order Number',
    },
    {
      accessorKey: 'bom_header.bom_code',
      header: 'BOM Code',
      cell: ({ row }: any) => row.original.bom_header?.bom_code || 'N/A',
    },
    {
      accessorKey: 'bom_header.parent_item.item_code',
      header: 'Item',
      cell: ({ row }: any) => {
        const item = row.original.bom_header?.parent_item;
        return item ? `${item.item_code} - ${item.description}` : 'N/A';
      },
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
      accessorKey: 'warehouse.name',
      header: 'Warehouse',
      cell: ({ row }: any) => row.original.warehouse?.name || 'N/A',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: any) => getStatusBadge(row.original.status),
    },
    {
      accessorKey: 'due_date',
      header: 'Due Date',
      cell: ({ row }: any) => {
        const date = row.original.due_date;
        return date ? new Date(date).toLocaleDateString() : 'No due date';
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: any) => {
        const order = row.original;
        return (
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push(`/transactions/manufacturing/orders/${order.id}`)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            
            {order.status === 'Draft' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => releaseOrderMutation.mutate(order.id)}
                disabled={releaseOrderMutation.isPending}
              >
                <Play className="h-4 w-4" />
              </Button>
            )}
            
            {order.status === 'Released' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => processOrderMutation.mutate(order.id)}
                disabled={processOrderMutation.isPending}
              >
                <Play className="h-4 w-4" />
              </Button>
            )}
            
            {['Draft', 'Released'].includes(order.status) && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (confirm('Are you sure you want to cancel this order?')) {
                    cancelOrderMutation.mutate(order.id);
                  }
                }}
                disabled={cancelOrderMutation.isPending}
              >
                <Square className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manufacturing Orders</h1>
        <Button onClick={() => router.push('/transactions/manufacturing/orders/new')}>
          <Plus className="mr-2 h-4 w-4" />
          New Order
        </Button>
      </div>

      <div className="mb-4 flex space-x-4">
        <div>
          <label className="block text-sm font-medium mb-2">Filter by Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Released">Released</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading manufacturing orders...</div>
      ) : (
        <DataTable columns={columns} data={orders || []} />
      )}
    </div>
  );
}
