'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { writeOffService, customerService, arTransactionService } from '@/services/arService';
import { ARWriteOffCreate, Customer, ARTransaction } from '@/types/ar';
import { formatCurrency, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface WriteOffCreateDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const reasonCodes = [
  { value: 'UNCOLLECTIBLE', label: 'Uncollectible Debt' },
  { value: 'CUSTOMER_BANKRUPTCY', label: 'Customer Bankruptcy' },
  { value: 'SMALL_BALANCE', label: 'Small Balance Write-off' },
  { value: 'DISPUTE_RESOLUTION', label: 'Dispute Resolution' },
  { value: 'OTHER', label: 'Other (specify in description)' },
];

const writeOffSchema = z.object({
  customer_id: z.string().min(1, 'Customer is required'),
  original_invoice_id: z.string().min(1, 'Invoice is required'),
  writeoff_amount: z.string().min(1, 'Amount is required'),
  reason_code: z.string().min(1, 'Reason code is required'),
  reason_description: z.string().min(10, 'Please provide a detailed reason (minimum 10 characters)'),
  writeoff_date: z.string().min(1, 'Write-off date is required'),
});

type WriteOffFormData = z.infer<typeof writeOffSchema>;

const WriteOffCreateDialog: React.FC<WriteOffCreateDialogProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<ARTransaction | null>(null);

  const form = useForm<WriteOffFormData>({
    resolver: zodResolver(writeOffSchema),
    defaultValues: {
      customer_id: '',
      original_invoice_id: '',
      writeoff_amount: '',
      reason_code: '',
      reason_description: '',
      writeoff_date: format(new Date(), 'yyyy-MM-dd'),
    },
  });

  // Fetch customers
  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customerService.getAll(),
    enabled: open,
  });

  // Fetch customer invoices
  const { data: invoices = [] } = useQuery({
    queryKey: ['customer-invoices', selectedCustomer?.id],
    queryFn: () => arTransactionService.getAll({ customer_id: selectedCustomer!.id }),
    enabled: open && !!selectedCustomer?.id,
  });

  // Create write-off mutation
  const createMutation = useMutation({
    mutationFn: (data: ARWriteOffCreate) => writeOffService.create(data),
    onSuccess: () => {
      toast.success('Write-off created successfully and submitted for approval');
      onSuccess();
      form.reset();
      setSelectedCustomer(null);
      setSelectedInvoice(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to create write-off');
    },
  });

  const handleCustomerChange = (customerId: string) => {
    const customer = customers.find(c => c.id.toString() === customerId);
    setSelectedCustomer(customer || null);
    setSelectedInvoice(null);
    form.setValue('customer_id', customerId);
    form.setValue('original_invoice_id', '');
    form.setValue('writeoff_amount', '');
  };

  const handleInvoiceChange = (invoiceId: string) => {
    const invoice = invoices.find((inv: ARTransaction) => inv.id.toString() === invoiceId);
    setSelectedInvoice(invoice || null);
    form.setValue('original_invoice_id', invoiceId);
    // Pre-fill with the open amount
    if (invoice) {
      form.setValue('writeoff_amount', invoice.open_amount.toString());
    }
  };

  const handleClose = () => {
    form.reset();
    setSelectedCustomer(null);
    setSelectedInvoice(null);
    onClose();
  };

  const onSubmit = (values: WriteOffFormData) => {
    const data: ARWriteOffCreate = {
      customer_id: Number(values.customer_id),
      original_invoice_id: Number(values.original_invoice_id),
      writeoff_amount: Number(values.writeoff_amount),
      reason_code: values.reason_code,
      reason_description: values.reason_description,
      writeoff_date: values.writeoff_date,
    };
    createMutation.mutate(data);
  };

  // Filter invoices to only show those with open amounts
  const openInvoices = invoices.filter((inv: ARTransaction) => inv.open_amount > 0);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Create AR Write-off
            <Button
              variant="outline"
              size="sm"
              onClick={handleClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardTitle>
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm text-blue-700">
              Write-offs require approval before being posted to the General Ledger.
              You will be notified when the write-off is approved or rejected.
            </p>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="customer">Customer *</Label>
                <select
                  id="customer"
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.watch('customer_id')}
                  onChange={(e) => handleCustomerChange(e.target.value)}
                >
                  <option value="">Select a customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id.toString()}>
                      {customer.customer_code} - {customer.name}
                    </option>
                  ))}
                </select>
                {form.formState.errors.customer_id && (
                  <p className="text-sm text-red-600">{form.formState.errors.customer_id.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="writeoff_date">Write-off Date *</Label>
                <Input
                  id="writeoff_date"
                  type="date"
                  {...form.register('writeoff_date')}
                />
                {form.formState.errors.writeoff_date && (
                  <p className="text-sm text-red-600">{form.formState.errors.writeoff_date.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="invoice">Invoice to Write-off *</Label>
              <select
                id="invoice"
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.watch('original_invoice_id')}
                onChange={(e) => handleInvoiceChange(e.target.value)}
                disabled={!selectedCustomer}
              >
                <option value="">
                  {!selectedCustomer 
                    ? 'Select a customer first' 
                    : openInvoices.length === 0 
                      ? 'No open invoices for this customer' 
                      : 'Select an invoice'
                  }
                </option>
                {openInvoices.map((invoice: ARTransaction) => (
                  <option key={invoice.id} value={invoice.id.toString()}>
                    {invoice.document_number} - {formatCurrency(invoice.open_amount)} ({formatDate(invoice.transaction_date)})
                  </option>
                ))}
              </select>
              {form.formState.errors.original_invoice_id && (
                <p className="text-sm text-red-600">{form.formState.errors.original_invoice_id.message}</p>
              )}
            </div>

            {selectedInvoice && (
              <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                <h4 className="font-medium text-gray-900 mb-2">Invoice Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Invoice #:</span> {selectedInvoice.document_number}
                  </div>
                  <div>
                    <span className="font-medium">Date:</span> {formatDate(selectedInvoice.transaction_date)}
                  </div>
                  <div>
                    <span className="font-medium">Total Amount:</span> {formatCurrency(selectedInvoice.total_amount)}
                  </div>
                  <div>
                    <span className="font-medium">Open Amount:</span> {formatCurrency(selectedInvoice.open_amount)}
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="writeoff_amount">Write-off Amount *</Label>
                <Input
                  id="writeoff_amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  {...form.register('writeoff_amount')}
                />
                {form.formState.errors.writeoff_amount && (
                  <p className="text-sm text-red-600">{form.formState.errors.writeoff_amount.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason_code">Reason Code *</Label>
                <select
                  id="reason_code"
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  {...form.register('reason_code')}
                >
                  <option value="">Select a reason</option>
                  {reasonCodes.map((reason) => (
                    <option key={reason.value} value={reason.value}>
                      {reason.label}
                    </option>
                  ))}
                </select>
                {form.formState.errors.reason_code && (
                  <p className="text-sm text-red-600">{form.formState.errors.reason_code.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason_description">Detailed Reason Description *</Label>
              <Textarea
                id="reason_description"
                rows={4}
                placeholder="Please provide a detailed explanation for this write-off request"
                {...form.register('reason_description')}
              />
              {form.formState.errors.reason_description && (
                <p className="text-sm text-red-600">{form.formState.errors.reason_description.message}</p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || !form.formState.isValid}
              >
                {createMutation.isPending ? 'Creating...' : 'Submit for Approval'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default WriteOffCreateDialog;
