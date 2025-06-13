'use client';

import Link from 'next/link';
import { Plus, ArrowLeftRight, ClipboardCheck, History } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { INV_TRANSACTIONS_ADJUST } from '@/lib/permissions';

const transactionItems = [
  {
    title: 'Adjustments',
    description: 'Adjust inventory quantities up or down',
    href: '/transactions/inventory/adjustments/new',
    icon: Plus,
    permission: INV_TRANSACTIONS_ADJUST,
    color: 'bg-green-100 text-green-600',
  },
  {
    title: 'Warehouse Transfers',
    description: 'Transfer stock between warehouses',
    href: '/transactions/inventory/transfers/new',
    icon: ArrowLeftRight,
    permission: INV_TRANSACTIONS_ADJUST,
    color: 'bg-blue-100 text-blue-600',
  },
  {
    title: 'Inventory Counts',
    description: 'Perform physical inventory counts',
    href: '/transactions/inventory/counts',
    icon: ClipboardCheck,
    permission: INV_TRANSACTIONS_ADJUST,
    color: 'bg-purple-100 text-purple-600',
  },
  {
    title: 'Transaction History',
    description: 'View all inventory transactions',
    href: '/transactions/inventory/history',
    icon: History,
    permission: INV_TRANSACTIONS_ADJUST,
    color: 'bg-gray-100 text-gray-600',
  },
];

export default function InventoryTransactionsPage() {
  const { hasPermission } = usePermissions();

  if (!hasPermission(INV_TRANSACTIONS_ADJUST)) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to perform inventory transactions.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Inventory Transactions</h1>
        <p className="text-gray-600 mt-2">
          Manage inventory movements and adjustments
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {transactionItems.map((item) => {
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

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-green-50 p-6 rounded-lg">
          <h3 className="text-lg font-medium text-green-900 mb-2">Quick Actions</h3>
          <div className="space-y-2">
            <Link
              href="/transactions/inventory/adjustments/new"
              className="block text-green-800 hover:text-green-600 text-sm font-medium"
            >
              → Process Stock Adjustment
            </Link>
            <Link
              href="/transactions/inventory/transfers/new"
              className="block text-green-800 hover:text-green-600 text-sm font-medium"
            >
              → Transfer Between Warehouses
            </Link>
            <Link
              href="/transactions/inventory/counts/new"
              className="block text-green-800 hover:text-green-600 text-sm font-medium"
            >
              → Start Inventory Count
            </Link>
          </div>
        </div>

        <div className="bg-blue-50 p-6 rounded-lg">
          <h3 className="text-lg font-medium text-blue-900 mb-2">Important Notes</h3>
          <div className="text-blue-800 text-sm space-y-1">
            <p>• All transactions will update GL accounts automatically</p>
            <p>• Stock levels are updated in real-time</p>
            <p>• Adjustments require proper reason codes</p>
            <p>• Count sessions must be completed to post adjustments</p>
          </div>
        </div>
      </div>
    </div>
  );
}
