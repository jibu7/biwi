'use client';

import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { ReportCard, ReportPageLayout } from '@/components/reports';
import { Settings, FileText, Calendar, BarChart3 } from 'lucide-react';

export default function ReportManagementPage() {
  const router = useRouter();

  const managementTools = [
    {
      title: 'Report Templates',
      description: 'Create, edit, and manage custom report templates and formats',
      href: '/reports/management/templates',
      icon: FileText,
      color: 'bg-blue-100 text-blue-600'
    },
    {
      title: 'Scheduled Reports',
      description: 'Set up automated report generation and email delivery',
      href: '/reports/management/scheduled',
      icon: Calendar,
      color: 'bg-green-100 text-green-600'
    }
  ];

  const quickAccess = [
    {
      title: 'Financial Reports',
      href: '/reports/financial',
      description: 'Balance Sheet, Income Statement, Cash Flow',
      icon: BarChart3,
      color: 'bg-indigo-100 text-indigo-600'
    },
    {
      title: 'Advanced GL',
      href: '/reports/gl/advanced',
      description: 'Cashbook, Trial Balance, Chart of Accounts',
      icon: BarChart3,
      color: 'bg-purple-100 text-purple-600'
    },
    {
      title: 'Advanced AR',
      href: '/reports/ar/advanced',
      description: 'Aging Analysis, Customer Reports',
      icon: BarChart3,
      color: 'bg-emerald-100 text-emerald-600'
    },
    {
      title: 'Advanced AP',
      href: '/reports/ap/advanced',
      description: 'Supplier Analysis, Payment Reports',
      icon: BarChart3,
      color: 'bg-orange-100 text-orange-600'
    }
  ];

  return (
    <ReportPageLayout
      title="Report Management"
      description="Manage report templates, schedules, and system-wide reporting configurations."
    >
      {/* Management Tools */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Management Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {managementTools.map((tool, index) => (
            <ReportCard
              key={index}
              title={tool.title}
              description={tool.description}
              icon={tool.icon}
              color={tool.color}
              buttonText="Manage"
              onClick={() => router.push(tool.href)}
            />
          ))}
        </div>
      </div>

      {/* Quick Access to Reports */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Quick Access to Reports
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickAccess.map((item, index) => (
            <ReportCard
              key={index}
              title={item.title}
              description={item.description}
              icon={item.icon}
              color={item.color}
              buttonText="View Reports"
              onClick={() => router.push(item.href)}
            />
          ))}
        </div>
      </div>

      {/* System Information */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h2 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
          <Settings className="h-5 w-5" />
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
      </Card>
    </ReportPageLayout>
  );
}
