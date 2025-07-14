'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, FileText, Calendar, User, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { customerService, arTransactionTypeService, createARInvoice } from '@/services/arService';
import { commonService } from '@/services/commonService';
import { TaxCalculator } from '@/lib/taxCalculator';
import { usePermissions } from '@/hooks/usePermissions';
import { AR_TRANSACTIONS_POST } from '@/lib/permissions';

interface ARTaxLine {
  taxTypeId: string;
  taxableAmount: number;
  taxAmount: number;
}

const invoiceSchema = z.object({
  customer_id: z.number().min(1, 'Customer is required'),
  ar_transaction_type_id: z.number().min(1, 'Transaction type is required'),
  transaction_date: z.string().min(1, 'Transaction date is required'),
  due_date: z.string().optional(),
  reference: z.string().optional(),
  document_number: z.string().min(1, 'Document number is required'),
  currencyId: z.string().optional(),
  lines: z.array(z.object({
    description: z.string().min(1, 'Description is required'),
    quantity: z.number().min(1, 'Quantity must be at least 1'),
    unitPrice: z.number().min(0, 'Unit price must be non-negative'),
    discountPercentage: z.number().min(0).max(100).default(0),
    taxTypeId: z.string().optional(),
  })).min(1, 'At least one line item is required')
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

export default function NewInvoicePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [exchangeRate, setExchangeRate] = useState(1);
  const [taxSummary, setTaxSummary] = useState({
    subtotal: 0,
    taxes: {} as Record<string, number>,
    grandTotal: 0
  });

  const { data: customers = [], isLoading: loadingCustomers } = useQuery({
    queryKey: ['customers'],
    queryFn: customerService.getAll,
  });

  const { data: transactionTypes = [], isLoading: loadingTypes } = useQuery({
    queryKey: ['ar-transaction-types'],
    queryFn: arTransactionTypeService.getAll,
  });

  const { data: currencies = [] } = useQuery({
    queryKey: ['currencies'],
    queryFn: () => commonService.getCurrencies()
  });

  const { data: taxTypes = [] } = useQuery({
    queryKey: ['taxTypes'],
    queryFn: () => commonService.getTaxTypes()
  });

  const invoiceTypes = transactionTypes.filter(type => type.base_type === 'Invoice' && type.is_active);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      transaction_date: new Date().toISOString().split('T')[0],
      lines: [{ description: '', quantity: 1, unitPrice: 0, discountPercentage: 0 }]
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "lines"
  });

  const watchTransactionDate = watch('transaction_date');
  const watchCustomerId = watch('customer_id');
  const watchLines = watch("lines");
  const watchCurrency = watch("currencyId");

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

  // Fetch exchange rate when currency changes
  useEffect(() => {
    if (watchCurrency) {
      commonService.getExchangeRate(watchCurrency, new Date())
        .then(rate => setExchangeRate(rate))
        .catch(() => setExchangeRate(1));
    }
  }, [watchCurrency]);

  // Recalculate taxes when lines change
  useEffect(() => {
    const summary = TaxCalculator.calculateDocumentTaxes(watchLines, taxTypes);
    setTaxSummary(summary);
  }, [watchLines, taxTypes]);

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
    mutationFn: (data: InvoiceFormData & { exchangeRate: number; total_amount: number; taxLines: ARTaxLine[] }) => createARInvoice(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ar-transactions'] });
      toast.success('Invoice created successfully');
      router.push('/transactions/ar/invoices');
    },
    onError: (error: Error) => {
      console.error('Error creating invoice:', error);
      toast.error('Failed to create invoice');
    },
  });

  const onSubmit = async (data: InvoiceFormData) => {
    if (!hasPermission(AR_TRANSACTIONS_POST)) {
      toast.error('You do not have permission to create invoices');
      return;
    }

    setIsSubmitting(true);
    try {
      await createMutation.mutateAsync({
        ...data,
        exchangeRate,
        total_amount: taxSummary.grandTotal,
        taxLines: Object.entries(taxSummary.taxes).map(([taxName, amount]) => ({
          taxTypeId: taxTypes.find(t => t.name === taxName)?.id.toString() || '',
          taxableAmount: taxSummary.subtotal,
          taxAmount: amount,
        })),
      });
    } catch (error: unknown) {
      console.error('Error:', error);
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
              </div>

              {/* Currency */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">Currency</label>
                <select {...register('currencyId')} className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                  <option value="">Select Currency</option>
                  {currencies?.map(curr => (
                    <option key={curr.id} value={curr.id}>
                      {curr.code} - {curr.name}
                    </option>
                  ))}
                </select>
                {exchangeRate !== 1 && (
                  <p className="text-sm text-gray-600 mt-1">
                    Exchange Rate: {exchangeRate}
                  </p>
                )}
              </div>

              {/* Transaction Type */}
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
            </div>
          </div>

          {/* Line Items */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Line Items</h3>
              <button 
                type="button" 
                onClick={() => append({ description: '', quantity: 1, unitPrice: 0, discountPercentage: 0 })}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Line
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 text-sm font-medium text-gray-900">Description</th>
                    <th className="text-left py-2 px-3 text-sm font-medium text-gray-900">Quantity</th>
                    <th className="text-left py-2 px-3 text-sm font-medium text-gray-900">Unit Price</th>
                    <th className="text-left py-2 px-3 text-sm font-medium text-gray-900">Discount %</th>
                    <th className="text-left py-2 px-3 text-sm font-medium text-gray-900">Tax Type</th>
                    <th className="text-right py-2 px-3 text-sm font-medium text-gray-900">Line Total</th>
                    <th className="text-center py-2 px-3 text-sm font-medium text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {fields.map((field, index) => {
                    const line = watchLines[index];
                    const lineTotal = TaxCalculator.calculateLineTotal(line, taxTypes);
                    
                    return (
                      <tr key={field.id} className="border-b border-gray-100">
                        <td className="py-2 px-3">
                          <input 
                            {...register(`lines.${index}.description`)} 
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:border-blue-500 focus:outline-none"
                            placeholder="Enter description"
                          />
                          {errors.lines?.[index]?.description && (
                            <p className="text-xs text-red-600 mt-1">{errors.lines[index]?.description?.message}</p>
                          )}
                        </td>
                        <td className="py-2 px-3">
                          <input 
                            type="number" 
                            {...register(`lines.${index}.quantity`, { valueAsNumber: true })} 
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:border-blue-500 focus:outline-none"
                            min="1"
                          />
                          {errors.lines?.[index]?.quantity && (
                            <p className="text-xs text-red-600 mt-1">{errors.lines[index]?.quantity?.message}</p>
                          )}
                        </td>
                        <td className="py-2 px-3">
                          <input 
                            type="number" 
                            step="0.01"
                            {...register(`lines.${index}.unitPrice`, { valueAsNumber: true })} 
                            className="w-24 px-2 py-1 border border-gray-300 rounded text-sm focus:border-blue-500 focus:outline-none"
                            min="0"
                          />
                          {errors.lines?.[index]?.unitPrice && (
                            <p className="text-xs text-red-600 mt-1">{errors.lines[index]?.unitPrice?.message}</p>
                          )}
                        </td>
                        <td className="py-2 px-3">
                          <input 
                            type="number" 
                            {...register(`lines.${index}.discountPercentage`, { valueAsNumber: true })} 
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:border-blue-500 focus:outline-none"
                            min="0"
                            max="100"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <select {...register(`lines.${index}.taxTypeId`)} className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:border-blue-500 focus:outline-none">
                            <option value="">No Tax</option>
                            {taxTypes?.filter(t => t.tax_nature === 'Sales').map(tax => (
                              <option key={tax.id} value={tax.id}>
                                {tax.name} ({tax.rate_percentage}%)
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 px-3 text-right text-sm">
                          {lineTotal.toFixed(2)}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <button 
                            type="button" 
                            onClick={() => remove(index)}
                            className="text-red-600 hover:text-red-800 p-1"
                            disabled={fields.length === 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {errors.lines && (
              <p className="text-sm text-red-600 mt-2">{errors.lines.message}</p>
            )}
          </div>

          {/* Tax Summary */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="space-y-2 text-right">
              <p className="text-sm">Subtotal: {taxSummary.subtotal?.toFixed(2)}</p>
              {Object.entries(taxSummary.taxes || {}).map(([taxName, amount]) => (
                <p key={taxName} className="text-sm">{taxName}: {amount.toFixed(2)}</p>
              ))}
              <div className="border-t pt-2">
                <p className="font-bold text-lg">
                  Total: {watchCurrency && currencies?.find(c => c.id.toString() === watchCurrency)?.symbol} 
                  {taxSummary.grandTotal?.toFixed(2)}
                </p>
                {exchangeRate !== 1 && (
                  <p className="text-sm text-gray-600">
                    Base Currency: {(taxSummary.grandTotal * exchangeRate).toFixed(2)}
                  </p>
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
