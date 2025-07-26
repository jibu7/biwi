'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Calendar, 
  CreditCard, 
  Building2, 
  FileText, 
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { apService } from '@/services/apService';
import { cn } from '@/lib/utils';

export default function APTransactionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const transactionId = parseInt(params.id as string);

  const { data: transaction, isLoading, error } = useQuery({
    queryKey: ['apTransaction', transactionId],
    queryFn: () => apService.getAPTransaction(transactionId),
    enabled: !!transactionId,
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => apService.getSuppliers(),
  });

  const { data: transactionTypes = [] } = useQuery({
    queryKey: ['apTransactionTypes'],
    queryFn: () => apService.getAPTransactionTypes(),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading transaction details...</p>
        </div>
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Transaction Not Found</h2>
          <p className="text-gray-600 mb-4">
            The AP transaction you're looking for could not be found.
          </p>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const supplier = suppliers.find(s => s.id === transaction.supplier_id);
  const transactionType = transactionTypes.find(t => t.id === transaction.ap_transaction_type_id);

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'posted':
      case 'paid':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'draft':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      posted: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      draft: 'bg-yellow-100 text-yellow-800',
      open: 'bg-orange-100 text-orange-800',
    };
    
    return (
      <span className={cn(
        'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium',
        statusStyles[status?.toLowerCase() as keyof typeof statusStyles] || 'bg-gray-100 text-gray-800'
      )}>
        {getStatusIcon(status)}
        <span className="ml-2">{status}</span>
      </span>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Math.abs(amount));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to AP Transactions
          </button>
        </div>
      </div>

      {/* Transaction Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {transaction.document_number}
            </h1>
            <p className="text-gray-600 mt-1">
              {transactionType?.name || 'Unknown Type'}
            </p>
          </div>
          <div className="text-right">
            {getStatusBadge(transaction.status)}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Supplier Info */}
          <div className="flex items-start space-x-3">
            <Building2 className="h-5 w-5 text-gray-400 mt-1" />
            <div>
              <p className="text-sm font-medium text-gray-500">Supplier</p>
              <p className="text-sm text-gray-900">
                {supplier ? `${supplier.supplier_code} - ${supplier.name}` : 'Unknown'}
              </p>
            </div>
          </div>

          {/* Transaction Date */}
          <div className="flex items-start space-x-3">
            <Calendar className="h-5 w-5 text-gray-400 mt-1" />
            <div>
              <p className="text-sm font-medium text-gray-500">Transaction Date</p>
              <p className="text-sm text-gray-900">
                {formatDate(transaction.transaction_date)}
              </p>
            </div>
          </div>

          {/* Due Date */}
          <div className="flex items-start space-x-3">
            <Clock className="h-5 w-5 text-gray-400 mt-1" />
            <div>
              <p className="text-sm font-medium text-gray-500">Due Date</p>
              <p className="text-sm text-gray-900">
                {transaction.due_date ? formatDate(transaction.due_date) : 'Not set'}
              </p>
            </div>
          </div>

          {/* Reference */}
          <div className="flex items-start space-x-3">
            <FileText className="h-5 w-5 text-gray-400 mt-1" />
            <div>
              <p className="text-sm font-medium text-gray-500">Reference</p>
              <p className="text-sm text-gray-900">
                {transaction.reference || 'No reference'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Financial Summary</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Amount */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-blue-600">Total Amount</p>
                <p className="text-2xl font-bold text-blue-900">
                  {formatCurrency(transaction.total_amount)}
                </p>
              </div>
            </div>
          </div>

          {/* Open Amount */}
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center">
              <CreditCard className="h-8 w-8 text-orange-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-orange-600">Open Amount</p>
                <p className="text-2xl font-bold text-orange-900">
                  {formatCurrency(transaction.open_amount)}
                </p>
              </div>
            </div>
          </div>

          {/* Paid Amount */}
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-green-600">Paid Amount</p>
                <p className="text-2xl font-bold text-green-900">
                  {formatCurrency(transaction.total_amount - transaction.open_amount)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Details */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Details</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              GL Journal Entry
            </label>
            <p className="text-sm text-gray-900">
              {transaction.linked_gl_journal_entry_id ? 
                `GL Entry #${transaction.linked_gl_journal_entry_id}` : 
                'Not linked'
              }
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Posted to GL
            </label>
            <p className="text-sm text-gray-900">
              {transaction.is_posted_to_gl ? 'Yes' : 'No'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Currency
            </label>
            <p className="text-sm text-gray-900">
              USD (1.000000)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Purchase Order
            </label>
            <p className="text-sm text-gray-900">
              {transaction.purchase_order_id ? 
                `PO #${transaction.purchase_order_id}` : 
                'Not linked'
              }
            </p>
          </div>
        </div>

        {transaction.description && (
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Description
            </label>
            <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
              {transaction.description}
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3">
        <button
          onClick={() => router.back()}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          Close
        </button>
        
        {transaction.status === 'Draft' && (
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Edit Transaction
          </button>
        )}
        
        {transaction.open_amount > 0 && (
          <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
            Record Payment
          </button>
        )}
      </div>
    </div>
  );
}