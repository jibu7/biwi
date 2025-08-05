import { navItems, type NavItem } from './navigationItems';
import * as permissions from './permissions';
import { LucideIcon } from 'lucide-react';

export interface DashboardModule {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  color: string;
  requiredPermission?: string;
  items: string[];
}

// Color mappings for consistent dashboard appearance
const moduleColors: Record<string, string> = {
  'organization-setup': 'bg-blue-500',
  'formatting-settings': 'bg-cyan-500',
  'financial-setup': 'bg-green-500', 
  'accounts-receivable-setup': 'bg-purple-500',
  'accounts-payable-setup': 'bg-red-500',
  'inventory-setup': 'bg-yellow-500',
  'order-entry-setup': 'bg-indigo-500',
  'bom-setup': 'bg-purple-500',
  'pos-setup': 'bg-orange-500',
  'common-setup': 'bg-gray-500',
  
  // Transaction modules
  'general-ledger-transactions': 'bg-green-500',
  'accounts-receivable-transactions': 'bg-purple-500', 
  'accounts-payable-transactions': 'bg-red-500',
  'inventory-transactions': 'bg-yellow-500',
  'order-entry-transactions': 'bg-indigo-500',
  'bom-transactions': 'bg-purple-500',
  'pos-transactions': 'bg-orange-500',
  
  // Analytics modules
  'executive-dashboard': 'bg-indigo-500',
  'financial-reporting': 'bg-green-500',
  'gl-reports': 'bg-green-500',
  'ar-reports': 'bg-purple-500',
  'ap-reports': 'bg-red-500',
  'inventory-reports': 'bg-yellow-500',
  'oe-reports': 'bg-indigo-500',
  'bom-reports': 'bg-purple-500',
  'pos-reports': 'bg-orange-500',
  'tax-reports': 'bg-gray-500',
  'report-management': 'bg-slate-500'
};

/**
 * Extract dashboard modules from navigation items for a specific category
 */
export function getDashboardModules(
  categoryId: string, 
  hasPermission: (permission: string) => boolean
): DashboardModule[] {
  const categoryItem = navItems.find(item => item.id === categoryId);
  
  if (!categoryItem?.children) {
    return [];
  }

  return categoryItem.children
    .filter(child => {
      // Check if user has permission for this module
      if (child.requiredPermission && !hasPermission(child.requiredPermission)) {
        return false;
      }
      
      // Special case for Order Entry - check if user has any OE permissions
      if (child.id === 'order-entry-transactions') {
        const oePermissions = [
          permissions.OE_SALES_ORDERS_MANAGE,
          permissions.OE_PURCHASE_ORDERS_MANAGE, 
          permissions.OE_GRV_PROCESS
        ];
        return oePermissions.some(permission => hasPermission(permission));
      }
      
      // Only include items that have href (are navigable)
      return child.href && child.icon;
    })
    .map(child => ({
      title: child.label,
      description: child.description || '',
      icon: child.icon!,
      href: child.href!,
      color: moduleColors[child.id || ''] || 'bg-gray-500',
      requiredPermission: child.requiredPermission,
      items: extractChildLabels(child)
    }));
}

/**
 * Extract child labels for the "Includes" section
 */
function extractChildLabels(item: NavItem): string[] {
  if (!item.children) return [];
  
  return item.children
    .filter(child => child.label && !child.children) // Only leaf nodes
    .map(child => child.label)
    .slice(0, 4); // Limit to 4 items for display
}

/**
 * Get maintenance modules (Setup & Configuration category)
 */
export function getMaintenanceModules(hasPermission: (permission: string) => boolean): DashboardModule[] {
  return getDashboardModules('setup-configuration', hasPermission);
}

/**
 * Get transaction modules (Operations & Transactions category)
 */
export function getTransactionModules(hasPermission: (permission: string) => boolean): DashboardModule[] {
  return getDashboardModules('operations-transactions', hasPermission);
}

/**
 * Get analytics modules (Analytics & Insights category)
 */
export function getAnalyticsModules(hasPermission: (permission: string) => boolean): DashboardModule[] {
  return getDashboardModules('analytics-insights', hasPermission);
}

/**
 * Get all accessible modules for a user across all categories
 */
export function getAllAccessibleModules(hasPermission: (permission: string) => boolean): {
  maintenance: DashboardModule[];
  transactions: DashboardModule[];
  analytics: DashboardModule[];
} {
  return {
    maintenance: getMaintenanceModules(hasPermission),
    transactions: getTransactionModules(hasPermission),
    analytics: getAnalyticsModules(hasPermission)
  };
}
