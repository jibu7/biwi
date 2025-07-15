'use client';


import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable, Column } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import { Plus, Edit, Trash2, CreditCard } from 'lucide-react';

interface TransactionType {
  id: string;
  name: string;
  code: string;
  description: string;
  is_active: boolean;
  requires_reference: boolean;
}

export default function TransactionTypesPage() {
  const [transactionTypes] = useState<TransactionType[]>([
    {
      id: '1',
      name: 'Cash',
      code: 'CASH',
      description: 'Cash payment',
      is_active: true,
      requires_reference: false,
    },
    {
      id: '2',
      name: 'Credit Card',
      code: 'CARD',
      description: 'Credit/Debit card payment',
      is_active: true,
      requires_reference: true,
    },
    {
      id: '3',
      name: 'Mobile Payment',
      code: 'MOBILE',
      description: 'Mobile payment (Apple Pay, Google Pay, etc.)',
      is_active: true,
      requires_reference: true,
    },
    {
      id: '4',
      name: 'Gift Card',
      code: 'GIFT',
      description: 'Gift card payment',
      is_active: true,
      requires_reference: true,
    },
  ]);

  const columns: Column<TransactionType>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-gray-500" />
          <span className="font-medium">{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: 'code',
      header: 'Code',
      cell: ({ row }) => (
        <span className="font-mono bg-gray-100 px-2 py-1 rounded">
          {row.original.code}
        </span>
      ),
    },
    {
      accessorKey: 'description',
      header: 'Description',
    },
    {
      accessorKey: 'requires_reference',
      header: 'Requires Reference',
      cell: ({ row }) => (
        <span className={`px-2 py-1 rounded-full text-xs ${
          row.original.requires_reference 
            ? 'bg-yellow-100 text-yellow-700' 
            : 'bg-gray-100 text-gray-700'
        }`}>
          {row.original.requires_reference ? 'Yes' : 'No'}
        </span>
      ),
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ row }) => (
        <span className={`px-2 py-1 rounded-full text-xs ${
          row.original.is_active 
            ? 'bg-green-100 text-green-700' 
            : 'bg-red-100 text-red-700'
        }`}>
          {row.original.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="p-2">
            <Edit className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="outline" className="p-2">
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">Transaction Types</h1>
          <p className="text-gray-600">Manage payment methods and transaction types</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Transaction Type
        </Button>
      </div>

      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Payment Methods</h2>
          <div className="flex gap-4">
            <Input 
              placeholder="Search transaction types..." 
              className="w-64"
            />
          </div>
        </div>
        
        <DataTable
          columns={columns}
          data={transactionTypes}
        />
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Configuration Notes</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <p>• <strong>Requires Reference:</strong> Payment methods that need additional information (card numbers, mobile payment IDs, etc.)</p>
          <p>• <strong>Active Status:</strong> Only active payment methods will be available in the POS terminal</p>
          <p>• <strong>Codes:</strong> Used for reporting and integration purposes - should be unique</p>
        </div>
      </Card>
    </div>
  );
}
