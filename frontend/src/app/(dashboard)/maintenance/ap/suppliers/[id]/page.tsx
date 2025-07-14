'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apService } from '@/services/apService';
import { glService } from '@/services/glService';
import { commonService } from '@/services/commonService';
const supplierSchema = z.object({
  supplier_code: z.string().min(1, 'Supplier code is required'),
  name: z.string().min(1, 'Name is required'),
  payment_terms: z.string().optional(),
  default_ap_gl_account_id: z.number().optional(),
  default_currency_id: z.number().optional(),
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

type SupplierFormData = z.infer<typeof supplierSchema>;

export default function EditSupplierPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const supplierId = params?.id ? parseInt(params.id as string) : 0;

  const { data: supplier, isLoading } = useQuery({
    queryKey: ['supplier', supplierId],
    queryFn: () => apService.getSupplier(supplierId),
  enabled: supplierId > 0,
  });

  const { data: glAccounts = [] } = useQuery({
    queryKey: ['glAccounts'],
    queryFn: () => glService.getGLAccounts(),
  });

  const { data: currencies = [] } = useQuery({
    queryKey: ['currencies'],
    queryFn: () => commonService.getCurrencies(),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
  });

  useEffect(() => {
    if (supplier) {
      reset({
        ...supplier,
        default_ap_gl_account_id: supplier.default_ap_gl_account_id || undefined,
        default_currency_id: supplier.default_currency_id || undefined,
      });
    }
  }, [supplier, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: SupplierFormData) => apService.updateSupplier(supplierId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier', supplierId] });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      router.push('/maintenance/ap/suppliers');
    },
  });

  const onSubmit = async (data: SupplierFormData) => {
    await updateMutation.mutateAsync(data);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Edit Supplier</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Supplier Code
            </label>
            <input
              type="text"
              {...register('supplier_code')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            {errors.supplier_code && (
              <p className="mt-1 text-sm text-red-600">{errors.supplier_code.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Supplier Name
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
            Default AP GL Account
          </label>
          <select
            {...register('default_ap_gl_account_id', {
              setValueAs: (v) => v === '' ? undefined : parseInt(v)
            })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Use Default</option>
            {glAccounts
              .filter(acc => acc.account_type === 'Liability')
              .map((account) => (
                <option key={account.id} value={account.id}>
                  {account.account_code} - {account.account_name}
                </option>
              ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Default Currency
          </label>
          <select
            {...register('default_currency_id', {
              setValueAs: (v) => v === '' ? undefined : parseInt(v)
            })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Use System Default</option>
            {currencies
              .filter(currency => currency.is_active)
              .map((currency) => (
                <option key={currency.id} value={currency.id}>
                  {currency.code} - {currency.name}
                  {currency.is_base_currency ? ' (Base Currency)' : ''}
                </option>
              ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            Default currency for transactions with this supplier
          </p>
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
            <div>
              <label className="block text-sm font-medium text-gray-700">
                State/Province
              </label>
              <input
                type="text"
                {...register('address.state')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Postal Code
              </label>
              <input
                type="text"
                {...register('address.postal_code')}
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
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Contact Person
              </label>
              <input
                type="text"
                {...register('contact_info.contact_person')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div>
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
            disabled={isSubmitting || updateMutation.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting || updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/maintenance/ap/suppliers')}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
