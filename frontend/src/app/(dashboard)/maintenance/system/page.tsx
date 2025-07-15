'use client';


import Link from 'next/link';
import { useAuth } from '@/store/authStore';
import { usePermissions } from '@/hooks/usePermissions';
import { 
  Building, 
  Users, 
  Shield, 
  Calendar,
  Globe,
  Percent,
  MapPin
} from 'lucide-react';
import * as permissions from '@/lib/permissions';

export default function SystemMaintenancePage() {
  const { user, company } = useAuth();
  const { hasPermission } = usePermissions();

  const systemModules = [
    {
      title: 'Company Details',
      description: 'Manage company information and settings',
      icon: Building,
      href: '/maintenance/system/company',
      color: 'bg-blue-500',
      requiredPermission: permissions.COMPANY_READ,
    },
    {
      title: 'Users',
      description: 'Manage system users and their access',
      icon: Users,
      href: '/maintenance/system/users',
      color: 'bg-green-500',
      requiredPermission: permissions.USER_READ,
    },
    {
      title: 'Roles',
      description: 'Configure user roles and permissions',
      icon: Shield,
      href: '/maintenance/system/roles',
      color: 'bg-purple-500',
      requiredPermission: permissions.ROLE_READ,
    },
    {
      title: 'Accounting Periods',
      description: 'Setup fiscal years and accounting periods',
      icon: Calendar,
      href: '/maintenance/system/accounting-periods',
      color: 'bg-orange-500',
      requiredPermission: permissions.ACCOUNTING_PERIOD_MANAGE,
    },
    {
      title: 'Currencies',
      description: 'Manage currency codes and exchange rates',
      icon: Globe,
      href: '/maintenance/system/currencies',
      color: 'bg-teal-500',
      requiredPermission: permissions.COMMON_SETUP_CURRENCIES,
    },
    {
      title: 'Tax Types',
      description: 'Configure tax codes and rates',
      icon: Percent,
      href: '/maintenance/system/tax-types',
      color: 'bg-red-500',
      requiredPermission: permissions.COMMON_SETUP_TAXES,
    },
    {
      title: 'Branches',
      description: 'Manage company branches and locations',
      icon: MapPin,
      href: '/maintenance/system/branches',
      color: 'bg-indigo-500',
      requiredPermission: permissions.COMMON_SETUP_BRANCHES,
    },
  ];

  const accessibleModules = systemModules.filter(module => 
    hasPermission(module.requiredPermission)
  );

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center text-sm text-gray-500 mb-2">
          <Link href="/maintenance" className="hover:text-gray-700">
            Maintenance
          </Link>
          <span className="mx-2">/</span>
          <span>System & Company</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">System & Company Setup</h1>
        <p className="text-gray-600 mt-2">
          Configure core system settings, company information, and user management
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
              <p className="text-gray-600 text-sm">
                {module.description}
              </p>
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
            No System Modules Available
          </h3>
          <p className="text-gray-600">
            You don&apos;t have permission to access any system modules. 
            Contact your administrator to request access.
          </p>
        </div>
      )}
    </div>
  );
}
