import React, { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useCompanyContext } from '@/contexts/CompanyContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LogOut, 
  Search, 
  ChevronDown, 
  Menu,
  Bell,
  User
} from 'lucide-react';
import { navItems } from '@/lib/navigationItems';
import { usePermissions } from '@/hooks/usePermissions';
import { cn } from '@/lib/utils';

// Simple dropdown navigation component
const NavDropdown = ({ item, hasPermission, pathname }: {
  item: any;
  hasPermission: (permission: string) => boolean;
  pathname: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Check permissions
  if (item.requiredPermission && !hasPermission(item.requiredPermission)) {
    return null;
  }

  // Filter visible children
  const visibleChildren = item.children?.filter((child: any) => 
    !child.requiredPermission || hasPermission(child.requiredPermission)
  );

  const hasChildren = visibleChildren && visibleChildren.length > 0;
  const Icon = item.icon;
  const isActive = pathname.startsWith(item.href || '');

  if (!hasChildren) {
    return (
      <Link
        href={item.href || '#'}
        className={cn(
          "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 hover:bg-accent hover:text-accent-foreground",
          isActive && "bg-accent text-accent-foreground"
        )}
      >
        {Icon && <Icon className="w-4 h-4" />}
        <span>{item.label}</span>
      </Link>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className={cn(
          "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 hover:bg-accent hover:text-accent-foreground",
          isActive && "bg-accent text-accent-foreground"
        )}
      >
        {Icon && <Icon className="w-4 h-4" />}
        <span>{item.label}</span>
        <ChevronDown className="w-3 h-3" />
      </button>
      
      {isOpen && (
        <div 
          className="absolute top-full left-0 mt-1 min-w-[250px] rounded-lg border bg-popover shadow-lg z-50"
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
        >
          <div className="p-2 space-y-1">
            {visibleChildren.map((child: any) => {
              const ChildIcon = child.icon;
              const isChildActive = pathname === child.href;
              
              return (
                <Link
                  key={child.label}
                  href={child.href || '#'}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                    isChildActive && "bg-accent text-accent-foreground font-medium"
                  )}
                >
                  {ChildIcon && <ChildIcon className="w-4 h-4 text-muted-foreground" />}
                  <div>
                    <div className="font-medium">{child.label}</div>
                    {child.description && (
                      <div className="text-xs text-muted-foreground">{child.description}</div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export const MainNavigation = () => {
  const { user, isPlatformAdmin, logout } = useAuthStore();
  const { currentCompany } = useCompanyContext();
  const { hasPermission } = usePermissions();
  const pathname = usePathname();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Helper function to stop impersonation
  const stopImpersonation = async () => {
    try {
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

  return (
    <>
      {/* Enhanced Main Navigation Header */}
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Left Section - Brand & Navigation */}
            <div className="flex items-center gap-6">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground md:hidden"
                aria-expanded={isMobileMenuOpen}
                aria-label="Toggle mobile menu"
              >
                <Menu className="h-5 w-5" />
              </button>

              {/* Brand */}
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">V</span>
                </div>
                <div className="hidden sm:block">
                  <h1 className="font-semibold text-lg">
                    {isPlatformAdmin ? 'Platform Admin' : currentCompany?.name || 'ChannelZap'}
                  </h1>
                  {currentCompany && !isPlatformAdmin && (
                    <p className="text-xs text-muted-foreground">{currentCompany.name}</p>
                  )}
                </div>
              </div>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center gap-1">
                {navItems.map((item) => (
                  <NavDropdown 
                    key={item.label} 
                    item={item} 
                    hasPermission={hasPermission} 
                    pathname={pathname}
                  />
                ))}
              </div>
            </div>

            {/* Right Section - Actions & User */}
            <div className="flex items-center gap-2">
              {/* Search Button */}
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                aria-label="Search"
              >
                <Search className="h-4 w-4" />
              </button>

              {/* Notifications */}
              <button
                className="relative inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-destructive"></span>
              </button>

              {/* Company Impersonation Status */}
              {isPlatformAdmin && currentCompany && (
                <div className="hidden sm:flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-1.5 text-sm border border-destructive/20">
                  <div className="h-2 w-2 rounded-full bg-destructive animate-pulse"></div>
                  <span className="text-destructive font-medium">Impersonating: {currentCompany.name}</span>
                  <button
                    onClick={stopImpersonation}
                    className="ml-2 rounded-md bg-destructive px-2 py-1 text-xs text-destructive-foreground hover:bg-destructive/90 transition-colors"
                  >
                    Exit
                  </button>
                </div>
              )}

              {/* User Menu */}
              <div className="relative ml-2">
                <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-sm font-medium">{user?.full_name || user?.email}</div>
                    <div className="text-xs text-muted-foreground">{user?.email}</div>
                  </div>
                </button>
              </div>

              {/* Logout Button */}
              <button
                onClick={() => {
                  logout();
                  window.location.href = isPlatformAdmin ? '/platform-login' : '/login';
                }}
                className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t bg-background">
            <div className="container mx-auto px-4 py-4 space-y-2">
              {navItems.map((item) => {
                if (item.requiredPermission && !hasPermission(item.requiredPermission)) {
                  return null;
                }
                
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href || '');
                
                return (
                  <Link
                    key={item.label}
                    href={item.href || '#'}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive ? "bg-accent text-accent-foreground" : "hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    {Icon && <Icon className="h-4 w-4" />}
                    {item.label}
                  </Link>
                );
              })}
              
              {/* Mobile Impersonation Status */}
              {isPlatformAdmin && currentCompany && (
                <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-destructive">Impersonating</div>
                      <div className="text-xs text-muted-foreground">{currentCompany.name}</div>
                    </div>
                    <button
                      onClick={stopImpersonation}
                      className="rounded-md bg-destructive px-3 py-1 text-xs text-destructive-foreground hover:bg-destructive/90"
                    >
                      Exit
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Enhanced Search Overlay */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-20">
            <div className="mx-auto max-w-2xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search navigation..."
                  className="w-full rounded-lg border bg-background pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  autoFocus
                />
                <button
                  onClick={() => setIsSearchOpen(false)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <span className="text-xs bg-muted px-2 py-1 rounded">ESC</span>
                </button>
              </div>
              <div className="mt-4 text-center text-sm text-muted-foreground">
                Start typing to search navigation items...
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};