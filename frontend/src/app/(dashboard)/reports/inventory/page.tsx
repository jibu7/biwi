'use client';

import Link from 'next/link';
import { FileText, DollarSign, Package, TrendingUp, List } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { INV_REPORTS_VIEW } from '@/lib/permissions';

const reportItems = [
  {
    title: 'Item Listing',
    description: 'Complete listing of all inventory items',
    href: '/reports/inventory/item-listing',
    icon: List,
    permission: INV_REPORTS_VIEW,
    color: 'bg-blue-100 text-blue-600',
  },
  {
    title: 'Stock Quantity',
    description: 'Current stock levels by warehouse',
    href: '/reports/inventory/stock-quantity',
    icon: Package,
    permission: INV_REPORTS_VIEW,
    color: 'bg-green-100 text-green-600',
  },
  {
    title: 'Movement Report',
    description: 'Track inventory movements over time',
    href: '/reports/inventory/movement',
    icon: TrendingUp,
    permission: INV_REPORTS_VIEW,
    color: 'bg-purple-100 text-purple-600',
  },
  {
    title: 'Valuation Report',
    description: 'Total inventory value by warehouse',
    href: '/reports/inventory/valuation',
    icon: DollarSign,
    permission: INV_REPORTS_VIEW,
    color: 'bg-yellow-100 text-yellow-600',
  },
];

export default function InventoryReportsPage() {
  const { hasPermission } = usePermissions();

  if (!hasPermission(INV_REPORTS_VIEW)) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to view inventory reports.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Inventory Reports</h1>
        <p className="text-gray-600 mt-2">
          Analyze your inventory data and performance
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200 hover:border-blue-300"
            >
              <div className="flex items-center mb-4">
                <div className={`p-3 rounded-lg ${item.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 ml-3">
                  {item.title}
                </h3>
              </div>
              <p className="text-gray-600 text-sm">
                {item.description}
              </p>
            </Link>
          );
        })}
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 p-6 rounded-lg">
          <h3 className="text-lg font-medium text-blue-900 mb-2">Master Data</h3>
          <div className="space-y-2">
            <Link
              href="/reports/inventory/item-listing"
              className="block text-blue-800 hover:text-blue-600 text-sm font-medium"
            >
              → Item Listing Report
            </Link>
            <p className="text-blue-700 text-xs">View all items with details</p>
          </div>
        </div>

        <div className="bg-green-50 p-6 rounded-lg">
          <h3 className="text-lg font-medium text-green-900 mb-2">Stock Analysis</h3>
          <div className="space-y-2">
            <Link
              href="/reports/inventory/stock-quantity"
              className="block text-green-800 hover:text-green-600 text-sm font-medium"
            >
              → Stock Quantity Report
            </Link>
            <p className="text-green-700 text-xs">Current stock levels and availability</p>
          </div>
        </div>

        <div className="bg-yellow-50 p-6 rounded-lg">
          <h3 className="text-lg font-medium text-yellow-900 mb-2">Financial</h3>
          <div className="space-y-2">
            <Link
              href="/reports/inventory/valuation"
              className="block text-yellow-800 hover:text-yellow-600 text-sm font-medium"
            >
              → Valuation Report
            </Link>
            <p className="text-yellow-700 text-xs">Total inventory asset value</p>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Report Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700 text-sm">
          <div>
            <h4 className="font-medium mb-1">Export Options</h4>
            <p>All reports can be exported to CSV format for further analysis</p>
          </div>
          <div>
            <h4 className="font-medium mb-1">Real-time Data</h4>
            <p>Reports show current data based on the latest transactions</p>
          </div>
          <div>
            <h4 className="font-medium mb-1">Filtering</h4>
            <p>Filter by warehouse, date range, or item criteria</p>
          </div>
          <div>
            <h4 className="font-medium mb-1">Drill-down</h4>
            <p>Click on items for detailed transaction history</p>
          </div>
        </div>
      </div>
    </div>
  );
}
