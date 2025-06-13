'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Download, DollarSign, User, FileText, AlertTriangle } from 'lucide-react';
import { CustomerStatementItem } from '@/types/ar';
import { arReportsService, customerService } from '@/services/arService';
import { usePermissions } from '@/hooks/usePermissions';
import { AR_REPORTS_VIEW } from '@/lib/permissions';

export default function CustomerStatementPage() {
  const { hasPermission } = usePermissions();
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [fromDate, setFromDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 3); // 3 months ago
    return date.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: customers = [], isLoading: loadingCustomers } = useQuery({
    queryKey: ['customers'],
    queryFn: customerService.getAll,
    enabled: hasPermission(AR_REPORTS_VIEW),
  });

  const { data: statementData = [], isLoading, error, refetch } = useQuery({
    queryKey: ['customer-statement', customerId, fromDate, toDate],
    queryFn: () => arReportsService.getCustomerStatement(customerId!, fromDate, toDate),
    enabled: hasPermission(AR_REPORTS_VIEW) && !!customerId && !!fromDate && !!toDate,
  });

  const selectedCustomer = customers.find(c => c.id === customerId);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
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

  const getAmountColor = (amount: number, typeName: string) => {
    if (typeName?.includes('Invoice') && amount > 0) return 'text-red-600';
    if ((typeName?.includes('Receipt') || typeName?.includes('Credit')) && amount > 0) return 'text-green-600';
    return '';
  };

  const exportToCSV = () => {
    if (!selectedCustomer || statementData.length === 0) return;

    const headers = ['Date', 'Due Date', 'Document #', 'Reference', 'Type', 'Amount', 'Open Amount', 'Status'];
    const csvContent = [
      `Customer Statement - ${selectedCustomer.name}`,
      `Period: ${formatDate(fromDate)} to ${formatDate(toDate)}`,
      '',
      headers.join(','),
      ...statementData.map(item => [
        item.transaction_date,
        item.due_date || '',
        `"${item.document_number}"`,
        `"${item.reference || ''}"`,
        `"${item.ar_transaction_type_name}"`,
        item.total_amount,
        item.open_amount,
        item.status,
      ].join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customer-statement-${selectedCustomer.customer_code}-${fromDate}-to-${toDate}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (!hasPermission(AR_REPORTS_VIEW)) {
    return (
      <div className="p-6">
        <div className="text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">Access Denied</h3>
          <p className="mt-1 text-sm text-gray-500">
            You don't have permission to view AR reports.
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
          <h1 className="text-3xl font-bold tracking-tight">Customer Statement</h1>
          <p className="text-gray-600">
            View detailed transaction history for a customer
          </p>
        </div>
        {selectedCustomer && statementData.length > 0 && (
          <button
            onClick={exportToCSV}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="rounded-lg border p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Customer *</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
              <select
                value={customerId || ''}
                onChange={(e) => setCustomerId(e.target.value ? Number(e.target.value) : null)}
                className="w-full rounded-md border border-input bg-background px-10 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                disabled={loadingCustomers}
              >
                <option value="">Select a customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} ({customer.customer_code})
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">From Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-10 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">To Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-10 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => refetch()}
              disabled={!customerId}
              className="w-full rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
            >
              Generate Statement
            </button>
          </div>
        </div>
      </div>

      {/* Customer Info */}
      {selectedCustomer && (
        <div className="rounded-lg border p-4 bg-muted/30">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Customer</p>
              <p className="font-medium">{selectedCustomer.name}</p>
              <p className="text-sm text-gray-600">Code: {selectedCustomer.customer_code}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Current Balance</p>
              <p className="text-lg font-bold text-red-600">{formatCurrency(selectedCustomer.current_balance)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Statement Period</p>
              <p className="font-medium">{formatDate(fromDate)} to {formatDate(toDate)}</p>
            </div>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="p-6">
          <div className="text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-red-400" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">Error</h3>
            <p className="mt-1 text-sm text-gray-500">
              Failed to load customer statement. Please try again.
            </p>
          </div>
        </div>
      )}

      {!isLoading && !error && customerId && (
        <>
          {/* Statement Table */}
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="h-12 px-4 text-left align-middle font-medium text-gray-600">
                      Date
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-gray-600">
                      Due Date
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-gray-600">
                      Document #
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-gray-600">
                      Type
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
                  </tr>
                </thead>
                <tbody>
                  {statementData.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="h-32 text-center">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <FileText className="h-8 w-8 text-gray-600" />
                          <p className="text-sm text-gray-600">
                            {customerId 
                              ? 'No transactions found for the selected period.'
                              : 'Please select a customer to view their statement.'
                            }
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    statementData
                      .sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime())
                      .map((item) => (
                        <tr key={item.id} className="border-b hover:bg-muted/50">
                          <td className="px-4 py-4">
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4 text-gray-600" />
                              <span>{formatDate(item.transaction_date)}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            {item.due_date ? (
                              <div className="flex items-center space-x-2">
                                <Calendar className="h-4 w-4 text-gray-600" />
                                <span>{formatDate(item.due_date)}</span>
                              </div>
                            ) : (
                              <span className="text-gray-600">-</span>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center space-x-2">
                              <FileText className="h-4 w-4 text-gray-600" />
                              <span className="font-medium">{item.document_number}</span>
                            </div>
                            {item.reference && (
                              <p className="text-xs text-gray-600">Ref: {item.reference}</p>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-sm">{item.ar_transaction_type_name}</span>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <DollarSign className="h-4 w-4 text-gray-600" />
                              <span className={`font-medium ${getAmountColor(item.total_amount, item.ar_transaction_type_name)}`}>
                                {formatCurrency(item.total_amount)}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <DollarSign className="h-4 w-4 text-gray-600" />
                              <span className={`font-medium ${getAmountColor(item.open_amount, item.ar_transaction_type_name)}`}>
                                {formatCurrency(item.open_amount)}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(item.status)}`}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary */}
          {statementData.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="rounded-md border p-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Total Transactions</p>
                  <p className="text-2xl font-bold">{statementData.length}</p>
                </div>
              </div>
              <div className="rounded-md border p-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Total Invoiced</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(
                      statementData
                        .filter(item => item.ar_transaction_type_name.includes('Invoice'))
                        .reduce((sum, item) => sum + item.total_amount, 0)
                    )}
                  </p>
                </div>
              </div>
              <div className="rounded-md border p-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Total Payments</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(
                      statementData
                        .filter(item => item.ar_transaction_type_name.includes('Receipt'))
                        .reduce((sum, item) => sum + item.total_amount, 0)
                    )}
                  </p>
                </div>
              </div>
              <div className="rounded-md border p-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Outstanding</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(
                      statementData
                        .filter(item => item.open_amount > 0)
                        .reduce((sum, item) => sum + item.open_amount, 0)
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Instructions */}
      {!customerId && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                <FileText className="h-3 w-3 text-blue-600" />
              </div>
            </div>
            <div className="text-sm">
              <p className="font-medium text-blue-900">How to use Customer Statement</p>
              <p className="text-blue-800 mt-1">
                Select a customer and date range to generate a detailed statement showing all transactions 
                for that period. The statement includes invoices, payments, credit notes, and current balances.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
