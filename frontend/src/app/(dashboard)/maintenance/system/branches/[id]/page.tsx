"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Building, MapPin, Phone } from 'lucide-react';
import { commonService, BranchUpdate } from '@/services/commonService';

const branchSchema = z.object({
  name: z.string().min(1, 'Branch name is required').max(100, 'Name too long'),
  address_street: z.string().optional(),
  address_city: z.string().optional(),
  address_state: z.string().optional(),
  address_zip: z.string().optional(),
  contact_phone: z.string().optional(),
  contact_email: z.string().email('Invalid email').optional().or(z.literal('')),
  contact_manager: z.string().optional(),
  default_gl_segment_code: z.string().max(10, 'GL segment too long').optional(),
  is_active: z.boolean(),
});

type BranchFormData = z.infer<typeof branchSchema>;

export default function EditBranchPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const unwrappedParams = React.use(params);
  const branchId = parseInt(unwrappedParams.id);

  const { data: branch, isLoading } = useQuery({
    queryKey: ['branch', branchId],
    queryFn: () => commonService.getBranch(branchId),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<BranchFormData>({
    resolver: zodResolver(branchSchema),
  });

  // Reset form when branch data loads
  useEffect(() => {
    if (branch) {
      const address = branch.address || {};
      const contactInfo = branch.contact_info || {};
      
      reset({
        name: branch.name,
        address_street: address.street || '',
        address_city: address.city || '',
        address_state: address.state || '',
        address_zip: address.zip || '',
        contact_phone: contactInfo.phone || '',
        contact_email: contactInfo.email || '',
        contact_manager: contactInfo.manager || '',
        default_gl_segment_code: branch.default_gl_segment_code || '',
        is_active: branch.is_active,
      });
    }
  }, [branch, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: BranchUpdate) => commonService.updateBranch(branchId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      queryClient.invalidateQueries({ queryKey: ['branch', branchId] });
      router.push('/maintenance/system/branches');
    },
    onError: (error: any) => {
      alert('Error updating branch: ' + (error.response?.data?.detail || error.message));
    },
  });

  const onSubmit = (data: BranchFormData) => {
    const branchData: BranchUpdate = {
      name: data.name,
      address: {
        street: data.address_street || '',
        city: data.address_city || '',
        state: data.address_state || '',
        zip: data.address_zip || '',
      },
      contact_info: {
        phone: data.contact_phone || '',
        email: data.contact_email || '',
        manager: data.contact_manager || '',
      },
      default_gl_segment_code: data.default_gl_segment_code || undefined,
      is_active: data.is_active,
    };

    updateMutation.mutate(branchData);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!branch) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Branch Not Found</h3>
          <p className="text-red-600">The requested branch could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Branches
        </button>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Building className="text-indigo-600" />
          Edit Branch: {branch.name}
        </h1>
        <p className="text-gray-600 mt-1">Update branch information and settings</p>
      </div>

      {/* Form - Same structure as new branch form */}
      <div className="bg-white rounded-lg shadow">
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Building size={20} className="text-gray-600" />
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Branch Name *
                </label>
                <input
                  {...register('name')}
                  type="text"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  GL Segment Code
                </label>
                <input
                  {...register('default_gl_segment_code')}
                  type="text"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  maxLength={10}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <div className="flex items-center">
                  <input
                    {...register('is_active')}
                    type="checkbox"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    Active Branch
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Address Information - Same as new form */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <MapPin size={20} className="text-gray-600" />
              Address Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Street Address
                </label>
                <input
                  {...register('address_street')}
                  type="text"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                <input
                  {...register('address_city')}
                  type="text"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State/Province
                </label>
                <input
                  {...register('address_state')}
                  type="text"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ZIP/Postal Code
                </label>
                <input
                  {...register('address_zip')}
                  type="text"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Contact Information - Same as new form */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Phone size={20} className="text-gray-600" />
              Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  {...register('contact_phone')}
                  type="tel"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  {...register('contact_email')}
                  type="email"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                {errors.contact_email && (
                  <p className="text-red-500 text-sm mt-1">{errors.contact_email.message}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Branch Manager
                </label>
                <input
                  {...register('contact_manager')}
                  type="text"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {updateMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Updating...
                </>
              ) : (
                <>
                  <Building size={16} />
                  Update Branch
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
