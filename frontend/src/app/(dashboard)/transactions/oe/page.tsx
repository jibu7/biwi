'use client';

import Link from 'next/link';
import { usePermissions } from '@/hooks/usePermissions';
import { 
  ShoppingCart, 
  Package, 
  FileText,
  Plus,
  AlertTriangle,
  Truck,
  CreditCard,
  BarChart3
} from 'lucide-react';
import * as permissions from '@/lib/permissions';

export default function OETransactionsPage() {
  const { hasPermission } = usePermissions();

  const transactionModules = [
    {
      title: 'Sales Orders',
      description: 'Create and manage customer sales orders',
      icon: ShoppingCart,
      href: '/transactions/oe/sales-orders',
      color: 'bg-blue-500',
      requiredPermission: permissions.OE_SALES_ORDERS_MANAGE,
      items: ['New Sales Orders', 'Order Management', 'Convert to Invoices', 'Order Tracking']
    },
    {
      title: 'Purchase Orders',
      description: 'Manage supplier purchase orders and procurement',
      icon: Package,
      href: '/transactions/oe/purchase-orders',
      color: 'bg-purple-500',
      requiredPermission: permissions.OE_PURCHASE_ORDERS_MANAGE,
      items: ['New Purchase Orders', 'Supplier Management', 'Receive Goods', 'Order Status']
    },
    {
      title: 'Goods Received Vouchers',
      description: 'Record goods received from suppliers',
      icon: FileText,
      href: '/transactions/oe/grvs',
      color: 'bg-green-500',
      requiredPermission: permissions.OE_GRV_PROCESS,
      items: ['Record Receipts', 'Convert to Invoices', 'Delivery Tracking', 'Variance Analysis']
    }
  ];

  const accessibleModules = transactionModules.filter(module => 
    !module.requiredPermission || hasPermission(module.requiredPermission)
  );

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Order Entry Transactions</h1>
        <p className="text-gray-600 mt-2">
          Manage sales orders, purchase orders, and goods received vouchers
        </p>
      </div>

      {/* Complete Procurement Workflow Guide */}
      <div className="rounded-lg border p-6 bg-gradient-to-r from-blue-50 to-green-50 mb-8">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-blue-600" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Complete Procurement Cycle - Inventory Replenishment</h2>
            <p className="text-gray-700 mb-4">
              <strong>When to Use:</strong> When inventory reaches reorder level or quantity = 0. 
              Follow this 3-step process to restock inventory and manage supplier payments.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Step 1: Purchase Orders */}
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <Package className="h-4 w-4 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Step 1: Create Purchase Order</h3>
                </div>
                <div className="text-sm text-gray-700 space-y-2">
                  <p><strong>Purpose:</strong> Order inventory from supplier</p>
                  <p><strong>Actions:</strong> Select supplier → Add items → Set quantities/prices</p>
                  <p><strong>Result:</strong> PO status "Open" → Inventory shows "On Order"</p>
                  <div className="mt-3 p-2 bg-purple-50 rounded text-xs">
                    <strong>Example:</strong> Order 5 laptops @ $299 = $1,495 total
                  </div>
                </div>
              </div>

              {/* Step 2: GRV */}
              <div className="bg-white rounded-lg p-4 border border-green-200">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Truck className="h-4 w-4 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Step 2: Receive Goods (GRV)</h3>
                </div>
                <div className="text-sm text-gray-700 space-y-2">
                  <p><strong>Purpose:</strong> Record actual delivery from supplier</p>
                  <p><strong>Actions:</strong> Link to PO → Verify quantities → Record condition</p>
                  <p><strong>Result:</strong> Inventory +5 units → GRV Accrual $1,495</p>
                  <div className="mt-3 p-2 bg-green-50 rounded text-xs">
                    <strong>GL Impact:</strong> Dr: Inventory $1,495 | Cr: GRV Accrual $1,495
                  </div>
                </div>
              </div>

              {/* Step 3: AP Invoice */}
              <div className="bg-white rounded-lg p-4 border border-orange-200">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <CreditCard className="h-4 w-4 text-orange-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Step 3: Convert to AP Invoice</h3>
                </div>
                <div className="text-sm text-gray-700 space-y-2">
                  <p><strong>Purpose:</strong> Process supplier's actual invoice</p>
                  <p><strong>Actions:</strong> Enter invoice # → Set due date → Convert</p>
                  <p><strong>Result:</strong> AP Invoice $1,495 → Ready for payment</p>
                  <div className="mt-3 p-2 bg-orange-50 rounded text-xs">
                    <strong>GL Impact:</strong> Dr: GRV Accrual $1,495 | Cr: Accounts Payable $1,495
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-white rounded-lg border border-yellow-200">
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                <BarChart3 className="h-4 w-4 mr-2 text-yellow-600" />
                Final Result: Complete Procurement Cycle
              </h4>
              <div className="text-sm text-gray-700 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p><strong>Inventory Status:</strong></p>
                  <ul className="ml-4 list-disc space-y-1 text-xs">
                    <li>Quantity: 0 → 5 units available</li>
                    <li>Ready for future sales</li>
                    <li>Reorder level satisfied</li>
                  </ul>
                </div>
                <div>
                  <p><strong>Financial Impact:</strong></p>
                  <ul className="ml-4 list-disc space-y-1 text-xs">
                    <li>Inventory Asset: +$1,495</li>
                    <li>Accounts Payable: +$1,495</li>
                    <li>GRV Accrual: Cleared to $0</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
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
            <ShoppingCart className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Order Entry Transactions Available
          </h3>
          <p className="text-gray-600">
            You don&apos;t have permission to access order entry transactions. 
            Contact your administrator to request access.
          </p>
        </div>
      )}

      {/* Quick Actions Section */}
      {accessibleModules.length > 0 && (
        <div className="mt-12">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
          <div className="bg-white shadow rounded-lg p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {hasPermission(permissions.OE_SALES_ORDERS_MANAGE) && (
                <Link
                  href="/transactions/oe/sales-orders/new"
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Sales Order
                </Link>
              )}
              {hasPermission(permissions.OE_PURCHASE_ORDERS_MANAGE) && (
                <Link
                  href="/transactions/oe/purchase-orders/new"
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Purchase Order
                </Link>
              )}
              {hasPermission(permissions.OE_GRV_PROCESS) && (
                <Link
                  href="/transactions/oe/grvs/new"
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New GRV
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
