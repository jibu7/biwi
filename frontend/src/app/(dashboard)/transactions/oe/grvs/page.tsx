'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { 
  Plus, 
  Search, 
  Eye,
  FileText
} from 'lucide-react';
import { grvService } from '@/services/oeService';
import { apService } from '@/services/apService';
import { Supplier } from '@/types/ap';

export default function GRVsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<number | ''>('');
  const [selectedStatus, setSelectedStatus] = useState<string | ''>('');

  const { data: grvs = [], isLoading } = useQuery({
    queryKey: ['grvs'],
    queryFn: () => grvService.getAll(),
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => apService.getSuppliers(),
  });

  const convertToAPInvoiceMutation = useMutation({
    mutationFn: ({ id, details }: { id: number; details: any }) => grvService.convertToAPInvoice(id, details),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grvs'] });
    },
  });

  const filteredGRVs = useMemo(() => {
    return grvs.filter((grv) => {
      const matchesSearch = 
        grv.grv_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        grv.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        grv.purchase_order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        grv.supplier_delivery_note?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesSupplier = selectedSupplier === '' || grv.supplier_id === selectedSupplier;
      const matchesStatus = selectedStatus === '' || grv.status === selectedStatus;
      
      return matchesSearch && matchesSupplier && matchesStatus;
    });
  }, [grvs, searchTerm, selectedSupplier, selectedStatus]);

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

  const handleConvertToAPInvoice = async (grvId: number) => {
    // For now, we'll convert with minimal details
    // In a real app, this would open a modal or form for invoice details
    const invoiceDetails = {
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days
      reference: `GRV-${grvId}`,
    };

    if (confirm('Are you sure you want to convert this GRV to an AP invoice?')) {
      await convertToAPInvoiceMutation.mutateAsync({ id: grvId, details: invoiceDetails });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Goods Received Vouchers</h1>
          <p className="mt-2 text-sm text-gray-700">
            Track goods received from suppliers and convert to invoices.
          </p>
        </div>
        <Link
          href="/transactions/oe/grvs/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          New GRV
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
                placeholder="Search GRVs, suppliers, POs, or delivery notes..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Supplier</label>
            <select
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value === '' ? '' : Number(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">All Suppliers</option>
              {suppliers.map((supplier: Supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
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
            </select>
          </div>
        </div>
      </div>

      {/* GRVs Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  GRV Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Purchase Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Supplier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Received By
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="text-sm text-gray-500">Loading GRVs...</div>
                  </td>
                </tr>
              ) : filteredGRVs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="text-sm text-gray-500">No GRVs found.</div>
                  </td>
                </tr>
              ) : (
                filteredGRVs.map((grv) => (
                  <tr key={grv.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {grv.grv_number}
                        </div>
                        {grv.supplier_delivery_note && (
                          <div className="text-sm text-gray-500">
                            DN: {grv.supplier_delivery_note}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {grv.purchase_order_number || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {grv.supplier_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(grv.grv_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(grv.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {grv.received_by || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/transactions/oe/grvs/${grv.id}`}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        {grv.status === 'CONFIRMED' && (
                          <button
                            onClick={() => handleConvertToAPInvoice(grv.id)}
                            disabled={convertToAPInvoiceMutation.isPending}
                            className="text-green-600 hover:text-green-900 disabled:opacity-50"
                            title="Convert to AP Invoice"
                          >
                            <FileText className="h-4 w-4" />
                          </button>
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
            label: 'Total GRVs',
            value: filteredGRVs.length,
            color: 'text-blue-600',
          },
          {
            label: 'Draft GRVs',
            value: filteredGRVs.filter(g => g.status === 'DRAFT').length,
            color: 'text-gray-600',
          },
          {
            label: 'Confirmed GRVs',
            value: filteredGRVs.filter(g => g.status === 'CONFIRMED').length,
            color: 'text-blue-600',
          },
          {
            label: 'Invoiced GRVs',
            value: filteredGRVs.filter(g => g.status === 'INVOICED').length,
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

      {/* Success/Error Messages */}
      {convertToAPInvoiceMutation.isSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <p className="text-sm text-green-800">
            GRV successfully converted to AP invoice!
          </p>
        </div>
      )}

      {convertToAPInvoiceMutation.isError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-800">
            Failed to convert GRV to AP invoice. Please try again.
          </p>
        </div>
      )}
    </div>
  );
}
