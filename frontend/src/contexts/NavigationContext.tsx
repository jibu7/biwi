'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface NavigationContextType {
  // Search functionality
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  
  // Favorites
  favorites: string[];
  toggleFavorite: (href: string) => void;
  
  // Recent items
  recentItems: string[];
  addRecentItem: (href: string) => void;
  
  // Mobile navigation
  isMobileNavOpen: boolean;
  setIsMobileNavOpen: (open: boolean) => void;
  
  // Sidebar state
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
  
  // Quick actions
  quickActions: Array<{
    label: string;
    href: string;
    icon: string;
    category: string;
  }>;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  
  // Search state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Favorites state - persist in localStorage
  const [favorites, setFavorites] = useState<string[]>([]);
  
  // Recent items state - persist in localStorage
  const [recentItems, setRecentItems] = useState<string[]>([]);
  
  // Mobile navigation state
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  
  // Sidebar state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // Quick actions - commonly used features
  const quickActions = [
    { label: 'New Journal Entry', href: '/transactions/gl/journal-entry/new', icon: '📝', category: 'GL' },
    { label: 'New Customer', href: '/maintenance/ar/customers/new', icon: '👤', category: 'AR' },
    { label: 'New Supplier', href: '/maintenance/ap/suppliers/new', icon: '🏢', category: 'AP' },
    { label: 'Stock Adjustment', href: '/transactions/inventory/adjustments/new', icon: '📦', category: 'Inventory' },
    { label: 'New Sales Order', href: '/transactions/oe/sales-orders/new', icon: '🛒', category: 'OE' },
    { label: 'Balance Sheet', href: '/reports/financial/balance-sheet', icon: '📊', category: 'Reports' },
  ];
  
  // Load favorites and recent items from localStorage on mount
  useEffect(() => {
    const savedFavorites = localStorage.getItem('vinea-favorites');
    const savedRecent = localStorage.getItem('vinea-recent');
    
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites));
      } catch (error) {
        console.error('Failed to parse saved favorites:', error);
      }
    }
    
    if (savedRecent) {
      try {
        setRecentItems(JSON.parse(savedRecent));
      } catch (error) {
        console.error('Failed to parse saved recent items:', error);
      }
    }
  }, []);
  
  // Save favorites to localStorage when changed
  useEffect(() => {
    localStorage.setItem('vinea-favorites', JSON.stringify(favorites));
  }, [favorites]);
  
  // Save recent items to localStorage when changed
  useEffect(() => {
    localStorage.setItem('vinea-recent', JSON.stringify(recentItems));
  }, [recentItems]);
  
  // Add current page to recent items when pathname changes
  useEffect(() => {
    if (pathname && pathname !== '/' && !pathname.includes('/login')) {
      addRecentItem(pathname);
    }
  }, [pathname]);
  
  // Close mobile nav when pathname changes
  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [pathname]);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Cmd+K or Ctrl+K for search
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setIsSearchOpen(!isSearchOpen);
      }
      
      // ESC to close modals
      if (event.key === 'Escape') {
        setIsSearchOpen(false);
        setIsMobileNavOpen(false);
        setSearchQuery('');
      }
      
      // Cmd+B or Ctrl+B to toggle sidebar
      if ((event.metaKey || event.ctrlKey) && event.key === 'b') {
        event.preventDefault();
        setIsSidebarCollapsed(!isSidebarCollapsed);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, isSidebarCollapsed]);
  
  const toggleFavorite = (href: string) => {
    setFavorites(prev => 
      prev.includes(href) 
        ? prev.filter(item => item !== href)
        : [...prev, href].slice(0, 10) // Limit to 10 favorites
    );
  };
  
  const addRecentItem = (href: string) => {
    setRecentItems(prev => {
      const filtered = prev.filter(item => item !== href);
      return [href, ...filtered].slice(0, 10); // Limit to 10 recent items
    });
  };
  
  const value: NavigationContextType = {
    isSearchOpen,
    setIsSearchOpen,
    searchQuery,
    setSearchQuery,
    favorites,
    toggleFavorite,
    recentItems,
    addRecentItem,
    isMobileNavOpen,
    setIsMobileNavOpen,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    quickActions,
  };
  
  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};