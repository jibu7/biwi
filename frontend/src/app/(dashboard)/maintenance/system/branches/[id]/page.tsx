'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { commonService } from '@/services/commonService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Branch } from '@/types/common';
import { COMMON_SETUP_BRANCHES } from '@/lib/permissions';
import { useAuth } from '@/store/authStore';
import { ArrowLeft } from 'lucide-react';

const branchFormSchema = z.object({
  name: z.string().min(1, "Branch name is required").max(100),
  address_line1: z.string().min(1, "Address Line 1 is required").max(255),
  address_line2: z.string().max(255).optional().nullable(),
  city: z.string().min(1, "City is required").max(100),
  state_province: z.string().min(1, "State/Province is required").max(100),
  postal_code: z.string().min(1, "Postal Code is required").max(20),
  country: z.string().min(1, "Country is required").max(100),
  phone_number: z.string().max(20).optional().nullable(),
  email_address: z.string().email("Invalid email address").max(100).optional().nullable(),
});

type BranchFormValues = z.infer<typeof branchFormSchema>;

export default function EditBranchPage() {
  const router = useRouter();
  const params = useParams();
  const branchIdStr = resolvedParams?.id as string;
  const branchId = Number(branchIdStr);
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();

  const { data: branch, isLoading: isLoadingBranch, isError: isErrorBranch } = useQuery<Branch, Error>({
    queryKey: ['branch', branchId],
    queryFn: () => commonService.getBranch(branchId), // Ensure branchId is number
    enabled: !!branchId && hasPermission(`${COMMON_SETUP_BRANCHES}:edit`),
  });

  const form = useForm<BranchFormValues>({
    resolver: zodResolver(branchFormSchema),
    defaultValues: {
      name: '',
      address_line1: '',
      address_line2: '',
      city: '',
      state_province: '',
      postal_code: '',
      country: '',
      phone_number: '',
      email_address: '',
    },
  });

  useEffect(() => {
    if (branch) {
      form.reset({
        name: branch.name,
        address_line1: branch.address_line1,
        address_line2: branch.address_line2 || '',
        city: branch.city,
        state_province: branch.state_province,
        postal_code: branch.postal_code,
        country: branch.country,
        phone_number: branch.phone_number || '',
        email_address: branch.email_address || '',
      });
    }
  }, [branch, form]);

  const updateBranchMutation = useMutation<Branch, Error, BranchFormValues>({
    mutationFn: (data) => commonService.updateBranch(branchId, data), // Ensure branchId is number
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      queryClient.invalidateQueries({ queryKey: ['branch', branchId] });
      toast.success(`Branch "${data.name}" updated successfully.`);
      router.push('/maintenance/system/branches');
    },
    onError: (error) => {
      const errorData = error as any;
      const errorMessage = errorData?.response?.data?.detail || error.message || "Failed to update branch. Please try again.";
      toast.error(errorMessage);
      if (errorData?.response?.data?.errors) {
        const fieldErrors = errorData.response.data.errors;
        Object.keys(fieldErrors).forEach((field) => {
          form.setError(field as keyof BranchFormValues, {
            type: 'server',
            message: fieldErrors[field][0],
          });
        });
      }
    },
  });

  const onSubmit = (data: BranchFormValues) => {
    if (!hasPermission(`${COMMON_SETUP_BRANCHES}:edit`)) {
      toast.error("You don&apos;t have permission to edit branches.");
      return;
    }
    updateBranchMutation.mutate(data);
  };

  if (!hasPermission(`${COMMON_SETUP_BRANCHES}:view`) && !hasPermission(`${COMMON_SETUP_BRANCHES}:edit`)) {
    return <p>You do not have permission to view or edit branches.</p>;
  }

  if (isLoadingBranch) return <p>Loading branch details...</p>;
  if (isErrorBranch) return <p>Error loading branch details.</p>;
  if (!branch && !isLoadingBranch) return <p>Branch not found.</p>; // Added !isLoadingBranch condition

  return (
    <div className="container mx-auto p-4">
      <Button variant="outline" size="sm" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Branches
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>Edit Branch: {branch?.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="name"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>Branch Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Main Office, Downtown Branch" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address_line1"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>Address Line 1</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 123 Main St" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address_line2"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>Address Line 2 (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Suite 100, Apt B" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., New York" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="state_province"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel>State / Province</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., NY, California" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="postal_code"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel>Postal Code</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 10001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., United States" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="phone_number"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel>Phone Number (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., (555) 123-4567" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email_address"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel>Email Address (Optional)</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="e.g., branch@example.com" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button type="submit" disabled={updateBranchMutation.isPending || !hasPermission(`${COMMON_SETUP_BRANCHES}:edit`)}>
                {updateBranchMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
