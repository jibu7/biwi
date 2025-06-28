"use client";

import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Building, MapPin, Phone, Mail } from 'lucide-react';
import { commonService, BranchCreate } from '@/services/commonService';

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

// Helper function to parse API errors for branches
const parseApiError = (error: any): string => {
  if (error?.response?.status === 400) {
    const detail = error.response?.data?.detail;
    if (typeof detail === 'string') {
      if (detail.includes('Branch name already exists')) {
        return 'A branch with this name already exists for your company. Please use a different name.';
      }
      return detail;
    }
  }
  
  if (error?.response?.status === 422) {
    // Validation errors
    const detail = error.response?.data?.detail;
    if (Array.isArray(detail) && detail.length > 0) {
      const firstError = detail[0];
      if (firstError.msg) {
        return `${firstError.loc?.join(' ')}: ${firstError.msg}`;
      }
    }
    return 'Please check your input values and try again.';
  }
  
  if (error?.message) {
    return error.message;
  }
  
  return 'An unexpected error occurred while creating the branch. Please try again.';
};

export default function NewBranchPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<BranchFormData>({
    resolver: zodResolver(branchSchema),
    defaultValues: {
      is_active: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: BranchCreate) => commonService.createBranch(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      router.push('/maintenance/system/branches');
    },
    onError: (error: any) => {
      console.error('Error creating branch:', error);
      // The error will be displayed in the JSX error block
    },
  });

  const onSubmit = (data: BranchFormData) => {
    // Convert form data to API format
    const branchData: BranchCreate = {
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

    createMutation.mutate(branchData);
  };

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
          Add New Branch
        </h1>
        <p className="text-gray-600 mt-1">Create a new company branch or location</p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow">
        {createMutation.error && (
          <div className="p-6 pb-0">
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Error Creating Branch
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{parseApiError(createMutation.error)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
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
                  placeholder="e.g., Head Office, West Coast Branch"
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
                  placeholder="e.g., HO, WC, NYC"
                  maxLength={10}
                />
                {errors.default_gl_segment_code && (
                  <p className="text-red-500 text-sm mt-1">{errors.default_gl_segment_code.message}</p>
                )}
                <p className="text-gray-500 text-sm mt-1">Used for GL reporting and segmentation</p>
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

          {/* Address Information */}
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
                  placeholder="123 Main Street"
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
                  placeholder="New York"
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
                  placeholder="NY"
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
                  placeholder="10001"
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
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
                  placeholder="+1 (555) 123-4567"
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
                  placeholder="branch@company.com"
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
                  placeholder="John Smith"
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
              disabled={createMutation.isPending}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {createMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Building size={16} />
                  Create Branch
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
