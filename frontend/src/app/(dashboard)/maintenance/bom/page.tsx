'use client';


import Link from 'next/link';
import { usePermissions } from '@/hooks/usePermissions';
import { 
  Wrench, 
  Package, 
  Settings 
} from 'lucide-react';
import * as permissions from '@/lib/permissions';

export default function BOMMaintenancePage() {
  const { hasPermission } = usePermissions();

  const bomModules = [
    {
      title: 'Bill of Materials',
      description: 'Manage bill of materials for manufactured items',
      icon: Package,
      href: '/maintenance/bom/bills',
      color: 'bg-purple-500',
      requiredPermission: permissions.BOM_SETUP_MANAGE,
      items: ['BOM Headers', 'BOM Lines', 'Manufacturing Instructions', 'Revision Control']
    },
    {
      title: 'BOM Defaults',
      description: 'Configure default settings for BOM operations',
      icon: Settings,
      href: '/maintenance/bom/defaults',
      color: 'bg-indigo-500',
      requiredPermission: permissions.BOM_SETUP_MANAGE,
      items: ['Default Accounts', 'Numbering Configuration', 'Manufacturing Settings']
    }
  ];

  const accessibleModules = bomModules.filter(module => 
    hasPermission(module.requiredPermission)
  );

  if (accessibleModules.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center">
          <Wrench className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No Access</h3>
          <p className="mt-1 text-sm text-gray-500">
            You don&apos;t have permission to access BOM setup modules.
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
              Bill of Materials Setup
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Configure bill of materials, manufacturing processes, and default settings.
            </p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {accessibleModules.map((module) => {
            const Icon = module.icon;
            return (
              <Link
                key={module.href}
                href={module.href}
                className="group relative rounded-lg p-6 bg-white shadow-sm border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all duration-200"
              >
                <div>
                  <span className="rounded-lg inline-flex p-3 bg-purple-50 text-purple-600 group-hover:bg-purple-100">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                </div>
                <div className="mt-8">
                  <h3 className="text-lg font-medium text-gray-900">
                    <span className="absolute inset-0" aria-hidden="true" />
                    {module.title}
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    {module.description}
                  </p>
                  <div className="mt-4">
                    <ul className="text-xs text-gray-400 space-y-1">
                      {module.items.map((item, index) => (
                        <li key={index} className="flex items-center">
                          <span className="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <span className="pointer-events-none absolute top-6 right-6 text-gray-300 group-hover:text-gray-400" aria-hidden="true">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="m11.293 17.293 1.414 1.414L19.414 12l-6.707-6.707-1.414 1.414L15.586 11H6v2h9.586l-4.293 4.293z" />
                  </svg>
                </span>
              </Link>
            );
          })}
        </div>

        <div className="mt-12 bg-gray-50 rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Getting Started with BOM Setup</h2>
          <div className="prose prose-sm text-gray-600">
            <ol className="list-decimal list-inside space-y-2">
              <li>
                <strong>BOM Defaults</strong> - Start by configuring default accounts and settings for manufacturing operations.
              </li>
              <li>
                <strong>Bill of Materials</strong> - Create and manage bill of materials for your manufactured items, including components and instructions.
              </li>
              <li>
                <strong>Manufacturing Orders</strong> - Use the configured BOMs to create manufacturing orders in the transactions section.
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
