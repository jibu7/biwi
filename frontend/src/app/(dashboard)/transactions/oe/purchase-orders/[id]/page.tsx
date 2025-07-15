'use client';


import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Edit, Save, X, Package, FileText, Trash2 } from 'lucide-react';
import { purchaseOrderService } from '@/services/oeService';
import { PurchaseOrder, PurchaseOrderLine } from '@/types/oe';
import { safeCurrency } from '@/lib/formatters';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function PurchaseOrderDetailPage({ params }: PageProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);

  useEffect(() => {
    params.then(setResolvedParams);
  }, [params]);

  const purchaseOrderId = resolvedParams ? Number(resolvedParams.id) : 0;

  const { data: purchaseOrder, isLoading } = useQuery({
    queryKey: ['purchaseOrder', purchaseOrderId],
    queryFn: () => purchaseOrderService.getById(purchaseOrderId),
    enabled: purchaseOrderId > 0,
  });

  const deleteMutation = useMutation({
    mutationFn: () => purchaseOrderService.delete(purchaseOrderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      router.push('/transactions/oe/purchase-orders');
    },
    onError: (error) => {
      console.error('Failed to delete purchase order:', error);
      alert('Failed to delete purchase order. Please try again.');
    }
  });

  if (!resolvedParams) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-sm text-gray-500">Loading...</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-sm text-gray-500">Loading purchase order...</div>
      </div>
    );
  }

  if (!purchaseOrder) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-sm text-gray-500">Purchase order not found</div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      'DRAFT': 'bg-gray-100 text-gray-800',
      'CONFIRMED': 'bg-blue-100 text-blue-800',
      'RECEIVED': 'bg-yellow-100 text-yellow-800',
      'INVOICED': 'bg-green-100 text-green-800',
      'CANCELLED': 'bg-red-100 text-red-800',
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[status as keyof typeof statusStyles] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  const subtotal = purchaseOrder.lines?.reduce((sum: number, line: PurchaseOrderLine) => sum + (Number(line.line_total) || 0), 0) || 0;

  const handleReceiveGoods = () => {
    router.push(`/transactions/oe/grvs/new?po=${purchaseOrderId}`);
  };

  const handleDelete = () => {
    if (purchaseOrder?.status !== 'DRAFT') {
      alert('Only draft purchase orders can be deleted.');
      return;
    }
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    deleteMutation.mutate();
    setShowDeleteConfirm(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Purchase Order {purchaseOrder.order_number}
            </h1>
            <div className="flex items-center space-x-4 mt-1">
              {getStatusBadge(purchaseOrder.status)}
              <span className="text-sm text-gray-500">
                Created on {new Date(purchaseOrder.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
        <div className="flex space-x-3">
          {purchaseOrder.status === 'CONFIRMED' && (
            <button
              onClick={handleReceiveGoods}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <Package className="h-4 w-4 mr-2" />
              Receive Goods
            </button>
          )}
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {isEditing ? (
              <>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </>
            ) : (
              <>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </>
            )}
          </button>
          {purchaseOrder.status === 'DRAFT' && (
            <button
              onClick={handleDelete}
              className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Header Information */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Order Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Supplier</label>
            <p className="mt-1 text-sm text-gray-900">{purchaseOrder.supplier_name}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Order Date</label>
            <p className="mt-1 text-sm text-gray-900">
              {new Date(purchaseOrder.order_date).toLocaleDateString()}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Supplier Reference</label>
            <p className="mt-1 text-sm text-gray-900">
              {purchaseOrder.supplier_reference || 'N/A'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Currency</label>
            <p className="mt-1 text-sm text-gray-900">{purchaseOrder.currency_code}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Exchange Rate</label>
            <p className="mt-1 text-sm text-gray-900">{purchaseOrder.exchange_rate}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <p className="mt-1">{getStatusBadge(purchaseOrder.status)}</p>
          </div>
        </div>
        {purchaseOrder.notes && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <p className="mt-1 text-sm text-gray-900">{purchaseOrder.notes}</p>
          </div>
        )}
      </div>

      {/* Line Items */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Line Items</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Received
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Discount %
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Line Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {purchaseOrder.lines?.map((line: PurchaseOrderLine) => (
                <tr key={line.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {line.item_code || `Item #${line.item_id}` || 'Unknown Item'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {line.item_description || 'No description available'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {/* display ordered quantity */}
                    {(line as any).quantity_ordered ?? line.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex flex-col">
                      <span>{line.quantity_received || 0}</span>
                      {(line.quantity_received || 0) < (line.quantity || 0) && (
                        <span className="text-xs text-orange-600">
                          Pending: {(line.quantity || 0) - (line.quantity_received || 0)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {safeCurrency(line.unit_price)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {Number(line.discount_percentage) || 0}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {safeCurrency(line.line_total)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {line.notes || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totals */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-end">        <div className="w-64 space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Subtotal:</span>
            <span className="text-sm font-medium">${(Number(purchaseOrder.subtotal) || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Tax:</span>
            <span className="text-sm font-medium">${(Number(purchaseOrder.tax_amount) || 0).toFixed(2)}</span>
          </div>
          <div className="border-t pt-2 flex justify-between">
            <span className="text-base font-medium">Total:</span>
            <span className="text-base font-bold">${(Number(purchaseOrder.total_amount) || 0).toFixed(2)}</span>
          </div>
        </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Actions</h2>
        <div className="flex flex-wrap gap-3">
          {purchaseOrder.status === 'CONFIRMED' && (
            <button
              onClick={handleReceiveGoods}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <Package className="h-4 w-4 mr-2" />
              Receive Goods
            </button>
          )}
          <button
            onClick={() => router.push(`/transactions/oe/grvs?po=${purchaseOrderId}`)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FileText className="h-4 w-4 mr-2" />
            View GRVs
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">Delete Purchase Order</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete this purchase order? This action cannot be undone.
                </p>
              </div>
              <div className="flex justify-center space-x-4 mt-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleteMutation.isPending}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
