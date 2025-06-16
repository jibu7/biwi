'use client';

import Link from 'next/link';
import { Settings, FileText, Calendar, BarChart3 } from 'lucide-react';

export default function ReportManagementPage() {
  const managementTools = [
    {
      title: 'Report Templates',
      description: 'Create, edit, and manage custom report templates and formats',
      href: '/reports/management/templates',
      icon: FileText,
      color: 'bg-blue-50 border-blue-200 text-blue-700'
    },
    {
      title: 'Scheduled Reports',
      description: 'Set up automated report generation and email delivery',
      href: '/reports/management/scheduled',
      icon: Calendar,
      color: 'bg-green-50 border-green-200 text-green-700'
    }
  ];

  const quickAccess = [
    {
      title: 'Financial Reports',
      href: '/reports/financial',
      description: 'Balance Sheet, Income Statement, Cash Flow'
    },
    {
      title: 'Advanced GL',
      href: '/reports/gl/advanced',
      description: 'Cashbook, Trial Balance, Chart of Accounts'
    },
    {
      title: 'Advanced AR',
      href: '/reports/ar/advanced',
      description: 'Aging Analysis, Customer Reports'
    },
    {
      title: 'Advanced AP',
      href: '/reports/ap/advanced',
      description: 'Supplier Analysis, Payment Reports'
    }
  ];

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Report Management</h1>
        <p className="text-lg text-gray-600">
          Manage report templates, schedules, and system-wide reporting configurations.
        </p>
      </div>

      {/* Management Tools */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Management Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {managementTools.map((tool) => {
            const IconComponent = tool.icon;
            return (
              <Link
                key={tool.href}
                href={tool.href}
                className="block group"
              >
                <div className={`border-2 rounded-lg p-6 transition-all duration-200 hover:shadow-lg hover:scale-105 ${tool.color}`}>
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <IconComponent className="w-8 h-8" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-2 group-hover:underline">
                        {tool.title}
                      </h3>
                      <p className="text-sm opacity-80">
                        {tool.description}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Quick Access to Reports */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <BarChart3 className="w-6 h-6 mr-2" />
          Quick Access to Reports
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickAccess.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow duration-200"
            >
              <h3 className="font-semibold text-gray-900 mb-2 hover:text-indigo-600">
                {item.title}
              </h3>
              <p className="text-sm text-gray-600">
                {item.description}
              </p>
            </Link>
          ))}
        </div>
      </div>

      {/* System Information */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
          <Settings className="w-5 h-5 mr-2" />
          System Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium text-blue-800">Report Engine:</span>
            <span className="text-blue-700 ml-2">Advanced Reporting v2.1</span>
          </div>
          <div>
            <span className="font-medium text-blue-800">Export Formats:</span>
            <span className="text-blue-700 ml-2">PDF, CSV, Excel</span>
          </div>
          <div>
            <span className="font-medium text-blue-800">Scheduling:</span>
            <span className="text-blue-700 ml-2">Daily, Weekly, Monthly</span>
          </div>
        </div>
      </div>
    </div>
  );
}
