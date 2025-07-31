'use client';

import { usePlatformAuth } from '@/hooks/usePlatformAuth';
import { LogOut } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';

export function PlatformNavbar() {
  const { platformUser } = usePlatformAuth();

  const handleLogout = () => {
    // Clear platform auth
    localStorage.removeItem('platform_auth_token');
    // Redirect to platform login
    window.location.href = '/platform-login';
  };

  return (
    <nav className="bg-gray-900 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Logo size="md" variant="light" textSize="lg" />
            <span className="ml-4 text-xl font-semibold text-white">
              Platform Administration
            </span>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-300">
              Welcome, {platformUser?.full_name || platformUser?.email}
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-300 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
