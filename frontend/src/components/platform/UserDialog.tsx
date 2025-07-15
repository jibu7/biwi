'use client';


import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, EnhancedSelect, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { platformService, PlatformUser, UserCreate, UserUpdate } from '@/services/platformService';

interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: PlatformUser;
  companies: Array<{ company: { id: number; name: string; code: string } }>;
  mode: 'create' | 'edit';
}

export function UserDialog({ open, onOpenChange, user, companies, mode }: UserDialogProps) {
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    password: '',
    user_type: 'company_user',
    company_id: '',
    is_active: true,
  });

  // Update form data when user changes
  useEffect(() => {
    if (user && mode === 'edit') {
      setFormData({
        email: user.email,
        full_name: user.full_name,
        password: '',
        user_type: user.user_type,
        company_id: user.company_id?.toString() || '',
        is_active: user.is_active,
      });
    } else {
      setFormData({
        email: '',
        full_name: '',
        password: '',
        user_type: 'company_user',
        company_id: '',
        is_active: true,
      });
    }
  }, [user, mode, open]);

  const queryClient = useQueryClient();

  const createUserMutation = useMutation({
    mutationFn: (userData: UserCreate) => platformService.createUser(userData),
    onSuccess: () => {
      toast.success('User created successfully');
      queryClient.invalidateQueries({ queryKey: ['platform-users'] });
      queryClient.invalidateQueries({ queryKey: ['platform-user-stats'] });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to create user');
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ userId, userData }: { userId: number; userData: UserUpdate }) =>
      platformService.updateUser(userId, userData),
    onSuccess: () => {
      toast.success('User updated successfully');
      queryClient.invalidateQueries({ queryKey: ['platform-users'] });
      queryClient.invalidateQueries({ queryKey: ['platform-user-stats'] });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to update user');
    },
  });

  const resetForm = () => {
    setFormData({
      email: '',
      full_name: '',
      password: '',
      user_type: 'company_user',
      company_id: '',
      is_active: true,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === 'create') {
      const userData: UserCreate = {
        email: formData.email,
        full_name: formData.full_name,
        password: formData.password,
        user_type: formData.user_type,
        company_id: formData.user_type === 'platform_admin' ? undefined : parseInt(formData.company_id),
        is_active: formData.is_active,
      };
      createUserMutation.mutate(userData);
    } else if (user) {
      const userData: UserUpdate = {
        email: formData.email,
        full_name: formData.full_name,
        user_type: formData.user_type,
        is_active: formData.is_active,
      };
      
      if (formData.password) {
        userData.password = formData.password;
      }
      
      updateUserMutation.mutate({ userId: user.id, userData });
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  const userTypeOptions = [
    { value: 'platform_admin', label: 'Platform Admin' },
    { value: 'company_admin', label: 'Company Admin' },
    { value: 'company_user', label: 'Company User' },
  ];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create New User' : 'Edit User'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">
              Password {mode === 'edit' && '(leave blank to keep current)'}
            </Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              required={mode === 'create'}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="user_type">User Type</Label>
            <EnhancedSelect
              value={formData.user_type}
              onValueChange={(value) => setFormData(prev => ({ ...prev, user_type: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select user type" />
              </SelectTrigger>
              <SelectContent>
                {userTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </EnhancedSelect>
          </div>
          
          {formData.user_type !== 'platform_admin' && (
            <div className="space-y-2">
              <Label htmlFor="company_id">Company</Label>
              <EnhancedSelect
                value={formData.company_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, company_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((comp) => (
                    <SelectItem key={comp.company.id} value={comp.company.id.toString()}>
                      {comp.company.name} ({comp.company.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </EnhancedSelect>
            </div>
          )}
          
          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked: boolean) => setFormData(prev => ({ ...prev, is_active: checked }))}
            />
            <Label htmlFor="is_active">Active</Label>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createUserMutation.isPending || updateUserMutation.isPending}
            >
              {mode === 'create' ? 'Create User' : 'Update User'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
