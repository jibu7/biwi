'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, CreditCard } from 'lucide-react';
import Link from 'next/link';

const paymentMethodSchema = z.object({
  code: z.string().min(1, 'Code is required').max(20, 'Code must be 20 characters or less'),
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  description: z.string().optional(),
  method_type: z.enum(['Cash', 'Check', 'Bank Transfer', 'Credit Card', 'Electronic', 'Other']),
  default_gl_account_id: z.number().optional(),
  requires_reference: z.boolean(),
  is_active: z.boolean(),
});

type PaymentMethodFormData = z.infer<typeof paymentMethodSchema>;

export default function NewPaymentMethodPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PaymentMethodFormData>({
    resolver: zodResolver(paymentMethodSchema),
    defaultValues: {
      method_type: 'Cash',
      requires_reference: false,
      is_active: true,
    },
  });

  const onSubmit = async (data: PaymentMethodFormData) => {
    try {
      setIsSubmitting(true);
      
      // TODO: Replace with actual API call when backend is implemented
      console.log('Creating payment method:', data);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Navigate back to payment methods list
      router.push('/maintenance/ap/payment-methods');
    } catch (error) {
      console.error('Error creating payment method:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const methodType = watch('method_type');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <div className="flex items-center space-x-4">
            <Link
              href="/maintenance/ap/payment-methods"
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">New Payment Method</h1>
              <p className="text-gray-600">Create a new payment method for supplier transactions</p>
            </div>
          </div>
        </div>

        {/* Development Notice */}
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <CreditCard className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Development Notice
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  Payment methods functionality is currently under development. 
                  This form is ready for implementation but will not save data until the backend API is completed.
                </p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Payment Method Details</h3>
            </div>
            
            <div className="px-6 py-4 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                    Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('code')}
                    type="text"
                    id="code"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="e.g., CASH, CHECK, WIRE"
                  />
                  {errors.code && (
                    <p className="mt-1 text-sm text-red-600">{errors.code.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('name')}
                    type="text"
                    id="name"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="e.g., Cash Payment, Check Payment"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  {...register('description')}
                  id="description"
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Optional description of this payment method"
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="method_type" className="block text-sm font-medium text-gray-700">
                  Method Type <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('method_type')}
                  id="method_type"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="Cash">Cash</option>
                  <option value="Check">Check</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Electronic">Electronic</option>
                  <option value="Other">Other</option>
                </select>
                {errors.method_type && (
                  <p className="mt-1 text-sm text-red-600">{errors.method_type.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="default_gl_account_id" className="block text-sm font-medium text-gray-700">
                    Default GL Account
                  </label>
                  <select
                    {...register('default_gl_account_id', { valueAsNumber: true })}
                    id="default_gl_account_id"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="">Select GL Account</option>
                    <option value={1001}>1001 - Cash in Bank</option>
                    <option value={1002}>1002 - Checking Account</option>
                    <option value={1003}>1003 - Savings Account</option>
                    <option value={1004}>1004 - Petty Cash</option>
                  </select>
                  {errors.default_gl_account_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.default_gl_account_id.message}</p>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      {...register('requires_reference')}
                      id="requires_reference"
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="requires_reference" className="ml-2 block text-sm text-gray-900">
                      Requires Reference
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">
                    Check this if payments using this method require a reference number (e.g., check number, wire confirmation)
                  </p>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  {...register('is_active')}
                  id="is_active"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                  Active
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Link
              href="/maintenance/ap/payment-methods"
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Payment Method
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
