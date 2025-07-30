'use client';

import React, { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
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
  const [timeRange, setTimeRange] = useState('30d');
  const [isLoading, setIsLoading] = useState(false);

  // Mock data - in real implementation, this would come from API
  const kpiData = {
    totalRevenue: {
      value: '$2,847,392',
      change: '+12.5%',
      changeType: 'positive' as const,
      trend: [45, 52, 48, 61, 58, 67, 73, 69, 76, 82, 85, 91]
    },
    totalExpenses: {
      value: '$1,923,481',
      change: '+8.2%',
      changeType: 'negative' as const,
      trend: [35, 42, 38, 45, 48, 52, 49, 56, 53, 59, 62, 65]
    },
    netProfit: {
      value: '$923,911',
      change: '+18.3%',
      changeType: 'positive' as const,
      trend: [10, 15, 12, 18, 16, 22, 25, 23, 28, 31, 34, 38]
    },
    cashFlow: {
      value: '$1,234,567',
      change: '+5.7%',
      changeType: 'positive' as const,
      trend: [20, 25, 22, 30, 28, 35, 32, 38, 36, 42, 45, 48]
    },
    activeCustomers: {
      value: '1,847',
      change: '+24',
      changeType: 'positive' as const,
    },
    pendingOrders: {
      value: '156',
      change: '-12',
      changeType: 'positive' as const,
    },
    inventoryValue: {
      value: '$456,789',
      change: '+3.2%',
      changeType: 'positive' as const,
    },
    outstandingAR: {
      value: '$234,567',
      change: '-8.4%',
      changeType: 'positive' as const,
    }
  };

  const revenueByMonth = [
    { label: 'Jan', value: 180000 },
    { label: 'Feb', value: 195000 },
    { label: 'Mar', value: 210000 },
    { label: 'Apr', value: 225000 },
    { label: 'May', value: 240000 },
    { label: 'Jun', value: 255000 },
    { label: 'Jul', value: 270000 },
    { label: 'Aug', value: 285000 },
    { label: 'Sep', value: 265000 },
    { label: 'Oct', value: 290000 },
    { label: 'Nov', value: 305000 },
    { label: 'Dec', value: 320000 }
  ];

  const expenseBreakdown = [
    { label: 'Cost of Goods Sold', value: 45, color: '#ef4444' },
    { label: 'Salaries & Benefits', value: 28, color: '#3b82f6' },
    { label: 'Operating Expenses', value: 15, color: '#10b981' },
    { label: 'Marketing', value: 8, color: '#f59e0b' },
    { label: 'Other', value: 4, color: '#8b5cf6' }
  ];

  const topProducts = [
    { label: 'Product A', value: 125000, color: 'bg-blue-500' },
    { label: 'Product B', value: 98000, color: 'bg-green-500' },
    { label: 'Product C', value: 87000, color: 'bg-yellow-500' },
    { label: 'Product D', value: 76000, color: 'bg-purple-500' },
    { label: 'Product E', value: 65000, color: 'bg-red-500' }
  ];

  const salesFunnel = [
    { label: 'Leads', value: 1200, color: '#ddd6fe' },
    { label: 'Qualified', value: 800, color: '#c4b5fd' },
    { label: 'Proposals', value: 400, color: '#a78bfa' },
    { label: 'Negotiations', value: 200, color: '#8b5cf6' },
    { label: 'Closed Won', value: 120, color: '#7c3aed' }
  ];

  const alerts = [
    { type: 'warning', message: 'Low inventory levels for 3 products', priority: 'high' },
    { type: 'info', message: 'Monthly financial reports ready for review', priority: 'medium' },
    { type: 'success', message: '15 new customer orders this week', priority: 'low' },
    { type: 'warning', message: '5 invoices overdue by 30+ days', priority: 'high' }
  ];

  const refreshData = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
  };

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
              Last updated: {new Date().toLocaleTimeString()}
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
          value={kpiData.totalRevenue.value}
          change={kpiData.totalRevenue.change}
          changeType={kpiData.totalRevenue.changeType}
          icon={DollarSign}
          trend={kpiData.totalRevenue.trend}
          subtitle="Gross revenue this period"
          loading={isLoading}
        />
        
        <DashboardCard
          title="Net Profit"
          value={kpiData.netProfit.value}
          change={kpiData.netProfit.change}
          changeType={kpiData.netProfit.changeType}
          icon={TrendingUp}
          trend={kpiData.netProfit.trend}
          subtitle="After all expenses"
          loading={isLoading}
        />
        
        <DashboardCard
          title="Cash Flow"
          value={kpiData.cashFlow.value}
          change={kpiData.cashFlow.change}
          changeType={kpiData.cashFlow.changeType}
          icon={Activity}
          trend={kpiData.cashFlow.trend}
          subtitle="Operating cash flow"
          loading={isLoading}
        />
        
        <DashboardCard
          title="Active Customers"
          value={kpiData.activeCustomers.value}
          change={kpiData.activeCustomers.change}
          changeType={kpiData.activeCustomers.changeType}
          icon={Users}
          subtitle="Customers with orders"
          loading={isLoading}
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard
          title="Pending Orders"
          value={kpiData.pendingOrders.value}
          change={kpiData.pendingOrders.change}
          changeType={kpiData.pendingOrders.changeType}
          icon={ShoppingCart}
          subtitle="Awaiting fulfillment"
          loading={isLoading}
        />
        
        <DashboardCard
          title="Inventory Value"
          value={kpiData.inventoryValue.value}
          change={kpiData.inventoryValue.change}
          changeType={kpiData.inventoryValue.changeType}
          icon={Package}
          subtitle="Current stock value"
          loading={isLoading}
        />
        
        <DashboardCard
          title="Outstanding A/R"
          value={kpiData.outstandingAR.value}
          change={kpiData.outstandingAR.change}
          changeType={kpiData.outstandingAR.changeType}
          icon={CreditCard}
          subtitle="Accounts receivable"
          loading={isLoading}
        />
        
        <DashboardCard
          title="Total Expenses"
          value={kpiData.totalExpenses.value}
          change={kpiData.totalExpenses.change}
          changeType={kpiData.totalExpenses.changeType}
          icon={TrendingDown}
          subtitle="All operating costs"
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
          title="Top Products by Revenue"
          subtitle="Best performing products this month"
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
