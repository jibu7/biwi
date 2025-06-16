'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, FileText, Calendar, User, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { ARTransactionCreate } from '@/types/ar';
import { arTransactionService, customerService, arTransactionTypeService } from '@/services/arService';
import { usePermissions } from '@/hooks/usePermissions';
import { AR_TRANSACTIONS_POST } from '@/lib/permissions';

const invoiceSchema = z.object({
  customer_id: z.number().min(1, 'Customer is required'),
  ar_transaction_type_id: z.number().min(1, 'Transaction type is required'),
  transaction_date: z.string().min(1, 'Transaction date is required'),
  due_date: z.string().optional(),
  reference: z.string().optional(),
  document_number: z.string().min(1, 'Document number is required'),
  total_amount: z.number().min(0.01, 'Amount must be greater than 0'),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

export default function NewInvoicePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: customers = [], isLoading: loadingCustomers } = useQuery({
    queryKey: ['customers'],
    queryFn: customerService.getAll,
  });

  const { data: transactionTypes = [], isLoading: loadingTypes } = useQuery({
    queryKey: ['ar-transaction-types'],
    queryFn: arTransactionTypeService.getAll,
  });

  const invoiceTypes = transactionTypes.filter(type => type.base_type === 'Invoice' && type.is_active);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      transaction_date: new Date().toISOString().split('T')[0],
      total_amount: 0,
    },
  });

  const watchTransactionDate = watch('transaction_date');
  const watchCustomerId = watch('customer_id');

  // Auto-calculate due date based on customer payment terms
  useEffect(() => {
    if (watchCustomerId && watchTransactionDate) {
      const customer = customers.find(c => c.id === Number(watchCustomerId));
      if (customer?.payment_terms) {
        const days = parseInt(customer.payment_terms.replace(/\D/g, '')) || 30;
        const dueDate = new Date(watchTransactionDate);
        dueDate.setDate(dueDate.getDate() + days);
        setValue('due_date', dueDate.toISOString().split('T')[0]);
      }
    }
  }, [watchCustomerId, watchTransactionDate, customers, setValue]);

  // Auto-generate document number
  useEffect(() => {
    const generateDocumentNumber = () => {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      return `INV-${year}${month}-${random}`;
    };

    setValue('document_number', generateDocumentNumber());
  }, [setValue]);

  const createMutation = useMutation({
    mutationFn: (data: ARTransactionCreate) => arTransactionService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ar-transactions'] });
      router.push('/transactions/ar/invoices');
    },
    onError: (error: any) => {
      console.error('Error creating invoice:', error);
    },
  });

  const onSubmit = async (data: InvoiceFormData) => {
    if (!hasPermission(AR_TRANSACTIONS_POST)) {
      alert('You do not have permission to create invoices');
      return;
    }

    setIsSubmitting(true);
    try {
      await createMutation.mutateAsync({
        ...data,
        total_amount: Number(data.total_amount),
      });
    } catch (error: any) {
      console.error('Error:', error);
      alert('Failed to create invoice. Please try again.');
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
            You don&apos;t have permission to create invoices.
          </p>
          <Link
            href="/transactions/ar/invoices"
            className="mt-4 inline-flex items-center text-sm text-primary hover:underline"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Invoices
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href="/transactions/ar/invoices"
              className="rounded-md p-2 hover:bg-gray-100 text-gray-700"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">New Invoice</h1>
              <p className="text-gray-600">
                Create a new customer invoice
              </p>
            </div>
          </div>
        </div>        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Customer */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">Customer *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
                  <select
                    {...register('customer_id', { valueAsNumber: true })}
                    className="w-full rounded-md border border-gray-300 bg-white px-10 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    disabled={loadingCustomers}
                  >
                    <option value="" className="text-gray-500">Select a customer</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id} className="text-gray-900">
                        {customer.name} ({customer.customer_code})
                      </option>
                    ))}
                  </select>
                </div>
              {errors.customer_id && (
                <p className="text-sm text-red-600">{errors.customer_id.message}</p>
              )}
            </div>              {/* Transaction Type */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">Invoice Type *</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
                  <select
                    {...register('ar_transaction_type_id', { valueAsNumber: true })}
                    className="w-full rounded-md border border-gray-300 bg-white px-10 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    disabled={loadingTypes}
                  >
                    <option value="" className="text-gray-500">Select invoice type</option>
                    {invoiceTypes.map((type) => (
                      <option key={type.id} value={type.id} className="text-gray-900">
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
              <label className="text-sm font-medium text-gray-900">Invoice Date *</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
                <input
                  type="date"
                  {...register('transaction_date')}
                  className="w-full rounded-md border border-gray-300 bg-white px-10 py-2 text-sm text-gray-900 ring-offset-2 placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                />
              </div>
              {errors.transaction_date && (
                <p className="text-sm text-red-600">{errors.transaction_date.message}</p>
              )}
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">Due Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
                <input
                  type="date"
                  {...register('due_date')}
                  className="w-full rounded-md border border-gray-300 bg-white px-10 py-2 text-sm text-gray-900 ring-offset-2 placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                />
              </div>
              {errors.due_date && (
                <p className="text-sm text-red-600">{errors.due_date.message}</p>
              )}
            </div>

            {/* Document Number */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">Document Number *</label>
              <input
                type="text"
                {...register('document_number')}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 ring-offset-2 placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                placeholder="Enter document number"
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
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 ring-offset-2 placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                placeholder="Enter reference"
              />
              {errors.reference && (
                <p className="text-sm text-red-600">{errors.reference.message}</p>
              )}
            </div>

            {/* Total Amount */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-gray-900">Total Amount *</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('total_amount', { valueAsNumber: true })}
                  className="w-full rounded-md border border-gray-300 bg-white px-10 py-2 text-sm text-gray-900 ring-offset-2 placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                  placeholder="0.00"
                />
              </div>
              {errors.total_amount && (
                <p className="text-sm text-red-600">{errors.total_amount.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <Link
            href="/transactions/ar/invoices"
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {isSubmitting ? 'Creating...' : 'Create Invoice'}
          </button>
        </div>
      </form>
    </div>
    </div>
  );
}
