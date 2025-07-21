'use client';

import { usePlatformAuth } from '@/hooks/usePlatformAuth';
import { LogOutIcon, UserIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function PlatformHeader() {
  const { platformUser, logout } = usePlatformAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/platform-login');
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-6 py-4 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Platform Administration</h2>
          <p className="text-sm text-gray-600">Managing {new Date().toLocaleDateString()}</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <UserIcon className="h-4 w-4 text-gray-600" />
            <span className="text-gray-700">{platformUser?.email}</span>
          </div>
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            <LogOutIcon className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
