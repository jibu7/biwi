'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  FileText, 
  BarChart3, 
  Bell, 
  Shield, 
  Settings,
  LogOut
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/authService';

const sidebarItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/platform/dashboard' },
  { icon: Building2, label: 'Companies', href: '/platform/companies' },
  { icon: Users, label: 'Users', href: '/platform/users' },
  { icon: FileText, label: 'Audit Logs', href: '/platform/audit-logs' },
  { icon: BarChart3, label: 'Analytics', href: '/platform/analytics' },
  { icon: Bell, label: 'Alerts', href: '/platform/alerts' },
  { icon: Shield, label: 'Security', href: '/platform/security' },
  { icon: Settings, label: 'Settings', href: '/platform/settings' },
];

export function PlatformSidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  const handleLogout = () => {
    authService.logout();
    window.location.href = '/platform-login';
  };

  return (
    <div className="w-64 bg-gray-900 text-white">
      <div className="p-4">
        <h2 className="text-xl font-bold mb-2">Biwi Platform</h2>
        <p className="text-sm text-gray-400">Vinea ERP - Platform Administration</p>
      </div>

      <nav className="mt-8">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-6 py-3 hover:bg-gray-800 transition-colors ${
                isActive ? 'bg-gray-800 border-l-4 border-blue-500' : ''
              }`}
            >
              <Icon className="h-5 w-5 mr-3" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="absolute bottom-0 w-64 p-4 border-t border-gray-800">
        <div className="bg-orange-600 rounded-lg p-3 mb-3">
          <p className="text-xs font-semibold">PLATFORM ADMIN MODE</p>
          <p className="text-xs">System access enabled</p>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{user?.full_name || user?.email}</p>
            <p className="text-xs text-gray-400">Platform Admin</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 hover:bg-gray-800 rounded"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
