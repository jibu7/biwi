'use client';

import Link from 'next/link';
import { usePermissions } from '@/hooks/usePermissions';
import { 
  Settings, 
  ShoppingCart, 
  Package2 
} from 'lucide-react';
import * as permissions from '@/lib/permissions';

export default function OEMaintenancePage() {
  const { hasPermission } = usePermissions();

  const oeModules = [
    {
      title: 'Order Defaults',
      description: 'Configure default settings for order entry operations',
      icon: Settings,
      href: '/maintenance/oe/defaults',
      color: 'bg-blue-500',
      requiredPermission: permissions.OE_SETUP_MANAGE,
      items: ['Currency Settings', 'Numbering Configuration', 'Approval Workflows', 'Default Accounts']
    },
    {
      title: 'Sales Order Types',
      description: 'Manage sales order types and their configurations',
      icon: ShoppingCart,
      href: '/maintenance/oe/sales-order-types',
      color: 'bg-green-500',
      requiredPermission: permissions.OE_SETUP_MANAGE,
      items: ['Order Categories', 'Pricing Rules', 'Workflow Settings']
    },
    {
      title: 'Purchase Order Types',
      description: 'Configure purchase order types and approval limits',
      icon: Package2,
      href: '/maintenance/oe/purchase-order-types',
      color: 'bg-purple-500',
      requiredPermission: permissions.OE_SETUP_MANAGE,
      items: ['Order Categories', 'Approval Limits', 'Vendor Rules']
    }
  ];

  const accessibleModules = oeModules.filter(module => 
    !module.requiredPermission || hasPermission(module.requiredPermission)
  );

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Order Entry Setup</h1>
        <p className="text-gray-600 mt-2">
          Configure order entry settings, types, and workflows
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
            <ShoppingCart className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Order Entry Setup Available
          </h3>
          <p className="text-gray-600">
            You don't have permission to access order entry setup. 
            Contact your administrator to request access.
          </p>
        </div>
      )}
    </div>
  );
}
