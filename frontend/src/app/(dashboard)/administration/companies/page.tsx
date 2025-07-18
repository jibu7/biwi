'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { platformService } from '@/services/platformService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Building2, Plus, Search, Users, HardDrive } from 'lucide-react';
import Link from 'next/link';

export default function CompaniesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: companies = [], isLoading, error } = useQuery({
    queryKey: ['platform-companies', searchTerm, statusFilter],
    queryFn: () => platformService.getCompanies({
      search: searchTerm || undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
    }),
    staleTime: 30 * 1000, // 30 seconds
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Active', variant: 'default' as const },
      trial: { label: 'Trial', variant: 'secondary' as const },
      suspended: { label: 'Suspended', variant: 'destructive' as const },
      inactive: { label: 'Inactive', variant: 'outline' as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const filteredCompanies = companies.filter((company: any) => {
    const matchesSearch = !searchTerm || 
      company.company?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.company?.code?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      company.company?.subscription_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-red-600">Failed to load companies. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Companies</h1>
          <p className="text-muted-foreground">Manage tenant companies and their settings</p>
        </div>
        <Link href="/administration/companies/new">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Company
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search companies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="trial">Trial</option>
                <option value="suspended">Suspended</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Companies Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredCompanies.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No companies found</h3>
            <p className="text-gray-600 text-center mb-4">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Get started by creating your first company'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <Link href="/administration/companies/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Company
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCompanies.map((companyData: any) => {
            const company = companyData.company || companyData;
            return (
              <Card key={company.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-gray-900 truncate">
                        {company.name}
                      </CardTitle>
                      <p className="text-sm text-gray-500 font-mono">
                        {company.code}
                      </p>
                    </div>
                    {getStatusBadge(company.subscription_status)}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {company.primary_contact_email && (
                      <div>
                        <p className="text-xs text-gray-500">Contact</p>
                        <p className="text-sm text-gray-900 truncate">
                          {company.primary_contact_email}
                        </p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Users</p>
                          <p className="text-sm font-medium">
                            {companyData.user_count || 0}/{company.user_limit || 'N/A'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <HardDrive className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Storage</p>
                          <p className="text-sm font-medium">
                            {companyData.storage_used_gb?.toFixed(1) || '0.0'}/{company.storage_limit_gb || 'N/A'} GB
                          </p>
                        </div>
                      </div>
                    </div>

                    {company.created_at && (
                      <div>
                        <p className="text-xs text-gray-500">Created</p>
                        <p className="text-sm text-gray-700">
                          {new Date(company.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Link href={`/administration/companies/${company.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          View Details
                        </Button>
                      </Link>
                      <Link href={`/administration/companies/${company.id}/edit`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          Edit
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Summary Stats */}
      {!isLoading && filteredCompanies.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-gray-900">{filteredCompanies.length}</p>
                <p className="text-sm text-gray-600">
                  {searchTerm || statusFilter !== 'all' ? 'Filtered' : 'Total'} Companies
                </p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {filteredCompanies.filter((c: any) => c.company?.subscription_status === 'active').length}
                </p>
                <p className="text-sm text-gray-600">Active</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {filteredCompanies.filter((c: any) => c.company?.subscription_status === 'trial').length}
                </p>
                <p className="text-sm text-gray-600">Trial</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">
                  {filteredCompanies.filter((c: any) => c.company?.subscription_status === 'suspended').length}
                </p>
                <p className="text-sm text-gray-600">Suspended</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
