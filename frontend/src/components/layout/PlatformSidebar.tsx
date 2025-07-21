'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDownIcon, ChevronRightIcon } from 'lucide-react';
import { platformNavItems } from '@/lib/platformNavigationItems';
import { cn } from '@/lib/utils';

export function PlatformSidebar() {
  const pathname = usePathname();
  const [expandedSections, setExpandedSections] = useState<string[]>(['Dashboard']);

  const toggleSection = (label: string) => {
    setExpandedSections(prev =>
      prev.includes(label)
        ? prev.filter(l => l !== label)
        : [...prev, label]
    );
  };

  const renderNavItem = (item: any, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedSections.includes(item.label);
    const Icon = item.icon;
    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

    return (
      <div key={item.label} className="w-full">
        <div
          className={cn(
            "flex items-center justify-between px-3 py-2 rounded-md transition-colors cursor-pointer",
            "hover:bg-gray-700",
            isActive && "bg-gray-700",
            level === 0 && "font-semibold text-white",
            level === 1 && "ml-4 text-gray-300",
            level === 2 && "ml-8 text-gray-400"
          )}
          onClick={() => {
            if (hasChildren) {
              toggleSection(item.label);
            }
          }}
        >
          <div className="flex items-center gap-2 flex-1">
            {hasChildren ? (
              isExpanded ? <ChevronDownIcon className="h-4 w-4" /> : <ChevronRightIcon className="h-4 w-4" />
            ) : (
              <span className="w-4" />
            )}
            {Icon && <Icon className="h-4 w-4" />}
            {item.href ? (
              <Link href={item.href} className="flex-1 flex items-center gap-2">
                {item.label}
              </Link>
            ) : (
              <span>{item.label}</span>
            )}
          </div>
        </div>
        
        {hasChildren && isExpanded && (
          <div className="mt-1">
            {item.children.map((child: any) => renderNavItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className="w-64 bg-gray-900 text-white h-full overflow-y-auto">
      <div className="p-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Biwi Platform</h1>
          <p className="text-sm text-gray-400 mt-1">Vinea ERP - Platform Administration</p>
        </div>
        <nav className="space-y-1">
          {platformNavItems.map(item => renderNavItem(item))}
        </nav>
      </div>
    </aside>
  );
}
