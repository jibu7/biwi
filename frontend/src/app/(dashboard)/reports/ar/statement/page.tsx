'use client';


import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Download, DollarSign, User, FileText, AlertTriangle, Printer, Mail, Eye } from 'lucide-react';
import { CustomerStatementItem } from '@/types/ar';
import { arReportsService, customerService } from '@/services/arService';
import { usePermissions } from '@/hooks/usePermissions';
import { AR_REPORTS_VIEW } from '@/lib/permissions';

export default function CustomerStatementPage() {
  const { hasPermission } = usePermissions();
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [fromDate, setFromDate] = useState(() => {
    const date = new Date();
    date.setDate(1); // First day of current month
    return date.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
  const [statementType, setStatementType] = useState<'detailed' | 'summary'>('detailed');
  const [includePaidItems, setIncludePaidItems] = useState(true);
  const [showAging, setShowAging] = useState(true);
  const [showPreview, setShowPreview] = useState(false);

  const { data: customers = [], isLoading: loadingCustomers } = useQuery({
    queryKey: ['customers'],
    queryFn: customerService.getAll,
    enabled: hasPermission(AR_REPORTS_VIEW),
  });

  const { data: statementData = [], isLoading, error, refetch } = useQuery({
    queryKey: ['customer-statement', customerId, fromDate, toDate, includePaidItems],
    queryFn: () => arReportsService.getCustomerStatement(customerId!, fromDate, toDate),
    enabled: hasPermission(AR_REPORTS_VIEW) && !!customerId && !!fromDate && !!toDate,
  });

  // Filter data based on settings
  const filteredStatementData = statementData.filter(item => {
    if (!includePaidItems && item.status === 'Paid') {
      return false;
    }
    return true;
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

  const getAmountColor = (amount: number, typeName: string | null | undefined) => {
    if (typeName && typeName.includes('Invoice') && amount > 0) return 'text-red-600';
    if (typeName && (typeName.includes('Receipt') || typeName.includes('Credit')) && amount > 0) return 'text-green-600';
    return '';
  };

  // Calculate aging buckets
  const calculateAging = () => {
    const today = new Date();
    const aging = {
      current: 0,
      days30: 0,
      days60: 0,
      days90Plus: 0,
    };

    filteredStatementData
      .filter(item => item.open_amount > 0 && item.due_date)
      .forEach(item => {
        const dueDate = new Date(item.due_date!);
        const daysPastDue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysPastDue <= 0) {
          aging.current += item.open_amount;
        } else if (daysPastDue <= 30) {
          aging.days30 += item.open_amount;
        } else if (daysPastDue <= 60) {
          aging.days60 += item.open_amount;
        } else {
          aging.days90Plus += item.open_amount;
        }
      });

    return aging;
  };

  const aging = calculateAging();

  const printStatement = () => {
    if (!selectedCustomer || filteredStatementData.length === 0) return;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(generateStatementHTML());
      printWindow.document.close();
      printWindow.print();
    }
  };

  const emailStatement = () => {
    if (!selectedCustomer || filteredStatementData.length === 0) return;
    
    // In a real implementation, this would call a backend API to send the email
    alert(`Email statement functionality would send statement to ${selectedCustomer.email || 'customer email'}`);
  };

  const generateStatementHTML = () => {
    if (!selectedCustomer) return '';

    const companyInfo = {
      name: "Your Company Name",
      address: "123 Business Street",
      cityStateZip: "City, State ZIP",
    };

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Customer Statement</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
          .company-info { text-align: center; margin-bottom: 20px; }
          .customer-info { margin-bottom: 20px; }
          .statement-info { margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .amount { text-align: right; }
          .aging-summary { margin-top: 20px; }
          .total-due { font-weight: bold; font-size: 1.2em; }
          .status { font-weight: bold; color: green; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>CUSTOMER STATEMENT</h1>
        </div>
        
        <div class="company-info">
          <div><strong>${companyInfo.name}</strong></div>
          <div>${companyInfo.address}</div>
          <div>${companyInfo.cityStateZip}</div>
        </div>

        <div class="customer-info">
          <strong>STATEMENT FOR:</strong> ${selectedCustomer.name}<br>
          <strong>STATEMENT DATE:</strong> ${formatDate(toDate)}<br>
          <strong>ACCOUNT NUMBER:</strong> ${selectedCustomer.customer_code}
        </div>

        <div class="statement-info">
          <strong>Statement Period:</strong> ${formatDate(fromDate)} to ${formatDate(toDate)}
        </div>

        <h3>TRANSACTION HISTORY</h3>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Reference</th>
              <th class="amount">Amount</th>
              <th class="amount">Balance</th>
            </tr>
          </thead>
          <tbody>
            ${filteredStatementData
              .sort((a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime())
              .map((item, index) => {
                const runningBalance = filteredStatementData
                  .slice(0, index + 1)
                  .reduce((sum, t) => {
                    return sum + (t.ar_transaction_type_name && t.ar_transaction_type_name.includes('Invoice') ? t.total_amount : -t.total_amount);
                  }, 0);
                
                return `
                  <tr>
                    <td>${formatDate(item.transaction_date)}</td>
                    <td>${item.ar_transaction_type_name || 'Unknown'}</td>
                    <td>${item.document_number}</td>
                    <td class="amount">$${item.total_amount.toFixed(2)}</td>
                    <td class="amount">$${runningBalance.toFixed(2)}</td>
                  </tr>
                `;
              }).join('')}
          </tbody>
        </table>

        ${showAging ? `
        <div class="aging-summary">
          <h3>AGING SUMMARY</h3>
          <table>
            <tr>
              <th>Current</th>
              <th>30 Days</th>
              <th>60 Days</th>
              <th>90+ Days</th>
              <th>TOTAL DUE</th>
            </tr>
            <tr>
              <td class="amount">$${aging.current.toFixed(2)}</td>
              <td class="amount">$${aging.days30.toFixed(2)}</td>
              <td class="amount">$${aging.days60.toFixed(2)}</td>
              <td class="amount">$${aging.days90Plus.toFixed(2)}</td>
              <td class="amount total-due">$${(aging.current + aging.days30 + aging.days60 + aging.days90Plus).toFixed(2)}</td>
            </tr>
          </table>
        </div>
        ` : ''}

        <div style="margin-top: 30px;">
          <div class="status">
            Account Status: ${(aging.current + aging.days30 + aging.days60 + aging.days90Plus) === 0 ? 'PAID IN FULL' : 'OUTSTANDING BALANCE'}
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const exportToCSV = () => {
    if (!selectedCustomer || filteredStatementData.length === 0) return;

    const headers = ['Date', 'Due Date', 'Document #', 'Reference', 'Type', 'Amount', 'Open Amount', 'Status'];
    const csvContent = [
      `Customer Statement - ${selectedCustomer.name}`,
      `Period: ${formatDate(fromDate)} to ${formatDate(toDate)}`,
      `Statement Type: ${statementType.charAt(0).toUpperCase() + statementType.slice(1)}`,
      `Include Paid Items: ${includePaidItems ? 'Yes' : 'No'}`,
      '',
      headers.join(','),
      ...filteredStatementData.map(item => [
        item.transaction_date,
        item.due_date || '',
        `"${item.document_number}"`,
        `"${item.reference || ''}"`,
        `"${item.ar_transaction_type_name}"`,
        item.total_amount,
        item.open_amount,
        item.status,
      ].join(',')),
      '',
      'AGING SUMMARY',
      `Current,$${aging.current.toFixed(2)}`,
      `30 Days,$${aging.days30.toFixed(2)}`,
      `60 Days,$${aging.days60.toFixed(2)}`,
      `90+ Days,$${aging.days90Plus.toFixed(2)}`,
      `TOTAL DUE,$${(aging.current + aging.days30 + aging.days60 + aging.days90Plus).toFixed(2)}`,
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
            You don&apos;t have permission to view AR reports.
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
            Generate detailed customer statements with transaction history and aging
          </p>
        </div>
        {selectedCustomer && filteredStatementData.length > 0 && (
          <div className="flex space-x-2">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="inline-flex items-center justify-center rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-gray-700"
            >
              <Eye className="mr-2 h-4 w-4" />
              {showPreview ? 'Hide Preview' : 'Preview'}
            </button>
            <button
              onClick={printStatement}
              className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700"
            >
              <Printer className="mr-2 h-4 w-4" />
              Print
            </button>
            <button
              onClick={emailStatement}
              className="inline-flex items-center justify-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-green-700"
            >
              <Mail className="mr-2 h-4 w-4" />
              Email
            </button>
            <button
              onClick={exportToCSV}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </button>
          </div>
        )}
      </div>

      {/* Statement Parameters Guide */}
      <div className="rounded-lg border p-4 bg-blue-50">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-3 w-3 text-blue-600" />
            </div>
          </div>
          <div className="text-sm">
            <p className="font-medium text-blue-900">Statement Configuration Guide:</p>
            <div className="text-blue-800 mt-1 space-y-1">
              <p><strong>Statement Type:</strong> Detailed shows all transactions, Summary shows totals only</p>
              <p><strong>Include Paid Items:</strong> Show fully paid invoices in addition to outstanding items</p>
              <p><strong>Show Aging:</strong> Include aging analysis showing how long invoices have been outstanding</p>
              <p><strong>Date Range:</strong> Transactions within this period will be included in the statement</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-lg border p-4">
        <h3 className="text-lg font-medium mb-4">Statement Parameters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

          <div className="space-y-2">
            <label className="text-sm font-medium">Statement Type</label>
            <select
              value={statementType}
              onChange={(e) => setStatementType(e.target.value as 'detailed' | 'summary')}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="detailed">Detailed</option>
              <option value="summary">Summary</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Options</label>
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={includePaidItems}
                  onChange={(e) => setIncludePaidItems(e.target.checked)}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm">Include Paid Items</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={showAging}
                  onChange={(e) => setShowAging(e.target.checked)}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm">Show Aging</span>
              </label>
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
          {/* Statement Preview */}
          {showPreview && selectedCustomer && filteredStatementData.length > 0 && (
            <div className="rounded-lg border p-6 bg-white">
              <div className="text-center border-b-2 border-black pb-4 mb-6">
                <h2 className="text-2xl font-bold">CUSTOMER STATEMENT</h2>
              </div>
              
              <div className="text-center mb-6">
                <div className="font-bold">Your Company Name</div>
                <div>123 Business Street</div>
                <div>City, State ZIP</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <div><strong>STATEMENT FOR:</strong> {selectedCustomer.name}</div>
                  <div><strong>ACCOUNT NUMBER:</strong> {selectedCustomer.customer_code}</div>
                </div>
                <div>
                  <div><strong>STATEMENT DATE:</strong> {formatDate(toDate)}</div>
                  <div><strong>STATEMENT PERIOD:</strong> {formatDate(fromDate)} to {formatDate(toDate)}</div>
                </div>
              </div>

              <h3 className="font-bold text-lg mb-4">TRANSACTION HISTORY</h3>
              <div className="overflow-x-auto mb-6">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-4 py-2 text-left">Date</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Type</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Reference</th>
                      <th className="border border-gray-300 px-4 py-2 text-right">Amount</th>
                      <th className="border border-gray-300 px-4 py-2 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStatementData
                      .sort((a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime())
                      .map((item, index) => {
                        const runningBalance = filteredStatementData
                          .slice(0, index + 1)
                          .reduce((sum, t) => {
                            return sum + (t.ar_transaction_type_name && t.ar_transaction_type_name.includes('Invoice') ? t.total_amount : -t.total_amount);
                          }, 0);
                        
                        return (
                          <tr key={item.id}>
                            <td className="border border-gray-300 px-4 py-2">{formatDate(item.transaction_date)}</td>
                            <td className="border border-gray-300 px-4 py-2">{item.ar_transaction_type_name || 'Unknown'}</td>
                            <td className="border border-gray-300 px-4 py-2">{item.document_number}</td>
                            <td className="border border-gray-300 px-4 py-2 text-right">
                              {item.ar_transaction_type_name && item.ar_transaction_type_name.includes('Invoice') ? '' : '-'}{formatCurrency(Math.abs(item.total_amount))}
                            </td>
                            <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(runningBalance)}</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>

              {showAging && (
                <div className="mb-6">
                  <h3 className="font-bold text-lg mb-4">AGING SUMMARY</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-300 px-4 py-2">Current</th>
                          <th className="border border-gray-300 px-4 py-2">30 Days</th>
                          <th className="border border-gray-300 px-4 py-2">60 Days</th>
                          <th className="border border-gray-300 px-4 py-2">90+ Days</th>
                          <th className="border border-gray-300 px-4 py-2">TOTAL DUE</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(aging.current)}</td>
                          <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(aging.days30)}</td>
                          <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(aging.days60)}</td>
                          <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(aging.days90Plus)}</td>
                          <td className="border border-gray-300 px-4 py-2 text-right font-bold">
                            {formatCurrency(aging.current + aging.days30 + aging.days60 + aging.days90Plus)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="text-center mt-6">
                <div className="font-bold text-lg text-green-600">
                  Account Status: {(aging.current + aging.days30 + aging.days60 + aging.days90Plus) === 0 ? 'PAID IN FULL' : 'OUTSTANDING BALANCE'}
                </div>
              </div>
            </div>
          )}

          {/* Statement Table */}
          {!showPreview && (
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
                    {filteredStatementData.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="h-32 text-center">
                          <div className="flex flex-col items-center justify-center space-y-2">
                            <FileText className="h-8 w-8 text-gray-600" />
                            <p className="text-sm text-gray-600">
                              {customerId 
                                ? 'No transactions found for the selected period and criteria.'
                                : 'Please select a customer to view their statement.'
                              }
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredStatementData
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
                              <span className="text-sm">{item.ar_transaction_type_name || 'Unknown'}</span>
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
          )}

          {/* Enhanced Summary with Aging */}
          {filteredStatementData.length > 0 && (
            <>
              {/* Financial Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="rounded-md border p-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Total Transactions</p>
                    <p className="text-2xl font-bold">{filteredStatementData.length}</p>
                  </div>
                </div>
                <div className="rounded-md border p-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Total Invoiced</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(
                        filteredStatementData
                          .filter(item => item.ar_transaction_type_name && item.ar_transaction_type_name.includes('Invoice'))
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
                        filteredStatementData
                          .filter(item => item.ar_transaction_type_name && item.ar_transaction_type_name.includes('Receipt'))
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
                        filteredStatementData
                          .filter(item => item.open_amount > 0)
                          .reduce((sum, item) => sum + item.open_amount, 0)
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Aging Analysis */}
              {showAging && (
                <div className="rounded-md border p-6">
                  <h3 className="text-lg font-medium mb-4">Aging Analysis</h3>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="rounded-md border p-4 bg-green-50">
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Current</p>
                        <p className="text-xl font-bold text-green-600">{formatCurrency(aging.current)}</p>
                        <p className="text-xs text-gray-500">0-30 days</p>
                      </div>
                    </div>
                    <div className="rounded-md border p-4 bg-yellow-50">
                      <div className="text-center">
                        <p className="text-sm text-gray-600">30 Days</p>
                        <p className="text-xl font-bold text-yellow-600">{formatCurrency(aging.days30)}</p>
                        <p className="text-xs text-gray-500">31-60 days</p>
                      </div>
                    </div>
                    <div className="rounded-md border p-4 bg-orange-50">
                      <div className="text-center">
                        <p className="text-sm text-gray-600">60 Days</p>
                        <p className="text-xl font-bold text-orange-600">{formatCurrency(aging.days60)}</p>
                        <p className="text-xs text-gray-500">61-90 days</p>
                      </div>
                    </div>
                    <div className="rounded-md border p-4 bg-red-50">
                      <div className="text-center">
                        <p className="text-sm text-gray-600">90+ Days</p>
                        <p className="text-xl font-bold text-red-600">{formatCurrency(aging.days90Plus)}</p>
                        <p className="text-xs text-gray-500">Over 90 days</p>
                      </div>
                    </div>
                    <div className="rounded-md border p-4 bg-gray-100">
                      <div className="text-center">
                        <p className="text-sm text-gray-600">TOTAL DUE</p>
                        <p className="text-xl font-bold text-gray-900">
                          {formatCurrency(aging.current + aging.days30 + aging.days60 + aging.days90Plus)}
                        </p>
                        <p className="text-xs text-gray-500">All periods</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Account Status */}
                  <div className="mt-6 text-center">
                    <div className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-medium ${
                      (aging.current + aging.days30 + aging.days60 + aging.days90Plus) === 0 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      Account Status: {(aging.current + aging.days30 + aging.days60 + aging.days90Plus) === 0 ? 'PAID IN FULL' : 'OUTSTANDING BALANCE'}
                    </div>
                  </div>
                </div>
              )}
            </>
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
              <p className="font-medium text-blue-900">Customer Statement - Step-by-Step Guide</p>
              <div className="text-blue-800 mt-2 space-y-2">
                <div><strong>Step 1:</strong> Select a customer from the dropdown</div>
                <div><strong>Step 2:</strong> Choose statement period (From Date to To Date)</div>
                <div><strong>Step 3:</strong> Configure statement options:</div>
                <ul className="ml-4 list-disc space-y-1">
                  <li><strong>Statement Type:</strong> Detailed (all transactions) or Summary (totals only)</li>
                  <li><strong>Include Paid Items:</strong> Show fully paid invoices in addition to outstanding items</li>
                  <li><strong>Show Aging:</strong> Include aging analysis showing overdue amounts</li>
                </ul>
                <div><strong>Step 4:</strong> Click "Generate Statement" to create the report</div>
                <div><strong>Step 5:</strong> Use "Preview" to see print format, "Print" for PDF, or "Email" to send to customer</div>
                <div className="mt-3 p-3 bg-blue-100 rounded-md">
                  <p className="font-semibold text-blue-900">💡 Example Output:</p>
                  <p className="text-blue-800 text-xs">
                    Statement shows transaction history, current balance, aging buckets (Current, 30-day, 60-day, 90+ day), 
                    and account status (Paid in Full vs Outstanding Balance). Perfect for customer reconciliation and collection efforts.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
