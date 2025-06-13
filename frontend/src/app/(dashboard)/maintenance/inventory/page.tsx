'use client';

import Link from 'next/link';
import { Package, Warehouse, Ruler, Settings, BarChart3, Tag } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { INV_SETUP_MANAGE } from '@/lib/permissions';

const maintenanceItems = [
  {
    title: 'Items',
    description: 'Manage inventory items, descriptions, and pricing',
    href: '/maintenance/inventory/items',
    icon: Package,
    permission: INV_SETUP_MANAGE,
  },
  {
    title: 'Warehouses',
    description: 'Set up and manage warehouse locations',
    href: '/maintenance/inventory/warehouses',
    icon: Warehouse,
    permission: INV_SETUP_MANAGE,
  },
  {
    title: 'Units of Measure',
    description: 'Configure units of measure and conversions',
    href: '/maintenance/inventory/units-of-measure',
    icon: Ruler,
    permission: INV_SETUP_MANAGE,
  },
  {
    title: 'Transaction Types',
    description: 'Define inventory transaction types',
    href: '/maintenance/inventory/transaction-types',
    icon: BarChart3,
    permission: INV_SETUP_MANAGE,
  },
  {
    title: 'Barcodes',
    description: 'Manage item barcodes and scanning',
    href: '/maintenance/inventory/barcodes',
    icon: Tag,
    permission: INV_SETUP_MANAGE,
  },
  {
    title: 'Defaults',
    description: 'Configure default settings and GL accounts',
    href: '/maintenance/inventory/defaults',
    icon: Settings,
    permission: INV_SETUP_MANAGE,
  },
];

export default function InventoryMaintenancePage() {
  const { hasPermission } = usePermissions();

  if (!hasPermission(INV_SETUP_MANAGE)) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access inventory setup.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Inventory Setup</h1>
        <p className="text-gray-600 mt-2">
          Configure and manage your inventory system settings
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {maintenanceItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200 hover:border-blue-300"
            >
              <div className="flex items-center mb-4">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Icon className="h-6 w-6 text-blue-600" />
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

      <div className="mt-8 bg-blue-50 p-6 rounded-lg">
        <h3 className="text-lg font-medium text-blue-900 mb-2">Getting Started</h3>
        <div className="text-blue-800 text-sm space-y-2">
          <p>1. <strong>Set up Units of Measure</strong> - Define how you measure your inventory</p>
          <p>2. <strong>Create Warehouses</strong> - Set up your storage locations</p>
          <p>3. <strong>Configure Defaults</strong> - Set default GL accounts and warehouse</p>
          <p>4. <strong>Add Items</strong> - Create your inventory items</p>
          <p>5. <strong>Set up Transaction Types</strong> - Configure adjustment types as needed</p>
        </div>
      </div>
    </div>
  );
}
