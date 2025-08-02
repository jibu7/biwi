'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bug, BarChart3 } from 'lucide-react';

export default function ErrorReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const tabs = [
    {
      name: 'Error Reports',
      href: '/administration/error-reports',
      icon: Bug,
    },
    {
      name: 'Analytics',
      href: '/administration/error-reports/analytics',
      icon: BarChart3,
    },
  ];

  const isActive = (href: string) => {
    if (href === '/administration/error-reports') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="space-y-6">
      {/* Sub Navigation */}
      <div className="border-b bg-white -mx-6 px-6">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 text-sm font-medium transition-colors ${
                  isActive(tab.href)
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div>{children}</div>
    </div>
  );
}