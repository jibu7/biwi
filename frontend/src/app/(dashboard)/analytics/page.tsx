'use client';

import React from 'react';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  TrendingUp, 
  BarChart3, 
  PieChart,
  Activity,
  Target,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export default function AnalyticsPage() {
  const dashboards = [
    {
      id: 'executive',
      title: 'Executive Dashboard',
      description: 'High-level business metrics and KPIs for leadership team',
      href: '/analytics/dashboard/executive',
      icon: LayoutDashboard,
      color: 'bg-blue-500',
      badge: 'Live Data',
      features: ['Real-time KPIs', 'Revenue analytics', 'Expense tracking', 'Quick actions']
    },
    {
      id: 'financial',
      title: 'Financial Dashboard',
      description: 'Detailed financial analysis and reporting',
      href: '/analytics/dashboard/financial',
      icon: TrendingUp,
      color: 'bg-green-500',
      badge: 'Coming Soon',
      features: ['P&L analysis', 'Cash flow', 'Budget vs actual', 'Financial ratios']
    },
    {
      id: 'operations',
      title: 'Operations Dashboard',
      description: 'Operational metrics and performance indicators',
      href: '/analytics/dashboard/operations',
      icon: Activity,
      color: 'bg-purple-500',
      badge: 'Coming Soon',
      features: ['Inventory metrics', 'Order fulfillment', 'Supply chain', 'Quality metrics']
    },
    {
      id: 'sales',
      title: 'Sales Analytics',
      description: 'Sales performance and customer insights',
      href: '/analytics/dashboard/sales',
      icon: Target,
      color: 'bg-orange-500',
      badge: 'Coming Soon',
      features: ['Sales funnel', 'Customer analytics', 'Product performance', 'Territory analysis']
    }
  ];

  const quickReports = [
    { title: 'Balance Sheet', href: '/reports/financial/balance-sheet', icon: BarChart3 },
    { title: 'Income Statement', href: '/reports/financial/income-statement', icon: TrendingUp },
    { title: 'Cash Flow', href: '/reports/financial/cash-flow', icon: Activity },
    { title: 'Customer Aging', href: '/reports/ar/aging', icon: PieChart }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics & Insights</h1>
        <p className="text-gray-600 mt-2">
          Comprehensive business intelligence and reporting platform
        </p>
      </div>

      {/* Featured Dashboard */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5" />
              <span className="text-blue-100 text-sm font-medium">Featured</span>
            </div>
            <h2 className="text-2xl font-bold mb-2">Executive Dashboard</h2>
            <p className="text-blue-100 mb-4 max-w-md">
              Get real-time insights into your business performance with our comprehensive executive dashboard featuring live KPIs, revenue analytics, and smart recommendations.
            </p>
            <Link
              href="/analytics/dashboard/executive"
              className="inline-flex items-center gap-2 bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors"
            >
              View Dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="hidden lg:block">
            <LayoutDashboard className="h-24 w-24 text-blue-300" />
          </div>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Available Dashboards</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {dashboards.map((dashboard) => {
            const Icon = dashboard.icon;
            const isAvailable = dashboard.badge === 'Live Data';
            
            return (
              <div
                key={dashboard.id}
                className="bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-lg ${dashboard.color} bg-opacity-10`}>
                      <Icon className={`h-6 w-6 ${dashboard.color.replace('bg-', 'text-')}`} />
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      dashboard.badge === 'Live Data' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {dashboard.badge}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {dashboard.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    {dashboard.description}
                  </p>
                  
                  <ul className="space-y-1 mb-6">
                    {dashboard.features.map((feature, index) => (
                      <li key={index} className="text-sm text-gray-500 flex items-center gap-2">
                        <div className="w-1 h-1 bg-gray-400 rounded-full" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  {isAvailable ? (
                    <Link
                      href={dashboard.href}
                      className="w-full bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                    >
                      Open Dashboard
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  ) : (
                    <button
                      disabled
                      className="w-full bg-gray-100 text-gray-400 px-4 py-2 rounded-lg text-sm font-medium cursor-not-allowed"
                    >
                      Coming Soon
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Reports */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Reports</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickReports.map((report, index) => {
            const Icon = report.icon;
            
            return (
              <Link
                key={index}
                href={report.href}
                className="bg-white rounded-lg border p-4 hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-gray-100 transition-colors">
                    <Icon className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-900 group-hover:text-gray-700">
                      {report.title}
                    </span>
                    <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 ml-auto inline" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Analytics Features */}
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Analytics Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
            <h4 className="font-medium text-gray-900 mb-2">Real-time Data</h4>
            <p className="text-sm text-gray-600">
              Live updates and real-time insights into your business performance
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Target className="h-6 w-6 text-green-600" />
            </div>
            <h4 className="font-medium text-gray-900 mb-2">Smart Insights</h4>
            <p className="text-sm text-gray-600">
              AI-powered recommendations and intelligent business insights
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <PieChart className="h-6 w-6 text-purple-600" />
            </div>
            <h4 className="font-medium text-gray-900 mb-2">Interactive Charts</h4>
            <p className="text-sm text-gray-600">
              Beautiful, interactive visualizations for better data understanding
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
