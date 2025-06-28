"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, User, Mail, Shield, Users } from 'lucide-react';
import { userService } from '@/services/userService';
import { roleService } from '@/services/roleService';
import { UserUpdate, Role } from '@/types';
import { usePermissions } from '@/hooks/usePermissions';
import * as permissions from '@/lib/permissions';

const userSchema = z.object({
  email: z.string().email('Invalid email address'),
  full_name: z.string().min(1, 'Full name is required').max(100, 'Name too long'),
  is_active: z.boolean(),
  is_superuser: z.boolean(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
});

type UserFormData = z.infer<typeof userSchema>;

export default function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const unwrappedParams = React.use(params);
  const userId = parseInt(unwrappedParams.id);
  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);
  const [rolesInitialized, setRolesInitialized] = useState(false);

  // Check permissions
  if (!hasPermission(permissions.USER_UPDATE)) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Access Denied</h3>
          <p className="text-red-600">You don't have permission to edit users.</p>
        </div>
      </div>
    );
  }

  const { data: user, isLoading } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => userService.getUser(userId),
  });

  const { data: allRoles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: () => roleService.getRoles(),
    enabled: hasPermission(permissions.USER_MANAGE_ROLES),
  });

  const { data: userRoles = [] } = useQuery({
    queryKey: ['userRoles', userId],
    queryFn: () => userService.getUserRoles(userId),
    enabled: !!userId && hasPermission(permissions.USER_MANAGE_ROLES),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
  });

  // Reset form when user data loads
  useEffect(() => {
    if (user) {
      reset({
        email: user.email,
        full_name: user.full_name || '',
        is_active: user.is_active,
        is_superuser: user.is_superuser,
        password: '', // Don't populate password
      });
    }
  }, [user, reset]);

  // Initialize selected roles when user roles data is first loaded
  useEffect(() => {
    if (userRoles && userRoles.length >= 0 && !rolesInitialized) {
      setSelectedRoles(userRoles.map(role => role.id));
      setRolesInitialized(true);
    }
  }, [userRoles, rolesInitialized]);

  const updateMutation = useMutation({
    mutationFn: (data: UserUpdate) => userService.updateUser(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
      alert('User updated successfully!');
      router.push('/maintenance/system/users');
    },
    onError: (error: any) => {
      alert('Error updating user: ' + (error.response?.data?.detail || error.message));
    },
  });

  const assignRoleMutation = useMutation({
    mutationFn: ({ roleId }: { roleId: number }) => userService.assignRole(userId, roleId),
    onSuccess: () => {
      // Don't auto-invalidate to prevent loops - we'll update state manually
    },
  });

  const revokeRoleMutation = useMutation({
    mutationFn: ({ roleId }: { roleId: number }) => userService.revokeRole(userId, roleId),
    onSuccess: () => {
      // Don't auto-invalidate to prevent loops - we'll update state manually  
    },
  });

  const handleRoleToggle = async (roleId: number, isAssigned: boolean) => {
    try {
      if (isAssigned) {
        await revokeRoleMutation.mutateAsync({ roleId });
        setSelectedRoles(prev => prev.filter(id => id !== roleId));
      } else {
        await assignRoleMutation.mutateAsync({ roleId });
        setSelectedRoles(prev => [...prev, roleId]);
      }
      
      // Manually invalidate queries after state update
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['userRoles', userId] });
      }, 100);
      
    } catch (error) {
      alert('Error updating role assignment: ' + (error as any).message);
      // Revert the local state change on error
      if (isAssigned) {
        setSelectedRoles(prev => [...prev, roleId]);
      } else {
        setSelectedRoles(prev => prev.filter(id => id !== roleId));
      }
    }
  };

  const onSubmit = (data: UserFormData) => {
    const updateData: UserUpdate = {
      email: data.email,
      full_name: data.full_name,
      is_active: data.is_active,
      is_superuser: data.is_superuser,
    };

    // Only include password if it's provided
    if (data.password && data.password.trim()) {
      updateData.password = data.password;
    }

    updateMutation.mutate(updateData);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">User Not Found</h3>
          <p className="text-red-600">The requested user could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <User className="text-indigo-600" />
            Edit User
          </h1>
          <p className="text-gray-600 mt-1">Update user information and permissions</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Mail className="text-gray-500" size={20} />
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  {...register('email')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="user@company.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  {...register('full_name')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="John Doe"
                />
                {errors.full_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.full_name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password (leave blank to keep current)
                </label>
                <input
                  type="password"
                  {...register('password')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter new password"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="text-gray-500" size={20} />
              Security Settings
            </h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  {...register('is_active')}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Active User
                </label>
              </div>

              {hasPermission(permissions.USER_MANAGE_ROLES) && (
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('is_superuser')}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    Superuser (Full system access)
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Role Assignment */}
          {hasPermission(permissions.USER_MANAGE_ROLES) && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <Users className="text-gray-500" size={20} />
                Role Assignment
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                {allRoles.length === 0 ? (
                  <p className="text-sm text-gray-500">No roles available. Create roles first to assign them to users.</p>
                ) : (
                  <div className="space-y-3">
                    {allRoles.map((role) => {
                      const isAssigned = selectedRoles.includes(role.id);
                      return (
                        <div key={role.id} className="flex items-start space-x-3">
                          <input
                            type="checkbox"
                            id={`role-${role.id}`}
                            checked={isAssigned}
                            onChange={() => handleRoleToggle(role.id, isAssigned)}
                            disabled={assignRoleMutation.isPending || revokeRoleMutation.isPending}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mt-1"
                          />
                          <div className="flex-1">
                            <label htmlFor={`role-${role.id}`} className="block text-sm font-medium text-gray-900 cursor-pointer">
                              {role.name}
                            </label>
                            {role.description && (
                              <p className="text-xs text-gray-500 mt-1">{role.description}</p>
                            )}
                            <div className="text-xs text-gray-400 mt-1">
                              {role.permissions.length} permission{role.permissions.length !== 1 ? 's' : ''}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-6 border-t">
            <button
              type="button"
              onClick={() => router.push('/maintenance/system/users')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {updateMutation.isPending ? 'Updating...' : 'Update User'}
            </button>
          </div>
        </form>
      </div>

      {/* Loading overlay */}
      {updateMutation.isPending && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Updating user...</p>
          </div>
        </div>
      )}
    </div>
  );
}
