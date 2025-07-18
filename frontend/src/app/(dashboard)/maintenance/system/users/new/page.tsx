'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { userService } from '@/services/userService';
import { companyManagementService } from '@/services/companyManagementService';
import { useAuthStore } from '@/store/authStore';
import { useState, useEffect } from 'react';

const userSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  full_name: z.string().optional(),
  is_active: z.boolean(),
  is_superuser: z.boolean(),
  role_names: z.array(z.string()),
});

type UserFormData = z.infer<typeof userSchema>;

export default function NewUserPage() {
  const router = useRouter();
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const { company, selectedCompanyId, user } = useAuthStore();
  
  // Get the company ID to use for role fetching
  const companyId = company?.id || selectedCompanyId || user?.company_id;
  
  // Fetch available roles
  const { data: availableRoles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ['availableRoles', companyId],
    queryFn: () => {
      if (!companyId) throw new Error('No company context available');
      return companyManagementService.getAvailableRoles(companyId);
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      is_active: true,
      is_superuser: false,
      role_names: [],
    },
  });

  // Sync selectedRoles with form
  useEffect(() => {
    setValue('role_names', selectedRoles);
  }, [selectedRoles, setValue]);

  const createMutation = useMutation({
    mutationFn: userService.createUser,
    onSuccess: () => {
      router.push('/maintenance/system/users');
    },
  });

  // Handle role toggle
  const handleRoleToggle = (roleName: string) => {
    const currentRoles = selectedRoles;
    const newRoles = currentRoles.includes(roleName)
      ? currentRoles.filter(r => r !== roleName)
      : [...currentRoles, roleName];
    
    setSelectedRoles(newRoles);
  };

  const onSubmit = async (data: UserFormData) => {
    // Include selected roles in the submission
    const submitData = {
      ...data,
      role_names: selectedRoles,
    };
    await createMutation.mutateAsync(submitData);
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Create New User</h1>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Email Address
          </label>
          <input
            type="email"
            {...register('email')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            type="password"
            {...register('password')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Full Name
          </label>
          <input
            type="text"
            {...register('full_name')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              {...register('is_active')}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Active</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              {...register('is_superuser')}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Superuser</span>
          </label>
        </div>

        {/* Role Selection Section */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Assign Roles
            </label>
            {rolesLoading ? (
              <div className="text-sm text-gray-500">Loading roles...</div>
            ) : availableRoles.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-md p-3">
                {availableRoles.map((role) => (
                  <label key={role.id} className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedRoles.includes(role.name)}
                      onChange={() => handleRoleToggle(role.name)}
                      className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900">
                        {role.name}
                      </div>
                      {role.description && (
                        <div className="text-xs text-gray-500 mt-1">
                          {role.description}
                        </div>
                      )}
                      <div className="text-xs text-gray-400 mt-1">
                        {role.permissions?.length || 0} permissions
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            ) : companyId ? (
              <div className="text-sm text-gray-500">
                No roles available for this company.
              </div>
            ) : (
              <div className="text-sm text-amber-600">
                No company context available. Please select a company first.
              </div>
            )}
            
            {selectedRoles.length > 0 && (
              <div className="mt-3 p-2 bg-blue-50 rounded-md">
                <div className="text-sm text-blue-800">
                  Selected roles: {selectedRoles.join(', ')}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Creating...' : 'Create User'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/maintenance/system/users')}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
