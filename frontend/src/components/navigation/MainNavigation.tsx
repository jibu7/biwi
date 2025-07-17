import React from 'react';
import { useAuthStore } from '@/store/authStore';
import { useCompanyContext } from '@/contexts/CompanyContext';
import Link from 'next/link';
import { LogOut } from 'lucide-react';

export const MainNavigation = () => {
  const { user, isPlatformAdmin, logout } = useAuthStore();
  const { currentCompany } = useCompanyContext();
  
  // Helper function to stop impersonation
  const stopImpersonation = async () => {
    try {
      // Call the backend to stop impersonation
      await fetch('/api/v1/platform/stop-impersonation', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${useAuthStore.getState().token}`,
        },
      });
      window.location.href = '/platform/dashboard';
    } catch (error) {
      console.error('Failed to stop impersonation:', error);
    }
  };
  
  // Render platform admin navigation if user is platform admin
  if (isPlatformAdmin) {
    return (
      <nav className="bg-gray-900 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="font-bold text-xl">Platform Admin</span>
              </div>
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-4">
                  <Link href="/platform/dashboard" className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md">
                    Dashboard
                  </Link>
                  <Link href="/platform/companies" className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md">
                    Companies
                  </Link>
                  <Link href="/platform/users" className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md">
                    Users
                  </Link>
                  <Link href="/platform/audit-logs" className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md">
                    Audit Logs
                  </Link>
                  <Link href="/platform/settings" className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md">
                    Settings
                  </Link>
                </div>
              </div>
            </div>
            
            {/* Company Impersonation Status */}
            {currentCompany && (
              <div className="bg-red-900/60 px-3 py-1 rounded-md flex items-center">
                <span className="text-red-200 mr-2">Impersonating:</span>
                <span className="font-bold">{currentCompany.name}</span>
                <button 
                  onClick={stopImpersonation} 
                  className="ml-3 text-xs bg-red-700 px-2 py-1 rounded hover:bg-red-600"
                >
                  Exit
                </button>
              </div>
            )}
            
            {/* User Profile Dropdown */}
            <div className="ml-4 flex items-center md:ml-6">
              <div className="relative">
                <div className="flex items-center space-x-3">
                  <span className="mr-2">{user?.full_name || user?.email}</span>
                  <button 
                    onClick={() => {
                      logout();
                      window.location.href = '/platform-login';
                    }}
                    className="bg-gray-800 p-1 rounded-full hover:bg-gray-700 flex items-center"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>
    );
  }
  
  // Regular tenant user navigation
  return (
    <nav className="bg-blue-800 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="font-bold text-xl">
                {currentCompany?.name || 'Company'}
              </span>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <Link href="/dashboard" className="text-white hover:bg-blue-700 px-3 py-2 rounded-md">
                  Dashboard
                </Link>
                <Link href="/gl" className="text-blue-200 hover:bg-blue-700 hover:text-white px-3 py-2 rounded-md">
                  General Ledger
                </Link>
                <Link href="/ar" className="text-blue-200 hover:bg-blue-700 hover:text-white px-3 py-2 rounded-md">
                  Accounts Receivable
                </Link>
                <Link href="/ap" className="text-blue-200 hover:bg-blue-700 hover:text-white px-3 py-2 rounded-md">
                  Accounts Payable
                </Link>
                <Link href="/inventory" className="text-blue-200 hover:bg-blue-700 hover:text-white px-3 py-2 rounded-md">
                  Inventory
                </Link>
                <Link href="/oe" className="text-blue-200 hover:bg-blue-700 hover:text-white px-3 py-2 rounded-md">
                  Order Entry
                </Link>
              </div>
            </div>
          </div>
          
          {/* User Profile */}
          <div className="ml-4 flex items-center md:ml-6">
            <div className="relative">
              <div className="flex items-center space-x-3">
                <span className="mr-2">{user?.full_name || user?.email}</span>
                <button 
                  onClick={() => {
                    logout();
                    window.location.href = '/login';
                  }}
                  className="bg-blue-700 p-1 rounded-full hover:bg-blue-600 flex items-center"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
