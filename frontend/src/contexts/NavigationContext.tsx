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
  
  // Enhanced features
  pinnedItems: string[];
  togglePinnedItem: (href: string) => void;
  
  // Quick actions
  quickActions: Array<{
    label: string;
    href: string;
    icon: string;
    category: string;
    keywords?: string[];
    requiredPermission?: string;
  }>;
  
  // Smart suggestions
  suggestedActions: Array<{
    label: string;
    href: string;
    reason: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  
  // Navigation preferences
  navigationPreferences: {
    viewMode: 'compact' | 'comfortable' | 'spacious';
    showDescriptions: boolean;
    showBadges: boolean;
    groupByFrequency: boolean;
  };
  updateNavigationPreferences: (prefs: Partial<NavigationContextType['navigationPreferences']>) => void;
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
  
  // Pinned items state - persist in localStorage
  const [pinnedItems, setPinnedItems] = useState<string[]>([]);
  
  // Mobile navigation state
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  
  // Sidebar state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // Navigation preferences
  const [navigationPreferences, setNavigationPreferences] = useState<{
    viewMode: 'compact' | 'comfortable' | 'spacious';
    showDescriptions: boolean;
    showBadges: boolean;
    groupByFrequency: boolean;
  }>({
    viewMode: 'comfortable',
    showDescriptions: true,
    showBadges: true,
    groupByFrequency: false
  });
  
  // Quick actions - commonly used features
  const quickActions = [
    { label: 'New Journal Entry', href: '/transactions/gl/journal-entry/new', icon: '📝', category: 'GL', keywords: ['journal', 'entry', 'gl'] },
    { label: 'New Customer', href: '/maintenance/ar/customers/new', icon: '👤', category: 'AR', keywords: ['customer', 'add', 'ar'] },
    { label: 'New Supplier', href: '/maintenance/ap/suppliers/new', icon: '🏢', category: 'AP', keywords: ['supplier', 'vendor', 'ap'] },
    { label: 'Stock Adjustment', href: '/transactions/inventory/adjustments/new', icon: '📦', category: 'Inventory', keywords: ['stock', 'inventory', 'adjustment'] },
    { label: 'New Sales Order', href: '/transactions/oe/sales-orders/new', icon: '🛒', category: 'OE', keywords: ['sales', 'order', 'oe'] },
    { label: 'Balance Sheet', href: '/reports/financial/balance-sheet', icon: '📊', category: 'Reports', keywords: ['balance', 'sheet', 'financial'] },
  ];
  
  // Smart suggestions based on usage patterns
  const suggestedActions = [
    { label: 'Complete Month-End Process', href: '/operations/month-end', reason: 'Based on current date', priority: 'high' as const },
    { label: 'Review Pending Approvals', href: '/operations/approvals', reason: 'You have 3 pending items', priority: 'medium' as const },
    { label: 'Update Company Settings', href: '/maintenance/system/company', reason: 'Settings not updated in 90 days', priority: 'low' as const },
  ];
  
  // Load favorites, recent items, and pinned items from localStorage on mount
  useEffect(() => {
    const savedFavorites = localStorage.getItem('channelzap-favorites');
    const savedRecent = localStorage.getItem('channelzap-recent');
    const savedPinned = localStorage.getItem('channelzap-pinned');
    const savedPreferences = localStorage.getItem('channelzap-nav-preferences');
    
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
    
    if (savedPinned) {
      try {
        setPinnedItems(JSON.parse(savedPinned));
      } catch (error) {
        console.error('Failed to parse saved pinned items:', error);
      }
    }
    
    if (savedPreferences) {
      try {
        setNavigationPreferences(prev => ({ ...prev, ...JSON.parse(savedPreferences) }));
      } catch (error) {
        console.error('Failed to parse saved navigation preferences:', error);
      }
    }
  }, []);
  
  // Save favorites to localStorage when changed
  useEffect(() => {
    localStorage.setItem('channelzap-favorites', JSON.stringify(favorites));
  }, [favorites]);
  
  // Save recent items to localStorage when changed
  useEffect(() => {
    localStorage.setItem('channelzap-recent', JSON.stringify(recentItems));
  }, [recentItems]);
  
  // Save pinned items to localStorage when changed
  useEffect(() => {
    localStorage.setItem('channelzap-pinned', JSON.stringify(pinnedItems));
  }, [pinnedItems]);
  
  // Save navigation preferences to localStorage when changed
  useEffect(() => {
    localStorage.setItem('channelzap-nav-preferences', JSON.stringify(navigationPreferences));
  }, [navigationPreferences]);
  
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
  
  const togglePinnedItem = (href: string) => {
    setPinnedItems(prev => 
      prev.includes(href) 
        ? prev.filter(item => item !== href)
        : [...prev, href].slice(0, 5) // Limit to 5 pinned items
    );
  };
  
  const addRecentItem = (href: string) => {
    setRecentItems(prev => {
      const filtered = prev.filter(item => item !== href);
      return [href, ...filtered].slice(0, 10); // Limit to 10 recent items
    });
  };
  
  const updateNavigationPreferences = (prefs: Partial<typeof navigationPreferences>) => {
    setNavigationPreferences(prev => ({ ...prev, ...prefs }));
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
    pinnedItems,
    togglePinnedItem,
    quickActions,
    suggestedActions,
    navigationPreferences,
    updateNavigationPreferences,
  };
  
  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};