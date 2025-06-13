'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Edit, Save, X, FileText, Package } from 'lucide-react';
import { grvService } from '@/services/oeService';
import { GoodsReceivedVoucher, GoodsReceivedVoucherLine } from '@/types/oe';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function GRVDetailPage({ params }: PageProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);
  const [isConvertingToInvoice, setIsConvertingToInvoice] = useState(false);

  useEffect(() => {
    params.then(setResolvedParams);
  }, [params]);

  const grvId = resolvedParams ? Number(resolvedParams.id) : 0;

  const { data: grv, isLoading } = useQuery({
    queryKey: ['grv', grvId],
    queryFn: () => grvService.getById(grvId),
    enabled: grvId > 0,
  });

  const convertToAPInvoiceMutation = useMutation({
    mutationFn: ({ id, details }: { id: number; details: any }) => grvService.convertToAPInvoice(id, details),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grv', grvId] });
      queryClient.invalidateQueries({ queryKey: ['grvs'] });
      setIsConvertingToInvoice(false);
    },
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
        <div className="text-sm text-gray-500">Loading GRV...</div>
      </div>
    );
  }

  if (!grv) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-sm text-gray-500">GRV not found</div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      'DRAFT': 'bg-gray-100 text-gray-800',
      'CONFIRMED': 'bg-blue-100 text-blue-800',
      'INVOICED': 'bg-green-100 text-green-800',
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[status as keyof typeof statusStyles] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  const calculateLineTotal = (line: GoodsReceivedVoucherLine) => {
    return line.quantity_received * line.unit_price;
  };

  const totalAmount = grv.lines?.reduce((sum: number, line: GoodsReceivedVoucherLine) => sum + calculateLineTotal(line), 0) || 0;

  const handleConvertToAPInvoice = async () => {
    const invoiceDetails = {
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days
      reference: `GRV-${grv.grv_number}`,
      description: `AP Invoice from GRV ${grv.grv_number}`,
    };

    if (confirm('Are you sure you want to convert this GRV to an AP invoice? This action cannot be undone.')) {
      setIsConvertingToInvoice(true);
      try {
        await convertToAPInvoiceMutation.mutateAsync({ id: grvId, details: invoiceDetails });
      } catch (error) {
        console.error('Error converting GRV to AP invoice:', error);
        setIsConvertingToInvoice(false);
      }
    }
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
              GRV {grv.grv_number}
            </h1>
            <div className="flex items-center space-x-4 mt-1">
              {getStatusBadge(grv.status)}
              <span className="text-sm text-gray-500">
                Created on {new Date(grv.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
        <div className="flex space-x-3">
          {grv.status === 'CONFIRMED' && (
            <button
              onClick={handleConvertToAPInvoice}
              disabled={isConvertingToInvoice}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileText className="h-4 w-4 mr-2" />
              {isConvertingToInvoice ? 'Converting...' : 'Convert to AP Invoice'}
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
        </div>
      </div>

      {/* Header Information */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">GRV Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Supplier</label>
            <p className="mt-1 text-sm text-gray-900">{grv.supplier_name}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">GRV Date</label>
            <p className="mt-1 text-sm text-gray-900">
              {new Date(grv.grv_date).toLocaleDateString()}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Purchase Order</label>
            <p className="mt-1 text-sm text-gray-900">
              {grv.purchase_order_number ? (
                <span 
                  className="text-blue-600 hover:text-blue-800 cursor-pointer"
                  onClick={() => router.push(`/transactions/oe/purchase-orders/${grv.purchase_order_id}`)}
                >
                  {grv.purchase_order_number}
                </span>
              ) : (
                'Standalone GRV'
              )}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Supplier Delivery Note</label>
            <p className="mt-1 text-sm text-gray-900">
              {grv.supplier_delivery_note || 'N/A'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <p className="mt-1">{getStatusBadge(grv.status)}</p>
          </div>
        </div>
        {grv.notes && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <p className="mt-1 text-sm text-gray-900">{grv.notes}</p>
          </div>
        )}
      </div>

      {/* Line Items */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Items Received</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity Received
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit Price
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
              {grv.lines?.map((line: GoodsReceivedVoucherLine) => (
                <tr key={line.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {line.item_code}
                      </div>
                      <div className="text-sm text-gray-500">
                        {line.item_description}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {line.quantity_received}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${line.unit_price.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${calculateLineTotal(line).toFixed(2)}
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
        <div className="flex justify-end">
          <div className="w-64 space-y-2">
            <div className="border-t pt-2 flex justify-between">
              <span className="text-base font-medium">Total Value:</span>
              <span className="text-base font-bold">${totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Actions</h2>
        <div className="flex flex-wrap gap-3">
          {grv.status === 'CONFIRMED' && (
            <button
              onClick={handleConvertToAPInvoice}
              disabled={isConvertingToInvoice}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileText className="h-4 w-4 mr-2" />
              {isConvertingToInvoice ? 'Converting...' : 'Convert to AP Invoice'}
            </button>
          )}
          {grv.purchase_order_id && (
            <button
              onClick={() => router.push(`/transactions/oe/purchase-orders/${grv.purchase_order_id}`)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Package className="h-4 w-4 mr-2" />
              View Purchase Order
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
