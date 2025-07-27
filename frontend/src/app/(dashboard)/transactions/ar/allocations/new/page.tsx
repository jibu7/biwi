'use client';


import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2, 
  User, 
  Calendar, 
  DollarSign,
  FileText,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';
import { ARAllocationCreate, ARAllocationLineCreate, ARTransaction } from '@/types/ar';
import { arAllocationService, arTransactionService, customerService } from '@/services/arService';
import { usePermissions } from '@/hooks/usePermissions';
import { AR_TRANSACTIONS_POST } from '@/lib/permissions';

const allocationSchema = z.object({
  allocation_date: z.string().min(1, 'Allocation date is required'),
  customer_id: z.number().min(1, 'Customer is required'),
  lines: z.array(z.object({
    debit_transaction_id: z.number().min(1, 'Debit transaction is required'),
    credit_transaction_id: z.number().min(1, 'Credit transaction is required'),
    allocated_amount: z.number().min(0.01, 'Allocated amount must be greater than 0'),
  })).min(1, 'At least one allocation line is required'),
});

type AllocationFormData = z.infer<typeof allocationSchema>;

interface AllocationLine {
  id: string;
  debit_transaction_id: number;
  credit_transaction_id: number;
  allocated_amount: number;
}

export default function NewAllocationPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [allocationLines, setAllocationLines] = useState<AllocationLine[]>([]);

  const { data: customers = [], isLoading: loadingCustomers } = useQuery({
    queryKey: ['customers'],
    queryFn: customerService.getAll,
  });

  const { data: customerTransactions = [], isLoading: loadingTransactions } = useQuery({
    queryKey: ['ar-transactions', selectedCustomerId],
    queryFn: () => arTransactionService.getAll({ customer_id: selectedCustomerId! }),
    enabled: !!selectedCustomerId,
  });

  const outstandingDebits = customerTransactions.filter(t => 
    t.ar_transaction_type_name?.includes('Invoice') && 
    t.open_amount > 0 && 
    t.status === 'Posted'
  );

  const availableCredits = customerTransactions.filter(t => 
    (t.ar_transaction_type_name?.includes('Receipt') || t.ar_transaction_type_name?.includes('Credit')) && 
    t.open_amount > 0 && 
    t.status === 'Posted'
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AllocationFormData>({
    resolver: zodResolver(allocationSchema),
    defaultValues: {
      allocation_date: new Date().toISOString().split('T')[0],
      lines: [],
    },
  });

  const watchCustomerId = watch('customer_id');

  useEffect(() => {
    if (watchCustomerId) {
      setSelectedCustomerId(Number(watchCustomerId));
      setAllocationLines([]);
    }
  }, [watchCustomerId]);

  useEffect(() => {
    setValue('lines', allocationLines.map(line => ({
      debit_transaction_id: line.debit_transaction_id,
      credit_transaction_id: line.credit_transaction_id,
      allocated_amount: line.allocated_amount,
    })));
  }, [allocationLines, setValue]);

  const addAllocationLine = () => {
    const newLine: AllocationLine = {
      id: Date.now().toString(),
      debit_transaction_id: 0,
      credit_transaction_id: 0,
      allocated_amount: 0,
    };
    setAllocationLines([...allocationLines, newLine]);
  };

  const removeAllocationLine = (id: string) => {
    setAllocationLines(allocationLines.filter(line => line.id !== id));
  };

  const updateAllocationLine = (id: string, field: keyof AllocationLine, value: number) => {
    setAllocationLines(allocationLines.map(line => 
      line.id === id ? { ...line, [field]: value } : line
    ));
  };

  const createMutation = useMutation({
    mutationFn: (data: ARAllocationCreate) => arAllocationService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ar-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['ar-allocations'] });
      alert('Allocation created successfully!');
      router.push('/transactions/ar/allocations');
    },
    onError: (error: any) => {
      console.error('Error creating allocation:', error);
      const errorMessage = error?.response?.data?.detail || 'Failed to create allocation. Please try again.';
      alert(errorMessage);
    },
  });

  const onSubmit = async (data: AllocationFormData) => {
    if (!hasPermission(AR_TRANSACTIONS_POST)) {
      alert('You do not have permission to create allocations');
      return;
    }

    // Validate that we have allocation lines
    if (allocationLines.length === 0) {
      alert('Please add at least one allocation line before submitting.');
      return;
    }

    // Validate that all lines have required data
    const invalidLines = allocationLines.filter(line => 
      !line.debit_transaction_id || 
      !line.credit_transaction_id || 
      !line.allocated_amount || 
      line.allocated_amount <= 0
    );

    if (invalidLines.length > 0) {
      alert('Please complete all allocation line fields before submitting.');
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('Submitting allocation with data:', {
        allocation_date: data.allocation_date,
        customer_id: data.customer_id,
        lines: data.lines.map(line => ({
          debit_transaction_id: line.debit_transaction_id,
          credit_transaction_id: line.credit_transaction_id,
          allocated_amount: Number(line.allocated_amount),
        })),
      });
      
      await createMutation.mutateAsync({
        allocation_date: data.allocation_date,
        customer_id: data.customer_id,
        lines: data.lines.map(line => ({
          debit_transaction_id: line.debit_transaction_id,
          credit_transaction_id: line.credit_transaction_id,
          allocated_amount: Number(line.allocated_amount),
        })),
      });
    } catch (error: any) {
      console.error('Error:', error);
      const errorMessage = error?.response?.data?.detail || 'Failed to create allocation. Please try again.';
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getTotalAllocated = () => {
    return allocationLines.reduce((sum, line) => sum + (line.allocated_amount || 0), 0);
  };

  const getTransactionDisplay = (transaction: ARTransaction) => {
    return `${transaction.document_number} - ${formatCurrency(transaction.open_amount)} (${transaction.ar_transaction_type_name})`;
  };

  if (!hasPermission(AR_TRANSACTIONS_POST)) {
    return (
      <div className="p-6">
        <div className="text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">Access Denied</h3>
          <p className="mt-1 text-sm text-gray-500">
            You don&apos;t have permission to create allocations.
          </p>
          <Link
            href="/transactions/ar/allocations"
            className="mt-4 inline-flex items-center text-sm text-primary hover:underline"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Allocations
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/transactions/ar/allocations"
            className="rounded-md p-2 hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">New AR Allocation</h1>
            <p className="text-gray-700">
              Allocate receipts and credit notes to outstanding invoices
            </p>
          </div>
        </div>
      </div>

      // ...existing code...

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Header Information */}
        <div className="rounded-lg border p-6">
          <h3 className="text-lg font-medium mb-4 text-gray-900">Allocation Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">Customer *</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
                <select
                  {...register('customer_id', { valueAsNumber: true })}
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
            </div>

            {/* Allocation Date */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">Allocation Date *</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
                <input
                  type="date"
                  {...register('allocation_date')}
                  className="w-full rounded-md border border-gray-300 bg-white px-10 py-2 text-sm text-gray-900 ring-offset-background placeholder:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
              {errors.allocation_date && (
                <p className="text-sm text-red-600">{errors.allocation_date.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Allocation Lines */}
        {selectedCustomerId && (
          <div className="rounded-lg border p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Allocation Lines</h3>
              <button
                type="button"
                onClick={addAllocationLine}
                className="inline-flex items-center justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow hover:bg-blue-600/90"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Line
              </button>
            </div>

            {allocationLines.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="mx-auto h-8 w-8 text-gray-600" />
                <p className="mt-2 text-sm text-gray-600">
                  No allocation lines added yet. Click "Add Line" to start.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {allocationLines.map((line, index) => (
                  <div key={line.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-medium text-sm">Line {index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => removeAllocationLine(line.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Debit Transaction (Invoice) */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-900">Invoice/Debit *</label>
                        <select
                          value={line.debit_transaction_id}
                          onChange={(e) => updateAllocationLine(line.id, 'debit_transaction_id', Number(e.target.value))}
                          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 ring-offset-background placeholder:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                          <option value="">Select invoice</option>
                          {outstandingDebits.map((transaction) => (
                            <option key={transaction.id} value={transaction.id}>
                              {getTransactionDisplay(transaction)}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Credit Transaction (Receipt/Credit Note) */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-900">Receipt/Credit *</label>
                        <select
                          value={line.credit_transaction_id}
                          onChange={(e) => updateAllocationLine(line.id, 'credit_transaction_id', Number(e.target.value))}
                          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 ring-offset-background placeholder:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                          <option value="">Select receipt/credit</option>
                          {availableCredits.map((transaction) => (
                            <option key={transaction.id} value={transaction.id}>
                              {getTransactionDisplay(transaction)}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Allocated Amount */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-900">Amount *</label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={line.allocated_amount || ''}
                            onChange={(e) => updateAllocationLine(line.id, 'allocated_amount', Number(e.target.value))}
                            className="w-full rounded-md border border-gray-300 bg-white px-10 py-2 text-sm text-gray-900 ring-offset-background placeholder:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Summary */}
                <div className="rounded-lg bg-muted/50 p-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total Allocated:</span>
                    <span className="font-bold text-lg">{formatCurrency(getTotalAllocated())}</span>
                  </div>
                </div>
              </div>
            )}

            {errors.lines && (
              <p className="text-sm text-red-600 mt-2">{errors.lines.message}</p>
            )}
          </div>
        )}

        {/* Outstanding Transactions Summary */}
        {selectedCustomerId && (outstandingDebits.length > 0 || availableCredits.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Outstanding Invoices */}
            {outstandingDebits.length > 0 && (
              <div className="rounded-lg border p-4">
                <h4 className="font-medium mb-3 text-red-800">Outstanding Invoices</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {outstandingDebits.map((transaction) => (
                    <div key={transaction.id} className="flex justify-between text-sm">
                      <span>{transaction.document_number}</span>
                      <span className="text-red-600">{formatCurrency(transaction.open_amount)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t mt-2 pt-2">
                  <div className="flex justify-between font-medium text-sm">
                    <span>Total Outstanding:</span>
                    <span className="text-red-600">
                      {formatCurrency(outstandingDebits.reduce((sum, t) => sum + t.open_amount, 0))}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Available Credits */}
            {availableCredits.length > 0 && (
              <div className="rounded-lg border p-4">
                <h4 className="font-medium mb-3 text-green-800">Available Credits</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {availableCredits.map((transaction) => (
                    <div key={transaction.id} className="flex justify-between text-sm">
                      <span>{transaction.document_number}</span>
                      <span className="text-green-600">{formatCurrency(transaction.open_amount)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t mt-2 pt-2">
                  <div className="flex justify-between font-medium text-sm">
                    <span>Total Available:</span>
                    <span className="text-green-600">
                      {formatCurrency(availableCredits.reduce((sum, t) => sum + t.open_amount, 0))}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Warning */}
        {selectedCustomerId && outstandingDebits.length === 0 && availableCredits.length === 0 && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800">No Transactions Available</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  This customer has no outstanding invoices or available credits to allocate.
                  Make sure transactions are posted before creating allocations.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <Link
            href="/transactions/ar/allocations"
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || allocationLines.length === 0}
            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {isSubmitting ? 'Creating...' : 'Create Allocation'}
          </button>
        </div>
      </form>
    </div>
  );
}
