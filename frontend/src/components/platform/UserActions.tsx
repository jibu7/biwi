'use client';

import { useState, useRef, useEffect } from 'react';
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
  Eye 
} from 'lucide-react';
import { toast } from 'sonner';
import { platformService, PlatformUser } from '@/services/platformService';

interface UserActionsProps {
  user: PlatformUser;
  onEdit: (user: PlatformUser) => void;
}

export function UserActions({ user, onEdit }: UserActionsProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const queryClient = useQueryClient();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDropdown]);

  // Close dropdown on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [showDropdown]);

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

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (window.confirm(`Are you sure you want to delete user "${user.full_name || user.email}"?`)) {
      deleteUserMutation.mutate(user.id);
    }
    setShowDropdown(false);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    onEdit(user);
    setShowDropdown(false);
  };

  const handleToggleStatus = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const newStatus = !user.is_active;
    toggleUserStatusMutation.mutate({ userId: user.id, is_active: newStatus });
    setShowDropdown(false);
  };

  const handleResetPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // TODO: Implement reset password functionality
    toast.info('Reset password functionality coming soon');
    setShowDropdown(false);
  };

  const handleViewDetails = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // TODO: Implement view user details functionality
    toast.info('View details functionality coming soon');
    setShowDropdown(false);
  };

  const handleChangeRole = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // TODO: Implement change role functionality
    toast.info('Change role functionality coming soon');
    setShowDropdown(false);
  };

  const toggleDropdown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDropdown(!showDropdown);
  };

  return (
    <div className="relative inline-block text-left">
      <Button
        ref={buttonRef}
        size="sm"
        variant="outline"
        onClick={toggleDropdown}
        className="h-8 w-8 p-0 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
        aria-label={`Actions for ${user.full_name || user.email}`}
        aria-expanded={showDropdown}
        aria-haspopup="true"
      >
        <MoreHorizontal className="h-4 w-4" />
      </Button>
      
      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute right-0 z-50 mt-2 w-56 origin-top-right bg-white border border-gray-200 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
          role="menu"
          aria-orientation="vertical"
        >
          <div className="py-1" role="none">
            {/* View Details */}
            <button
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors duration-150"
              onClick={handleViewDetails}
              role="menuitem"
              type="button"
            >
              <Eye className="h-4 w-4 mr-3 text-gray-400" />
              View Details
            </button>
            
            {/* Edit User */}
            <button
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors duration-150"
              onClick={handleEdit}
              role="menuitem"
              type="button"
            >
              <Edit2 className="h-4 w-4 mr-3 text-gray-400" />
              Edit User
            </button>

            {/* Activate/Deactivate */}
            <button
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleToggleStatus}
              disabled={toggleUserStatusMutation.isPending}
              role="menuitem"
              type="button"
            >
              {user.is_active ? (
                <>
                  <UserX className="h-4 w-4 mr-3 text-gray-400" />
                  {toggleUserStatusMutation.isPending ? 'Deactivating...' : 'Deactivate User'}
                </>
              ) : (
                <>
                  <UserCheck className="h-4 w-4 mr-3 text-gray-400" />
                  {toggleUserStatusMutation.isPending ? 'Activating...' : 'Activate User'}
                </>
              )}
            </button>

            {/* Change Role - Only for non-platform admins */}
            {user.user_type !== 'platform_admin' && (
              <button
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors duration-150"
                onClick={handleChangeRole}
                role="menuitem"
                type="button"
              >
                <Shield className="h-4 w-4 mr-3 text-gray-400" />
                Change Role
              </button>
            )}

            {/* Reset Password */}
            <button
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors duration-150"
              onClick={handleResetPassword}
              role="menuitem"
              type="button"
            >
              <Key className="h-4 w-4 mr-3 text-gray-400" />
              Reset Password
            </button>

            {/* Divider */}
            <div className="border-t border-gray-100 my-1" role="separator" />

            {/* Delete User - Only for non-platform admins */}
            {user.user_type !== 'platform_admin' && (
              <button
                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleDelete}
                disabled={deleteUserMutation.isPending}
                role="menuitem"
                type="button"
              >
                <Trash2 className="h-4 w-4 mr-3" />
                {deleteUserMutation.isPending ? 'Deleting...' : 'Delete User'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
