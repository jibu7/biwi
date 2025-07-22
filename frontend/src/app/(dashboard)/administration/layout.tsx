'use client';

import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Building2, Users, Settings, Shield } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdministrationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && (!user || !user.is_superuser)) {
      router.push('/dashboard');
    }
  }, [user, isLoading]); // Remove router from dependencies

  // Show loading or redirect if not authorized
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || !user.is_superuser) {
    return null;
  }

  const navigationItems = [
    {
      name: 'Companies',
      href: '/administration/companies',
      icon: Building2,
      description: 'Manage tenant companies',
    },
    {
      name: 'Users',
      href: '/administration/users',
      icon: Users,
      description: 'Cross-company user management',
    },
    {
      name: 'Settings',
      href: '/administration/settings',
      icon: Settings,
      description: 'System-wide settings',
    },
    {
      name: 'Security',
      href: '/administration/security',
      icon: Shield,
      description: 'Security and audit logs',
    },
  ];

  const isActive = (href: string) => {
    if (href === '/administration') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Shield className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Administration</h1>
                <p className="text-sm text-gray-500">System management & configuration</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {user.full_name || user.email}
              </span>
              <Link
                href="/dashboard"
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  );
}
