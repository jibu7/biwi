'use client';

import { useState, useEffect } from 'react';
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
  User,
  Filter
} from 'lucide-react';
import { ARTransaction } from '@/types/ar';
import { arTransactionService } from '@/services/arService';
import { usePermissions } from '@/hooks/usePermissions';
import { AR_TRANSACTIONS_POST, AR_REPORTS_VIEW } from '@/lib/permissions';

export default function ARTransactionsListPage() {
  const { hasPermission } = usePermissions();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [filteredTransactions, setFilteredTransactions] = useState<ARTransaction[]>([]);

  const { data: transactions = [], isLoading, error, refetch } = useQuery({
    queryKey: ['ar-transactions'],
    queryFn: () => arTransactionService.getAll(),
    enabled: hasPermission(AR_REPORTS_VIEW),
  });

  useEffect(() => {
    if (transactions && Array.isArray(transactions)) {
      let filtered = transactions.filter((transaction: ARTransaction) =>
        transaction.document_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.reference?.toLowerCase().includes(searchTerm.toLowerCase())
      );

      if (statusFilter) {
        filtered = filtered.filter(t => t.status === statusFilter);
      }

      if (typeFilter) {
        filtered = filtered.filter(t => t.ar_transaction_type_name?.includes(typeFilter));
      }

      setFilteredTransactions(filtered);
    }
  }, [transactions, searchTerm, statusFilter, typeFilter]);

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

  const getTypeColor = (typeName: string) => {
    if (typeName?.includes('Invoice')) return 'bg-blue-100 text-blue-800';
    if (typeName?.includes('Credit')) return 'bg-red-100 text-red-800';
    if (typeName?.includes('Receipt')) return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getBalanceColor = (openAmount: number, typeName: string) => {
    if (openAmount === 0) return 'text-gray-600';
    if (typeName?.includes('Invoice')) return 'text-red-600';
    if (typeName?.includes('Credit') || typeName?.includes('Receipt')) return 'text-green-600';
    return 'text-gray-600';
  };

  if (!hasPermission(AR_REPORTS_VIEW)) {
    return (
      <div className="p-6">
        <div className="text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">Access Denied</h3>
          <p className="mt-1 text-sm text-gray-500">
            You don't have permission to view AR transactions.
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
            Failed to load transactions. Please try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">All AR Transactions</h1>
          <p className="text-gray-600">
            Complete list of all accounts receivable transactions
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white px-10 py-2 text-sm ring-offset-background placeholder:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>
        
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border border-gray-300 bg-white px-10 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Posted">Posted</option>
            <option value="Paid">Paid</option>
            <option value="PartiallyPaid">Partially Paid</option>
          </select>
        </div>

        <div className="relative">
          <FileText className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-md border border-gray-300 bg-white px-10 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="">All Types</option>
            <option value="Invoice">Invoices</option>
            <option value="Credit">Credit Notes</option>
            <option value="Receipt">Receipts</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="h-12 px-4 text-left align-middle font-medium text-gray-600">
                  Document #
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-gray-600">
                  Type
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
                  Amount
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
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <FileText className="h-8 w-8 text-gray-600" />
                      <p className="text-sm text-gray-600">
                        {searchTerm || statusFilter || typeFilter 
                          ? 'No transactions found matching your filters.' 
                          : 'No transactions found.'
                        }
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b hover:bg-gray-100/50">
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-gray-600" />
                        <span className="font-medium text-gray-900">{transaction.document_number}</span>
                      </div>
                      {transaction.reference && (
                        <p className="text-xs text-gray-600">Ref: {transaction.reference}</p>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getTypeColor(transaction.ar_transaction_type_name || '')}`}>
                        {transaction.ar_transaction_type_name}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-600" />
                        <span className="text-gray-900">{transaction.customer_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-600" />
                        <span className="text-gray-900">{formatDate(transaction.transaction_date)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {transaction.due_date ? (
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-600" />
                          <span className="text-gray-900">{formatDate(transaction.due_date)}</span>
                        </div>
                      ) : (
                        <span className="text-gray-600">-</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <DollarSign className="h-4 w-4 text-gray-600" />
                        <span className="font-medium text-gray-900">{formatCurrency(transaction.total_amount)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <DollarSign className="h-4 w-4 text-gray-600" />
                        <span className={`font-medium ${getBalanceColor(transaction.open_amount, transaction.ar_transaction_type_name || '')}`}>
                          {formatCurrency(transaction.open_amount)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(transaction.status)}`}>
                        {transaction.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center space-x-2">
                        <Link
                          href={`/transactions/ar/transactions/${transaction.id}`}
                          className="rounded-md p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                          title="View transaction"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        {hasPermission(AR_TRANSACTIONS_POST) && transaction.status === 'Draft' && (
                          <Link
                            href={`/transactions/ar/transactions/${transaction.id}/edit`}
                            className="rounded-md p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                            title="Edit transaction"
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
      {filteredTransactions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-md border p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Transactions</p>
              <p className="text-2xl font-bold">{filteredTransactions.length}</p>
            </div>
          </div>
          <div className="rounded-md border p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="text-2xl font-bold">
                {formatCurrency(filteredTransactions.reduce((sum, t) => sum + t.total_amount, 0))}
              </p>
            </div>
          </div>
          <div className="rounded-md border p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Outstanding</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(
                  filteredTransactions
                    .filter(t => t.ar_transaction_type_name?.includes('Invoice'))
                    .reduce((sum, t) => sum + t.open_amount, 0)
                )}
              </p>
            </div>
          </div>
          <div className="rounded-md border p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Unallocated Credits</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(
                  filteredTransactions
                    .filter(t => t.ar_transaction_type_name?.includes('Receipt') || t.ar_transaction_type_name?.includes('Credit'))
                    .reduce((sum, t) => sum + t.open_amount, 0)
                )}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
