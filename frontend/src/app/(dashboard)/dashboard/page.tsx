'use client';


import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { usePermissions } from '@/hooks/usePermissions';
import { getAllAccessibleModules } from '@/lib/dashboardUtils';
import { Cog, FileText, BarChart3, Users, Building2 } from 'lucide-react';

export default function DashboardPage() {
  const { user, company } = useAuthStore();
  const { hasPermission } = usePermissions();

  // Get all accessible modules from navigation items to ensure consistency with sidebar
  const { maintenance, transactions, analytics } = getAllAccessibleModules(hasPermission);

  const quickLinks = [
    {
      title: 'Maintenance',
      description: 'Manage system setup and master data',
      icon: Cog,
      href: '/maintenance',
      color: 'bg-blue-500',
      count: maintenance.length,
      items: maintenance.slice(0, 3).map(m => m.title)
    },
    {
      title: 'Transactions',
      description: 'Process daily business transactions',
      icon: FileText,
      href: '/transactions', 
      color: 'bg-green-500',
      count: transactions.length,
      items: transactions.slice(0, 3).map(m => m.title)
    },
    {
      title: 'Reports & Analytics',
      description: 'View analytics and reports',
      icon: BarChart3,
      href: '/reports',
      color: 'bg-purple-500',
      count: analytics.length,
      items: analytics.slice(0, 3).map(m => m.title)
    },
  ];

  const totalAccessibleModules = maintenance.length + transactions.length + analytics.length;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome to ChannelZap
        </h1>
        <p className="text-gray-600 mt-2">
          {user?.full_name || user?.email} - {company?.name}
        </p>
        <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>Active User</span>
          </div>
          <div className="flex items-center gap-1">
            <Building2 className="h-4 w-4" />
            <span>{totalAccessibleModules} Accessible Modules</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {quickLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.title}
              href={link.href}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 border border-gray-200 hover:border-gray-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`${link.color} w-12 h-12 rounded-lg flex items-center justify-center`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                  {link.count} modules
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {link.title}
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                {link.description}
              </p>
              {link.items.length > 0 && (
                <div className="text-xs text-gray-500">
                  <span className="font-medium">Available:</span>
                  <ul className="mt-1 space-y-1">
                    {link.items.map((item, index) => (
                      <li key={index} className="flex items-center">
                        <span className="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
                        {item}
                      </li>
                    ))}
                    {link.count > 3 && (
                      <li className="text-gray-400 italic">
                        ...and {link.count - 3} more
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {/* Quick Actions Section */}
      {totalAccessibleModules > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {hasPermission('gl:journal_post') && (
                <Link
                  href="/transactions/gl/journal-entry/new"
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
                >
                  New Journal Entry
                </Link>
              )}
              {hasPermission('oe:sales_orders_manage') && (
                <Link
                  href="/transactions/oe/sales-orders/new"
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                >
                  New Sales Order
                </Link>
              )}
              {hasPermission('ar:transactions_post') && (
                <Link
                  href="/transactions/ar/invoices"
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 transition-colors"
                >
                  Customer Invoice
                </Link>
              )}
              {hasPermission('gl:reports_view') && (
                <Link
                  href="/reports/gl/trial-balance"
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  Trial Balance
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* No Access Message */}
      {totalAccessibleModules === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Building2 className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Modules Available
          </h3>
          <p className="text-gray-600">
            You don&apos;t have permission to access any modules. 
            Contact your administrator to request access.
          </p>
        </div>
      )}
    </div>
  );
}
