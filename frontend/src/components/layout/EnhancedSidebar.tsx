'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  ChevronDown, 
  ChevronRight, 
  X, 
  Search,
  Star,
  Pin,
  Settings,
  Clock,
  Zap,
  ChevronLeft,
  MoreHorizontal,
  Heart,
  TrendingUp,
  BookOpen,
  Sparkles
} from 'lucide-react';
import { navItems, type NavItem } from '@/lib/navigationItems';
import { usePermissions } from '@/hooks/usePermissions';
import { useNavigation } from '@/contexts/NavigationContext';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/ui/Logo';

interface EnhancedSidebarProps {
  isSidebarOpen: boolean;
  setSidebarOpen: (isOpen: boolean) => void;
}

export function EnhancedSidebar({ isSidebarOpen, setSidebarOpen }: EnhancedSidebarProps) {
  const pathname = usePathname();
  const { hasPermission } = usePermissions();
  const { 
    favorites,
    toggleFavorite,
    recentItems,
    pinnedItems,
    togglePinnedItem,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    suggestedActions,
    navigationPreferences,
    updateNavigationPreferences
  } = useNavigation();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(['setup-configuration', 'analytics-insights']));
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'nav' | 'recent' | 'favorites' | 'suggested'>('nav');
  
  // Mobile gesture handling
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && isSidebarOpen) {
      setSidebarOpen(false);
    }
  };

  // Mobile-first responsive behavior
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const shouldShowOverlay = isMobile && isSidebarOpen;
  
  const toggleExpanded = (id: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Helper function to recursively check if any child is visible
  const hasVisibleChildren = (children: NavItem[]): boolean => {
    return children?.some((child: NavItem) => {
      const childVisible = !child.requiredPermission || hasPermission(child.requiredPermission);
      
      if (!child.children && childVisible) {
        return true;
      }
      
      if (child.children) {
        return childVisible && hasVisibleChildren(child.children);
      }
      
      return childVisible;
    }) || false;
  };

  // Filter navigation items based on search
  const filteredNavItems = useMemo(() => {
    if (!searchQuery.trim()) return navItems;
    
    const query = searchQuery.toLowerCase();
    
    const filterItems = (items: NavItem[]): NavItem[] => {
      return items.reduce((acc: NavItem[], item) => {
        const matchesSearch = 
          item.label.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query) ||
          item.searchKeywords?.some(keyword => keyword.includes(query));
        
        const filteredChildren = item.children ? filterItems(item.children) : [];
        
        if (matchesSearch || filteredChildren.length > 0) {
          acc.push({
            ...item,
            children: filteredChildren.length > 0 ? filteredChildren : item.children
          });
        }
        
        return acc;
      }, []);
    };
    
    return filterItems(navItems);
  }, [searchQuery]);

  const renderNavItem = (item: NavItem, level = 0) => {
    // Check permissions for this item
    if (item.requiredPermission && !hasPermission(item.requiredPermission)) {
      return null;
    }

    // Filter children based on permissions (recursively)
    const visibleChildren = item.children?.filter((child: NavItem) => {
      const childVisible = !child.requiredPermission || hasPermission(child.requiredPermission);
      
      if (!child.children) {
        return childVisible;
      }
      
      return childVisible && hasVisibleChildren(child.children);
    });

    // Don't render if no visible children and no href
    if (!item.href && (!visibleChildren || visibleChildren.length === 0)) {
      return null;
    }

    const hasChildren = visibleChildren && visibleChildren.length > 0;
    const isExpanded = item.id ? expandedItems.has(item.id) : false;
    const Icon = item.icon;
    const isActive = pathname === item.href;
    const isFavorite = item.href ? favorites.includes(item.href) : false;
    const isPinned = item.href ? pinnedItems.includes(item.href) : false;

    return (
      <div key={item.id || item.label} className="relative">
        {item.href ? (
          <div className="group relative">
            <Link
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200',
                'hover:bg-blue-50 hover:text-blue-700',
                isActive && 'bg-blue-100 text-blue-700 border-r-2 border-blue-600',
                level > 0 && 'ml-6',
                isSidebarCollapsed && 'justify-center px-2'
              )}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {Icon && (
                  <Icon 
                    className={cn(
                      "h-4 w-4 flex-shrink-0",
                      isActive ? "text-blue-600" : "text-gray-600"
                    )} 
                  />
                )}
                {!isSidebarCollapsed && (
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="truncate flex-1 min-w-0">{item.label}</span>
                      {item.badge && (
                        <span className={cn(
                          "px-1.5 py-0.5 text-xs rounded-full font-medium flex-shrink-0",
                          item.badge.variant === 'default' && "bg-primary/10 text-primary",
                          item.badge.variant === 'success' && "bg-green-100 text-green-700",
                          item.badge.variant === 'secondary' && "bg-gray-100 text-gray-700",
                          item.badge.pulse && "animate-pulse"
                        )}>
                          {item.badge.text}
                        </span>
                      )}
                    </div>
                    {navigationPreferences.showDescriptions && item.description && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {item.description}
                      </p>
                    )}
                  </div>
                )}
              </div>
              
              {!isSidebarCollapsed && item.href && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleFavorite(item.href!);
                    }}
                    className={cn(
                      "p-1 rounded hover:bg-accent/20 transition-colors",
                      isFavorite ? "text-yellow-500" : "text-muted-foreground"
                    )}
                  >
                    <Star className="h-3 w-3" fill={isFavorite ? "currentColor" : "none"} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      togglePinnedItem(item.href!);
                    }}
                    className={cn(
                      "p-1 rounded hover:bg-accent/20 transition-colors",
                      isPinned ? "text-blue-500" : "text-muted-foreground"
                    )}
                  >
                    <Pin className="h-3 w-3" fill={isPinned ? "currentColor" : "none"} />
                  </button>
                </div>
              )}
            </Link>
          </div>
        ) : (
          <button
            onClick={() => item.id && toggleExpanded(item.id)}
            className={cn(
              'w-full flex items-center justify-between gap-3 px-3 py-3 text-sm font-semibold rounded-lg transition-all duration-200',
              'hover:bg-blue-50 text-gray-900 min-w-0',
              level > 0 && 'ml-6',
              isSidebarCollapsed && 'justify-center px-2'
            )}
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {Icon && <Icon className="h-5 w-5 text-gray-600 flex-shrink-0" />}
              {!isSidebarCollapsed && (
                <div className="text-left min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-900 truncate">{item.label}</span>
                  </div>
                  {navigationPreferences.showDescriptions && item.description && (
                    <p className="text-xs text-gray-500 mt-0.5 font-normal truncate">
                      {item.description}
                    </p>
                  )}
                </div>
              )}
            </div>
            {!isSidebarCollapsed && hasChildren && (
              isExpanded ? (
                <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
              )
            )}
          </button>
        )}
        
        {hasChildren && isExpanded && !isSidebarCollapsed && (
          <div className="mt-1 space-y-1">
            {visibleChildren!.map((child: NavItem) => renderNavItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // Find nav item by href for recent/favorites display
  const findNavItemByHref = (href: string): NavItem | null => {
    const search = (items: NavItem[]): NavItem | null => {
      for (const item of items) {
        if (item.href === href) return item;
        if (item.children) {
          const found = search(item.children);
          if (found) return found;
        }
      }
      return null;
    };
    
    return search(navItems);
  };

  return (
    <>
      {/* Mobile overlay with improved touch handling */}
      {shouldShowOverlay && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />
      )}

      <div
        className={cn(
          'bg-white border-r border-gray-200 shadow-sm min-h-screen fixed top-0 left-0 z-40 transform transition-all duration-300 ease-in-out lg:relative lg:translate-x-0 flex flex-col mobile-sidebar',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full',
          isSidebarCollapsed ? 'w-16' : 'w-72',
          // Mobile-specific styles - improved responsive design
          'h-full lg:h-screen'
        )}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Header */}
        <div className={cn(
          "flex items-center justify-between p-4 border-b border-gray-200 bg-white flex-shrink-0",
          isSidebarCollapsed && "justify-center"
        )}>
          {!isSidebarCollapsed && (
            <Logo 
              size="md" 
              textSize="xl" 
              showText={false} 
              clickable={true} 
              href="/dashboard" 
            />
          )}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors hidden lg:flex items-center justify-center"
            >
              <ChevronLeft className={cn(
                "h-4 w-4 transition-transform duration-200",
                isSidebarCollapsed && "rotate-180"
              )} />
            </button>
            <button 
              onClick={() => setSidebarOpen(false)} 
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors lg:hidden flex items-center justify-center"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {!isSidebarCollapsed && (
          <>
            {/* Enhanced Search - Fixed Alignment */}
            <div className="px-4 py-4 border-b border-gray-200 bg-white flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search navigation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={cn(
                    "w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
                    "placeholder:text-gray-400 transition-all duration-200"
                  )}
                />
              </div>
            </div>

            {/* Enhanced Navigation Tabs - Fixed Alignment */}
            <div className="px-4 pb-4 border-b border-gray-200 bg-white flex-shrink-0">
              <div className="flex gap-0.5 bg-gray-100 rounded-lg p-0.5">
                {[
                  { key: 'nav', label: 'Menu', icon: BookOpen },
                  { key: 'recent', label: 'Recent', icon: Clock },
                  { key: 'favorites', label: 'Starred', icon: Star },
                  { key: 'suggested', label: 'Smart', icon: Sparkles }
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key as any)}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-1 py-2 px-1.5 text-xs font-medium rounded-md transition-all duration-200',
                      'min-h-[36px] min-w-0',
                      activeTab === key 
                        ? 'bg-white text-gray-900 shadow-sm border border-gray-200' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    )}
                  >
                    <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate text-xs leading-tight">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Enhanced Navigation Content - Fixed Spacing and Scrolling */}
        <div className={cn(
          "flex-1 overflow-y-auto px-4 py-3 bg-white sidebar-scroll",
          // Better scrolling behavior
          "overscroll-y-contain"
        )} style={{ maxHeight: 'calc(100vh - 200px)' }}>
          {activeTab === 'nav' && (
            <>
              {searchQuery ? (
                <div className="space-y-1">
                  {filteredNavItems.map((item) => renderNavItem(item))}
                  {filteredNavItems.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <Search className="h-8 w-8 mx-auto mb-3 opacity-40" />
                      <p className="text-sm font-medium">No results found</p>
                      <p className="text-xs mt-1 opacity-60">Try a different search term</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {navItems.map((item) => renderNavItem(item))}
                </div>
              )}
            </>
          )}

          {activeTab === 'recent' && (
            <div className="space-y-1">
              {recentItems.length > 0 ? (
                <>
                  <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>Recently Visited</span>
                  </div>
                  {recentItems.slice(0, 10).map((href) => {
                    const item = findNavItemByHref(href);
                    if (!item) return null;
                    return renderNavItem(item);
                  })}
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No recent items</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'favorites' && (
            <div className="space-y-1">
              {favorites.length > 0 ? (
                <>
                  <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-muted-foreground">
                    <Star className="h-3 w-3" />
                    <span>Starred Items</span>
                  </div>
                  {favorites.map((href) => {
                    const item = findNavItemByHref(href);
                    if (!item) return null;
                    return renderNavItem(item);
                  })}
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Star className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No starred items</p>
                  <p className="text-xs mt-1">Star items to access them quickly</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'suggested' && (
            <div className="space-y-3">
              {suggestedActions.length > 0 ? (
                <>
                  <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-muted-foreground">
                    <Sparkles className="h-3 w-3" />
                    <span>Smart Suggestions</span>
                  </div>
                  {suggestedActions.map((action, index) => (
                    <Link
                      key={index}
                      href={action.href}
                      onClick={() => setSidebarOpen(false)}
                      className="block p-3 bg-accent/20 rounded-lg hover:bg-accent/40 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2 min-w-0">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-foreground truncate">
                            {action.label}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {action.reason}
                          </p>
                        </div>
                        <span className={cn(
                          "px-2 py-1 text-xs rounded-full font-medium flex-shrink-0",
                          action.priority === 'high' && "bg-red-100 text-red-700",
                          action.priority === 'medium' && "bg-yellow-100 text-yellow-700",
                          action.priority === 'low' && "bg-blue-100 text-blue-700"
                        )}>
                          {action.priority}
                        </span>
                      </div>
                    </Link>
                  ))}
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No suggestions available</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Settings Footer - Fixed Alignment */}
        {!isSidebarCollapsed && (
          <div className="border-t border-gray-200 p-4 bg-white flex-shrink-0">
            <button
              onClick={() => {
                // Toggle some preference as example
                updateNavigationPreferences({
                  showDescriptions: !navigationPreferences.showDescriptions
                });
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <Settings className="h-4 w-4" />
              <span>Navigation Settings</span>
            </button>
          </div>
        )}
      </div>
    </>
  );
}
