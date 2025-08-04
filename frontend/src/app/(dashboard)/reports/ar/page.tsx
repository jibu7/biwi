'use client';

import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { ReportCard, ReportPageLayout } from '@/components/reports';
import { BarChart3, FileText, Users, TrendingDown, Calendar, UserCheck } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import * as permissions from '@/lib/permissions';

export default function ARReportsPage() {
  const router = useRouter();
  const { hasPermission } = usePermissions();

  const reportModules = [
    {
      title: 'Customer Aging Report',
      description: 'Analyze customer balances by age to identify overdue accounts and collection priorities',
      href: '/reports/ar/aging',
      icon: TrendingDown,
      permission: permissions.AR_REPORTS_VIEW,
      color: 'bg-red-100 text-red-600',
    },
    {
      title: 'Age Analysis Report',
      description: 'Alternative aging analysis view with detailed breakdown by aging periods',
      href: '/reports/ar/age-analysis',
      icon: BarChart3,
      permission: permissions.AR_REPORTS_VIEW,
      color: 'bg-orange-100 text-orange-600',
    },
    {
      title: 'Customer Statement',
      description: 'Generate detailed statements showing all transactions for specific customers over a period',
      href: '/reports/ar/statement',
      icon: FileText,
      permission: permissions.AR_REPORTS_VIEW,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      title: 'Customer Listing',
      description: 'Comprehensive list of all customers with contact information and account details',
      href: '/reports/ar/customer-listing',
      icon: Users,
      permission: permissions.AR_REPORTS_VIEW,
      color: 'bg-green-100 text-green-600',
    },
  ];

  const quickActions = [
    {
      title: 'Run Monthly Aging',
      href: '/reports/ar/aging',
      icon: Calendar,
    },
    {
      title: 'Generate Statements',
      href: '/reports/ar/statement',
      icon: FileText,
    },
    {
      title: 'Export Customer List',
      href: '/reports/ar/customer-listing',
      icon: UserCheck,
    },
  ];

  const accessibleModules = reportModules.filter(module => 
    hasPermission(module.permission)
  );

  if (accessibleModules.length === 0) {
    return (
      <ReportPageLayout
        title="Accounts Receivable Reports"
        description="Monitor customer accounts, analyze aging, and generate statements for effective receivables management."
      >
        <div className="max-w-sm mx-auto text-center py-12">
          <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No Access</h3>
          <p className="mt-1 text-sm text-gray-500">
            You don&apos;t have permission to access AR reports.
          </p>
        </div>
      </ReportPageLayout>
    );
  }

  return (
    <ReportPageLayout
      title="Accounts Receivable Reports"
      description="Monitor customer accounts, analyze aging, and generate statements for effective receivables management."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accessibleModules.map((module, index) => (
          <ReportCard
            key={index}
            title={module.title}
            description={module.description}
            icon={module.icon}
            color={module.color}
            onClick={() => router.push(module.href)}
          />
        ))}
      </div>

      <Card className="p-6 bg-gray-50">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={index}
                onClick={() => router.push(action.href)}
                className="flex items-center p-3 text-sm text-gray-700 hover:text-gray-900 hover:bg-white rounded transition-colors"
              >
                <Icon className="h-4 w-4 mr-2 text-gray-400" />
                {action.title}
              </button>
            );
          })}
        </div>
      </Card>
    </ReportPageLayout>
  );
}
