'use client';

import Link from 'next/link';
import { BarChart3, FileText, Users, TrendingDown, Calendar, UserCheck } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import * as permissions from '@/lib/permissions';

export default function ARReportsPage() {
  const { hasPermission } = usePermissions();

  const reportModules = [
    {
      title: 'Customer Aging Report',
      description: 'Analyze customer balances by age to identify overdue accounts and collection priorities',
      href: '/reports/ar/aging',
      icon: TrendingDown,
      permission: permissions.AR_REPORTS_VIEW,
      color: 'bg-red-500',
    },
    {
      title: 'Age Analysis Report',
      description: 'Alternative aging analysis view with detailed breakdown by aging periods',
      href: '/reports/ar/age-analysis',
      icon: BarChart3,
      permission: permissions.AR_REPORTS_VIEW,
      color: 'bg-orange-500',
    },
    {
      title: 'Customer Statement',
      description: 'Generate detailed statements showing all transactions for specific customers over a period',
      href: '/reports/ar/statement',
      icon: FileText,
      permission: permissions.AR_REPORTS_VIEW,
      color: 'bg-blue-500',
    },
    {
      title: 'Customer Listing',
      description: 'Comprehensive list of all customers with contact information and account details',
      href: '/reports/ar/customer-listing',
      icon: Users,
      permission: permissions.AR_REPORTS_VIEW,
      color: 'bg-green-500',
    },
  ];

  const accessibleModules = reportModules.filter(module => 
    hasPermission(module.permission)
  );

  if (accessibleModules.length === 0) {
    return (
      <div className="p-6">
        <div className="max-w-sm mx-auto text-center">
          <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No Access</h3>
          <p className="mt-1 text-sm text-gray-500">
            You don&apos;t have permission to access AR reports.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Accounts Receivable Reports</h1>
          <p className="mt-2 text-gray-600">
            Monitor customer accounts, analyze aging, and generate statements for effective receivables management.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accessibleModules.map((module) => {
            const IconComponent = module.icon;
            return (
              <Link
                key={module.href}
                href={module.href}
                className="block p-6 bg-white border border-gray-200 rounded-lg shadow hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-center mb-4">
                  <div className={`p-2 rounded-lg ${module.color}`}>
                    <IconComponent className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="ml-3 text-lg font-medium text-gray-900">
                    {module.title}
                  </h3>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {module.description}
                </p>
                <div className="mt-4 flex items-center text-sm text-blue-600 font-medium">
                  <span>View Report</span>
                  <svg 
                    className="ml-2 h-4 w-4" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M9 5l7 7-7 7" 
                    />
                  </svg>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-12 bg-gray-50 rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/reports/ar/aging"
              className="flex items-center p-3 text-sm text-gray-700 hover:text-gray-900 hover:bg-white rounded transition-colors"
            >
              <Calendar className="h-4 w-4 mr-2 text-gray-400" />
              Run Monthly Aging
            </Link>
            <Link
              href="/reports/ar/statement"
              className="flex items-center p-3 text-sm text-gray-700 hover:text-gray-900 hover:bg-white rounded transition-colors"
            >
              <FileText className="h-4 w-4 mr-2 text-gray-400" />
              Generate Statements
            </Link>
            <Link
              href="/reports/ar/customer-listing"
              className="flex items-center p-3 text-sm text-gray-700 hover:text-gray-900 hover:bg-white rounded transition-colors"
            >
              <UserCheck className="h-4 w-4 mr-2 text-gray-400" />
              Export Customer List
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
