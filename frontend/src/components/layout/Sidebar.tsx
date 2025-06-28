'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { navItems } from '@/lib/navigationItems';
import { usePermissions } from '@/hooks/usePermissions';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const pathname = usePathname();
  const { hasPermission } = usePermissions();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpanded = (label: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(label)) {
        newSet.delete(label);
      } else {
        newSet.add(label);
      }
      return newSet;
    });
  };

  const renderNavItem = (item: any, level = 0) => {
    // Helper function to recursively check if any child is visible
    const hasVisibleChildren = (children: any[]): boolean => {
      return children?.some((child: any) => {
        // Check if this child itself is visible
        const childVisible = !child.requiredPermission || hasPermission(child.requiredPermission);
        
        // If child has no children and is visible, return true
        if (!child.children && childVisible) {
          return true;
        }
        
        // If child has children, recursively check
        if (child.children) {
          return childVisible && hasVisibleChildren(child.children);
        }
        
        return childVisible;
      }) || false;
    };

    // Check permissions for this item
    if (item.requiredPermission && !hasPermission(item.requiredPermission)) {
      return null;
    }

    // Filter children based on permissions (recursively)
    const visibleChildren = item.children?.filter((child: any) => {
      const childVisible = !child.requiredPermission || hasPermission(child.requiredPermission);
      
      // If child has no children, just check its own permission
      if (!child.children) {
        return childVisible;
      }
      
      // If child has children, it's visible if it has permission AND has visible children
      return childVisible && hasVisibleChildren(child.children);
    });

    // Don't render if no visible children and no href
    if (!item.href && (!visibleChildren || visibleChildren.length === 0)) {
      return null;
    }

    const hasChildren = visibleChildren && visibleChildren.length > 0;
    const isExpanded = expandedItems.has(item.label);
    const Icon = item.icon;

    return (
      <div key={item.label}>
        {item.href ? (
          <Link
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-md transition-colors',
              pathname === item.href
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-700 hover:bg-gray-100',
              level > 0 && 'ml-6'
            )}
          >
            {Icon && <Icon className="h-5 w-5" />}
            {item.label}
          </Link>
        ) : (
          <button
            onClick={() => toggleExpanded(item.label)}
            className={cn(
              'w-full flex items-center justify-between gap-3 px-4 py-2 text-sm font-medium rounded-md transition-colors text-gray-700 hover:bg-gray-100',
              level > 0 && 'ml-6'
            )}
          >
            <div className="flex items-center gap-3">
              {Icon && <Icon className="h-5 w-5" />}
              {item.label}
            </div>
            {hasChildren &&
              (isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              ))}
          </button>
        )}
        {hasChildren && isExpanded && (
          <div className="mt-1">
            {visibleChildren.map((child: any) => renderNavItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white w-64 min-h-screen shadow-lg">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-800">Vinea ERP</h2>
      </div>
      <nav className="px-4 pb-4">
        {navItems.map((item) => renderNavItem(item))}
      </nav>
    </div>
  );
}
