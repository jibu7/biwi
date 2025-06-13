'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { apService } from '@/services/apService';

const allocationSchema = z.object({
  allocation_date: z.string().min(1, 'Date is required'),
  supplier_id: z.number().min(1, 'Supplier is required'),
  lines: z.array(z.object({
    credit_transaction_id: z.number().min(1, 'Credit transaction is required'),
    debit_transaction_id: z.number().min(1, 'Debit transaction is required'),
    allocated_amount: z.number().min(0.01, 'Amount must be greater than 0'),
  })).min(1, 'At least one allocation line is required'),
});

type AllocationFormData = z.infer<typeof allocationSchema>;

export default function NewAllocationPage() {
  const router = useRouter();
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(null);

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => apService.getSuppliers(),
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['apTransactions', selectedSupplierId],
    queryFn: () => apService.getAPTransactions({ supplier_id: selectedSupplierId! }),
    enabled: !!selectedSupplierId,
  });

  const creditTransactions = transactions.filter(t => t.open_amount > 0);
  const debitTransactions = transactions.filter(t => t.open_amount < 0);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AllocationFormData>({
    resolver: zodResolver(allocationSchema),
    defaultValues: {
      allocation_date: new Date().toISOString().split('T')[0],
      lines: [{ credit_transaction_id: 0, debit_transaction_id: 0, allocated_amount: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lines',
  });

  const watchedSupplierId = watch('supplier_id');

  const createMutation = useMutation({
    mutationFn: apService.createAPAllocation,
    onSuccess: () => {
      router.push('/transactions/ap/list');
    },
  });

  const onSubmit = async (data: AllocationFormData) => {
    await createMutation.mutateAsync(data);
  };

  const handleSupplierChange = (supplierId: number) => {
    setSelectedSupplierId(supplierId);
  };

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Allocate Transactions</h1>
      <p className="text-gray-600 mb-8">
        Allocate payments against invoices and other outstanding transactions.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Supplier
            </label>
            <select
              {...register('supplier_id', { 
                valueAsNumber: true,
                onChange: (e) => handleSupplierChange(parseInt(e.target.value))
              })}
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
              Allocation Date
            </label>
            <input
              type="date"
              {...register('allocation_date')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            {errors.allocation_date && (
              <p className="mt-1 text-sm text-red-600">{errors.allocation_date.message}</p>
            )}
          </div>
        </div>

        {selectedSupplierId && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Allocation Lines</h3>
              <button
                type="button"
                onClick={() => append({ credit_transaction_id: 0, debit_transaction_id: 0, allocated_amount: 0 })}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Line
              </button>
            </div>

            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-4 gap-4 p-4 border rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Credit Transaction (Invoice)
                    </label>
                    <select
                      {...register(`lines.${index}.credit_transaction_id` as const, { valueAsNumber: true })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="">Select Invoice</option>
                      {creditTransactions.map((transaction) => (
                        <option key={transaction.id} value={transaction.id}>
                          {transaction.document_number} - ${transaction.open_amount.toFixed(2)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Debit Transaction (Payment)
                    </label>
                    <select
                      {...register(`lines.${index}.debit_transaction_id` as const, { valueAsNumber: true })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="">Select Payment</option>
                      {debitTransactions.map((transaction) => (
                        <option key={transaction.id} value={transaction.id}>
                          {transaction.document_number} - ${Math.abs(transaction.open_amount).toFixed(2)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Allocated Amount
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      {...register(`lines.${index}.allocated_amount` as const, { valueAsNumber: true })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-end">
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="px-3 py-2 text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {errors.lines && (
              <p className="mt-1 text-sm text-red-600">{errors.lines.message}</p>
            )}
          </div>
        )}

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isSubmitting || createMutation.isPending || !selectedSupplierId}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting || createMutation.isPending ? 'Creating...' : 'Create Allocation'}
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
