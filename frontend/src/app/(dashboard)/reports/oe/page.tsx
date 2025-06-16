'use client';

import Link from 'next/link';
import { usePermissions } from '@/hooks/usePermissions';
import { 
  ShoppingCart, 
  Package, 
  FileText,
  BarChart3
} from 'lucide-react';
import * as permissions from '@/lib/permissions';

export default function OEReportsPage() {
  const { hasPermission } = usePermissions();

  const reportModules = [
    {
      title: 'Sales Orders Report',
      description: 'Comprehensive listing and analysis of sales orders',
      icon: ShoppingCart,
      href: '/reports/oe/sales-orders',
      color: 'bg-blue-500',
      requiredPermission: permissions.OE_REPORTS_VIEW,
      items: ['Sales Order Listing', 'Customer Analysis', 'Revenue Trends', 'Order Status Analysis']
    },
    {
      title: 'Purchase Orders Report',
      description: 'Analysis of purchase orders and supplier performance',
      icon: Package,
      href: '/reports/oe/purchase-orders',
      color: 'bg-purple-500',
      requiredPermission: permissions.OE_REPORTS_VIEW,
      items: ['Purchase Order Listing', 'Supplier Analysis', 'Spend Analysis', 'Delivery Performance']
    },
    {
      title: 'Goods Received Report',
      description: 'Track goods received and delivery performance',
      icon: FileText,
      href: '/reports/oe/grvs',
      color: 'bg-green-500',
      requiredPermission: permissions.OE_REPORTS_VIEW,
      items: ['GRV Listing', 'Delivery Analysis', 'Variance Reports', 'Invoice Matching']
    }
  ];

  const accessibleModules = reportModules.filter(module => 
    !module.requiredPermission || hasPermission(module.requiredPermission)
  );

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Order Entry Reports</h1>
        <p className="text-gray-600 mt-2">
          Generate comprehensive reports and analytics for sales orders, purchase orders, and goods received vouchers
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
            No Order Entry Reports Available
          </h3>
          <p className="text-gray-600">
            You don&apos;t have permission to access order entry reports. 
            Contact your administrator to request access.
          </p>
        </div>
      )}

      {/* Quick Stats Section */}
      {accessibleModules.length > 0 && (
        <div className="mt-12">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
          <div className="bg-white shadow rounded-lg p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {hasPermission(permissions.OE_REPORTS_VIEW) && (
                <>
                  <Link
                    href="/reports/oe/sales-orders"
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Sales Orders Report
                  </Link>
                  <Link
                    href="/reports/oe/purchase-orders"
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
                  >
                    Purchase Orders Report
                  </Link>
                  <Link
                    href="/reports/oe/grvs"
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                  >
                    GRVs Report
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
