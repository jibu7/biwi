'use client';


import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { bomService } from '@/services/bomService';
import { Button } from '@/components/ui/button';
import { DataTable, Column } from '@/components/ui/data-table';
import { BOMHeader } from '@/types/bom';

export default function BOMListPage() {
  const { data: boms, isLoading } = useQuery({
    queryKey: ['boms'],
    queryFn: () => bomService.getBOMHeaders()
  });

  const columns: Column<BOMHeader>[] = [
    {
      accessorKey: 'bom_code',
      header: 'BOM Code',
    },
    {
      accessorKey: 'parent_item.item_code',
      header: 'Parent Item',
    },
    {
      accessorKey: 'description',
      header: 'Description',
    },
    {
      accessorKey: 'revision',
      header: 'Revision',
    },
    {
      accessorKey: 'quantity_per_batch',
      header: 'Batch Qty',
    },
    {
      header: 'Active',
      cell: ({ row }: { row: { original: BOMHeader } }) => row.original.is_active ? 'Yes' : 'No'
    },
    {
      header: 'Actions',
      cell: ({ row }: { row: { original: BOMHeader } }) => (
        <div className="flex gap-2">
          <Link href={`/maintenance/bom/bills/${row.original.id}`}>
            <Button variant="outline" size="sm">View</Button>
          </Link>
        </div>
      )
    }
  ];

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Bill of Materials</h1>
        <Link href="/maintenance/bom/bills/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New BOM
          </Button>
        </Link>
      </div>

      <DataTable columns={columns} data={boms || []} />
    </div>
  );
}
