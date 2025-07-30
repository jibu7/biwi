'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { analyticsService, ExecutiveDashboardData, TimeRangeFilter } from '@/services/analyticsService';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Users, 
  Package, 
  ShoppingCart,
  CreditCard,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  BarChart3,
  PieChart,
  Download,
  RefreshCw,
  Settings,
  Filter,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  Activity
} from 'lucide-react';
import { DashboardCard } from '@/components/analytics/DashboardCard';
import { ChartContainer } from '@/components/analytics/ChartContainer';
import { SimpleBarChart, SimpleLineChart, DonutChart } from '@/components/analytics/SimpleCharts';
import { cn } from '@/lib/utils';

export default function ExecutiveDashboardPage() {
  const { user, company } = useAuthStore();
  const [timeRange, setTimeRange] = useState<TimeRangeFilter>('30d');
  
  // Fetch real analytics data
  const { 
    data: dashboardData, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['executive-dashboard', timeRange],
    queryFn: () => analyticsService.getExecutiveDashboard(timeRange),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // Auto-refresh every 10 minutes
  });

  // Helper function to determine change type from change string
  const getChangeType = (change: string): 'positive' | 'negative' | 'neutral' => {
    if (change.startsWith('+')) return 'positive';
    if (change.startsWith('-')) return 'negative';
    return 'neutral';
  };

  // Use real data or fallback to empty arrays if loading/error
  const revenueByMonth = dashboardData?.charts.revenueByMonth || [];

  const expenseBreakdown = (dashboardData?.charts.expenseBreakdown || []).map((item, index) => ({
    ...item,
    color: ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'][index % 8]
  }));

  const topProducts = (dashboardData?.charts.topCustomers || []).map((item, index) => ({
    ...item,
    color: ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-red-500', 'bg-pink-500', 'bg-teal-500', 'bg-orange-500'][index % 8]
  }));

  const salesFunnel = (dashboardData?.charts.salesFunnel || []).map((item, index) => ({
    ...item,
    color: ['#ddd6fe', '#c4b5fd', '#a78bfa', '#8b5cf6', '#7c3aed'][index % 5]
  }));

  const alerts = (dashboardData?.alerts || []).map(alert => ({
    ...alert,
    priority: alert.type === 'warning' ? 'high' : alert.type === 'error' ? 'high' : 'medium'
  }));

  const refreshData = async () => {
    await refetch();
  };

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-2">Failed to load dashboard data</p>
          <button 
            onClick={refreshData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Executive Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Real-time business insights for {company?.name}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-500">Live data</span>
            </div>
            <span className="text-gray-300">•</span>
            <span className="text-sm text-gray-500">
              Last updated: {dashboardData?.last_updated ? new Date(dashboardData.last_updated).toLocaleTimeString() : 'Never'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-3 mt-4 lg:mt-0">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          
          <button
            onClick={refreshData}
            disabled={isLoading}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            Refresh
          </button>
          
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="bg-white rounded-lg border shadow-sm p-4">
          <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Attention Required
          </h3>
          <div className="space-y-2">
            {alerts.map((alert, index) => (
              <div key={index} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  alert.type === 'warning' && "bg-amber-500",
                  alert.type === 'info' && "bg-blue-500",
                  alert.type === 'success' && "bg-green-500"
                )} />
                <span className="text-sm text-gray-700 flex-1">{alert.message}</span>
                <span className={cn(
                  "text-xs px-2 py-1 rounded-full font-medium",
                  alert.priority === 'high' && "bg-red-100 text-red-700",
                  alert.priority === 'medium' && "bg-yellow-100 text-yellow-700",
                  alert.priority === 'low' && "bg-green-100 text-green-700"
                )}>
                  {alert.priority}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard
          title="Total Revenue"
          value={dashboardData?.kpis.totalRevenue.value || '$0.00'}
          change={dashboardData?.kpis.totalRevenue.change || '+0.0%'}
          changeType={getChangeType(dashboardData?.kpis.totalRevenue.change || '+0.0%')}
          icon={DollarSign}
          subtitle="Gross revenue this period"
          loading={isLoading}
        />
        
        <DashboardCard
          title="Net Profit"
          value={dashboardData?.kpis.netProfit.value || '$0.00'}
          change={dashboardData?.kpis.netProfit.change || '+0.0%'}
          changeType={getChangeType(dashboardData?.kpis.netProfit.change || '+0.0%')}
          icon={TrendingUp}
          subtitle="After all expenses"
          loading={isLoading}
        />
        
        <DashboardCard
          title="Cash Flow"
          value={dashboardData?.kpis.cashFlow.value || '$0.00'}
          change={dashboardData?.kpis.cashFlow.change || '+0.0%'}
          changeType={getChangeType(dashboardData?.kpis.cashFlow.change || '+0.0%')}
          icon={Activity}
          subtitle="Operating cash flow"
          loading={isLoading}
        />
        
        <DashboardCard
          title="Active Customers"
          value={dashboardData?.kpis.activeCustomers.value || '0'}
          change={dashboardData?.kpis.activeCustomers.change || '+0'}
          changeType={getChangeType(dashboardData?.kpis.activeCustomers.change || '+0')}
          icon={Users}
          subtitle="Active customers"
          loading={isLoading}
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard
          title="Outstanding A/P"
          value={dashboardData?.kpis.outstandingAP?.value || '$0.00'}
          change={dashboardData?.kpis.outstandingAP?.change || '+0.0%'}
          changeType={getChangeType(dashboardData?.kpis.outstandingAP?.change || '+0.0%')}
          icon={ShoppingCart}
          subtitle="Accounts payable"
          loading={isLoading}
        />
        
        <DashboardCard
          title="Outstanding A/R"
          value={dashboardData?.kpis.outstandingAR.value || '$0.00'}
          change={dashboardData?.kpis.outstandingAR.change || '+0.0%'}
          changeType={getChangeType(dashboardData?.kpis.outstandingAR.change || '+0.0%')}
          icon={Package}
          subtitle="Accounts receivable"
          loading={isLoading}
        />
        
        <DashboardCard
          title="Cash Position"
          value={dashboardData?.kpis.cashFlow.value || '$0.00'}
          change={dashboardData?.kpis.cashFlow.change || '+0.0%'}
          changeType={getChangeType(dashboardData?.kpis.cashFlow.change || '+0.0%')}
          icon={CreditCard}
          subtitle="Cash & bank accounts"
          loading={isLoading}
        />
        
        <DashboardCard
          title="Total Revenue"
          value={dashboardData?.kpis.totalRevenue.value || '$0.00'}
          change={dashboardData?.kpis.totalRevenue.change || '+0.0%'}
          changeType={getChangeType(dashboardData?.kpis.totalRevenue.change || '+0.0%')}
          icon={TrendingUp}
          subtitle="Total period revenue"
          loading={isLoading}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartContainer
          title="Revenue Trend"
          subtitle="Monthly revenue over the past year"
          className="lg:col-span-2"
          loading={isLoading}
          actions={
            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
              <Eye className="h-4 w-4" />
            </button>
          }
        >
          <SimpleLineChart
            data={revenueByMonth}
            height={240}
            color="rgb(59, 130, 246)"
          />
        </ChartContainer>

        <ChartContainer
          title="Expense Breakdown"
          subtitle="Current period distribution"
          loading={isLoading}
        >
          <DonutChart
            data={expenseBreakdown}
            size={200}
            thickness={30}
          />
        </ChartContainer>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartContainer
          title="Top Customers by Revenue"
          subtitle="Best performing customers this period"
          loading={isLoading}
        >
          <SimpleBarChart
            data={topProducts}
            height={240}
          />
        </ChartContainer>

        <ChartContainer
          title="Sales Funnel"
          subtitle="Lead conversion progress"
          loading={isLoading}
        >
          <div className="space-y-4">
            {salesFunnel.map((stage, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className="w-20 text-sm font-medium text-gray-700">
                  {stage.label}
                </div>
                <div className="flex-1 bg-gray-200 rounded-full h-6 relative overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      backgroundColor: stage.color,
                      width: `${(stage.value / salesFunnel[0].value) * 100}%`
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-700">
                    {stage.value}
                  </div>
                </div>
                <div className="w-12 text-sm text-gray-500">
                  {Math.round((stage.value / salesFunnel[0].value) * 100)}%
                </div>
              </div>
            ))}
          </div>
        </ChartContainer>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'View Financial Reports', href: '/reports/financial', icon: BarChart3, color: 'bg-blue-50 text-blue-600' },
            { label: 'Process Invoices', href: '/transactions/ar/invoices', icon: CreditCard, color: 'bg-green-50 text-green-600' },
            { label: 'Check Inventory', href: '/reports/inventory', icon: Package, color: 'bg-purple-50 text-purple-600' },
            { label: 'Customer Analysis', href: '/reports/ar/customer-analysis', icon: Users, color: 'bg-orange-50 text-orange-600' }
          ].map((action, index) => (
            <a
              key={index}
              href={action.href}
              className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all group"
            >
              <div className={cn("p-2 rounded-lg", action.color)}>
                <action.icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-900 group-hover:text-gray-700">
                  {action.label}
                </span>
                <ArrowUpRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 ml-auto" />
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
