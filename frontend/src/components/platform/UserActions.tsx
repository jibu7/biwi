'use client';


import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { 
  Edit2, 
  Trash2, 
  MoreHorizontal, 
  Key, 
  UserCheck, 
  UserX, 
  Shield, 
  Eye,
  Settings 
} from 'lucide-react';
import { toast } from 'sonner';
import { platformService, PlatformUser } from '@/services/platformService';

interface UserActionsProps {
  user: PlatformUser;
  onEdit: (user: PlatformUser) => void;
}

export function UserActions({ user, onEdit }: UserActionsProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const queryClient = useQueryClient();

  const deleteUserMutation = useMutation({
    mutationFn: (userId: number) => platformService.deleteUser(userId),
    onSuccess: () => {
      toast.success('User deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['platform-users'] });
      queryClient.invalidateQueries({ queryKey: ['platform-user-stats'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to delete user');
    },
  });

  const toggleUserStatusMutation = useMutation({
    mutationFn: (data: { userId: number; is_active: boolean }) => 
      platformService.updateUser(data.userId, { is_active: data.is_active }),
    onSuccess: (_, variables) => {
      toast.success(`User ${variables.is_active ? 'activated' : 'deactivated'} successfully`);
      queryClient.invalidateQueries({ queryKey: ['platform-users'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to update user status');
    },
  });

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete user ${user.full_name}?`)) {
      deleteUserMutation.mutate(user.id);
    }
    setShowDropdown(false);
  };

  const handleEdit = () => {
    onEdit(user);
    setShowDropdown(false);
  };

  const handleToggleStatus = () => {
    const newStatus = !user.is_active;
    toggleUserStatusMutation.mutate({ userId: user.id, is_active: newStatus });
    setShowDropdown(false);
  };

  const handleResetPassword = () => {
    // TODO: Implement reset password functionality
    toast.info('Reset password functionality coming soon');
    setShowDropdown(false);
  };

  const handleViewDetails = () => {
    // TODO: Implement view user details functionality
    toast.info('View details functionality coming soon');
    setShowDropdown(false);
  };

  const handleChangeRole = () => {
    // TODO: Implement change role functionality
    toast.info('Change role functionality coming soon');
    setShowDropdown(false);
  };

  return (
    <div className="relative">
      <Button
        size="sm"
        variant="outline"
        onClick={() => setShowDropdown(!showDropdown)}
        className="h-8 w-8 p-0"
      >
        <MoreHorizontal className="h-4 w-4" />
      </Button>
      
      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border z-20">
            <div className="py-1">
              {/* View Details */}
              <button
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                onClick={handleViewDetails}
              >
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </button>
              
              {/* Edit User */}
              <button
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                onClick={handleEdit}
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Edit User
              </button>

              {/* Activate/Deactivate */}
              <button
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                onClick={handleToggleStatus}
                disabled={toggleUserStatusMutation.isPending}
              >
                {user.is_active ? (
                  <>
                    <UserX className="h-4 w-4 mr-2" />
                    {toggleUserStatusMutation.isPending ? 'Deactivating...' : 'Deactivate User'}
                  </>
                ) : (
                  <>
                    <UserCheck className="h-4 w-4 mr-2" />
                    {toggleUserStatusMutation.isPending ? 'Activating...' : 'Activate User'}
                  </>
                )}
              </button>

              {/* Change Role - Only for non-platform admins */}
              {user.user_type !== 'platform_admin' && (
                <button
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                  onClick={handleChangeRole}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Change Role
                </button>
              )}

              {/* Reset Password */}
              <button
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                onClick={handleResetPassword}
              >
                <Key className="h-4 w-4 mr-2" />
                Reset Password
              </button>

              {/* Divider */}
              <div className="border-t border-gray-100 my-1" />

              {/* Delete User - Only for non-platform admins */}
              {user.user_type !== 'platform_admin' && (
                <button
                  className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left"
                  onClick={handleDelete}
                  disabled={deleteUserMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {deleteUserMutation.isPending ? 'Deleting...' : 'Delete User'}
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
