'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { 
  Plus, 
  Search, 
  Edit, 
  Eye, 
  FileText,
  Calendar,
  User,
  CheckCircle
} from 'lucide-react';
import { ARTransaction } from '@/types/ar';
import { arTransactionService } from '@/services/arService';
import { usePermissions } from '@/hooks/usePermissions';
import { AR_TRANSACTIONS_POST, AR_REPORTS_VIEW } from '@/lib/permissions';

export default function ARInvoicesPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const [searchTerm, setSearchTerm] = useState('');
  const [postingTransactionId, setPostingTransactionId] = useState<number | null>(null);

  const { data: transactions = [], isLoading, error } = useQuery({
    queryKey: ['ar-transactions', 'Invoice'],
    queryFn: () => arTransactionService.getByType('Invoice'),
    enabled: hasPermission(AR_REPORTS_VIEW),
  });

  const postTransactionMutation = useMutation({
    mutationFn: (transactionId: number) => arTransactionService.post(transactionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ar-transactions'] });
      setPostingTransactionId(null);
    },
    onError: (error: Error) => {
      console.error('Error posting transaction:', error);
      alert('Failed to post invoice. Please try again.');
      setPostingTransactionId(null);
    },
  });

  const handlePostTransaction = async (transactionId: number) => {
    if (!confirm('Are you sure you want to post this invoice? This action cannot be undone.')) {
      return;
    }
    setPostingTransactionId(transactionId);
    await postTransactionMutation.mutateAsync(transactionId);
  };

  const filteredInvoices = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return [];
    }
    return transactions.filter((transaction: ARTransaction) =>
      transaction.document_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.reference?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [transactions, searchTerm]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const safeParseAmount = (amount: unknown): number => {
    if (typeof amount === 'number' && !isNaN(amount)) {
      return amount;
    }
    if (typeof amount === 'string') {
      const parsed = parseFloat(amount);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft': return 'bg-gray-100 text-gray-800';
      case 'Posted': return 'bg-blue-100 text-blue-800';
      case 'Paid': return 'bg-green-100 text-green-800';
      case 'PartiallyPaid': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (!hasPermission(AR_REPORTS_VIEW)) {
    return (
      <div className="p-6">
        <div className="text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">Access Denied</h3>
          <p className="mt-1 text-sm text-gray-500">
            You don&apos;t have permission to view AR invoices.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center">
          <FileText className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">Error</h3>
          <p className="mt-1 text-sm text-gray-500">
            Failed to load invoices. Please try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Customer Invoices</h1>
            <p className="text-gray-600">
              Manage customer invoices and billing
            </p>
          </div>
        {hasPermission(AR_TRANSACTIONS_POST) && (
          <Link
            href="/transactions/ar/invoices/new"
            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-600/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Invoice
          </Link>
        )}
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
          <input
            type="text"
            placeholder="Search invoices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white px-10 py-2 text-sm ring-offset-background placeholder:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>
      </div>

      {/* Invoices Table */}
      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="h-12 px-4 text-left align-middle font-medium text-gray-600">
                  Document #
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-gray-600">
                  Customer
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-gray-600">
                  Date
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-gray-600">
                  Due Date
                </th>
                <th className="h-12 px-4 text-right align-middle font-medium text-gray-600">
                  Total Amount
                </th>
                <th className="h-12 px-4 text-right align-middle font-medium text-gray-600">
                  Open Amount
                </th>
                <th className="h-12 px-4 text-center align-middle font-medium text-gray-600">
                  Status
                </th>
                <th className="h-12 px-4 text-center align-middle font-medium text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <FileText className="h-8 w-8 text-gray-600" />
                      <p className="text-sm text-gray-600">
                        {searchTerm ? 'No invoices found matching your search.' : 'No invoices found.'}
                      </p>
                      {hasPermission(AR_TRANSACTIONS_POST) && !searchTerm && (
                        <Link
                          href="/transactions/ar/invoices/new"
                          className="text-sm text-primary hover:underline"
                        >
                          Create your first invoice
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b hover:bg-gray-100/50">
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-gray-600" />
                        <span className="font-medium text-gray-900">{invoice.document_number}</span>
                      </div>
                      {invoice.reference && (
                        <p className="text-xs text-gray-600">Ref: {invoice.reference}</p>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-600" />
                        <span className="text-gray-900">{invoice.customer_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-600" />
                        <span className="text-gray-900">{formatDate(invoice.transaction_date)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {invoice.due_date ? (
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-600" />
                          <span className="text-gray-900">{formatDate(invoice.due_date)}</span>
                        </div>
                      ) : (
                        <span className="text-gray-600">-</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="font-medium text-gray-900">{formatCurrency(safeParseAmount(invoice.total_amount))}</span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className={`font-medium ${safeParseAmount(invoice.open_amount) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(safeParseAmount(invoice.open_amount))}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(invoice.status)}`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center space-x-2">
                        <Link
                          href={`/transactions/ar/transactions/${invoice.id}`}
                          className="rounded-md p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                          title="View invoice"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        {hasPermission(AR_TRANSACTIONS_POST) && invoice.status === 'Draft' && (
                          <>
                            <Link
                              href={`/transactions/ar/transactions/${invoice.id}/edit`}
                              className="rounded-md p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                              title="Edit invoice"
                            >
                              <Edit className="h-4 w-4" />
                            </Link>
                            <button
                              onClick={() => handlePostTransaction(invoice.id)}
                              disabled={postingTransactionId === invoice.id}
                              className="rounded-md p-2 text-green-600 hover:bg-green-50 hover:text-green-700 disabled:opacity-50"
                              title="Post invoice"
                            >
                              {postingTransactionId === invoice.id ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                              ) : (
                                <CheckCircle className="h-4 w-4" />
                              )}
                            </button>
                          </>
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

      {/* Summary */}
      {filteredInvoices.length > 0 && (
        <div className="rounded-md border p-4">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">
              Showing {filteredInvoices.length} invoice{filteredInvoices.length !== 1 ? 's' : ''}
            </span>
            <div className="flex space-x-6">
              <span>
                Total: {formatCurrency(filteredInvoices.reduce((sum, inv) => sum + safeParseAmount(inv.total_amount), 0))}
              </span>
              <span>
                Outstanding: {formatCurrency(filteredInvoices.reduce((sum, inv) => sum + safeParseAmount(inv.open_amount), 0))}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
