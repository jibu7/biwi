'use client';


import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2, MoreHorizontal } from 'lucide-react';
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

  return (
    <div className="relative">
      <Button
        size="sm"
        variant="outline"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <MoreHorizontal className="h-4 w-4" />
      </Button>
      
      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border z-20">
            <div className="py-1">
              <button
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                onClick={handleEdit}
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Edit User
              </button>
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
