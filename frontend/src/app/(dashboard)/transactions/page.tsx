'use client';

import Link from 'next/link';
import { usePermissions } from '@/hooks/usePermissions';
import { 
  BookOpen, 
  UserCheck, 
  CreditCard, 
  Package, 
  ShoppingCart,
  FileText
} from 'lucide-react';
import * as permissions from '@/lib/permissions';

export default function TransactionsPage() {
  const { hasPermission } = usePermissions();

  const transactionModules = [
    {
      title: 'General Ledger',
      description: 'Create and manage journal entries for your general ledger',
      icon: BookOpen,
      href: '/transactions/gl',
      color: 'bg-green-500',
      requiredPermission: permissions.GL_JOURNAL_POST,
      items: ['Journal Entries', 'Account Postings', 'Period End Processing']
    },
    {
      title: 'Accounts Receivable',
      description: 'Process customer invoices, receipts, and credit notes',
      icon: UserCheck,
      href: '/transactions/ar',
      color: 'bg-purple-500',
      requiredPermission: permissions.AR_TRANSACTIONS_POST,
      items: ['Customer Invoices', 'Receipts', 'Credit Notes', 'Allocations']
    },
    {
      title: 'Accounts Payable',
      description: 'Manage supplier invoices, payments, and returns',
      icon: CreditCard,
      href: '/transactions/ap',
      color: 'bg-red-500',
      requiredPermission: permissions.AP_TRANSACTIONS_POST,
      items: ['Supplier Invoices', 'Payments', 'Debit Notes', 'Allocations']
    },
    {
      title: 'Inventory',
      description: 'Process inventory adjustments and transfers',
      icon: Package,
      href: '/transactions/inventory',
      color: 'bg-yellow-500',
      requiredPermission: permissions.INV_TRANSACTIONS_ADJUST,
      items: ['Stock Adjustments', 'Warehouse Transfers', 'Inventory Counts']
    },
    {
      title: 'Order Entry',
      description: 'Manage sales orders, purchase orders, and goods receipts',
      icon: ShoppingCart,
      href: '/transactions/oe',
      color: 'bg-indigo-500',
      requiredPermission: permissions.OE_SALES_ORDERS_MANAGE,
      items: ['Sales Orders', 'Purchase Orders', 'Goods Received Vouchers']
    }
  ];

  const accessibleModules = transactionModules.filter(module => 
    !module.requiredPermission || hasPermission(module.requiredPermission)
  );

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
        <p className="text-gray-600 mt-2">
          Process daily business transactions across all modules of your ERP system
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
            <FileText className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Transaction Modules Available
          </h3>
          <p className="text-gray-600">
            You don&apos;t have permission to access any transaction modules. 
            Contact your administrator to request access.
          </p>
        </div>
      )}

      {/* Quick Actions Section */}
      {accessibleModules.length > 0 && (
        <div className="mt-12">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Activity & Quick Actions</h2>
          <div className="bg-white shadow rounded-lg p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {hasPermission(permissions.GL_JOURNAL_POST) && (
                <Link
                  href="/transactions/gl/journal-entry/new"
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                >
                  New Journal Entry
                </Link>
              )}
              {hasPermission(permissions.OE_SALES_ORDERS_MANAGE) && (
                <Link
                  href="/transactions/oe/sales-orders/new"
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  New Sales Order
                </Link>
              )}
              {hasPermission(permissions.AR_TRANSACTIONS_POST) && (
                <Link
                  href="/transactions/ar/invoices"
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
                >
                  Customer Invoice
                </Link>
              )}
              {hasPermission(permissions.AP_TRANSACTIONS_POST) && (
                <Link
                  href="/transactions/ap/invoices/new"
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                >
                  Supplier Invoice
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
