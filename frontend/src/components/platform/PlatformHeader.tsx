'use client';


import { usePlatformAuthStore } from '@/store/platformAuthStore';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';

export function PlatformHeader() {
  const { user, logout } = usePlatformAuthStore();

  const handleLogout = () => {
    logout();
    window.location.href = '/platform-login';
  };

  return (
    <header className="h-16 border-b bg-white px-6">
      <div className="flex h-full items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Platform Administration</h2>
          <p className="text-sm text-gray-500">
            Managing {new Date().toLocaleDateString()}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4" />
            <span>{user?.email}</span>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
