'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { companyManagementService } from '@/services/companyManagementService';
import { platformService } from '@/services/platformService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft, Building2, User, Settings, AlertCircle } from 'lucide-react';
import Link from 'next/link';

// Form validation schema
const companyCreationSchema = z.object({
  // Company Information
  company_name: z.string().min(2, 'Company name must be at least 2 characters'),
  company_code: z.string().min(2, 'Company code must be at least 2 characters').regex(/^[A-Z0-9_]+$/, 'Company code must contain only uppercase letters, numbers, and underscores'),
  primary_contact_email: z.string().email('Invalid email address'),
  
  // Subscription Settings
  subscription_plan: z.enum(['trial', 'basic', 'professional', 'enterprise']),
  user_limit: z.number().min(1, 'User limit must be at least 1'),
  storage_limit_gb: z.number().min(1, 'Storage limit must be at least 1 GB'),
  
  // Admin User Information
  admin_email: z.string().email('Invalid admin email address'),
  admin_full_name: z.string().min(2, 'Admin full name must be at least 2 characters'),
  admin_password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  admin_password_confirm: z.string(),
  
  // Optional Settings
  is_active: z.boolean(),
  send_welcome_email: z.boolean(),
}).refine((data) => data.admin_password === data.admin_password_confirm, {
  message: "Passwords don't match",
  path: ["admin_password_confirm"],
});

type CompanyCreationFormData = z.infer<typeof companyCreationSchema>;

export default function NewCompanyPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CompanyCreationFormData>({
    resolver: zodResolver(companyCreationSchema),
    defaultValues: {
      subscription_plan: 'trial',
      user_limit: 50,
      storage_limit_gb: 10,
      is_active: true,
      send_welcome_email: true,
    },
  });

  // Watch for form values to show preview
  const watchedValues = watch();

  const createCompanyMutation = useMutation({
    mutationFn: async (data: CompanyCreationFormData) => {
      setIsSubmitting(true);
      
      try {
        // Step 1: Create the company
        const companyData = {
          name: data.company_name,
          code: data.company_code,
          primary_contact_email: data.primary_contact_email,
          subscription_plan: data.subscription_plan,
          user_limit: data.user_limit,
          storage_limit_gb: data.storage_limit_gb,
          is_active: data.is_active,
        };

        const createdCompany = await platformService.createCompany(companyData);
        
        // Step 2: Create the admin user for the company
        const adminUserData = {
          email: data.admin_email,
          password: data.admin_password,
          full_name: data.admin_full_name,
          user_type: 'company_admin' as const,
          company_id: createdCompany.id,
          is_active: data.is_active,
        };

        const createdAdmin = await companyManagementService.createUser(adminUserData);

        // Step 3: Send welcome email if requested
        if (data.send_welcome_email) {
          // This would typically call an email service
          console.log('Welcome email would be sent to:', data.admin_email);
        }

        return { company: createdCompany, admin: createdAdmin };
      } finally {
        setIsSubmitting(false);
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['platform-companies'] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      
      toast.success(
        `Company "${result.company.name}" and admin user created successfully!`
      );
      
      router.push('/administration/companies');
    },
    onError: (error: unknown) => {
      console.error('Company creation error:', error);
      toast.error(
        error.message || 'Failed to create company. Please try again.'
      );
    },
  });

  const onSubmit = async (data: CompanyCreationFormData) => {
    await createCompanyMutation.mutateAsync(data);
  };

  const subscriptionPlans = [
    { value: 'trial', label: 'Trial (30 days)', description: 'Free trial with basic features' },
    { value: 'basic', label: 'Basic', description: 'Essential features for small teams' },
    { value: 'professional', label: 'Professional', description: 'Advanced features for growing businesses' },
    { value: 'enterprise', label: 'Enterprise', description: 'Full feature set with priority support' },
  ];

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link 
            href="/administration/companies" 
            className="flex items-center gap-2 text-sm text-muted-foreground hover:underline mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Companies
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Create New Company</h1>
          <p className="text-muted-foreground">Set up a new company with an admin user</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Company Information Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Company Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company_name">Company Name *</Label>
                    <Input
                      id="company_name"
                      {...register('company_name')}
                      placeholder="e.g., Innovate Solutions Inc."
                      className={errors.company_name ? 'border-red-500' : ''}
                    />
                    {errors.company_name && (
                      <p className="text-sm text-red-600">{errors.company_name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company_code">Company Code *</Label>
                    <Input
                      id="company_code"
                      {...register('company_code')}
                      placeholder="e.g., INNOVATE_SOL"
                      className={errors.company_code ? 'border-red-500' : ''}
                    />
                    {errors.company_code && (
                      <p className="text-sm text-red-600">{errors.company_code.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="primary_contact_email">Primary Contact Email *</Label>
                  <Input
                    id="primary_contact_email"
                    type="email"
                    {...register('primary_contact_email')}
                    placeholder="e.g., contact@innovatesolutions.com"
                    className={errors.primary_contact_email ? 'border-red-500' : ''}
                  />
                  {errors.primary_contact_email && (
                    <p className="text-sm text-red-600">{errors.primary_contact_email.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Admin User Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Admin User Account
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Create the primary administrator account for this company
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="admin_email">Admin Email *</Label>
                    <Input
                      id="admin_email"
                      type="email"
                      {...register('admin_email')}
                      placeholder="e.g., admin@innovatesolutions.com"
                      className={errors.admin_email ? 'border-red-500' : ''}
                    />
                    {errors.admin_email && (
                      <p className="text-sm text-red-600">{errors.admin_email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="admin_full_name">Admin Full Name *</Label>
                    <Input
                      id="admin_full_name"
                      {...register('admin_full_name')}
                      placeholder="e.g., John Smith"
                      className={errors.admin_full_name ? 'border-red-500' : ''}
                    />
                    {errors.admin_full_name && (
                      <p className="text-sm text-red-600">{errors.admin_full_name.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="admin_password">Admin Password *</Label>
                    <Input
                      id="admin_password"
                      type="password"
                      {...register('admin_password')}
                      placeholder="Enter secure password"
                      className={errors.admin_password ? 'border-red-500' : ''}
                    />
                    {errors.admin_password && (
                      <p className="text-sm text-red-600">{errors.admin_password.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Must contain uppercase, lowercase, and number
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="admin_password_confirm">Confirm Password *</Label>
                    <Input
                      id="admin_password_confirm"
                      type="password"
                      {...register('admin_password_confirm')}
                      placeholder="Confirm password"
                      className={errors.admin_password_confirm ? 'border-red-500' : ''}
                    />
                    {errors.admin_password_confirm && (
                      <p className="text-sm text-red-600">{errors.admin_password_confirm.message}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Subscription Settings Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Subscription Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="subscription_plan">Subscription Plan *</Label>
                  <select
                    id="subscription_plan"
                    {...register('subscription_plan')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {subscriptionPlans.map((plan) => (
                      <option key={plan.value} value={plan.value}>
                        {plan.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">
                    {subscriptionPlans.find(p => p.value === watchedValues.subscription_plan)?.description}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="user_limit">User Limit *</Label>
                    <Input
                      id="user_limit"
                      type="number"
                      min="1"
                      {...register('user_limit', { valueAsNumber: true })}
                      className={errors.user_limit ? 'border-red-500' : ''}
                    />
                    {errors.user_limit && (
                      <p className="text-sm text-red-600">{errors.user_limit.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="storage_limit_gb">Storage Limit (GB) *</Label>
                    <Input
                      id="storage_limit_gb"
                      type="number"
                      min="1"
                      {...register('storage_limit_gb', { valueAsNumber: true })}
                      className={errors.storage_limit_gb ? 'border-red-500' : ''}
                    />
                    {errors.storage_limit_gb && (
                      <p className="text-sm text-red-600">{errors.storage_limit_gb.message}</p>
                    )}
                  </div>
                </div>

                {/* Additional Options */}
                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is_active"
                      {...register('is_active')}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <Label htmlFor="is_active" className="text-sm">
                      Activate company immediately
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="send_welcome_email"
                      {...register('send_welcome_email')}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <Label htmlFor="send_welcome_email" className="text-sm">
                      Send welcome email to admin user
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="text-lg">Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Company</h4>
                  <p className="font-medium">{watchedValues.company_name || 'Company Name'}</p>
                  <p className="text-sm text-muted-foreground">{watchedValues.company_code || 'COMPANY_CODE'}</p>
                </div>

                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Admin User</h4>
                  <p className="font-medium">{watchedValues.admin_full_name || 'Admin Name'}</p>
                  <p className="text-sm text-muted-foreground">{watchedValues.admin_email || 'admin@company.com'}</p>
                </div>

                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Subscription</h4>
                  <p className="font-medium capitalize">{watchedValues.subscription_plan || 'trial'}</p>
                  <p className="text-sm text-muted-foreground">
                    {watchedValues.user_limit || 50} users, {watchedValues.storage_limit_gb || 10} GB
                  </p>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm">
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                    <span className="text-muted-foreground">
                      Company will be {watchedValues.is_active ? 'activated' : 'created as inactive'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-4 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="min-w-[140px]"
          >
            {isSubmitting ? 'Creating...' : 'Create Company'}
          </Button>
        </div>
      </form>
    </div>
  );
}
