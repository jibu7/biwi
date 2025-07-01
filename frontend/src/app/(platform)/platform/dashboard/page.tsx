'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { platformService, PlatformMetrics } from '@/services/platformService';
import { Building, Users, Activity, DollarSign, AlertTriangle, TrendingUp } from 'lucide-react';
import Link from 'next/link';

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
}

function MetricCard({ title, value, description, icon, trend }: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function PlatformDashboard() {
  const { data: metrics, isLoading, error } = useQuery({
    queryKey: ['platform-metrics'],
    queryFn: platformService.getMetrics,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Error Loading Platform Data</h2>
          <p className="text-gray-600 mb-4">
            {error instanceof Error ? error.message : 'Failed to load platform metrics'}
          </p>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const suspendedCompaniesPercent = metrics?.total_companies 
    ? Math.round((metrics.suspended_companies / metrics.total_companies) * 100) 
    : 0;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Platform Administration</h1>
          <p className="text-muted-foreground">
            Monitor and manage your multi-tenant ERP platform
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/platform/companies">
            <Button>
              <Building className="h-4 w-4 mr-2" />
              Manage Companies
            </Button>
          </Link>
          <Link href="/platform/audit-logs">
            <Button variant="outline">
              <Activity className="h-4 w-4 mr-2" />
              Audit Logs
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Status Alert */}
      {suspendedCompaniesPercent > 10 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <span className="font-medium text-orange-800">
                High Suspension Rate: {suspendedCompaniesPercent}% of companies are suspended
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Companies"
          value={metrics?.total_companies || 0}
          description="All registered companies"
          icon={<Building className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          title="Active Companies"
          value={metrics?.active_companies || 0}
          description={`${metrics?.trial_companies || 0} in trial`}
          icon={<TrendingUp className="h-4 w-4 text-green-600" />}
        />
        <MetricCard
          title="Total Users"
          value={metrics?.total_users || 0}
          description={`${metrics?.active_users_today || 0} active today`}
          icon={<Users className="h-4 w-4 text-blue-600" />}
        />
        <MetricCard
          title="Monthly Revenue"
          value={`$${(metrics?.revenue_this_month || 0).toLocaleString()}`}
          description="Current month"
          icon={<DollarSign className="h-4 w-4 text-green-600" />}
        />
      </div>

      {/* Status Overview */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Company Status Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Active</span>
              <Badge variant="default" className="bg-green-100 text-green-800">
                {metrics?.active_companies || 0}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Trial</span>
              <Badge variant="secondary">
                {metrics?.trial_companies || 0}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Suspended</span>
              <Badge variant="destructive">
                {metrics?.suspended_companies || 0}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total</span>
              <Badge variant="outline">
                {metrics?.total_companies || 0}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Platform Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Total Transactions</span>
              <span className="font-medium">
                {(metrics?.total_transactions || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Active Users Today</span>
              <span className="font-medium">
                {metrics?.active_users_today || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Platform Health</span>
              <Badge 
                variant={suspendedCompaniesPercent < 5 ? "default" : "destructive"}
                className={suspendedCompaniesPercent < 5 ? "bg-green-100 text-green-800" : ""}
              >
                {suspendedCompaniesPercent < 5 ? "Healthy" : "Needs Attention"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Link href="/platform/companies/new">
              <Button variant="outline" className="w-full justify-start">
                <Building className="h-4 w-4 mr-2" />
                Create Company
              </Button>
            </Link>
            <Link href="/platform/companies?status=suspended">
              <Button variant="outline" className="w-full justify-start">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Review Suspended
              </Button>
            </Link>
            <Link href="/platform/audit-logs">
              <Button variant="outline" className="w-full justify-start">
                <Activity className="h-4 w-4 mr-2" />
                View Audit Logs
              </Button>
            </Link>
            <Link href="/platform/companies?status=trial">
              <Button variant="outline" className="w-full justify-start">
                <TrendingUp className="h-4 w-4 mr-2" />
                Trial Companies
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
