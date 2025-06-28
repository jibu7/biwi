"use client";

import { Globe, DollarSign, Percent, GitBranch } from 'lucide-react';
import Link from 'next/link';
import { usePermissions } from '@/hooks/usePermissions';
import { COMMON_SETUP_CURRENCIES, COMMON_SETUP_TAXES, COMMON_SETUP_BRANCHES } from '@/lib/permissions';

export default function CommonPage() {
  const { hasPermission } = usePermissions();

  const commonModules = [
    {
      title: 'Currencies',
      description: 'Manage currencies, exchange rates, and base currency settings',
      icon: DollarSign,
      href: '/maintenance/system/currencies',
      color: 'bg-green-500',
      requiredPermission: COMMON_SETUP_CURRENCIES,
      features: ['Currency codes', 'Exchange rates', 'Base currency', 'Active/inactive status']
    },
    {
      title: 'Tax Types',
      description: 'Configure tax codes, rates, and tax calculation rules',
      icon: Percent,
      href: '/maintenance/system/tax-types',
      color: 'bg-blue-500',
      requiredPermission: COMMON_SETUP_TAXES,
      features: ['Tax rates', 'Tax nature', 'Tax codes', 'Calculation rules']
    },
    {
      title: 'Branches',
      description: 'Set up company branches and locations',
      icon: GitBranch,
      href: '/maintenance/system/branches',
      color: 'bg-purple-500',
      requiredPermission: COMMON_SETUP_BRANCHES,
      features: ['Branch details', 'Location settings', 'Contact information', 'Branch hierarchy']
    }
  ];

  const accessibleModules = commonModules.filter(module => 
    hasPermission(module.requiredPermission)
  );

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center text-sm text-gray-500 mb-4">
          <Link href="/maintenance" className="hover:text-gray-700">
            Maintenance
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">Common</span>
        </div>

        <div className="flex items-center mb-4">
          <Globe className="h-8 w-8 text-gray-500 mr-3" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Common Setup</h1>
            <p className="text-gray-600 mt-2">
              Manage currencies, tax codes, and branches for your ERP system
            </p>
          </div>
        </div>
      </div>

      {accessibleModules.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <Globe className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-yellow-800 mb-2">
            No Access to Common Setup
          </h3>
          <p className="text-yellow-700">
            You don't have permission to access any common setup modules. 
            Contact your administrator to request access to currencies, tax types, or branches.
          </p>
        </div>
      ) : (
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
                  <span className="font-medium">Features:</span>
                  <ul className="mt-1 space-y-1">
                    {module.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <span className="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {accessibleModules.length > 0 && (
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-800 mb-2">
            Common Setup Overview
          </h3>
          <p className="text-blue-700 text-sm">
            These modules provide fundamental configuration settings that are used across all areas of your ERP system. 
            Ensure these are properly configured before setting up other modules.
          </p>
        </div>
      )}
    </div>
  );
}
