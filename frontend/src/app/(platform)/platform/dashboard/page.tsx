'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { platformService } from '@/services/platformService';
import { DashboardStats } from '@/components/platform/DashboardStats';
import { RevenueChart } from '@/components/platform/RevenueChart';
import { SystemHealthWidget } from '@/components/platform/SystemHealthWidget';
import { CompanyUsageTable } from '@/components/platform/CompanyUsageTable';

export default function PlatformDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['platform-stats'],
    queryFn: platformService.getPlatformStats,
  });

  const { data: health } = useQuery({
    queryKey: ['system-health'],
    queryFn: platformService.getSystemHealth,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Platform Dashboard</h1>
      
      <DashboardStats stats={stats} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue (MTD)</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <SystemHealthWidget health={health} />
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Top Companies by Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <CompanyUsageTable />
        </CardContent>
      </Card>
    </div>
  );
}