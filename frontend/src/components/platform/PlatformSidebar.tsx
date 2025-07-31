'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { LogOut } from 'lucide-react';
import { usePlatformAuthStore } from '@/store/platformAuthStore';
import { platformNavItems } from '@/lib/navigationItems';
import { NavItem } from '@/lib/navigationItems';
import { hasPermission } from '@/lib/permissions';

export function PlatformSidebar() {
  const pathname = usePathname();
  const { user, logout } = usePlatformAuthStore();

  const renderNavItem = (item: NavItem) => {
    if (item.requiredPermission && !hasPermission(user?.permissions || [], item.requiredPermission)) {
      return null;
    }

    const isActive = pathname === item.href;
    const Icon = item.icon;

    if (item.children) {
      return (
        <div key={item.label}>
          <span className="flex items-center px-6 py-3 text-sm font-semibold text-gray-400">
            {Icon && <Icon className="h-5 w-5 mr-3" />}
            {item.label}
          </span>
          <div className="ml-4">
            {item.children.map(renderNavItem)}
          </div>
        </div>
      );
    }

    return (
      <Link
        key={item.href}
        href={item.href!}
        className={`flex items-center px-6 py-3 hover:bg-gray-700 transition-colors ${
          isActive ? 'bg-gray-700 border-l-4 border-blue-500' : ''
        }`}
      >
        {Icon && <Icon className="h-5 w-5 mr-3" />}
        <span>{item.label}</span>
      </Link>
    );
  };

  return (
    <div className="w-64 bg-gray-800 text-white flex flex-col">
      <div className="p-4">
        <h2 className="text-xl font-bold mb-2">Biwi Platform</h2>
        <p className="text-sm text-gray-400 mt-2">Platform Administration</p>
      </div>

      <nav className="flex-1 mt-8 space-y-2">
        {platformNavItems.map(renderNavItem)}
      </nav>

      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{user?.full_name || user?.email}</p>
            <p className="text-xs text-gray-400">Platform Admin</p>
          </div>
          <button
            onClick={logout}
            className="p-2 hover:bg-gray-700 rounded"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
