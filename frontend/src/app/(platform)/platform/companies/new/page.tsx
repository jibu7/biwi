'use client';


import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { platformService, CompanyCreate } from '@/services/platformService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CreateCompanyPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<CompanyCreate>({
    name: '',
    code: '',
    primary_contact_email: '',
    user_limit: 50,
    storage_limit_gb: 10,
    subscription_status: 'trial',
  });

  const createCompanyMutation = useMutation({
    mutationFn: (data: CompanyCreate) => platformService.createCompany(data),
    onSuccess: (newCompany) => {
      queryClient.invalidateQueries({ queryKey: ['platform-companies'] });
      toast.success(`Company "${newCompany.name}" created successfully`);
      router.push('/platform/companies');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to create company');
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const dataToSend = {
        ...formData,
        user_limit: Number(formData.user_limit),
        storage_limit_gb: Number(formData.storage_limit_gb),
    };

    createCompanyMutation.mutate(dataToSend);
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
        <div>
            <Link href="/platform/companies" className="flex items-center gap-2 text-sm text-muted-foreground hover:underline">
                <ArrowLeft className="h-4 w-4" />
                Back to Companies
            </Link>
        </div>
      <Card>
        <CardHeader>
          <CardTitle>Create New Company</CardTitle>
          <p className="text-muted-foreground">Set up a new tenant on the platform.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label htmlFor="name" className="font-medium">Company Name</label>
                    <Input
                    id="name"
                    name="name"
                    placeholder="e.g., Innovate Corp"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    />
                </div>
                <div className="space-y-2">
                    <label htmlFor="code" className="font-medium">Company Code</label>
                    <Input
                    id="code"
                    name="code"
                    placeholder="e.g., INNOVATE"
                    value={formData.code}
                    onChange={handleInputChange}
                    required
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label htmlFor="primary_contact_email" className="font-medium">Primary Contact Email</label>
                <Input
                id="primary_contact_email"
                name="primary_contact_email"
                type="email"
                placeholder="e.g., contact@innovate.com"
                value={formData.primary_contact_email}
                onChange={handleInputChange}
                required
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label htmlFor="user_limit" className="font-medium">User Limit</label>
                    <Input
                    id="user_limit"
                    name="user_limit"
                    type="number"
                    value={formData.user_limit}
                    onChange={handleInputChange}
                    required
                    />
                </div>
                <div className="space-y-2">
                    <label htmlFor="storage_limit_gb" className="font-medium">Storage Limit (GB)</label>
                    <Input
                    id="storage_limit_gb"
                    name="storage_limit_gb"
                    type="number"
                    value={formData.storage_limit_gb}
                    onChange={handleInputChange}
                    required
                    />
                </div>
            </div>

            <div className="flex justify-end gap-4 pt-4">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                    Cancel
                </Button>
                <Button type="submit" disabled={createCompanyMutation.isPending}>
                    {createCompanyMutation.isPending ? 'Creating...' : 'Create Company'}
                </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
