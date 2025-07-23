'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { platformService } from '@/services/platformService';
import { DashboardStats } from '@/components/platform/DashboardStats';
import { RevenueChart } from '@/components/platform/RevenueChart';
import { SystemHealthWidget } from '@/components/platform/SystemHealthWidget';
import { CompanyUsageTable } from '@/components/platform/CompanyUsageTable';
import { Activity, TrendingUp, Shield, Users } from 'lucide-react';

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-slate-600 animate-pulse">Loading platform dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Platform Dashboard
            </h1>
            <p className="text-slate-600 mt-2">
              Monitor system performance and manage platform operations
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              System Online
            </div>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-indigo-600/10 rounded-3xl transform rotate-1"></div>
          <div className="relative bg-white/70 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl p-6">
            <DashboardStats stats={stats} />
          </div>
        </div>
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Revenue Chart */}
          <div className="group">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-blue-50/50 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg shadow-lg">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-semibold text-slate-800">
                      Revenue Analytics
                    </CardTitle>
                    <p className="text-sm text-slate-600">Month-to-date performance</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="h-[300px] relative">
                  <RevenueChart />
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* System Health */}
          <div className="group">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-indigo-50/50 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-lg">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-semibold text-slate-800">
                      System Health
                    </CardTitle>
                    <p className="text-sm text-slate-600">Real-time monitoring</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="h-[300px] relative">
                  <SystemHealthWidget health={health} />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Company Usage Table */}
        <div className="group">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-purple-50/30 backdrop-blur-sm">
            <CardHeader className="pb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg shadow-lg">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-semibold text-slate-800">
                      Company Usage Analytics
                    </CardTitle>
                    <p className="text-sm text-slate-600">Top performing companies by activity</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full text-xs font-medium text-slate-600">
                  <Activity className="h-3 w-3" />
                  Live Data
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/50 pointer-events-none rounded-lg"></div>
                <CompanyUsageTable />
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Footer */}
        <div className="text-center py-6">
          <p className="text-sm text-slate-500">
            Last updated: {new Date().toLocaleString()} • Data refreshes every 30 seconds
          </p>
        </div>
      </div>
    </div>
  );
}