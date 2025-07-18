'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { platformService } from '@/services/platformService';
import { Card } from '@/components/ui/card';
import { Building2, Users, FileText, TrendingUp } from 'lucide-react';

interface DashboardStats {
  total_companies: number;
  active_companies: number;
  suspended_companies: number;
  trial_companies: number;
  total_users: number;
  total_transactions: number;
  platform_admins: number;
}

export default function PlatformDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load stats and companies in parallel
      const [statsData, companiesData] = await Promise.all([
        platformService.getDashboardStats(),
        platformService.getCompanies({ limit: 5 }) // Recent 5 companies
      ]);
      
      setStats(statsData);
      setCompanies(companiesData);
    } catch (err) {
      console.error('Dashboard load error:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleImpersonate = async (companyId: number) => {
    try {
      await platformService.impersonateCompany(companyId);
      router.push('/dashboard');
    } catch (err) {
      console.error('Impersonation error:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          <p>{error}</p>
          <button 
            onClick={loadDashboardData}
            className="mt-2 text-sm underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Platform Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Companies</p>
              <p className="text-3xl font-bold">{stats?.total_companies || 0}</p>
              <p className="text-xs text-green-600">
                {stats?.active_companies || 0} active
              </p>
            </div>
            <Building2 className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Users</p>
              <p className="text-3xl font-bold">{stats?.total_users || 0}</p>
              <p className="text-xs text-muted-foreground">
                Across all companies
              </p>
            </div>
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Transactions (30d)</p>
              <p className="text-3xl font-bold">{stats?.total_transactions || 0}</p>
              <p className="text-xs text-muted-foreground">
                Last 30 days
              </p>
            </div>
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Trial Companies</p>
              <p className="text-3xl font-bold">{stats?.trial_companies || 0}</p>
              <p className="text-xs text-yellow-600">
                {stats?.suspended_companies || 0} suspended
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>
      </div>

      {/* Recent Companies */}
      <Card>
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Recent Companies</h2>
            <button
              onClick={() => router.push('/platform/companies')}
              className="text-sm text-primary hover:underline"
            >
              View all
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Company</th>
                  <th className="text-left py-2">Code</th>
                  <th className="text-left py-2">Users</th>
                  <th className="text-left py-2">Status</th>
                  <th className="text-left py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((companyData) => (
                  <tr key={companyData.company.id} className="border-b">
                    <td className="py-2">{companyData.company.name}</td>
                    <td className="py-2">{companyData.company.code}</td>
                    <td className="py-2">{companyData.user_count}</td>
                    <td className="py-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        companyData.company.subscription_status === 'active' 
                          ? 'bg-green-100 text-green-800'
                          : companyData.company.subscription_status === 'suspended'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {companyData.company.subscription_status}
                      </span>
                    </td>
                    <td className="py-2">
                      <button
                        onClick={() => handleImpersonate(companyData.company.id)}
                        className="text-sm text-primary hover:underline"
                      >
                        Impersonate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
}