'use client';


import Link from 'next/link';
import { BarChart3, FileText, Calculator, TrendingUp } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import * as permissions from '@/lib/permissions';

export default function GLReportsPage() {
  const { hasPermission } = usePermissions();

  const reportModules = [
    {
      title: 'Trial Balance',
      description: 'View account balances as of a specific date to verify that debits equal credits',
      href: '/reports/gl/trial-balance',
      icon: Calculator,
      permission: permissions.GL_REPORTS_VIEW,
      color: 'bg-blue-500',
    },
    {
      title: 'Account Transactions',
      description: 'View detailed transaction history for a specific general ledger account',
      href: '/reports/gl/account-transactions',
      icon: FileText,
      permission: permissions.GL_REPORTS_VIEW,
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
            You don&apos;t have permission to access GL reports.
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
              Financial Reports
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Generate and view general ledger financial reports and analysis.
            </p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {accessibleModules.map((module) => (
            <Link
              key={module.href}
              href={module.href}
              className="group relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <div>
                <span className={`rounded-lg inline-flex p-3 ring-4 ring-white ${module.color}`}>
                  <module.icon className="h-6 w-6 text-white" aria-hidden="true" />
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-medium text-gray-900 group-hover:text-indigo-600">
                  {module.title}
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  {module.description}
                </p>
              </div>
              <span className="absolute inset-0" aria-hidden="true" />
            </Link>
          ))}
        </div>

        {/* Report Information */}
        <div className="mt-12">
          <h2 className="text-lg font-medium text-gray-900 mb-4">About Financial Reports</h2>
          <div className="bg-white shadow rounded-lg p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-base font-medium text-gray-900 mb-3 flex items-center">
                  <Calculator className="h-5 w-5 mr-2 text-blue-500" />
                  Trial Balance
                </h3>
                <p className="text-sm text-gray-600">
                  The trial balance lists all general ledger accounts and their balances at a specific point in time. 
                  It's used to verify that total debits equal total credits, ensuring the books are in balance.
                </p>
                <ul className="mt-2 text-sm text-gray-500 list-disc list-inside">
                  <li>Shows account codes and names</li>
                  <li>Displays debit and credit balances</li>
                  <li>Verifies accounting equation balance</li>
                  <li>Can be exported to CSV</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-base font-medium text-gray-900 mb-3 flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-green-500" />
                  Account Transactions
                </h3>
                <p className="text-sm text-gray-600">
                  View detailed transaction history for any general ledger account over a specified date range. 
                  Includes running balance calculations and transaction details.
                </p>
                <ul className="mt-2 text-sm text-gray-500 list-disc list-inside">
                  <li>Filter by account and date range</li>
                  <li>View transaction details and references</li>
                  <li>See running account balance</li>
                  <li>Export transaction history</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Access</h2>
          <div className="bg-white shadow rounded-lg p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {hasPermission(permissions.GL_REPORTS_VIEW) && (
                <>
                  <Link
                    href="/reports/gl/trial-balance"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Calculator className="h-4 w-4 mr-2" />
                    Trial Balance
                  </Link>
                  <Link
                    href="/reports/gl/account-transactions"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Account Transactions
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
