'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Building2,
  Users,
  FileText,
  Settings,
  Shield,
  BarChart3,
  AlertCircle,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/platform/dashboard', icon: LayoutDashboard },
  { name: 'Companies', href: '/platform/companies', icon: Building2 },
  { name: 'Users', href: '/platform/users', icon: Users },
  { name: 'Audit Logs', href: '/platform/audit-logs', icon: FileText },
  { name: 'Analytics', href: '/platform/analytics', icon: BarChart3 },
  { name: 'Alerts', href: '/platform/alerts', icon: AlertCircle },
  { name: 'Security', href: '/platform/security', icon: Shield },
  { name: 'Settings', href: '/platform/settings', icon: Settings },
];

export function PlatformSidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-gray-900 text-white">
      <div className="flex h-16 items-center px-6">
        <h1 className="text-xl font-bold">Biwi Platform</h1>
      </div>
      
      <nav className="mt-6 space-y-1 px-3">
        {navigation.map((item) => {
          const isActive = pathname === item.href || 
                          (item.href !== '/platform/dashboard' && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
      
      <div className="absolute bottom-0 w-64 p-4">
        <div className="rounded-lg bg-orange-600 p-3">
          <p className="text-xs font-medium">PLATFORM ADMIN MODE</p>
          <p className="mt-1 text-xs text-orange-100">
            Full system access enabled
          </p>
        </div>
      </div>
    </div>
  );
}
