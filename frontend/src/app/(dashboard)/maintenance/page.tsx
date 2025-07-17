'use client';


import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { usePermissions } from '@/hooks/usePermissions';
import { 
  Building, 
  BookOpen, 
  UserCheck, 
  CreditCard, 
  Package, 
  ShoppingCart, 
  Globe,
  Wrench
} from 'lucide-react';
import * as permissions from '@/lib/permissions';

export default function MaintenancePage() {
  const { user, company } = useAuthStore();
  const { hasPermission } = usePermissions();

  const maintenanceModules = [
    {
      title: 'System & Company',
      description: 'Manage company details, users, roles, and accounting periods',
      icon: Building,
      href: '/maintenance/system',
      color: 'bg-blue-500',
      requiredPermission: permissions.COMPANY_READ,
      items: ['Company Details', 'Users', 'Roles', 'Accounting Periods']
    },
    {
      title: 'General Ledger',
      description: 'Setup chart of accounts and GL configuration',
      icon: BookOpen,
      href: '/maintenance/gl',
      color: 'bg-green-500',
      requiredPermission: permissions.GL_SETUP_MANAGE,
      items: ['Chart of Accounts', 'Account Classes']
    },
    {
      title: 'Accounts Receivable',
      description: 'Configure customer categories and payment terms',
      icon: UserCheck,
      href: '/maintenance/ar',
      color: 'bg-purple-500',
      requiredPermission: permissions.AR_SETUP_MANAGE,
      items: ['Customer Categories', 'Payment Terms']
    },
    {
      title: 'Accounts Payable',
      description: 'Setup supplier categories and payment terms',
      icon: CreditCard,
      href: '/maintenance/ap',
      color: 'bg-red-500',
      requiredPermission: permissions.AP_SETUP_MANAGE,
      items: ['Supplier Categories', 'Payment Terms']
    },
    {
      title: 'Inventory',
      description: 'Manage product categories and units of measure',
      icon: Package,
      href: '/maintenance/inventory',
      color: 'bg-yellow-500',
      requiredPermission: permissions.INV_SETUP_MANAGE,
      items: ['Product Categories', 'Units of Measure']
    },
    {
      title: 'Order Entry',
      description: 'Configure sales and purchase order types',
      icon: ShoppingCart,
      href: '/maintenance/oe',
      color: 'bg-indigo-500',
      requiredPermission: permissions.OE_SETUP_MANAGE,
      items: ['Sales Order Types', 'Purchase Order Types']
    },
    {
      title: 'Bill of Materials',
      description: 'Manage BOMs and manufacturing defaults',
      icon: Wrench,
      href: '/maintenance/bom',
      color: 'bg-purple-500',
      requiredPermission: permissions.BOM_SETUP_MANAGE,
      items: ['BOM Headers', 'Manufacturing Settings', 'Default Accounts']
    },
    {
      title: 'Common',
      description: 'Manage currencies, tax codes, and branches',
      icon: Globe,
      href: '/maintenance/common',
      color: 'bg-gray-500',
      requiredPermission: null, // Common setup accessible to all users
      items: ['Currencies', 'Tax Codes', 'Branches']
    }
  ];

  const accessibleModules = maintenanceModules.filter(module => 
    !module.requiredPermission || hasPermission(module.requiredPermission)
  );

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Maintenance</h1>
        <p className="text-gray-600 mt-2">
          Configure system settings and master data for your ERP system
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
            <Building className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Maintenance Modules Available
          </h3>
          <p className="text-gray-600">
            You don&apos;t have permission to access any maintenance modules. 
            Contact your administrator to request access.
          </p>
        </div>
      )}
    </div>
  );
}
