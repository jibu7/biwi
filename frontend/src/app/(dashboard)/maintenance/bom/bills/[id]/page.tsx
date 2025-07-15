'use client';


import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Edit, Trash2, Plus } from 'lucide-react';
import Link from 'next/link';
import { bomService } from '@/services/bomService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable, Column } from '@/components/ui/data-table';
import { BOMComponent } from '@/types/bom';

export default function BOMDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bomId = parseInt(params.id as string);

  const { data: bom, isLoading, error } = useQuery({
    queryKey: ['bom', bomId],
    queryFn: () => bomService.getBOMHeader(bomId),
    enabled: !isNaN(bomId)
  });

  const componentColumns: Column<BOMComponent>[] = [
    {
      accessorKey: 'sequence_number',
      header: 'Seq',
    },
    {
      accessorKey: 'component_item.item_code',
      header: 'Component Item',
    },
    {
      accessorKey: 'component_item.description',
      header: 'Description',
    },
    {
      accessorKey: 'quantity_required',
      header: 'Qty Required',
    },
    {
      accessorKey: 'unit_of_measure.name',
      header: 'UOM',
    },
    {
      accessorKey: 'scrap_percentage',
      header: 'Scrap %',
      cell: ({ row }: { row: { original: BOMComponent } }) => `${row.original.scrap_percentage}%`
    },
    {
      header: 'Phantom',
      cell: ({ row }: { row: { original: BOMComponent } }) => 
        row.original.is_phantom ? <Badge variant="secondary">Yes</Badge> : <Badge variant="outline">No</Badge>
    },
    {
      header: 'Actions',
      cell: ({ row }: { row: { original: BOMComponent } }) => (
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Edit className="h-3 w-3" />
          </Button>
          <Button variant="outline" size="sm" className="text-red-600">
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )
    }
  ];

  if (isLoading) return <div>Loading...</div>;
  if (error || !bom) return <div>Error loading BOM details</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{bom.bom_code}</h1>
            <p className="text-muted-foreground">{bom.description}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Edit className="mr-2 h-4 w-4" />
            Edit BOM
          </Button>
          <Button variant="destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* BOM Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>BOM Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">BOM Code</label>
                <p className="font-medium">{bom.bom_code}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Revision</label>
                <p className="font-medium">{bom.revision}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Parent Item</label>
                <p className="font-medium">{bom.parent_item?.item_code}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <Badge variant={bom.is_active ? "default" : "secondary"}>
                  {bom.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Batch Quantity</label>
                <p className="font-medium">{bom.quantity_per_batch} {bom.unit_of_measure?.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Effective Date</label>
                <p className="font-medium">{new Date(bom.effective_date).toLocaleDateString()}</p>
              </div>
            </div>
            {bom.notes && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Notes</label>
                <p className="text-sm">{bom.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href={`/transactions/bom/manufacturing-orders/new?bomId=${bom.id}`}>
              <Button className="w-full" variant="outline">
                Create Manufacturing Order
              </Button>
            </Link>
            <Link href={`/reports/bom/mrp?bomId=${bom.id}`}>
              <Button className="w-full" variant="outline">
                Run MRP Analysis
              </Button>
            </Link>
            <Button className="w-full" variant="outline">
              Copy BOM
            </Button>
            <Button className="w-full" variant="outline">
              Export BOM
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Components Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Components ({bom.components?.length || 0})</CardTitle>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Component
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {bom.components && bom.components.length > 0 ? (
            <DataTable 
              columns={componentColumns} 
              data={bom.components.sort((a, b) => a.sequence_number - b.sequence_number)} 
            />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No components defined for this BOM
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
