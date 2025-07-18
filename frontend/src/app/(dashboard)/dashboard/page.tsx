'use client';


import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { Cog, FileText, BarChart3 } from 'lucide-react';

export default function DashboardPage() {
  const { user, company } = useAuthStore();

  const quickLinks = [
    {
      title: 'Maintenance',
      description: 'Manage system setup and master data',
      icon: Cog,
      href: '/maintenance',
      color: 'bg-blue-500',
    },
    {
      title: 'Transactions',
      description: 'Process daily business transactions',
      icon: FileText,
      href: '/transactions',
      color: 'bg-green-500',
    },
    {
      title: 'Reports',
      description: 'View analytics and reports',
      icon: BarChart3,
      href: '/reports',
      color: 'bg-purple-500',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome to Vinea ERP
        </h1>
        <p className="text-gray-600 mt-2">
          {user?.full_name || user?.email} - {company?.name}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {quickLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.title}
              href={link.href}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
            >
              <div className={`${link.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {link.title}
              </h3>
              <p className="text-gray-600 text-sm">{link.description}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
