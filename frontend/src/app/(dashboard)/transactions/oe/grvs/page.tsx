'use client';


import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { 
  Plus, 
  Search, 
  Eye,
  FileText,
  Package,
  Truck,
  CreditCard,
  AlertTriangle,
  X
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
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [selectedGRV, setSelectedGRV] = useState<any | null>(null);

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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['grvs'] });
      setShowConvertModal(false);
      setSelectedGRV(null);
      
      // Navigate to AP transactions to show the created invoice
      setTimeout(() => {
        router.push('/transactions/ap/list');
      }, 2000); // Give time for the success message to be seen
    },
    onError: (error) => {
      console.error('Error converting GRV to AP Invoice:', error);
    },
  });

  const filteredGRVs = useMemo(() => {
    return grvs.filter((grv) => {
      const matchesSearch = 
        (grv.document_number || grv.grv_number || '')?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (grv.supplier_name || '')?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (grv.purchase_order_number || '')?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (grv.supplier_delivery_note || grv.reference || '')?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesSupplier = selectedSupplier === '' || grv.supplier_id === selectedSupplier;
      const matchesStatus = selectedStatus === '' || grv.status === selectedStatus;
      
      return matchesSearch && matchesSupplier && matchesStatus;
    });
  }, [grvs, searchTerm, selectedSupplier, selectedStatus]);

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      'DRAFT': 'bg-gray-100 text-gray-800',
      'Open': 'bg-blue-100 text-blue-800',
      'CONFIRMED': 'bg-blue-100 text-blue-800',
      'INVOICED': 'bg-green-100 text-green-800',
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[status as keyof typeof statusStyles] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  const handleConvertToAPInvoice = (grv: any) => {
    setSelectedGRV(grv);
    setShowConvertModal(true);
  };

  const handleCreateGRVFromPO = (poId: number) => {
    router.push(`/transactions/oe/grvs/new?po=${poId}`);
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

      {/* Procurement Workflow Guide */}
      <div className="rounded-lg border p-4 bg-blue-50">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-3 w-3 text-blue-600" />
            </div>
          </div>
          <div className="text-sm">
            <p className="font-medium text-blue-900">Complete Procurement Cycle - Step 4: Replenish Inventory</p>
            <div className="text-blue-800 mt-1 space-y-1">
              <p><strong>Step 1:</strong> Create Purchase Order → Order inventory from supplier</p>
              <p><strong>Step 2:</strong> Receive Goods → Create GRV when goods arrive (increases inventory)</p>
              <p><strong>Step 3:</strong> Convert to AP Invoice → Process supplier's invoice (creates accounts payable)</p>
            </div>
            <div className="mt-2 flex space-x-4 text-xs">
              <div className="flex items-center space-x-1">
                <Package className="h-3 w-3 text-blue-600" />
                <span>Create PO</span>
              </div>
              <div className="flex items-center space-x-1">
                <Truck className="h-3 w-3 text-blue-600" />
                <span>Receive Goods</span>
              </div>
              <div className="flex items-center space-x-1">
                <CreditCard className="h-3 w-3 text-blue-600" />
                <span>Create Invoice</span>
              </div>
            </div>
          </div>
        </div>
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
              <option value="Open">Open</option>
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
                          {grv.document_number || grv.grv_number}
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
                        {(grv.status === 'CONFIRMED' || grv.status === 'Open') && (
                          <button
                            onClick={() => handleConvertToAPInvoice(grv)}
                            disabled={convertToAPInvoiceMutation.isPending}
                            className="text-green-600 hover:text-green-900 disabled:opacity-50"
                            title="Convert to AP Invoice"
                          >
                            <FileText className="h-4 w-4" />
                          </button>
                        )}
                        {grv.status === 'INVOICED' && grv.ap_invoice_id && (
                          <Link
                            href={`/transactions/ap/list`}
                            className="text-purple-600 hover:text-purple-900"
                            title="View AP Invoice"
                          >
                            <CreditCard className="h-4 w-4" />
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
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
            label: 'Open GRVs',
            value: filteredGRVs.filter(g => g.status === 'Open').length,
            color: 'text-blue-600',
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
            GRV converted to AP Invoice successfully! Redirecting to AP Transactions...
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

      {/* Convert to AP Invoice Modal */}
      {showConvertModal && selectedGRV && (
        <ConvertToAPInvoiceModal
          grv={selectedGRV}
          onSubmit={(details) => convertToAPInvoiceMutation.mutate({ id: selectedGRV.id, details })}
          onCancel={() => {
            setShowConvertModal(false);
            setSelectedGRV(null);
          }}
          isLoading={convertToAPInvoiceMutation.isPending}
        />
      )}
    </div>
  );
}

// Convert to AP Invoice Modal Component
function ConvertToAPInvoiceModal({ 
  grv, 
  onSubmit, 
  onCancel, 
  isLoading 
}: { 
  grv: any; 
  onSubmit: (details: any) => void; 
  onCancel: () => void; 
  isLoading: boolean;
}) {
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [paymentTerms, setPaymentTerms] = useState('Net 30');
  const [reference, setReference] = useState(`GRV-${grv.document_number || grv.grv_number}`);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceNumber.trim()) {
      alert('Please enter the supplier invoice number');
      return;
    }
    
    onSubmit({
      ap_transaction_type_id: 1, // Supplier Invoice
      supplier_id: grv.supplier_id,
      transaction_date: invoiceDate,
      due_date: dueDate,
      reference: reference,
      description: `AP Invoice from GRV ${grv.document_number || grv.grv_number}`,
      total_amount: grv.total_value || 0,
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Convert GRV to AP Invoice</h3>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mb-4 p-3 bg-blue-50 rounded-md">
            <div className="text-sm">
              <p><strong>GRV:</strong> {grv.document_number || grv.grv_number}</p>
              <p><strong>Supplier:</strong> {grv.supplier_name}</p>
              <p><strong>GRV Date:</strong> {new Date(grv.grv_date).toLocaleDateString()}</p>
              <p><strong>Amount:</strong> ${Number(grv.total_value || 0).toFixed(2)}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Supplier Invoice Number *
              </label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., SUP-INV-7890"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Invoice Date
              </label>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Payment Terms
              </label>
              <select
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Net 30">Net 30</option>
                <option value="Net 15">Net 15</option>
                <option value="Net 60">Net 60</option>
                <option value="COD">Cash on Delivery</option>
                <option value="Due on Receipt">Due on Receipt</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Reference
              </label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <div className="text-sm text-yellow-800">
                <p className="font-semibold">What happens when you convert:</p>
                <ul className="mt-1 ml-4 list-disc space-y-1 text-xs">
                  <li>GRV Accrual Account cleared: ${Number(grv.total_value || 0).toFixed(2)}</li>
                  <li>Accounts Payable increased: ${Number(grv.total_value || 0).toFixed(2)}</li>
                  <li>GRV status changes to "INVOICED"</li>
                  <li>AP Invoice created for supplier payment</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Converting...' : 'Create AP Invoice'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
