'use client';


import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, Package, Warehouse, Calendar, DollarSign } from 'lucide-react';
import { getInventoryTransaction } from '@/services/inventoryService';
import { safeCurrency, formatDate } from '@/lib/formatters';

export default function InventoryAdjustmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const adjustmentId = Number(params.id);

  const { data: adjustment, isLoading, error } = useQuery({
    queryKey: ['inventory-transaction', adjustmentId],
    queryFn: () => getInventoryTransaction(adjustmentId),
    enabled: !!adjustmentId,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !adjustment) {
    return (
      <div className="container mx-auto py-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Adjustment</h2>
          <p className="text-red-600">
            {error?.message || 'The requested inventory adjustment could not be found.'}
          </p>
          <Button 
            onClick={() => router.push('/transactions/inventory/adjustments')}
            className="mt-4"
            variant="outline"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Adjustments
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button
            onClick={() => router.push('/transactions/inventory/adjustments')}
            variant="outline"
            size="sm"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Adjustments
          </Button>
          <h1 className="text-3xl font-bold">Inventory Adjustment #{adjustment.id}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transaction Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Transaction Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Transaction ID</label>
                <p className="text-lg font-semibold">#{adjustment.id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Date</label>
                <p className="flex items-center">
                  <Calendar className="mr-1 h-4 w-4 text-gray-400" />
                  {formatDate(adjustment.transaction_date)}
                </p>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Transaction Type</label>
              <p className="text-lg">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  adjustment.transaction_type.base_type === 'AdjustmentIncrease' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {adjustment.transaction_type.name}
                </span>
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Reason</label>
              <p className="text-gray-900">{adjustment.notes || 'No reason provided'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Item & Warehouse Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="mr-2 h-5 w-5" />
              Item & Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Item</label>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="font-semibold">{adjustment.item.item_code}</p>
                <p className="text-sm text-gray-600">{adjustment.item.description}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {adjustment.item.item_type} • {adjustment.item.unit_of_measure?.name}
                </p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Warehouse</label>
              <div className="flex items-center bg-gray-50 rounded-lg p-3">
                <Warehouse className="mr-2 h-4 w-4 text-gray-400" />
                <div>
                  <p className="font-semibold">{adjustment.warehouse.name}</p>
                  <p className="text-sm text-gray-600">{adjustment.warehouse.location}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financial Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="mr-2 h-5 w-5" />
              Financial Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <label className="text-sm font-medium text-blue-700">Quantity</label>
                <p className="text-2xl font-bold text-blue-900">
                  {adjustment.quantity} {adjustment.item.unit_of_measure?.abbreviation}
                </p>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4">
                <label className="text-sm font-medium text-green-700">Unit Cost</label>
                <p className="text-2xl font-bold text-green-900">
                  {safeCurrency(adjustment.unit_cost)}
                </p>
              </div>
              
              <div className="bg-purple-50 rounded-lg p-4">
                <label className="text-sm font-medium text-purple-700">Total Value</label>
                <p className="text-2xl font-bold text-purple-900">
                  {safeCurrency(adjustment.total_value)}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-sm font-medium text-gray-700">GL Entry</label>
                <p className="text-sm text-gray-900">
                  {adjustment.linked_gl_journal_entry_id ? (
                    <span className="text-green-600">
                      ✓ Posted (#{adjustment.linked_gl_journal_entry_id})
                    </span>
                  ) : (
                    <span className="text-gray-500">Not posted</span>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
