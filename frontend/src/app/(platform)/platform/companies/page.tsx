'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DataTable, Column } from '@/components/ui/data-table';
import { platformService, CompanyWithStats } from '@/services/platformService';
import { Eye, Pause, Play, Settings, AlertTriangle, Users, HardDrive, Building, X, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface ActionDialogState {
  isOpen: boolean;
  type: 'suspend' | 'activate' | 'impersonate' | null;
  company: CompanyWithStats | null;
  reason: string;
}

interface CreateCompanyDialogState {
  isOpen: boolean;
  formData: {
    name: string;
    code: string;
    email: string;
    userLimit: string;
    storageLimit: string;
  };
}

export default function PlatformCompaniesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionDialog, setActionDialog] = useState<ActionDialogState>({
    isOpen: false,
    type: null,
    company: null,
    reason: ''
  });
  const [createDialog, setCreateDialog] = useState<CreateCompanyDialogState>({
    isOpen: false,
    formData: {
      name: '',
      code: '',
      email: '',
      userLimit: '50',
      storageLimit: '10'
    }
  });

  const { data: companies, isLoading, error } = useQuery({
    queryKey: ['platform-companies', search, statusFilter],
    queryFn: () => platformService.getCompanies({ 
      search: search || undefined, 
      status: statusFilter === 'all' ? undefined : statusFilter 
    }),
  });

  const suspendMutation = useMutation({
    mutationFn: ({ companyId, reason }: { companyId: number, reason: string }) =>
      platformService.suspendCompany(companyId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-companies'] });
      toast.success('Company suspended successfully');
      setActionDialog({ isOpen: false, type: null, company: null, reason: '' });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to suspend company');
    },
  });

  const activateMutation = useMutation({
    mutationFn: ({ companyId, reason }: { companyId: number, reason?: string }) =>
      platformService.activateCompany(companyId, reason || 'Platform admin activation'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-companies'] });
      toast.success('Company activated successfully');
      setActionDialog({ isOpen: false, type: null, company: null, reason: '' });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to activate company');
    },
  });

  const impersonateMutation = useMutation({
    mutationFn: (companyId: number) =>
      platformService.impersonateCompany(companyId),
    onSuccess: (data) => {
      localStorage.setItem('impersonation_token', data.access_token);
      localStorage.setItem('impersonated_company', JSON.stringify(data.company));
      toast.success(`Now impersonating ${data.company.name}`);
      router.push('/dashboard');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to impersonate company');
    },
  });

  const createCompanyMutation = useMutation({
    mutationFn: (data: any) => platformService.createCompany(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-companies'] });
      toast.success('Company created successfully');
      setCreateDialog({
        isOpen: false,
        formData: { name: '', code: '', email: '', userLimit: '50', storageLimit: '10' }
      });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to create company');
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'trial':
        return <Badge className="bg-blue-100 text-blue-800">Trial</Badge>;
      case 'suspended':
        return <Badge className="bg-red-100 text-red-800">Suspended</Badge>;
      case 'cancelled':
        return <Badge className="bg-gray-100 text-gray-800">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleAction = (type: 'suspend' | 'activate' | 'impersonate', company: CompanyWithStats) => {
    if (type === 'impersonate') {
      impersonateMutation.mutate(company.company.id);
    } else {
      setActionDialog({
        isOpen: true,
        type,
        company,
        reason: ''
      });
    }
  };

  const handleConfirmAction = () => {
    if (!actionDialog.company || !actionDialog.type) return;

    if (actionDialog.type === 'suspend') {
      suspendMutation.mutate({
        companyId: actionDialog.company.company.id,
        reason: actionDialog.reason
      });
    } else if (actionDialog.type === 'activate') {
      activateMutation.mutate({
        companyId: actionDialog.company.company.id,
        reason: actionDialog.reason
      });
    }
  };

  const handleCreateCompany = () => {
    const { formData } = createDialog;
    createCompanyMutation.mutate({
      name: formData.name,
      code: formData.code,
      primary_contact_email: formData.email,
      user_limit: parseInt(formData.userLimit),
      storage_limit_gb: parseInt(formData.storageLimit)
    });
  };

  const columns: Column<CompanyWithStats>[] = [
    {
      accessorKey: 'company.code',
      header: 'Code',
      cell: ({ row }: { row: { original: CompanyWithStats } }) => (
        <span className="font-mono text-sm">{row.original.company.code}</span>
      ),
    },
    {
      accessorKey: 'company.name',
      header: 'Company Name',
      cell: ({ row }: { row: { original: CompanyWithStats } }) => (
        <div>
          <div className="font-medium">{row.original.company.name}</div>
          {row.original.company.primary_contact_email && (
            <div className="text-sm text-muted-foreground">
              {row.original.company.primary_contact_email}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'user_count',
      header: 'Users',
      cell: ({ row }: { row: { original: CompanyWithStats } }) => (
        <div className="flex items-center gap-1">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span>{row.original.user_count}</span>
          <span className="text-muted-foreground">/ {row.original.company.user_limit}</span>
        </div>
      ),
    },
    {
      accessorKey: 'active_users_30d',
      header: 'Active (30d)',
      cell: ({ row }: { row: { original: CompanyWithStats } }) => (
        <span>{row.original.active_users_30d}</span>
      ),
    },
    {
      accessorKey: 'company.subscription_status',
      header: 'Status',
      cell: ({ row }: { row: { original: CompanyWithStats } }) => getStatusBadge(row.original.company.subscription_status),
    },
    {
      accessorKey: 'storage_used_gb',
      header: 'Storage',
      cell: ({ row }: { row: { original: CompanyWithStats } }) => {
        const used = row.original.storage_used_gb;
        const limit = row.original.company.storage_limit_gb;
        const percentage = (used / limit) * 100;
        
        return (
          <div className="flex items-center gap-1">
            <HardDrive className="h-4 w-4 text-muted-foreground" />
            <span className={percentage > 90 ? 'text-red-600 font-medium' : ''}>
              {used.toFixed(1)} / {limit} GB
            </span>
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: { row: { original: CompanyWithStats } }) => {
        const company = row.original;
        const isActive = company.company.subscription_status === 'active';
        const isSuspended = company.company.subscription_status === 'suspended';
        
        return (
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAction('impersonate', company)}
              disabled={isSuspended}
            >
              <Eye className="h-3 w-3" />
            </Button>
            
            {isActive && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAction('suspend', company)}
              >
                <Pause className="h-3 w-3" />
              </Button>
            )}
            
            {isSuspended && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAction('activate', company)}
              >
                <Play className="h-3 w-3" />
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading companies...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <span>Failed to load companies</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Company Management</h1>
          <p className="text-muted-foreground">
            Manage all companies in the platform
          </p>
        </div>
        <Button onClick={() => setCreateDialog({ ...createDialog, isOpen: true })}>
          <Plus className="h-4 w-4 mr-2" />
          Create Company
        </Button>
      </div>

      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <Input
            placeholder="Search companies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Companies</option>
          <option value="active">Active</option>
          <option value="trial">Trial</option>
          <option value="suspended">Suspended</option>
          <option value="cancelled">Cancelled</option>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <DataTable
            data={companies || []}
            columns={columns}
          />
        </CardContent>
      </Card>

      {/* Action Dialog */}
      {actionDialog.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                {actionDialog.type === 'suspend' ? 'Suspend Company' : 'Activate Company'}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActionDialog({ isOpen: false, type: null, company: null, reason: '' })}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Are you sure you want to {actionDialog.type} <strong>{actionDialog.company?.company.name}</strong>?
              </p>
              
              {actionDialog.type === 'suspend' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Reason for suspension:</label>
                  <Textarea
                    placeholder="Enter reason for suspension..."
                    value={actionDialog.reason}
                    onChange={(e) => setActionDialog({ ...actionDialog, reason: e.target.value })}
                  />
                </div>
              )}
              
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setActionDialog({ isOpen: false, type: null, company: null, reason: '' })}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmAction}
                  disabled={actionDialog.type === 'suspend' && !actionDialog.reason.trim()}
                  className={actionDialog.type === 'suspend' ? 'bg-red-600 hover:bg-red-700' : ''}
                >
                  {actionDialog.type === 'suspend' ? 'Suspend' : 'Activate'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create Company Dialog */}
      {createDialog.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Create New Company</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCreateDialog({ ...createDialog, isOpen: false })}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Company Name</label>
                <Input
                  placeholder="Enter company name"
                  value={createDialog.formData.name}
                  onChange={(e) => setCreateDialog({
                    ...createDialog,
                    formData: { ...createDialog.formData, name: e.target.value }
                  })}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Company Code</label>
                <Input
                  placeholder="Enter company code"
                  value={createDialog.formData.code}
                  onChange={(e) => setCreateDialog({
                    ...createDialog,
                    formData: { ...createDialog.formData, code: e.target.value }
                  })}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Primary Contact Email</label>
                <Input
                  type="email"
                  placeholder="Enter primary contact email"
                  value={createDialog.formData.email}
                  onChange={(e) => setCreateDialog({
                    ...createDialog,
                    formData: { ...createDialog.formData, email: e.target.value }
                  })}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">User Limit</label>
                  <Input
                    type="number"
                    value={createDialog.formData.userLimit}
                    onChange={(e) => setCreateDialog({
                      ...createDialog,
                      formData: { ...createDialog.formData, userLimit: e.target.value }
                    })}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Storage Limit (GB)</label>
                  <Input
                    type="number"
                    value={createDialog.formData.storageLimit}
                    onChange={(e) => setCreateDialog({
                      ...createDialog,
                      formData: { ...createDialog.formData, storageLimit: e.target.value }
                    })}
                  />
                </div>
              </div>
              
              <div className="flex gap-2 justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={() => setCreateDialog({ ...createDialog, isOpen: false })}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateCompany}
                  disabled={!createDialog.formData.name || !createDialog.formData.code || !createDialog.formData.email}
                >
                  Create Company
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
