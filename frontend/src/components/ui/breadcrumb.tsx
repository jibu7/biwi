import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className }) => {
  return (
    <nav className={cn("flex items-center space-x-2 text-sm", className)} aria-label="Breadcrumb">
      <Link 
        href="/" 
        className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Home"
      >
        <Home className="h-4 w-4" />
      </Link>
      
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="h-3 w-3 text-muted-foreground" />
          {item.href && index < items.length - 1 ? (
            <Link 
              href={item.href}
              className="text-muted-foreground hover:text-foreground transition-colors capitalize"
            >
              {item.label}
            </Link>
          ) : (
            <span 
              className={cn(
                "capitalize",
                index === items.length - 1 
                  ? "text-foreground font-medium" 
                  : "text-muted-foreground"
              )}
            >
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

// Auto breadcrumb hook to generate breadcrumbs from pathname
export const useAutoBreadcrumb = (pathname: string) => {
  const segments = pathname.split('/').filter(Boolean);
  
  const items: BreadcrumbItem[] = segments.map((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/');
    const label = segment.replace('-', ' ');
    
    return {
      label,
      href: index < segments.length - 1 ? href : undefined
    };
  });
  
  return items;
};