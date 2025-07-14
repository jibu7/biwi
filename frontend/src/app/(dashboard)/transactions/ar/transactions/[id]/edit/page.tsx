'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, X } from 'lucide-react';
import Link from 'next/link';
import { arTransactionService, customerService, arTransactionTypeService } from '@/services/arService';
import { ARTransactionUpdate } from '@/types/ar';
import { usePermissions } from '@/hooks/usePermissions';
import { AR_TRANSACTIONS_POST } from '@/lib/permissions';

export default function ARTransactionEditPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const transactionId = params ? parseInt(params.id as string, 10) : 0;

  const [formData, setFormData] = useState<ARTransactionUpdate>({
    customer_id: 0,
    ar_transaction_type_id: 0,
    transaction_date: '',
    due_date: '',
    reference: '',
    total_amount: 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch transaction data
  const { data: transaction, isLoading: transactionLoading } = useQuery({
    queryKey: ['ar-transaction', transactionId],
    queryFn: () => arTransactionService.getById(transactionId),
    enabled: hasPermission(AR_TRANSACTIONS_POST) && !isNaN(transactionId),
  });

  // Fetch customers
  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customerService.getAll(),
    enabled: hasPermission(AR_TRANSACTIONS_POST),
  });

  // Fetch transaction types
  const { data: transactionTypes = [] } = useQuery({
    queryKey: ['ar-transaction-types'],
    queryFn: () => arTransactionTypeService.getAll(),
    enabled: hasPermission(AR_TRANSACTIONS_POST),
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: ARTransactionUpdate) => arTransactionService.update(transactionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ar-transaction', transactionId] });
      queryClient.invalidateQueries({ queryKey: ['ar-transactions'] });
      router.push(`/transactions/ar/transactions/${transactionId}`);
    },
    onError: (error: unknown) => {
      console.error('Failed to update transaction:', error);
      type ErrorResponse = { response?: { data?: { detail?: string } } };
      if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as ErrorResponse).response?.data?.detail === 'string'
      ) {
        setErrors({ submit: (error as ErrorResponse).response!.data!.detail! });
      } else {
        setErrors({ submit: 'Failed to update transaction. Please try again.' });
      }
    },
  });

  // Initialize form data when transaction loads
  useEffect(() => {
    if (transaction) {
      setFormData({
        customer_id: transaction.customer_id,
        ar_transaction_type_id: transaction.ar_transaction_type_id,
        transaction_date: transaction.transaction_date,
        due_date: transaction.due_date || '',
        reference: transaction.reference || '',
        total_amount: transaction.total_amount,
      });
    }
  }, [transaction]);

  if (!hasPermission(AR_TRANSACTIONS_POST)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
          <p className="text-gray-600 mt-2">You don&apos;t have permission to edit AR transactions.</p>
        </div>
      </div>
    );
  }

  if (transactionLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading transaction...</p>
        </div>
      </div>
    );
  }

  if (!transaction) {
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

  if (transaction.status === 'Posted' || transaction.is_posted_to_gl) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Cannot Edit Posted Transaction</h2>
          <p className="text-gray-600 mt-2">This transaction has been posted to GL and cannot be edited.</p>
          <Link 
            href={`/transactions/ar/transactions/${transactionId}`}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            View Transaction
          </Link>
        </div>
      </div>
    );
  }

  const handleInputChange = (field: keyof ARTransactionUpdate, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.customer_id) {
      newErrors.customer_id = 'Customer is required';
    }
    if (!formData.ar_transaction_type_id) {
      newErrors.ar_transaction_type_id = 'Transaction type is required';
    }
    if (!formData.transaction_date) {
      newErrors.transaction_date = 'Transaction date is required';
    }
    if (!formData.total_amount || formData.total_amount <= 0) {
      newErrors.total_amount = 'Amount must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      updateMutation.mutate(formData);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href={`/transactions/ar/transactions/${transactionId}`}
              className="rounded-md p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                Edit Transaction {transaction.document_number}
              </h1>
              <p className="text-gray-600">
                {transaction.customer_name}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Transaction Information</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Customer */}
                <div>
                  <label htmlFor="customer_id" className="block text-sm font-medium text-gray-700">
                    Customer *
                  </label>
                  <select
                    id="customer_id"
                    value={formData.customer_id}
                    onChange={(e) => handleInputChange('customer_id', parseInt(e.target.value))}
                    className={`mt-1 block w-full border rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      errors.customer_id ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select Customer</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                  {errors.customer_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.customer_id}</p>
                  )}
                </div>

                {/* Transaction Type */}
                <div>
                  <label htmlFor="ar_transaction_type_id" className="block text-sm font-medium text-gray-700">
                    Transaction Type *
                  </label>
                  <select
                    id="ar_transaction_type_id"
                    value={formData.ar_transaction_type_id}
                    onChange={(e) => handleInputChange('ar_transaction_type_id', parseInt(e.target.value))}
                    className={`mt-1 block w-full border rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      errors.ar_transaction_type_id ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select Type</option>
                    {transactionTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                  {errors.ar_transaction_type_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.ar_transaction_type_id}</p>
                  )}
                </div>

                {/* Transaction Date */}
                <div>
                  <label htmlFor="transaction_date" className="block text-sm font-medium text-gray-700">
                    Transaction Date *
                  </label>
                  <input
                    type="date"
                    id="transaction_date"
                    value={formData.transaction_date}
                    onChange={(e) => handleInputChange('transaction_date', e.target.value)}
                    className={`mt-1 block w-full border rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      errors.transaction_date ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.transaction_date && (
                    <p className="mt-1 text-sm text-red-600">{errors.transaction_date}</p>
                  )}
                </div>

                {/* Due Date */}
                <div>
                  <label htmlFor="due_date" className="block text-sm font-medium text-gray-700">
                    Due Date
                  </label>
                  <input
                    type="date"
                    id="due_date"
                    value={formData.due_date}
                    onChange={(e) => handleInputChange('due_date', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Total Amount */}
                <div>
                  <label htmlFor="total_amount" className="block text-sm font-medium text-gray-700">
                    Total Amount *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    id="total_amount"
                    value={formData.total_amount}
                    onChange={(e) => handleInputChange('total_amount', parseFloat(e.target.value) || 0)}
                    className={`mt-1 block w-full border rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      errors.total_amount ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.total_amount && (
                    <p className="mt-1 text-sm text-red-600">{errors.total_amount}</p>
                  )}
                </div>

                {/* Reference */}
                <div>
                  <label htmlFor="reference" className="block text-sm font-medium text-gray-700">
                    Reference
                  </label>
                  <input
                    type="text"
                    id="reference"
                    value={formData.reference}
                    onChange={(e) => handleInputChange('reference', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3">
            <Link
              href={`/transactions/ar/transactions/${transactionId}`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Link>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updateMutation.isPending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
