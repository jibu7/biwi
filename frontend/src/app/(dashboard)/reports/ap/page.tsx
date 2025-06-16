'use client';

import Link from 'next/link';
import { BarChart3, FileText, Building2, TrendingDown, Calendar, ArrowUpDown } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import * as permissions from '@/lib/permissions';

export default function APReportsPage() {
  const { hasPermission } = usePermissions();

  const reportModules = [
    {
      title: 'Supplier Aging Report',
      description: 'Analyze supplier balances by age to manage payment priorities and cash flow planning',
      href: '/reports/ap/age-analysis',
      icon: TrendingDown,
      permission: permissions.AP_REPORTS_VIEW,
      color: 'bg-orange-500',
    },
    {
      title: 'Supplier Statement',
      description: 'Generate detailed statements showing all transactions for specific suppliers over a period',
      href: '/reports/ap/statement',
      icon: FileText,
      permission: permissions.AP_REPORTS_VIEW,
      color: 'bg-blue-500',
    },
    {
      title: 'Supplier Listing',
      description: 'Comprehensive list of all suppliers with contact information and account details',
      href: '/reports/ap/supplier-listing',
      icon: Building2,
      permission: permissions.AP_REPORTS_VIEW,
      color: 'bg-green-500',
    },
    {
      title: 'Payment Allocation Report',
      description: 'Track payment allocations and unallocated supplier payments for reconciliation',
      href: '/reports/ap/allocation-report',
      icon: ArrowUpDown,
      permission: permissions.AP_REPORTS_VIEW,
      color: 'bg-purple-500',
    },
    {
      title: 'AP Trial Balance',
      description: 'View detailed AP trial balance with supplier breakdowns and aging information',
      href: '/reports/ap/trial-balance',
      icon: BarChart3,
      permission: permissions.AP_REPORTS_VIEW,
      color: 'bg-red-500',
    },
    {
      title: 'Payment History',
      description: 'Comprehensive payment history report with detailed transaction analysis',
      href: '/reports/ap/payment-history',
      icon: Calendar,
      permission: permissions.AP_REPORTS_VIEW,
      color: 'bg-indigo-500',
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
            You don&apos;t have permission to access AP reports.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Accounts Payable Reports</h1>
          <p className="mt-2 text-gray-600">
            Monitor supplier accounts, analyze aging, and generate statements for effective payables management.
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
                <div className="mt-4 flex items-center text-sm text-orange-600 font-medium">
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
          <h2 className="text-lg font-medium text-gray-900 mb-4">Report Categories</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Aging & Analysis</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Supplier aging reports</li>
                <li>• Payment due analysis</li>
                <li>• Cash flow planning</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Supplier Management</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Supplier listings</li>
                <li>• Account statements</li>
                <li>• Contact information</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Transaction Analysis</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Payment allocations</li>
                <li>• Transaction history</li>
                <li>• Trial balance reports</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <Calendar className="h-5 w-5 text-orange-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-orange-800">
                Report Generation Tips
              </h3>
              <div className="mt-2 text-sm text-orange-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>Run aging reports monthly for better cash flow management</li>
                  <li>Generate supplier statements before payment runs</li>
                  <li>Review allocation reports to identify unallocated payments</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
