'use client';


import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { 
  Plus, 
  Search, 
  Edit, 
  Eye,
  FileText,
  Calendar
} from 'lucide-react';
import { salesOrderService } from '@/services/oeService';
import { customerService } from '@/services/arService';
import { SalesOrder } from '@/types/oe';
import { safeCurrency } from '@/lib/formatters';
import { toast } from 'sonner';

export default function SalesOrdersPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<number | ''>('');
  const [selectedStatus, setSelectedStatus] = useState<string | ''>('');

  const { data: salesOrders = [], isLoading } = useQuery({
    queryKey: ['salesOrders'],
    queryFn: () => salesOrderService.getAll(),
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customerService.getAll(),
  });

  const convertToInvoiceMutation = useMutation({
    mutationFn: salesOrderService.convertToInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salesOrders'] });
      toast.success('Sales Order converted to Invoice successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to convert sales order');
    },
  });

  const filteredSalesOrders = useMemo(() => {
    return salesOrders.filter((order) => {
      const matchesSearch = 
        (order.document_number && order.document_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (order.customer_name && order.customer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (order.reference && order.reference.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCustomer = selectedCustomer === '' || order.customer_id === selectedCustomer;
      const matchesStatus = selectedStatus === '' || order.status === selectedStatus;
      
      return matchesSearch && matchesCustomer && matchesStatus;
    });
  }, [salesOrders, searchTerm, selectedCustomer, selectedStatus]);

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

  const handleConvertToInvoice = async (orderId: number) => {
    if (confirm('Are you sure you want to convert this sales order to an invoice?')) {
      await convertToInvoiceMutation.mutateAsync(orderId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Orders</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage customer sales orders and track their progress.
          </p>
        </div>
        <Link
          href="/transactions/oe/sales-orders/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Sales Order
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Search</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                placeholder="Search orders, customers, or PO references..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Customer</label>
            <select
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value === '' ? '' : Number(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">All Customers</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="INVOICED">Invoiced</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sales Orders Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Amount
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="text-sm text-gray-500">Loading sales orders...</div>
                  </td>
                </tr>
              ) : filteredSalesOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="text-sm text-gray-500">No sales orders found.</div>
                  </td>
                </tr>
              ) : (
                filteredSalesOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {order.document_number}
                        </div>
                        {order.reference && (
                          <div className="text-sm text-gray-500">
                            PO: {order.reference}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {order.customer_name}
                      </div>
                      {order.sales_representative_name && (
                        <div className="text-sm text-gray-500">
                          Rep: {order.sales_representative_name}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(order.order_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {safeCurrency(order.total_amount, order.currency_code || 'USD')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/transactions/oe/sales-orders/${order.id}`}
                          className="text-blue-600 hover:text-blue-900"
                          title="View/Edit"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        {/* Convert button: only for confirmed orders, disabled when pending or not confirmed */}
                        <button
                          onClick={() => handleConvertToInvoice(order.id)}
                          disabled={convertToInvoiceMutation.isPending || order.status !== 'CONFIRMED'}
                          className="text-green-600 hover:text-green-900 disabled:opacity-50"
                          title="Convert to Invoice"
                        >
                          <FileText className="h-4 w-4" />
                        </button>
                        {/* Edit button for draft orders */}
                        {order.status === 'DRAFT' && (
                          <Link
                            href={`/transactions/oe/sales-orders/${order.id}`}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Orders',
            value: filteredSalesOrders.length,
            color: 'text-blue-600',
          },
          {
            label: 'Draft Orders',
            value: filteredSalesOrders.filter(o => o.status === 'DRAFT').length,
            color: 'text-gray-600',
          },
          {
            label: 'Confirmed Orders',
            value: filteredSalesOrders.filter(o => o.status === 'CONFIRMED').length,
            color: 'text-blue-600',
          },
          {
            label: 'Total Value',
            value: safeCurrency(filteredSalesOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0), filteredSalesOrders[0]?.currency_code || 'USD'),
            color: 'text-green-600',
          },
        ].map((stat, index) => (
          <div key={index} className="bg-white shadow rounded-lg p-6">
            <div className="text-sm font-medium text-gray-500">{stat.label}</div>
            <div className={`text-2xl font-bold ${stat.color}`}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
