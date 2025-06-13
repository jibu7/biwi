'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { customerService, salesRepService } from '@/services/arService';
import { glService } from '@/services/glService';
import { SalesRepresentative } from '@/types/ar';

const customerSchema = z.object({
  customer_code: z.string().min(1, 'Customer code is required'),
  name: z.string().min(1, 'Name is required'),
  payment_terms: z.string().optional(),
  credit_limit: z.number().min(0),
  sales_representative_id: z.number().nullable(),
  default_ar_gl_account_id: z.number().nullable(),
  is_active: z.boolean(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postal_code: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
  contact_info: z.object({
    phone: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    contact_person: z.string().optional(),
  }).optional(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

export default function EditCustomerPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const customerId = parseInt(params.id);

  const { data: customer, isLoading } = useQuery({
    queryKey: ['customer', customerId],
    queryFn: () => customerService.getById(customerId),
  });

  const { data: salesReps = [] } = useQuery({
    queryKey: ['salesReps'],
    queryFn: () => salesRepService.getAll(),
  });

  const { data: glAccounts = [] } = useQuery({
    queryKey: ['glAccounts'],
    queryFn: () => glService.getGLAccounts(),
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    values: customer ? {
      customer_code: customer.customer_code,
      name: customer.name,
      payment_terms: customer.payment_terms || '',
      credit_limit: customer.credit_limit || 0,
      sales_representative_id: customer.sales_representative_id || null,
      default_ar_gl_account_id: customer.default_ar_gl_account_id || null,
      is_active: customer.is_active,
      address: customer.address || {},
      contact_info: customer.contact_info || {},
    } : undefined,
  });

  const updateMutation = useMutation({
    mutationFn: (data: CustomerFormData) => 
      customerService.update(customerId, {
        ...data,
        sales_representative_id: data.sales_representative_id || undefined,
        default_ar_gl_account_id: data.default_ar_gl_account_id || undefined,
      }),
    onSuccess: () => {
      router.push('/maintenance/ar/customers');
    },
  });

  const onSubmit = async (data: CustomerFormData) => {
    await updateMutation.mutateAsync(data);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Edit Customer</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Customer Code
            </label>
            <input
              type="text"
              {...register('customer_code')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            {errors.customer_code && (
              <p className="mt-1 text-sm text-red-600">{errors.customer_code.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Customer Name
            </label>
            <input
              type="text"
              {...register('name')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Payment Terms
            </label>
            <input
              type="text"
              {...register('payment_terms')}
              placeholder="e.g., Net 30"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Credit Limit
            </label>
            <input
              type="number"
              step="0.01"
              {...register('credit_limit', { valueAsNumber: true })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            {errors.credit_limit && (
              <p className="mt-1 text-sm text-red-600">{errors.credit_limit.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Sales Representative
            </label>
            <select
              {...register('sales_representative_id', {
                setValueAs: (v) => v === '' ? null : parseInt(v)
              })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">None</option>
              {salesReps.map((rep: SalesRepresentative) => (
                <option key={rep.id} value={rep.id}>
                  {rep.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Default AR GL Account
            </label>
            <select
              {...register('default_ar_gl_account_id', {
                setValueAs: (v) => v === '' ? null : parseInt(v)
              })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Use Default</option>
              {glAccounts
                .filter(acc => acc.account_type === 'Asset')
                .map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.account_code} - {account.account_name}
                  </option>
                ))}
            </select>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Address</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Street
              </label>
              <input
                type="text"
                {...register('address.street')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                City
              </label>
              <input
                type="text"
                {...register('address.city')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Contact Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Phone
              </label>
              <input
                type="text"
                {...register('contact_info.phone')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                {...register('contact_info.email')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600">
              Current Balance: {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
              }).format(customer?.current_balance || 0)}
            </p>
          </div>
          <label className="flex items-center">
            <input
              type="checkbox"
              {...register('is_active')}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Active</span>
          </label>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Updating...' : 'Update Customer'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/maintenance/ar/customers')}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
