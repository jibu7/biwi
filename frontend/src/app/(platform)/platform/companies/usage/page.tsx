'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { platformService } from '@/services/platformService';
import { 
  HardDrive, 
  Users, 
  Activity, 
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Database,
  Zap,
  TrendingUp,
  Calendar,
  Building2,
  Gauge
} from 'lucide-react';

interface CompanyUsage {
  company: {
    id: number;
    name: string;
    code: string;
    subscription_status: string;
    subscription_plan?: string;
    storage_limit_gb: number;
    user_limit: number;
    is_active: boolean;
  };
  usage: {
    storage_gb: number;
    storage_percentage: number;
    users: number;
    user_percentage: number;
    active_users_30d: number;
    transactions_30d: number;
    api_calls_30d: number;
  };
  billing_period: string;
}

export default function CompanyUsagePage() {
  const [selectedPeriod, setSelectedPeriod] = useState<string>(
    new Date().toISOString().slice(0, 7) // Current month YYYY-MM
  );
  const [sortBy, setSortBy] = useState<'name' | 'storage' | 'users' | 'activity'>('name');

  const { data: usageData, isLoading } = useQuery({
    queryKey: ['companies-usage', selectedPeriod],
    queryFn: () => platformService.getCompaniesUsage({ billing_period: selectedPeriod }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-slate-600 animate-pulse">Loading usage analytics...</p>
        </div>
      </div>
    );
  }

  const companies: CompanyUsage[] = usageData || [];

  // Calculate platform totals
  const platformTotals = companies.reduce((totals, company) => ({
    totalStorage: totals.totalStorage + (company.usage.storage_gb || 0),
    totalUsers: totals.totalUsers + (company.usage.users || 0),
    totalActiveUsers: totals.totalActiveUsers + (company.usage.active_users_30d || 0),
    totalTransactions: totals.totalTransactions + (company.usage.transactions_30d || 0),
    totalApiCalls: totals.totalApiCalls + (company.usage.api_calls_30d || 0),
    totalCompanies: totals.totalCompanies + 1,
    activeCompanies: totals.activeCompanies + (company.company.is_active ? 1 : 0)
  }), {
    totalStorage: 0,
    totalUsers: 0,
    totalActiveUsers: 0,
    totalTransactions: 0,
    totalApiCalls: 0,
    totalCompanies: 0,
    activeCompanies: 0
  });

  // Sort companies
  const sortedCompanies = [...companies].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.company.name.localeCompare(b.company.name);
      case 'storage':
        return b.usage.storage_gb - a.usage.storage_gb;
      case 'users':
        return b.usage.users - a.usage.users;
      case 'activity':
        return b.usage.transactions_30d - a.usage.transactions_30d;
      default:
        return 0;
    }
  });

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600 bg-red-100';
    if (percentage >= 75) return 'text-orange-600 bg-orange-100';
    if (percentage >= 50) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'trial':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'suspended':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'expired':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatBytes = (gb: number) => {
    if (gb < 1) return `${(gb * 1024).toFixed(1)} MB`;
    return `${gb.toFixed(2)} GB`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Resource Usage Analytics
            </h1>
            <p className="text-slate-600 mt-2">
              Monitor resource consumption and usage patterns across all companies
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Billing Period
              </label>
              <input
                type="month"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Platform Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-lg font-semibold text-slate-800">
                    Storage Usage
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 mb-2">
                {formatBytes(platformTotals.totalStorage)}
              </div>
              <div className="text-sm text-slate-600">
                Across {platformTotals.totalCompanies} companies
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-600" />
                  <CardTitle className="text-lg font-semibold text-slate-800">
                    Total Users
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 mb-2">
                {platformTotals.totalUsers.toLocaleString()}
              </div>
              <div className="text-sm text-slate-600">
                {platformTotals.totalActiveUsers.toLocaleString()} active (30d)
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-purple-600" />
                  <CardTitle className="text-lg font-semibold text-slate-800">
                    Transactions
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 mb-2">
                {platformTotals.totalTransactions.toLocaleString()}
              </div>
              <div className="text-sm text-slate-600">
                Last 30 days
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-orange-600" />
                  <CardTitle className="text-lg font-semibold text-slate-800">
                    API Calls
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 mb-2">
                {platformTotals.totalApiCalls.toLocaleString()}
              </div>
              <div className="text-sm text-slate-600">
                Last 30 days
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between bg-white rounded-lg p-4 shadow-sm border">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-slate-700">Sort by:</span>
            <div className="flex gap-2">
              {[
                { key: 'name', label: 'Company Name', icon: Building2 },
                { key: 'storage', label: 'Storage Usage', icon: HardDrive },
                { key: 'users', label: 'User Count', icon: Users },
                { key: 'activity', label: 'Activity Level', icon: Activity }
              ].map(({ key, label, icon: Icon }) => (
                <Button
                  key={key}
                  variant={sortBy === key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSortBy(key as any)}
                  className="text-xs flex items-center gap-1"
                >
                  <Icon className="h-3 w-3" />
                  {label}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Calendar className="h-4 w-4" />
            Period: {selectedPeriod}
          </div>
        </div>

        {/* Companies Usage List */}
        <div className="space-y-4">
          {sortedCompanies.map((companyData) => (
            <Card 
              key={companyData.company.id} 
              className="border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-white"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                      <Building2 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">
                        {companyData.company.name}
                      </h3>
                      <p className="text-sm text-slate-500">
                        {companyData.company.code} • {companyData.company.subscription_plan || 'No Plan'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`text-xs ${getStatusColor(companyData.company.subscription_status)}`}>
                      {companyData.company.subscription_status}
                    </Badge>
                    {companyData.company.is_active ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Storage Usage */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                        <HardDrive className="h-4 w-4" />
                        Storage
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${getUsageColor(companyData.usage.storage_percentage)}`}>
                        {companyData.usage.storage_percentage}%
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-slate-900">
                      {formatBytes(companyData.usage.storage_gb)}
                    </div>
                    <div className="text-xs text-slate-500">
                      of {companyData.company.storage_limit_gb || '∞'} GB limit
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          companyData.usage.storage_percentage >= 90 ? 'bg-red-500' :
                          companyData.usage.storage_percentage >= 75 ? 'bg-orange-500' :
                          companyData.usage.storage_percentage >= 50 ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(companyData.usage.storage_percentage, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* User Usage */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                        <Users className="h-4 w-4" />
                        Users
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${getUsageColor(companyData.usage.user_percentage)}`}>
                        {companyData.usage.user_percentage}%
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-slate-900">
                      {companyData.usage.users}
                    </div>
                    <div className="text-xs text-slate-500">
                      of {companyData.company.user_limit || '∞'} user limit
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          companyData.usage.user_percentage >= 90 ? 'bg-red-500' :
                          companyData.usage.user_percentage >= 75 ? 'bg-orange-500' :
                          companyData.usage.user_percentage >= 50 ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(companyData.usage.user_percentage, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Activity Metrics */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <Activity className="h-4 w-4" />
                      Activity (30d)
                    </div>
                    <div className="text-2xl font-bold text-slate-900">
                      {companyData.usage.active_users_30d}
                    </div>
                    <div className="text-xs text-slate-500">
                      active users
                    </div>
                    <div className="text-sm text-slate-600">
                      {companyData.usage.transactions_30d.toLocaleString()} transactions
                    </div>
                  </div>

                  {/* API Usage */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <Zap className="h-4 w-4" />
                      API Calls (30d)
                    </div>
                    <div className="text-2xl font-bold text-slate-900">
                      {companyData.usage.api_calls_30d.toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-500">
                      API requests
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-600">
                      <TrendingUp className="h-3 w-3" />
                      Activity score: {Math.round((companyData.usage.active_users_30d / companyData.usage.users) * 100) || 0}%
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-4 pt-4 border-t">
                  <Button variant="outline" size="sm" className="text-xs">
                    <BarChart3 className="h-3 w-3 mr-1" />
                    View Trends
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs">
                    <Gauge className="h-3 w-3 mr-1" />
                    Usage Details
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs">
                    Manage Limits
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Summary Footer */}
        <div className="text-center py-6 bg-white rounded-lg shadow-sm border">
          <p className="text-sm text-slate-500">
            Showing usage data for {companies.length} companies in period {selectedPeriod}
            • Total Storage: {formatBytes(platformTotals.totalStorage)}
            • Total Users: {platformTotals.totalUsers.toLocaleString()}
            • Active Companies: {platformTotals.activeCompanies}/{platformTotals.totalCompanies}
          </p>
        </div>
      </div>
    </div>
  );
}