'use client';


import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, FileText, Calendar, User, DollarSign, CreditCard, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { ARTransactionCreate, Customer, ARTransactionType } from '@/types/ar';
import { arTransactionService, customerService, arTransactionTypeService } from '@/services/arService';
import { usePermissions } from '@/hooks/usePermissions';
import { AR_TRANSACTIONS_POST } from '@/lib/permissions';
import Toast from '@/components/ui/Toast';

const receiptSchema = z.object({
  customer_id: z.number().min(1, 'Customer is required'),
  ar_transaction_type_id: z.number().min(1, 'Transaction type is required'),
  transaction_date: z.string().min(1, 'Transaction date is required'),
  reference: z.string().optional(),
  document_number: z.string().min(1, 'Document number is required'),
  total_amount: z.number().min(0.01, 'Amount must be greater than 0'),
  payment_method: z.string().min(1, 'Payment method is required'),
});

type ReceiptFormData = z.infer<typeof receiptSchema>;

export default function NewReceiptPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' | 'info' } | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);

  const { data: customers = [], isLoading: loadingCustomers } = useQuery<Customer[], Error>({
    queryKey: ['customers'],
    queryFn: () => customerService.getAll(),
  });

  const { data: transactionTypes = [], isLoading: loadingTypes } = useQuery<ARTransactionType[], Error>({
    queryKey: ['ar-transaction-types'],
    queryFn: () => arTransactionTypeService.getAll(),
  });

  const receiptTypes = (transactionTypes || []).filter((type: ARTransactionType) => type.base_type === 'Receipt' && type.is_active);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ReceiptFormData>({
    resolver: zodResolver(receiptSchema),
    defaultValues: {
      transaction_date: new Date().toISOString().split('T')[0],
      total_amount: 0,
      payment_method: 'Check',
    },
  });

  // Auto-generate document number
  useEffect(() => {
    const generateDocumentNumber = () => {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      return `RCP-${year}${month}-${random}`;
    };

    setValue('document_number', generateDocumentNumber());
  }, [setValue]);

  const createMutation = useMutation({
    mutationFn: (data: ARTransactionCreate) => arTransactionService.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ar-transactions'] });
      setToast({ 
        message: `Receipt ${data.document_number} created successfully! Next: Post it, then allocate to invoices to mark them as paid.`, 
        type: 'success' 
      });
      // Navigate after a longer delay to show the message
      setTimeout(() => {
        router.push('/transactions/ar/receipts');
      }, 3000);
    },
    onError: (error: unknown) => {
      console.error('Error creating receipt:', error);
      type ErrorResponse = { response?: { data?: { detail?: string } } };
      let errorMessage = 'Failed to create receipt';
      if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as ErrorResponse).response?.data?.detail === 'string'
      ) {
        errorMessage = (error as ErrorResponse).response!.data!.detail!;
      }
      setToast({ message: errorMessage, type: 'error' });
    },
  });

  const onSubmit = async (data: ReceiptFormData) => {
    if (!hasPermission(AR_TRANSACTIONS_POST)) {
      setToast({ message: 'You do not have permission to create receipts', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    try {
      // Prepare the transaction data
      const transactionData: ARTransactionCreate = {
        customer_id: data.customer_id,
        ar_transaction_type_id: data.ar_transaction_type_id,
        transaction_date: data.transaction_date,
        document_number: data.document_number,
        total_amount: Number(data.total_amount),
        // Use reference field for payment method and description
        reference: data.reference || `${data.payment_method} payment`,
      };

      await createMutation.mutateAsync(transactionData);
    } catch (error: unknown) {
      console.error('Error:', error);
      // Error handling is done in the mutation's onError callback
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!hasPermission(AR_TRANSACTIONS_POST)) {
    return (
      <div className="p-6">
        <div className="text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">Access Denied</h3>
          <p className="mt-1 text-sm text-gray-500">
            You don&apos;t have permission to create receipts.
          </p>
          <Link
            href="/transactions/ar/receipts"
            className="mt-4 inline-flex items-center text-sm text-primary hover:underline"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Receipts
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href="/transactions/ar/receipts"
              className="rounded-md p-2 hover:bg-gray-100 text-gray-700"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">New Receipt</h1>
              <p className="text-gray-600">
                Record a new customer payment
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">Customer *</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
                <select
                  {...register('customer_id', { 
                    valueAsNumber: true,
                    onChange: (e) => setSelectedCustomerId(Number(e.target.value) || null)
                  })}
                  className="w-full rounded-md border border-gray-300 bg-white px-10 py-2 text-sm text-gray-900 ring-offset-background placeholder:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
              {errors.customer_id && (
                <p className="text-sm text-red-600">{errors.customer_id.message}</p>
              )}
              {selectedCustomerId && (
                <div className="mt-2 p-2 bg-gray-50 rounded-md">
                  <p className="text-xs text-gray-600">
                    Current Balance: $
                    {(() => {
                      const customer = customers.find(c => c.id === selectedCustomerId);
                      const balance = customer?.current_balance;
                      if (balance === null || balance === undefined) return '0.00';
                      const numBalance = typeof balance === 'string' ? parseFloat(balance) : balance;
                      return isNaN(numBalance) ? '0.00' : numBalance.toFixed(2);
                    })()}
                  </p>
                </div>
              )}
            </div>

            {/* Transaction Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">Receipt Type *</label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
                <select
                  {...register('ar_transaction_type_id', { valueAsNumber: true })}
                  className="w-full rounded-md border border-gray-300 bg-white px-10 py-2 text-sm text-gray-900 ring-offset-background placeholder:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  disabled={loadingTypes}
                >
                  <option value="">Select receipt type</option>
                  {receiptTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>
              {errors.ar_transaction_type_id && (
                <p className="text-sm text-red-600">{errors.ar_transaction_type_id.message}</p>
              )}
            </div>

            {/* Transaction Date */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">Receipt Date *</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
                <input
                  type="date"
                  {...register('transaction_date')}
                  className="w-full rounded-md border border-gray-300 bg-white px-10 py-2 text-sm text-gray-900 ring-offset-background placeholder:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
              {errors.transaction_date && (
                <p className="text-sm text-red-600">{errors.transaction_date.message}</p>
              )}
            </div>

            {/* Document Number */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">Receipt Number *</label>
              <input
                type="text"
                {...register('document_number')}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 ring-offset-background placeholder:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Enter receipt number"
              />
              {errors.document_number && (
                <p className="text-sm text-red-600">{errors.document_number.message}</p>
              )}
            </div>

            {/* Reference */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">Reference</label>
              <input
                type="text"
                {...register('reference')}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 ring-offset-background placeholder:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Enter reference (e.g., CHK-001, bank reference)"
              />
              {errors.reference && (
                <p className="text-sm text-red-600">{errors.reference.message}</p>
              )}
              <p className="text-xs text-gray-600">
                Optional: Check number, bank reference, or other payment identifier
              </p>
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">Payment Method *</label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
                <select
                  {...register('payment_method')}
                  className="w-full rounded-md border border-gray-300 bg-white px-10 py-2 text-sm text-gray-900 ring-offset-background placeholder:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="Check">Check</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Wire Transfer">Wire Transfer</option>
                  <option value="EFT">Electronic Funds Transfer (EFT)</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              {errors.payment_method && (
                <p className="text-sm text-red-600">{errors.payment_method.message}</p>
              )}
            </div>

            {/* Total Amount */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">Receipt Amount *</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('total_amount', { valueAsNumber: true })}
                  className="w-full rounded-md border border-gray-300 bg-white px-10 py-2 text-sm text-gray-900 ring-offset-background placeholder:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="0.00"
                />
              </div>
              {errors.total_amount && (
                <p className="text-sm text-red-600">{errors.total_amount.message}</p>
              )}
              <p className="text-xs text-gray-600">
                Enter the amount received from the customer
              </p>
            </div>
          </div>
        </div>

        // ...existing code...

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <Link
            href="/transactions/ar/receipts"
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-600/90 disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {isSubmitting ? 'Creating...' : 'Create Receipt'}
          </button>
        </div>
      </form>
    </div>
    </div>
  );
}
