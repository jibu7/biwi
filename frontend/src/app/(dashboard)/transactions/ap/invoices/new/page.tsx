'use client';


import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { apService } from '@/services/apService';

const invoiceSchema = z.object({
  supplier_id: z.number().min(1, 'Supplier is required'),
  ap_transaction_type_id: z.number().min(1, 'Transaction type is required'),
  transaction_date: z.string().min(1, 'Date is required'),
  due_date: z.string().optional(),
  reference: z.string().optional(),
  total_amount: z.number().min(0.01, 'Amount must be greater than 0'),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

export default function NewSupplierInvoicePage() {
  const router = useRouter();

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => apService.getSuppliers(),
  });

  const { data: transactionTypes = [] } = useQuery({
    queryKey: ['apTransactionTypes'],
    queryFn: () => apService.getAPTransactionTypes(),
  });

  const invoiceTypes = transactionTypes.filter(t => t.base_type === 'Supplier Invoice');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      transaction_date: new Date().toISOString().split('T')[0],
    },
  });

  const selectedSupplierId = watch('supplier_id');
  const transactionDate = watch('transaction_date');

  // Auto-calculate due date based on supplier payment terms
  useEffect(() => {
    if (selectedSupplierId && transactionDate) {
      const supplier = suppliers.find(s => s.id === Number(selectedSupplierId));
      if (supplier?.payment_terms) {
        const days = parseInt(supplier.payment_terms.replace(/\D/g, '')) || 0;
        const date = new Date(transactionDate);
        date.setDate(date.getDate() + days);
        setValue('due_date', date.toISOString().split('T')[0]);
      }
    }
  }, [selectedSupplierId, transactionDate, suppliers, setValue]);

  const createMutation = useMutation({
    mutationFn: apService.createAPTransaction,
    onSuccess: () => {
      router.push('/transactions/ap/list');
    },
  });

  const onSubmit = async (data: InvoiceFormData) => {
    await createMutation.mutateAsync(data);
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">New Supplier Invoice</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Supplier
          </label>
          <select
            {...register('supplier_id', { valueAsNumber: true })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Select Supplier</option>
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.supplier_code} - {supplier.name}
              </option>
            ))}
          </select>
          {errors.supplier_id && (
            <p className="mt-1 text-sm text-red-600">{errors.supplier_id.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Invoice Type
          </label>
          <select
            {...register('ap_transaction_type_id', { valueAsNumber: true })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Select Type</option>
            {invoiceTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
          {errors.ap_transaction_type_id && (
            <p className="mt-1 text-sm text-red-600">{errors.ap_transaction_type_id.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Invoice Date
            </label>
            <input
              type="date"
              {...register('transaction_date')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            {errors.transaction_date && (
              <p className="mt-1 text-sm text-red-600">{errors.transaction_date.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Due Date
            </label>
            <input
              type="date"
              {...register('due_date')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Reference
          </label>
          <input
            type="text"
            {...register('reference')}
            placeholder="e.g., Supplier invoice number"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Amount
          </label>
          <input
            type="number"
            step="0.01"
            {...register('total_amount', { valueAsNumber: true })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          {errors.total_amount && (
            <p className="mt-1 text-sm text-red-600">{errors.total_amount.message}</p>
          )}
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isSubmitting || createMutation.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting || createMutation.isPending ? 'Creating...' : 'Create Invoice'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/transactions/ap/list')}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
