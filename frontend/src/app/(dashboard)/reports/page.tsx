'use client';

import Link from 'next/link';
import { usePermissions } from '@/hooks/usePermissions';
import { 
  BarChart3, 
  BookOpen, 
  UserCheck, 
  CreditCard, 
  Package, 
  ShoppingCart
} from 'lucide-react';
import * as permissions from '@/lib/permissions';

export default function ReportsPage() {
  const { hasPermission } = usePermissions();

  const reportModules = [
    {
      title: 'Financial Reports',
      description: 'Generate trial balance, P&L, balance sheet, and other financial reports',
      icon: BookOpen,
      href: '/reports/gl',
      color: 'bg-green-500',
      requiredPermission: permissions.GL_REPORTS_VIEW,
      items: ['Trial Balance', 'Profit & Loss', 'Balance Sheet', 'Account Transactions']
    },
    {
      title: 'Accounts Receivable',
      description: 'Customer aging, statements, and receivables analysis',
      icon: UserCheck,
      href: '/reports/ar',
      color: 'bg-purple-500',
      requiredPermission: permissions.AR_REPORTS_VIEW,
      items: ['Customer Aging', 'Customer Statements', 'Sales Analysis', 'Collection Reports']
    },
    {
      title: 'Accounts Payable',
      description: 'Supplier aging, payment analysis, and payables reports',
      icon: CreditCard,
      href: '/reports/ap',
      color: 'bg-red-500',
      requiredPermission: permissions.AP_REPORTS_VIEW,
      items: ['Supplier Aging', 'Payment Analysis', 'Purchase Reports', 'Cash Flow']
    },
    {
      title: 'Inventory Reports',
      description: 'Stock levels, movement analysis, and valuation reports',
      icon: Package,
      href: '/reports/inventory',
      color: 'bg-yellow-500',
      requiredPermission: permissions.INV_REPORTS_VIEW,
      items: ['Stock Quantity', 'Movement Analysis', 'Valuation Reports', 'ABC Analysis']
    },
    {
      title: 'Order Entry Reports',
      description: 'Sales orders, purchase orders, and delivery analysis',
      icon: ShoppingCart,
      href: '/reports/oe',
      color: 'bg-indigo-500',
      requiredPermission: permissions.OE_REPORTS_VIEW,
      items: ['Sales Order Listing', 'Purchase Order Reports', 'GRV Analysis', 'Order Trends']
    }
  ];

  const accessibleModules = reportModules.filter(module => 
    !module.requiredPermission || hasPermission(module.requiredPermission)
  );

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-gray-600 mt-2">
          Generate comprehensive reports and analytics across all modules of your ERP system
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accessibleModules.map((module) => {
          const Icon = module.icon;
          return (
            <Link
              key={module.title}
              href={module.href}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 border border-gray-200 hover:border-gray-300"
            >
              <div className={`${module.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {module.title}
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                {module.description}
              </p>
              <div className="text-xs text-gray-500">
                <span className="font-medium">Includes:</span>
                <ul className="mt-1 space-y-1">
                  {module.items.map((item, index) => (
                    <li key={index} className="flex items-center">
                      <span className="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Link>
          );
        })}
      </div>

      {accessibleModules.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <BarChart3 className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Reports Available
          </h3>
          <p className="text-gray-600">
            You don&apos;t have permission to access any report modules. 
            Contact your administrator to request access.
          </p>
        </div>
      )}

      {/* Quick Reports Section */}
      {accessibleModules.length > 0 && (
        <div className="mt-12">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Reports</h2>
          <div className="bg-white shadow rounded-lg p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {hasPermission(permissions.GL_REPORTS_VIEW) && (
                <Link
                  href="/reports/gl/trial-balance"
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                >
                  Trial Balance
                </Link>
              )}
              {hasPermission(permissions.AR_REPORTS_VIEW) && (
                <Link
                  href="/reports/ar/aging"
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
                >
                  Customer Aging
                </Link>
              )}
              {hasPermission(permissions.AP_REPORTS_VIEW) && (
                <Link
                  href="/reports/ap/age-analysis"
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                >
                  Supplier Aging
                </Link>
              )}
              {hasPermission(permissions.INV_REPORTS_VIEW) && (
                <Link
                  href="/reports/inventory/stock-quantity"
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700"
                >
                  Stock Report
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Report Categories */}
      {accessibleModules.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Report Categories</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-base font-medium text-gray-900 mb-3">Financial Reports</h3>
              <div className="text-sm text-gray-600 space-y-2">
                <div>• Trial Balance & General Ledger</div>
                <div>• Profit & Loss Statement</div>
                <div>• Balance Sheet</div>
                <div>• Cash Flow Statement</div>
              </div>
            </div>
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-base font-medium text-gray-900 mb-3">Operational Reports</h3>
              <div className="text-sm text-gray-600 space-y-2">
                <div>• Sales & Purchase Analysis</div>
                <div>• Inventory Movement & Valuation</div>
                <div>• Customer & Supplier Reports</div>
                <div>• Order Entry Analytics</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
