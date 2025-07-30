'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  X, 
  Clock, 
  Star, 
  ArrowRight,
  Command,
  Hash,
  User,
  Settings,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { navItems } from '@/lib/navigationItems';
import { usePermissions } from '@/hooks/usePermissions';
import { useNavigation } from '@/contexts/NavigationContext';

interface SearchResult {
  id: string;
  title: string;
  description?: string;
  href: string;
  category: string;
  icon?: React.ComponentType<any>;
  keywords: string[];
}

interface SearchCategory {
  name: string;
  icon: React.ComponentType<any>;
  color: string;
}

const categories: Record<string, SearchCategory> = {
  navigation: { name: 'Navigation', icon: Hash, color: 'text-blue-500' },
  recent: { name: 'Recent', icon: Clock, color: 'text-gray-500' },
  favorites: { name: 'Favorites', icon: Star, color: 'text-yellow-500' },
  quick: { name: 'Quick Actions', icon: Command, color: 'text-green-500' },
  users: { name: 'Users', icon: User, color: 'text-purple-500' },
  reports: { name: 'Reports', icon: TrendingUp, color: 'text-orange-500' },
  settings: { name: 'Settings', icon: Settings, color: 'text-gray-600' },
};

export const GlobalSearch: React.FC = () => {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const { 
    isSearchOpen, 
    setIsSearchOpen, 
    searchQuery, 
    setSearchQuery,
    favorites,
    recentItems,
    quickActions 
  } = useNavigation();
  
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  // Helper to find nav item by href
  const findNavItemByHref = useCallback((href: string): any => {
    const search = (items: any[]): any => {
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
  }, []);
  
  // Build searchable items from navigation
  const buildSearchableItems = useCallback(() => {
    const items: SearchResult[] = [];
    
    const addNavItems = (navs: any[], category = 'navigation') => {
      navs.forEach(nav => {
        // Skip if no permission
        if (nav.requiredPermission && !hasPermission(nav.requiredPermission)) {
          return;
        }
        
        if (nav.href) {
          // Enhanced search keywords from new nav structure
          const keywords = [
            nav.label.toLowerCase(), 
            category.toLowerCase(),
            ...(nav.searchKeywords || []),
            ...(nav.meta?.category ? [nav.meta.category] : [])
          ];
          
          items.push({
            id: nav.id || `nav-${nav.href}`,
            title: nav.label,
            description: nav.description || `Navigate to ${nav.label}`,
            href: nav.href,
            category,
            icon: nav.icon,
            keywords
          });
          
          // Add quick actions as separate searchable items
          if (nav.quickActions) {
            nav.quickActions.forEach((action: any) => {
              if (!action.requiredPermission || hasPermission(action.requiredPermission)) {
                items.push({
                  id: `quick-${action.href}`,
                  title: action.label,
                  description: `Quick action - ${action.category}`,
                  href: action.href,
                  category: 'quick',
                  icon: action.icon,
                  keywords: [action.label.toLowerCase(), action.category.toLowerCase(), 'quick', 'action', ...(action.keywords || [])]
                });
              }
            });
          }
        }
        
        if (nav.children) {
          addNavItems(nav.children, category);
        }
      });
    };
    
    // Add navigation items
    addNavItems(navItems);
    
    // Add recent items
    recentItems.forEach((href) => {
      const navItem = findNavItemByHref(href);
      if (navItem) {
        items.push({
          id: `recent-${href}`,
          title: navItem.label,
          description: `Recently visited`,
          href,
          category: 'recent',
          icon: navItem.icon,
          keywords: [navItem.label.toLowerCase(), 'recent']
        });
      }
    });
    
    // Add favorites
    favorites.forEach(href => {
      const navItem = findNavItemByHref(href);
      if (navItem) {
        items.push({
          id: `favorite-${href}`,
          title: navItem.label,
          description: `Favorited`,
          href,
          category: 'favorites',
          icon: navItem.icon,
          keywords: [navItem.label.toLowerCase(), 'favorite', 'starred']
        });
      }
    });
    
    // Add quick actions from context
    quickActions.forEach(action => {
      // Check if action has permission requirement
      const hasRequiredPermission = !action.requiredPermission || hasPermission(action.requiredPermission);
      
      if (hasRequiredPermission) {
        items.push({
          id: `context-quick-${action.href}`,
          title: action.label,
          description: `Quick action - ${action.category}`,
          href: action.href,
          category: 'quick',
          keywords: [action.label.toLowerCase(), action.category.toLowerCase(), 'quick', 'action', ...(action.keywords || [])]
        });
      }
    });
    
    return items;
  }, [navItems, hasPermission, recentItems, favorites, quickActions, findNavItemByHref]);
  
  // Calculate relevance score for sorting
  const calculateRelevanceScore = useCallback((item: SearchResult, query: string): number => {
    const q = query.toLowerCase();
    let score = 0;
    
    // Exact title match gets highest score
    if (item.title.toLowerCase() === q) score += 100;
    
    // Title starts with query
    if (item.title.toLowerCase().startsWith(q)) score += 50;
    
    // Title contains query
    if (item.title.toLowerCase().includes(q)) score += 25;
    
    // Category bonuses
    if (item.category === 'favorites') score += 10;
    if (item.category === 'recent') score += 8;
    if (item.category === 'quick') score += 5;
    
    return score;
  }, []);
  
  // Search function
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      // Show recent and favorites when no query
      const items = buildSearchableItems();
      const defaultResults = [
        ...items.filter(item => item.category === 'recent').slice(0, 3),
        ...items.filter(item => item.category === 'favorites').slice(0, 3),
        ...items.filter(item => item.category === 'quick').slice(0, 4)
      ];
      setResults(defaultResults);
      return;
    }
    
    setIsLoading(true);
    
    // Simulate search delay for better UX
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const items = buildSearchableItems();
    const filtered = items.filter(item => {
      const searchTerms = query.toLowerCase().split(' ');
      return searchTerms.every(term => 
        item.keywords.some(keyword => keyword.includes(term)) ||
        item.title.toLowerCase().includes(term) ||
        (item.description && item.description.toLowerCase().includes(term))
      );
    });
    
    // Sort by relevance
    const sorted = filtered.sort((a, b) => {
      const aScore = calculateRelevanceScore(a, query);
      const bScore = calculateRelevanceScore(b, query);
      return bScore - aScore;
    });
    
    setResults(sorted.slice(0, 10)); // Limit to 10 results
    setIsLoading(false);
  }, [buildSearchableItems, calculateRelevanceScore]);
  
  // Handle result click
  const handleResultClick = useCallback((result: SearchResult) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    router.push(result.href);
  }, [router, setIsSearchOpen, setSearchQuery]);
  
  // Handle search query changes
  useEffect(() => {
    const debounced = setTimeout(() => {
      performSearch(searchQuery);
    }, 150);
    
    return () => clearTimeout(debounced);
  }, [searchQuery, performSearch]);
  
  // Handle keyboard navigation
  useEffect(() => {
    if (!isSearchOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < results.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : results.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (results[selectedIndex]) {
            handleResultClick(results[selectedIndex]);
          }
          break;
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, results, selectedIndex, handleResultClick]);
  
  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);
  
  // Close search on outside click
  useEffect(() => {
    if (!isSearchOpen) return;
    
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Element;
      if (!target.closest('[data-search-container]')) {
        setIsSearchOpen(false);
      }
    };
    
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [isSearchOpen, setIsSearchOpen]);
  
  if (!isSearchOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-in fade-in-0 duration-200">
      <div className="container mx-auto px-4 pt-20">
        <div 
          className="mx-auto max-w-2xl bg-background rounded-lg shadow-2xl border animate-in slide-in-from-top-4 duration-300"
          data-search-container
        >
          {/* Search Input */}
          <div className="relative border-b">
            <div className="flex items-center px-4">
              <Search className="h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search navigation, actions, and more..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-3 py-4 bg-transparent border-0 focus:outline-none text-sm placeholder:text-muted-foreground"
                autoFocus
              />
              <div className="flex items-center gap-2">
                {isLoading && (
                  <div className="h-4 w-4 border-2 border-muted border-t-foreground rounded-full animate-spin" />
                )}
                <button
                  onClick={() => setIsSearchOpen(false)}
                  className="p-1 hover:bg-accent rounded transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
          
          {/* Search Results */}
          <div className="max-h-96 overflow-y-auto">
            {results.length === 0 && !isLoading ? (
              <div className="p-8 text-center text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No results found</p>
                <p className="text-xs mt-1">Try searching for pages, actions, or features</p>
              </div>
            ) : (
              <div className="py-2">
                {/* Group results by category */}
                {Object.entries(
                  results.reduce((groups, result) => {
                    if (!groups[result.category]) {
                      groups[result.category] = [];
                    }
                    groups[result.category].push(result);
                    return groups;
                  }, {} as Record<string, SearchResult[]>)
                ).map(([categoryKey, categoryResults]) => {
                  const category = categories[categoryKey];
                  if (!category) return null;
                  
                  return (
                    <div key={categoryKey} className="mb-2">
                      <div className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                        <category.icon className={cn("h-3 w-3", category.color)} />
                        {category.name}
                      </div>
                      {categoryResults.map((result) => {
                        const globalIndex = results.indexOf(result);
                        const Icon = result.icon;
                        
                        return (
                          <button
                            key={result.id}
                            onClick={() => handleResultClick(result)}
                            className={cn(
                              "w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-accent transition-colors",
                              globalIndex === selectedIndex && "bg-accent"
                            )}
                          >
                            <div className="flex-shrink-0">
                              {Icon ? (
                                <Icon className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <div className="h-4 w-4 rounded bg-muted" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">
                                {result.title}
                              </div>
                              {result.description && (
                                <div className="text-xs text-muted-foreground truncate">
                                  {result.description}
                                </div>
                              )}
                            </div>
                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* Search Footer */}
          <div className="border-t px-4 py-3 flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">↑↓</kbd>
              <span>Navigate</span>
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">↵</kbd>
              <span>Select</span>
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">ESC</kbd>
              <span>Close</span>
            </div>
            <div className="flex items-center gap-1">
              <span>Search by</span>
              <Command className="h-3 w-3" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};