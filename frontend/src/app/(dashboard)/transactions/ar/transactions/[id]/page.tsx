'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Edit, FileText, DollarSign, Calendar, User, Building, MessageSquare, CheckCircle, Printer, Download } from 'lucide-react';
import Link from 'next/link';
import { arTransactionService, arTransactionTypeService } from '@/services/arService';
import { companyService } from '@/services/companyService';
import { ARTransaction } from '@/types/ar';
import { Company } from '@/types';
import { usePermissions } from '@/hooks/usePermissions';
import { AR_TRANSACTIONS_POST, AR_REPORTS_VIEW } from '@/lib/permissions';

export default function ARTransactionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const transactionId = params ? parseInt(params.id as string, 10) : 0;
  const [showPrintDialog, setShowPrintDialog] = useState(false);

  const { data: transaction, isLoading, error } = useQuery({
    queryKey: ['ar-transaction', transactionId],
    queryFn: () => arTransactionService.getById(transactionId),
    enabled: hasPermission(AR_REPORTS_VIEW) && !isNaN(transactionId),
  });

  // Fetch transaction types to get base_type for current transaction
  const { data: transactionTypes = [] } = useQuery({
    queryKey: ['ar-transaction-types'],
    queryFn: () => arTransactionTypeService.getAll(),
    enabled: !!transaction,
  });

  // Fetch current company information
  const { data: company } = useQuery({
    queryKey: ['current-company'],
    queryFn: () => companyService.getCurrentCompany(),
  });

  const currentTransactionType = transactionTypes.find(t => t.id === transaction?.ar_transaction_type_id);

  const createPrintContent = () => {
    const companyName = company?.name || 'Your Company Name';
    const companyAddress = company?.address ? 
      (typeof company.address === 'string' ? company.address : 
       `${company.address.street || company.address.address_line_1 || ''} ${company.address.city || ''} ${company.address.state || ''} ${company.address.zip || company.address.postal_code || ''}`.trim()) 
      : '';
    const companyContact = company?.contact_info ?
      (typeof company.contact_info === 'string' ? company.contact_info :
       `${company.contact_info.phone || ''} ${company.contact_info.email || ''}`.trim()) : '';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${transaction?.document_number}</title>
          <style>
            @media print {
              @page { margin: 0.5in; size: A4; }
              body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
            }
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              line-height: 1.4;
              color: #333;
            }
            .header { 
              display: flex; 
              justify-content: space-between; 
              align-items: flex-start;
              border-bottom: 3px solid #2563eb; 
              padding-bottom: 20px; 
              margin-bottom: 30px; 
            }
            .company-info {
              flex: 1;
            }
            .company-name { 
              font-size: 28px; 
              font-weight: bold; 
              color: #2563eb;
              margin-bottom: 8px; 
            }
            .company-details {
              font-size: 14px;
              color: #666;
              line-height: 1.5;
            }
            .invoice-title { 
              text-align: right;
              flex: 1;
            }
            .invoice-title h1 {
              font-size: 36px; 
              color: #2563eb;
              margin: 0;
              font-weight: bold;
            }
            .invoice-number {
              font-size: 18px;
              color: #666;
              margin-top: 5px;
            }
            
            .invoice-details { 
              display: flex; 
              justify-content: space-between; 
              margin-bottom: 40px; 
            }
            .bill-to, .invoice-info { 
              flex: 1; 
              margin-right: 40px;
            }
            .invoice-info {
              margin-right: 0;
            }
            .section-title { 
              font-size: 16px; 
              font-weight: bold;
              margin-bottom: 15px; 
              color: #2563eb;
              border-bottom: 2px solid #e5e7eb; 
              padding-bottom: 5px; 
            }
            .detail-row { 
              margin: 8px 0; 
              font-size: 14px; 
              display: flex;
              justify-content: space-between;
            }
            .detail-label {
              font-weight: 600;
              color: #374151;
              min-width: 120px;
            }
            .detail-value {
              color: #111827;
            }
            
            .items-section {
              margin: 40px 0;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            .items-table th {
              background-color: #f3f4f6;
              border: 1px solid #d1d5db;
              padding: 12px;
              text-align: left;
              font-weight: 600;
              color: #374151;
            }
            .items-table td {
              border: 1px solid #d1d5db;
              padding: 12px;
              text-align: left;
            }
            .items-table .amount {
              text-align: right;
            }
            
            .totals-section { 
              margin-top: 40px; 
              display: flex;
              justify-content: flex-end;
            }
            .totals-table {
              min-width: 300px;
            }
            .totals-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid #e5e7eb;
            }
            .totals-row.total {
              border-bottom: 3px double #2563eb;
              font-weight: bold;
              font-size: 18px;
              color: #2563eb;
              padding: 15px 0;
            }
            
            .payment-terms {
              margin-top: 40px;
              padding: 20px;
              background-color: #f9fafb;
              border-left: 4px solid #2563eb;
            }
            .payment-terms h3 {
              color: #2563eb;
              margin-top: 0;
            }
            
            .footer { 
              margin-top: 50px; 
              text-align: center; 
              font-size: 12px; 
              color: #6b7280;
              border-top: 1px solid #e5e7eb;
              padding-top: 20px;
            }
            
            .status-badge {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: 600;
              text-transform: uppercase;
              margin-top: 10px;
            }
            .status-draft { background-color: #fef3c7; color: #92400e; }
            .status-posted { background-color: #d1fae5; color: #065f46; }
            .status-paid { background-color: #dbeafe; color: #1e40af; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-info">
              <div class="company-name">${companyName}</div>
              <div class="company-details">
                ${companyAddress ? `<div>${companyAddress}</div>` : ''}
                ${companyContact ? `<div>${companyContact}</div>` : ''}
              </div>
            </div>
            <div class="invoice-title">
              <h1>INVOICE</h1>
              <div class="invoice-number">#${transaction?.document_number}</div>
              ${transaction?.status ? `<div class="status-badge status-${transaction.status.toLowerCase().replace(/\s+/g, '')}">${transaction.status}</div>` : ''}
            </div>
          </div>
          
          <div class="invoice-details">
            <div class="bill-to">
              <div class="section-title">Bill To:</div>
              <div style="font-size: 16px; font-weight: 600; margin-bottom: 10px;">${transaction?.customer_name || 'N/A'}</div>
              <div style="color: #6b7280; font-size: 14px;">Customer ID: ${transaction?.customer_id || 'N/A'}</div>
            </div>
            
            <div class="invoice-info">
              <div class="section-title">Invoice Information:</div>
              <div class="detail-row">
                <span class="detail-label">Invoice Date:</span>
                <span class="detail-value">${transaction ? formatDate(transaction.transaction_date) : 'N/A'}</span>
              </div>
              ${transaction?.due_date ? `
                <div class="detail-row">
                  <span class="detail-label">Due Date:</span>
                  <span class="detail-value">${formatDate(transaction.due_date)}</span>
                </div>
              ` : ''}
              ${transaction?.reference ? `
                <div class="detail-row">
                  <span class="detail-label">Reference:</span>
                  <span class="detail-value">${transaction.reference}</span>
                </div>
              ` : ''}
              ${transaction?.ar_transaction_type_name ? `
                <div class="detail-row">
                  <span class="detail-label">Type:</span>
                  <span class="detail-value">${transaction.ar_transaction_type_name}</span>
                </div>
              ` : ''}
            </div>
          </div>
          
          <div class="items-section">
            <div class="section-title">Invoice Items:</div>
            <table class="items-table">
              <thead>
                <tr>
                  <th style="width: 60%;">Description</th>
                  <th style="width: 15%;">Quantity</th>
                  <th style="width: 25%;" class="amount">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <div style="font-weight: 600;">${transaction?.ar_transaction_type_name || 'Professional Services'}</div>
                    <div style="color: #6b7280; font-size: 13px;">
                      ${transaction?.reference ? `Reference: ${transaction.reference}` : 'Services rendered as per agreement'}
                    </div>
                  </td>
                  <td>1</td>
                  <td class="amount">${transaction ? formatCurrency(transaction.total_amount) : '$0.00'}</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div class="totals-section">
            <div class="totals-table">
              <div class="totals-row">
                <span>Subtotal:</span>
                <span>${transaction ? formatCurrency(transaction.total_amount) : '$0.00'}</span>
              </div>
              <div class="totals-row">
                <span>Tax (0%):</span>
                <span>$0.00</span>
              </div>
              <div class="totals-row total">
                <span>Total Amount:</span>
                <span>${transaction ? formatCurrency(transaction.total_amount) : '$0.00'}</span>
              </div>
              ${transaction?.open_amount && transaction.open_amount > 0 ? `
                <div class="totals-row" style="color: #dc2626; font-weight: 600; margin-top: 10px;">
                  <span>Amount Due:</span>
                  <span>${formatCurrency(transaction.open_amount)}</span>
                </div>
              ` : ''}
              ${transaction?.open_amount === 0 ? `
                <div class="totals-row" style="color: #059669; font-weight: 600; margin-top: 10px;">
                  <span>Status:</span>
                  <span>PAID IN FULL</span>
                </div>
              ` : ''}
            </div>
          </div>
          
          ${transaction?.due_date ? `
            <div class="payment-terms">
              <h3>Payment Terms & Information</h3>
              <p><strong>Due Date:</strong> ${formatDate(transaction.due_date)}</p>
              <p>Please reference invoice number <strong>${transaction.document_number}</strong> when making payment.</p>
              <p style="margin: 10px 0 0 0; font-size: 13px; color: #6b7280;">
                Late payments may be subject to fees. Thank you for your prompt payment.
              </p>
            </div>
          ` : ''}
          
          <div class="footer">
            <p><strong>Thank you for your business!</strong></p>
            <p style="margin: 10px 0 5px 0;">Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
            <p style="font-size: 11px;">This is a computer-generated invoice.</p>
          </div>
        </body>
      </html>
    `;
  };

  const handlePrint = () => {
    setShowPrintDialog(true);
  };

  const handlePrintConfirm = (format: 'pdf' | 'direct') => {
    setShowPrintDialog(false);
    
    if (format === 'pdf') {
      // Create print-friendly content in a new window
      const printContent = createPrintContent();
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        // Small delay to ensure content is loaded before printing
        setTimeout(() => {
          printWindow.print();
        }, 500);
      }
    } else {
      // Direct print of current page
      window.print();
    }
  };

  // PrintDialog Component
  const PrintDialog = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Print Invoice</h3>
        <p className="text-sm text-gray-600 mb-6">
          Select your preferred print format for Invoice {transaction?.document_number}
        </p>
        
        <div className="space-y-3 mb-6">
          <button
            onClick={() => handlePrintConfirm('pdf')}
            className="w-full flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Download className="h-5 w-5 text-blue-600 mr-3" />
            <div className="text-left">
              <div className="font-medium text-gray-900">PDF Format</div>
              <div className="text-sm text-gray-500">Recommended for sharing and archiving</div>
            </div>
          </button>
          
          <button
            onClick={() => handlePrintConfirm('direct')}
            className="w-full flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Printer className="h-5 w-5 text-green-600 mr-3" />
            <div className="text-left">
              <div className="font-medium text-gray-900">Print Directly</div>
              <div className="text-sm text-gray-500">Send directly to printer</div>
            </div>
          </button>
        </div>
        
        <div className="flex justify-end">
          <button
            onClick={() => setShowPrintDialog(false)}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  if (!hasPermission(AR_REPORTS_VIEW)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
          <p className="text-gray-600 mt-2">You don't have permission to view AR transactions.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading transaction details...</p>
        </div>
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Transaction Not Found</h2>
          <p className="text-gray-600 mt-2">The requested transaction could not be found.</p>
          <Link 
            href="/transactions/ar/list"
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Transactions
          </Link>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'Posted':
        return 'bg-green-100 text-green-800';
      case 'Paid':
        return 'bg-blue-100 text-blue-800';
      case 'PartiallyPaid':
        return 'bg-orange-100 text-orange-800';
      case 'Voided':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTransactionIcon = (baseType: string) => {
    switch (baseType) {
      case 'Invoice':
        return <FileText className="h-6 w-6 text-blue-600" />;
      case 'Receipt':
        return <DollarSign className="h-6 w-6 text-green-600" />;
      case 'Credit Note':
        return <MessageSquare className="h-6 w-6 text-orange-600" />;
      default:
        return <FileText className="h-6 w-6 text-gray-600" />;
    }
  };

  const handlePrintInvoice = (format: 'pdf' | 'html') => {
    if (format === 'pdf') {
      // Create print-friendly content in a new window
      const printContent = createPrintContent();
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        // Small delay to ensure content is loaded before printing
        setTimeout(() => {
          printWindow.print();
        }, 500);
      }
    } else {
      // Direct print of current page
      window.print();
    }
    setShowPrintDialog(false);
  };

  return (
    <>
      <style jsx>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { font-size: 12pt; }
          .bg-gray-50 { background: white !important; }
          .shadow { box-shadow: none !important; }
          .border { border: 1px solid #ccc !important; }
        }
      `}</style>
      
    <div className="min-h-screen bg-gray-50">
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between no-print">
          <div className="flex items-center space-x-4">
            <Link
              href="/transactions/ar/list"
              className="rounded-md p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center space-x-3">
              {getTransactionIcon(currentTransactionType?.base_type || '')}
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                  {currentTransactionType?.name} {transaction.document_number}
                </h1>
                <p className="text-gray-600">
                  {transaction.customer_name}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${getStatusColor(transaction.status)}`}>
              {transaction.status === 'Posted' && <CheckCircle className="h-4 w-4 mr-1" />}
              {transaction.status}
            </span>
            {hasPermission(AR_TRANSACTIONS_POST) && transaction.status === 'Draft' && (
              <Link
                href={`/transactions/ar/transactions/${transaction.id}/edit`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Transaction
              </Link>
            )}
          </div>
        </div>
        
        {/* Print-only header */}
        <div className="hidden print-only">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold">{company?.name || 'Your Company Name'}</h1>
            <h2 className="text-xl">INVOICE</h2>
            <p className="text-lg">{transaction.document_number}</p>
          </div>
        </div>

        {/* Transaction Details Card */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Transaction Details</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Document Number</label>
                  <div className="mt-1 flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-900 font-mono">{transaction.document_number}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Customer</label>
                  <div className="mt-1 flex items-center space-x-2">
                    <Building className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-900">{transaction.customer_name}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Transaction Type</label>
                  <div className="mt-1">
                    <span className="text-sm text-gray-900">{transaction.ar_transaction_type_name || currentTransactionType?.name}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Transaction Date</label>
                  <div className="mt-1 flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-900">{formatDate(transaction.transaction_date)}</span>
                  </div>
                </div>
                {transaction.due_date && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Due Date</label>
                    <div className="mt-1 flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-900">{formatDate(transaction.due_date)}</span>
                    </div>
                  </div>
                )}
                {transaction.reference && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Reference</label>
                    <div className="mt-1">
                      <span className="text-sm text-gray-900">{transaction.reference}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Total Amount</label>
                  <div className="mt-1 flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                    <span className="text-lg font-semibold text-gray-900">{formatCurrency(transaction.total_amount)}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Open Amount</label>
                  <div className="mt-1">
                    <span className="text-sm text-gray-900">{formatCurrency(transaction.open_amount)}</span>
                  </div>
                </div>
                {transaction.is_posted_to_gl && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">GL Status</label>
                    <div className="mt-1 flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-700">Posted to GL</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 no-print">
          <Link
            href="/transactions/ar/list"
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Back to List
          </Link>
          {currentTransactionType?.base_type === 'Invoice' && (
            <button
              onClick={handlePrint}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print Invoice
            </button>
          )}
        </div>
      </div>

      {/* Print Dialog */}
      {showPrintDialog && <PrintDialog />}
    </div>
    </>
  );
}
