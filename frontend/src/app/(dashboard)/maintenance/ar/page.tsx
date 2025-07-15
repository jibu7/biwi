'use client';


import Link from 'next/link';
import { Users, Settings, FileText, UserCheck } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import * as permissions from '@/lib/permissions';

export default function ARMaintenancePage() {
  const { hasPermission } = usePermissions();

  const arModules = [
    {
      title: 'Customers',
      description: 'Manage customer information, billing addresses, and account settings',
      href: '/maintenance/ar/customers',
      icon: Users,
      permission: permissions.AR_SETUP_MANAGE,
    },
    {
      title: 'Sales Representatives',
      description: 'Set up and manage sales representative information and territories',
      href: '/maintenance/ar/sales-representatives',
      icon: UserCheck,
      permission: permissions.AR_SETUP_MANAGE,
    },
    {
      title: 'Transaction Types',
      description: 'Configure AR transaction types for invoices, credit memos, and payments',
      href: '/maintenance/ar/transaction-types',
      icon: FileText,
      permission: permissions.AR_SETUP_MANAGE,
    },
    {
      title: 'AR Defaults',
      description: 'Configure default accounts and settings for accounts receivable processing',
      href: '/maintenance/ar/defaults',
      icon: Settings,
      permission: permissions.AR_SETUP_MANAGE,
    },
  ];

  const accessibleModules = arModules.filter(module => 
    hasPermission(module.permission)
  );

  if (accessibleModules.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No Access</h3>
          <p className="mt-1 text-sm text-gray-500">
            You don&apos;t have permission to access AR setup modules.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Accounts Receivable Setup
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Configure your accounts receivable customers, transaction types, and default settings.
            </p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {accessibleModules.map((module) => {
            const Icon = module.icon;
            return (
              <Link
                key={module.href}
                href={module.href}
                className="group relative rounded-lg p-6 bg-white shadow-sm border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all duration-200"
              >
                <div>
                  <span className="rounded-lg inline-flex p-3 bg-blue-50 text-blue-600 group-hover:bg-blue-100">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                </div>
                <div className="mt-4">
                  <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600">
                    {module.title}
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    {module.description}
                  </p>
                </div>
                <span
                  className="pointer-events-none absolute top-6 right-6 text-gray-300 group-hover:text-gray-400"
                  aria-hidden="true"
                >
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="m11.293 17.293 1.414 1.414L19.414 12l-6.707-6.707-1.414 1.414L15.586 11H6v2h9.586l-4.293 4.293z" />
                  </svg>
                </span>
              </Link>
            );
          })}
        </div>

        <div className="mt-12 bg-gray-50 rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Getting Started with AR Setup</h2>
          <div className="prose prose-sm text-gray-600">
            <ol className="list-decimal list-inside space-y-2">
              <li>
                <strong>Customers</strong> - Start by setting up your customer master data including billing information, credit limits, and payment terms.
              </li>
              <li>
                <strong>Sales Representatives</strong> - Configure sales representative information and assign territories for proper commission tracking.
              </li>
              <li>
                <strong>AR Defaults</strong> - Set up default accounts for AR control, cash receipts, and write-offs to ensure proper financial reporting.
              </li>
              <li>
                <strong>Transaction Types</strong> - Define transaction types for invoices, credit memos, and adjustments with appropriate GL account mappings.
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
