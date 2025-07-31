'use client';

import { useRouter } from 'next/navigation';
import { LogOut, Menu, Search, Command } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { CompanySwitcher } from './CompanySwitcher';
import { CompanyContext } from './CompanyContext';
import { GlobalSearch } from '@/components/navigation/GlobalSearch';
import { useNavigation } from '@/contexts/NavigationContext';
import { Logo } from '@/components/ui/Logo';

interface HeaderProps {
  onMenuButtonClick: () => void;
}

export function Header({ onMenuButtonClick }: HeaderProps) {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { setIsSearchOpen } = useNavigation();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <>
      <header className="bg-white shadow-md px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onMenuButtonClick} className="lg:hidden">
              <Menu className="h-6 w-6" />
            </button>
            <div className="hidden lg:block">
              <Logo 
                size="md" 
                textSize="lg" 
                showText={false} 
                clickable={true} 
                href="/dashboard" 
              />
            </div>
            <div className="hidden sm:flex items-center gap-4">
              <CompanySwitcher />
              <CompanyContext />
            </div>
          </div>
          
          {/* Search Section */}
          <div className="flex-1 max-w-lg mx-4 hidden md:block">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Search className="h-4 w-4" />
              <span>Search or jump to...</span>
            </button>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Mobile search button */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="md:hidden flex items-center justify-center w-10 h-10 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Search className="h-5 w-5" />
            </button>
            
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{user?.full_name || user?.email}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-2 sm:px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
        <div className="sm:hidden mt-4">
          <CompanySwitcher />
          <div className="mt-2">
            <CompanyContext />
          </div>
        </div>
      </header>
      
      {/* Global Search Modal */}
      <GlobalSearch />
    </>
  );
}

