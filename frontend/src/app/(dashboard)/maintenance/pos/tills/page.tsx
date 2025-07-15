'use client';


import { DataTable, Column } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { posService } from '@/services/posService';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Till } from '@/types/pos';

export default function TillsPage() {
  const { data: tills, isLoading } = useQuery({
    queryKey: ['pos-tills'],
    queryFn: () => posService.getTills(),
  });

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
          <Link href={`/maintenance/pos/tills/${row.original.id}`}>
            <Button size="sm" variant="outline">Edit</Button>
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">Tills</h1>
        <Link href="/maintenance/pos/tills/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Till
          </Button>
        </Link>
      </div>

      <DataTable
        columns={columns}
        data={tills?.data || []}
      />
    </div>
  );
}
