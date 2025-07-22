'use client';


import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { 
  Plus, 
  Search, 
  Edit, 
  Eye, 
  FileText,
  Calendar,
  DollarSign,
  User
} from 'lucide-react';
import { ARTransaction } from '@/types/ar';
import { arTransactionService } from '@/services/arService';
import { usePermissions } from '@/hooks/usePermissions';
import { AR_TRANSACTIONS_POST, AR_REPORTS_VIEW } from '@/lib/permissions';

export default function ARCreditNotesPage() {
  const { hasPermission } = usePermissions();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: transactions = [], isLoading, error } = useQuery({
    queryKey: ['ar-transactions'],
    queryFn: () => arTransactionService.getAll(),
    enabled: hasPermission(AR_REPORTS_VIEW),
  });

  // Use useMemo instead of useEffect for filtering
  const filteredCreditNotes = useMemo(() => {
    if (!transactions) return [];
    
    // First filter for Credit Note transactions, then apply search filter
    const creditNotes = transactions.filter((transaction: ARTransaction) => 
      transaction.ar_transaction_type_id === 3 || // Assuming Credit Note type ID is 3
      transaction.document_number.includes('CN-') // Alternative: filter by document pattern
    );

    return creditNotes.filter((transaction: ARTransaction) =>
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
            You don&apos;t have permission to view AR credit notes.
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
            Failed to load credit notes. Please try again.
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
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Credit Notes</h1>
            <p className="text-gray-600">
              Manage customer credit notes and refunds
            </p>
          </div>
        {hasPermission(AR_TRANSACTIONS_POST) && (
          <Link
            href="/transactions/ar/credit-notes/new"
            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-600/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Credit Note
          </Link>
        )}
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
          <input
            type="text"
            placeholder="Search credit notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white px-10 py-2 text-sm ring-offset-background placeholder:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>
      </div>

      {/* Credit Notes Table */}
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
                <th className="h-12 px-4 text-right align-middle font-medium text-gray-600">
                  Credit Amount
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
              {filteredCreditNotes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <FileText className="h-8 w-8 text-gray-600" />
                      <p className="text-sm text-gray-600">
                        {searchTerm ? 'No credit notes found matching your search.' : 'No credit notes found.'}
                      </p>
                      {hasPermission(AR_TRANSACTIONS_POST) && !searchTerm && (
                        <Link
                          href="/transactions/ar/credit-notes/new"
                          className="text-sm text-primary hover:underline"
                        >
                          Create your first credit note
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCreditNotes.map((creditNote: ARTransaction) => (
                  <tr key={creditNote.id} className="border-b hover:bg-gray-100/50">
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-gray-600" />
                        <span className="font-medium text-gray-900">{creditNote.document_number}</span>
                      </div>
                      {creditNote.reference && (
                        <p className="text-xs text-gray-600">Ref: {creditNote.reference}</p>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-600" />
                        <span className="text-gray-900">{creditNote.customer_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-600" />
                        <span className="text-gray-900">{formatDate(creditNote.transaction_date)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <DollarSign className="h-4 w-4 text-gray-600" />
                        <span className="font-medium text-red-600">{formatCurrency(creditNote.total_amount)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <DollarSign className="h-4 w-4 text-gray-600" />
                        <span className={`font-medium ${creditNote.open_amount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {formatCurrency(creditNote.open_amount)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(creditNote.status)}`}>
                        {creditNote.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center space-x-2">
                        <Link
                          href={`/transactions/ar/transactions/${creditNote.id}`}
                          className="rounded-md p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                          title="View credit note"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        {hasPermission(AR_TRANSACTIONS_POST) && creditNote.status === 'Draft' && (
                          <Link
                            href={`/transactions/ar/transactions/${creditNote.id}/edit`}
                            className="rounded-md p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                            title="Edit credit note"
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

      {/* Summary */}
      {filteredCreditNotes.length > 0 && (
        <div className="rounded-md border p-4">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">
              Showing {filteredCreditNotes.length} credit note{filteredCreditNotes.length !== 1 ? 's' : ''}
            </span>
            <div className="flex space-x-6">
              <span>
                Total Credits: {formatCurrency(filteredCreditNotes.reduce((sum: number, cn: ARTransaction) => sum + cn.total_amount, 0))}
              </span>
              <span>
                Outstanding: {formatCurrency(filteredCreditNotes.reduce((sum: number, cn: ARTransaction) => sum + cn.open_amount, 0))}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
