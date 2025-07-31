/**
 * Utility to verify that sidebar and dashboard show the same navigation items
 * based on user permissions.
 */

import { navItems } from '@/lib/navigationItems';
import { getDashboardModules } from '@/lib/dashboardUtils';

/**
 * Verify that sidebar navigation and dashboard modules are in sync
 */
export function verifyNavigationSync(hasPermission: (permission: string) => boolean) {
  const results = {
    maintenance: {
      sidebarCount: 0,
      dashboardCount: 0,
      sidebarItems: [] as string[],
      dashboardItems: [] as string[],
      inSync: false
    },
    transactions: {
      sidebarCount: 0,
      dashboardCount: 0,
      sidebarItems: [] as string[],
      dashboardItems: [] as string[],
      inSync: false
    },
    analytics: {
      sidebarCount: 0,
      dashboardCount: 0,
      sidebarItems: [] as string[],
      dashboardItems: [] as string[],
      inSync: false
    }
  };

  // Check Setup & Configuration (Maintenance)
  const setupCategory = navItems.find(item => item.id === 'setup-configuration');
  if (setupCategory?.children) {
    const visibleSidebarItems = setupCategory.children.filter(child => 
      child.href && child.icon && (!child.requiredPermission || hasPermission(child.requiredPermission))
    );
    results.maintenance.sidebarCount = visibleSidebarItems.length;
    results.maintenance.sidebarItems = visibleSidebarItems.map(item => item.label);
  }

  const maintenanceModules = getDashboardModules('setup-configuration', hasPermission);
  results.maintenance.dashboardCount = maintenanceModules.length;
  results.maintenance.dashboardItems = maintenanceModules.map(module => module.title);
  results.maintenance.inSync = results.maintenance.sidebarCount === results.maintenance.dashboardCount;

  // Check Operations & Transactions
  const transactionsCategory = navItems.find(item => item.id === 'operations-transactions');
  if (transactionsCategory?.children) {
    const visibleSidebarItems = transactionsCategory.children.filter(child => {
      if (!child.href || !child.icon) return false;
      
      // Special handling for Order Entry
      if (child.id === 'order-entry-transactions') {
        const oePermissions = ['oe:sales_orders_manage', 'oe:purchase_orders_manage', 'oe:grv_process'];
        return oePermissions.some(permission => hasPermission(permission));
      }
      
      return !child.requiredPermission || hasPermission(child.requiredPermission);
    });
    results.transactions.sidebarCount = visibleSidebarItems.length;
    results.transactions.sidebarItems = visibleSidebarItems.map(item => item.label);
  }

  const transactionModules = getDashboardModules('operations-transactions', hasPermission);
  results.transactions.dashboardCount = transactionModules.length;
  results.transactions.dashboardItems = transactionModules.map(module => module.title);
  results.transactions.inSync = results.transactions.sidebarCount === results.transactions.dashboardCount;

  // Check Analytics & Insights
  const analyticsCategory = navItems.find(item => item.id === 'analytics-insights');
  if (analyticsCategory?.children) {
    const visibleSidebarItems = analyticsCategory.children.filter(child => 
      child.href && child.icon && (!child.requiredPermission || hasPermission(child.requiredPermission))
    );
    results.analytics.sidebarCount = visibleSidebarItems.length;
    results.analytics.sidebarItems = visibleSidebarItems.map(item => item.label);
  }

  const analyticsModules = getDashboardModules('analytics-insights', hasPermission);
  results.analytics.dashboardCount = analyticsModules.length;
  results.analytics.dashboardItems = analyticsModules.map(module => module.title);
  results.analytics.inSync = results.analytics.sidebarCount === results.analytics.dashboardCount;

  const overallSync = results.maintenance.inSync && results.transactions.inSync && results.analytics.inSync;

  return {
    ...results,
    overallSync,
    summary: {
      totalSidebarItems: results.maintenance.sidebarCount + results.transactions.sidebarCount + results.analytics.sidebarCount,
      totalDashboardItems: results.maintenance.dashboardCount + results.transactions.dashboardCount + results.analytics.dashboardCount,
      message: overallSync ? "✅ Sidebar and Dashboard are synchronized!" : "❌ Sidebar and Dashboard are not synchronized"
    }
  };
}

/**
 * Log navigation sync results to console
 */
export function logNavigationSync(hasPermission: (permission: string) => boolean) {
  const results = verifyNavigationSync(hasPermission);
  
  console.group('🔍 Navigation Synchronization Check');
  
  console.log('📊 Summary:', results.summary.message);
  console.log(`Total Sidebar Items: ${results.summary.totalSidebarItems}`);
  console.log(`Total Dashboard Items: ${results.summary.totalDashboardItems}`);
  
  console.group('🔧 Maintenance Section');
  console.log(`Sidebar: ${results.maintenance.sidebarCount} items - ${results.maintenance.sidebarItems.join(', ')}`);
  console.log(`Dashboard: ${results.maintenance.dashboardCount} items - ${results.maintenance.dashboardItems.join(', ')}`);
  console.log(`In Sync: ${results.maintenance.inSync ? '✅' : '❌'}`);
  console.groupEnd();

  console.group('💼 Transactions Section');
  console.log(`Sidebar: ${results.transactions.sidebarCount} items - ${results.transactions.sidebarItems.join(', ')}`);
  console.log(`Dashboard: ${results.transactions.dashboardCount} items - ${results.transactions.dashboardItems.join(', ')}`);
  console.log(`In Sync: ${results.transactions.inSync ? '✅' : '❌'}`);
  console.groupEnd();

  console.group('📈 Analytics Section');
  console.log(`Sidebar: ${results.analytics.sidebarCount} items - ${results.analytics.sidebarItems.join(', ')}`);
  console.log(`Dashboard: ${results.analytics.dashboardCount} items - ${results.analytics.dashboardItems.join(', ')}`);
  console.log(`In Sync: ${results.analytics.inSync ? '✅' : '❌'}`);
  console.groupEnd();

  console.groupEnd();
  
  return results;
}
