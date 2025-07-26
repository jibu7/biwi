'use client';


import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Edit, Save, X, FileText } from 'lucide-react';
import { salesOrderService } from '@/services/oeService';
import { toast } from 'sonner';
import { SalesOrder, SalesOrderLine } from '@/types/oe';
import { safeCurrency } from '@/lib/formatters';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function SalesOrderDetailPage({ params }: PageProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);

  useEffect(() => {
    params.then(setResolvedParams);
  }, [params]);

  const salesOrderId = resolvedParams ? Number(resolvedParams.id) : 0;

  const { data: salesOrder, isLoading } = useQuery({
    queryKey: ['salesOrder', salesOrderId],
    queryFn: () => salesOrderService.getById(salesOrderId),
    enabled: salesOrderId > 0,
  });

  const convertToInvoiceMutation = useMutation({
    mutationFn: salesOrderService.convertToInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salesOrder', salesOrderId] });
      queryClient.invalidateQueries({ queryKey: ['salesOrders'] });
      toast.success('Sales Order converted to Invoice successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to convert sales order');
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
        <div className="text-sm text-gray-500">Loading sales order...</div>
      </div>
    );
  }

  if (!salesOrder) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-sm text-gray-500">Sales order not found.</div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      'DRAFT': 'bg-gray-100 text-gray-800',
      'CONFIRMED': 'bg-blue-100 text-blue-800',
      'INVOICED': 'bg-green-100 text-green-800',
      'CANCELLED': 'bg-red-100 text-red-800',
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[status as keyof typeof statusStyles] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  const handleConvertToInvoice = async () => {
    if (confirm('Are you sure you want to convert this sales order to an invoice?')) {
      await convertToInvoiceMutation.mutateAsync(salesOrder.id);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sales Orders
          </button>
        </div>
        
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Sales Order {salesOrder.document_number}
            </h1>
            <p className="mt-2 text-sm text-gray-700">
              Created on {new Date(salesOrder.order_date).toLocaleDateString()}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {getStatusBadge(salesOrder.status)}
            
            {(salesOrder.status === 'CONFIRMED' || salesOrder.status === 'Open') && (
              <button
                onClick={handleConvertToInvoice}
                disabled={convertToInvoiceMutation.isPending || (salesOrder.status !== 'CONFIRMED' && salesOrder.status !== 'Open')}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                <FileText className="h-4 w-4 mr-2" />
                {convertToInvoiceMutation.isPending ? 'Converting...' : 'Convert to Invoice'}
              </button>
            )}
            
            {!isEditing && salesOrder.status === 'DRAFT' && (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </button>
            )}
            
            {isEditing && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    // Handle save logic here
                    setIsEditing(false);
                  }}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Order Header */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium mb-4">Order Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Customer</label>
            <div className="mt-1 text-sm text-gray-900">{salesOrder.customer_name}</div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Order Date</label>
            <div className="mt-1 text-sm text-gray-900">
              {new Date(salesOrder.order_date).toLocaleDateString()}
            </div>
          </div>
          
          {salesOrder.reference && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Customer PO Reference</label>
              <div className="mt-1 text-sm text-gray-900">{salesOrder.reference}</div>
            </div>
          )}
          
          {salesOrder.sales_representative_name && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Sales Representative</label>
              <div className="mt-1 text-sm text-gray-900">{salesOrder.sales_representative_name}</div>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Currency</label>
            <div className="mt-1 text-sm text-gray-900">{salesOrder.currency_code}</div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Exchange Rate</label>
            <div className="mt-1 text-sm text-gray-900">{salesOrder.exchange_rate}</div>
          </div>
        </div>
        
        {salesOrder.notes && (
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <div className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
              {salesOrder.notes}
            </div>
          </div>
        )}
      </div>

      {/* Line Items */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium mb-4">Line Items</h2>
        
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
                  Unit Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Discount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tax
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
              {salesOrder.lines?.map((line: SalesOrderLine) => (
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
                    {line.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {safeCurrency(line.unit_price)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {line.discount_percentage}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {line.tax_amount ? safeCurrency(line.tax_amount) : 'No Tax'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {safeCurrency(line.line_total)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {line.notes || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Totals */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium mb-4">Order Totals</h2>
        
        <div className="flex justify-end">
          <div className="w-80">
            <div className="flex justify-between py-2">
              <span className="text-sm text-gray-600">Subtotal:</span>
              <span className="text-sm font-medium">
                {safeCurrency(salesOrder.subtotal)}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-sm text-gray-600">Tax:</span>
              <span className="text-sm font-medium">
                {safeCurrency(salesOrder.tax_amount)}
              </span>
            </div>
            <div className="border-t border-gray-200 pt-2">
              <div className="flex justify-between py-2">
                <span className="text-lg font-medium">Total:</span>
                <span className="text-lg font-bold text-blue-600">
                  {safeCurrency(salesOrder.total_amount)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Messages */}
      {convertToInvoiceMutation.isSuccess && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-md p-4">
          <p className="text-sm text-green-800">
            Sales order successfully converted to invoice!
          </p>
        </div>
      )}

      {convertToInvoiceMutation.isError && (
        <div className="mt-6 bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-800">
            Failed to convert sales order to invoice. Please try again.
          </p>
        </div>
      )}
    </div>
  );
}
