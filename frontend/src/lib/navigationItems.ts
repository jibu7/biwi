import { 
  Cog, 
  FileText, 
  BarChart3, 
  Users, 
  Building, 
  Calendar,
  BookOpen,
  UserCheck,
  CreditCard,
  Package,
  ShoppingCart,
  DollarSign,
  Globe,
  Percent,
  GitBranch,
  Settings,
  Factory,
  Wrench,
  Calculator,
  LayoutDashboard,
  Building2,
} from 'lucide-react';
import * as permissions from './permissions';

export interface NavItem {
  label: string;
  href?: string;
  icon?: any;
  requiredPermission?: string;
  children?: NavItem[];
}

export const navItems: NavItem[] = [
  {
    label: "Maintenance",
    icon: Cog,
    children: [
      {
        label: "System & Company",
        href: "/maintenance/system",
        icon: Building,
        requiredPermission: permissions.COMPANY_READ,
        children: [
          { 
            label: "Company Details", 
            href: "/maintenance/system/company", 
            requiredPermission: permissions.COMPANY_READ 
          },
          { 
            label: "Users", 
            href: "/maintenance/system/users", 
            requiredPermission: permissions.USER_READ 
          },
          { 
            label: "Roles", 
            href: "/maintenance/system/roles", 
            requiredPermission: permissions.ROLE_READ 
          },
          { 
            label: "Accounting Periods", 
            href: "/maintenance/system/accounting-periods", 
            requiredPermission: permissions.ACCOUNTING_PERIOD_MANAGE 
          },
        ]
      },
      {
        label: "GL Setup",
        href: "/maintenance/gl",
        icon: BookOpen,
        requiredPermission: permissions.GL_SETUP_MANAGE,
        children: [
          { 
            label: "Chart of Accounts", 
            href: "/maintenance/gl/accounts", 
            requiredPermission: permissions.GL_SETUP_MANAGE 
          },
          { 
            label: "Transaction Types", 
            href: "/maintenance/gl/transaction-types", 
            requiredPermission: permissions.GL_SETUP_MANAGE 
          },
          { 
            label: "Defaults", 
            href: "/maintenance/gl/defaults", 
            requiredPermission: permissions.GL_SETUP_MANAGE 
          },
        ]
      },
      {
        label: "Accounts Receivable",
        href: "/maintenance/ar",
        icon: UserCheck,
        requiredPermission: permissions.AR_SETUP_MANAGE,
        children: [
          { 
            label: "Customers", 
            href: "/maintenance/ar/customers", 
            requiredPermission: permissions.AR_SETUP_MANAGE 
          },
          { 
            label: "Sales Representatives", 
            href: "/maintenance/ar/sales-reps", 
            requiredPermission: permissions.AR_SETUP_MANAGE 
          },
          { 
            label: "Transaction Types", 
            href: "/maintenance/ar/transaction-types", 
            requiredPermission: permissions.AR_SETUP_MANAGE 
          },
          { 
            label: "Defaults", 
            href: "/maintenance/ar/defaults", 
            requiredPermission: permissions.AR_SETUP_MANAGE 
          }
        ]
      },
      {
        label: "AP Setup",
        href: "/maintenance/ap",
        icon: CreditCard,
        requiredPermission: permissions.AP_SETUP_MANAGE,
        children: [
          { 
            label: "Suppliers", 
            href: "/maintenance/ap/suppliers", 
            requiredPermission: permissions.AP_SETUP_MANAGE 
          },
          { 
            label: "Transaction Types", 
            href: "/maintenance/ap/transaction-types", 
            requiredPermission: permissions.AP_SETUP_MANAGE 
          },
          { 
            label: "Defaults", 
            href: "/maintenance/ap/defaults", 
            requiredPermission: permissions.AP_SETUP_MANAGE 
          },
        ]
      },
      {
        label: "Inventory Setup",
        href: "/maintenance/inventory",
        icon: Package,
        requiredPermission: permissions.INV_SETUP_MANAGE,
        children: [
          { 
            label: "Items", 
            href: "/maintenance/inventory/items", 
            requiredPermission: permissions.INV_SETUP_MANAGE 
          },
          { 
            label: "Warehouses", 
            href: "/maintenance/inventory/warehouses", 
            requiredPermission: permissions.INV_SETUP_MANAGE 
          },
          { 
            label: "Units of Measure", 
            href: "/maintenance/inventory/units-of-measure", 
            requiredPermission: permissions.INV_SETUP_MANAGE 
          },
          { 
            label: "Transaction Types", 
            href: "/maintenance/inventory/transaction-types", 
            requiredPermission: permissions.INV_SETUP_MANAGE 
          },
          { 
            label: "Barcodes", 
            href: "/maintenance/inventory/barcodes", 
            requiredPermission: permissions.INV_SETUP_MANAGE 
          },
          { 
            label: "Defaults", 
            href: "/maintenance/inventory/defaults", 
            requiredPermission: permissions.INV_SETUP_MANAGE 
          },
        ]
      },
      {
        label: "OE Setup",
        href: "/maintenance/oe",
        icon: ShoppingCart,
        requiredPermission: permissions.OE_SETUP_MANAGE,
        children: [
          { 
            label: "Order Defaults", 
            href: "/maintenance/oe/defaults", 
            requiredPermission: permissions.OE_SETUP_MANAGE 
          },
          { 
            label: "Sales Order Types", 
            href: "/maintenance/oe/sales-order-types", 
            requiredPermission: permissions.OE_SETUP_MANAGE 
          },
          { 
            label: "Purchase Order Types", 
            href: "/maintenance/oe/purchase-order-types", 
            requiredPermission: permissions.OE_SETUP_MANAGE 
          }
        ]
      },
      {
        label: "BOM Setup",
        href: "/maintenance/bom",
        icon: Wrench,
        requiredPermission: permissions.BOM_SETUP_MANAGE,
        children: [
          { 
            label: "Bill of Materials", 
            href: "/maintenance/bom/bills", 
            requiredPermission: permissions.BOM_SETUP_MANAGE 
          },
          { 
            label: "Defaults", 
            href: "/maintenance/bom/defaults", 
            requiredPermission: permissions.BOM_SETUP_MANAGE 
          }
        ]
      },
      {
        label: "POS Setup",
        href: "/maintenance/pos",
        requiredPermission: permissions.POS_SETUP_MANAGE,
        children: [
          { 
            label: "Tills", 
            href: "/maintenance/pos/tills", 
            requiredPermission: permissions.POS_TILL_MANAGE 
          },
          { 
            label: "Transaction Types", 
            href: "/maintenance/pos/transaction-types", 
            requiredPermission: permissions.POS_SETUP_MANAGE 
          },
          { 
            label: "Defaults", 
            href: "/maintenance/pos/defaults", 
            requiredPermission: permissions.POS_SETUP_MANAGE 
          },
        ]
      },
      {
        label: "Common",
        href: "/maintenance/common",
        icon: Globe,
        children: [
          { 
            label: "Currencies", 
            href: "/maintenance/system/currencies", 
            requiredPermission: permissions.COMMON_SETUP_CURRENCIES 
          },
          { 
            label: "Tax Types", 
            href: "/maintenance/system/tax-types", 
            requiredPermission: permissions.COMMON_SETUP_TAXES 
          },
          { 
            label: "Branches", 
            href: "/maintenance/system/branches", 
            requiredPermission: permissions.COMMON_SETUP_BRANCHES 
          }
        ]
      }
    ]
  },
  {
    label: "Transactions",
    icon: FileText,
    children: [
      {
        label: "General Ledger",
        icon: BookOpen,
        href: "/transactions/gl",
        requiredPermission: permissions.GL_JOURNAL_POST,
        children: [
          { 
            label: "Journal Entry", 
            href: "/transactions/gl/journal-entry/new", 
            requiredPermission: permissions.GL_JOURNAL_POST 
          },
          { 
            label: "View Journal Entries", 
            href: "/transactions/gl/journal-entries", 
            requiredPermission: permissions.GL_REPORTS_VIEW 
          },
        ]
      },
      {
        label: "Accounts Receivable",
        icon: UserCheck,
        href: "/transactions/ar",
        requiredPermission: permissions.AR_TRANSACTIONS_POST,
        children: [
          { 
            label: "Invoices", 
            href: "/transactions/ar/invoices", 
            requiredPermission: permissions.AR_TRANSACTIONS_POST 
          },
          { 
            label: "Credit Notes", 
            href: "/transactions/ar/credit-notes", 
            requiredPermission: permissions.AR_TRANSACTIONS_POST 
          },
          { 
            label: "Receipts", 
            href: "/transactions/ar/receipts", 
            requiredPermission: permissions.AR_TRANSACTIONS_POST 
          },
          { 
            label: "Allocations", 
            href: "/transactions/ar/allocations", 
            requiredPermission: permissions.AR_TRANSACTIONS_POST 
          },
          { 
            label: "All Transactions", 
            href: "/transactions/ar/list", 
            requiredPermission: permissions.AR_TRANSACTIONS_POST 
          }
        ]
      },
      {
        label: "Accounts Payable",
        href: "/transactions/ap",
        requiredPermission: permissions.AP_TRANSACTIONS_POST,
        children: [
          { 
            label: "New Supplier Invoice", 
            href: "/transactions/ap/invoices/new", 
            requiredPermission: permissions.AP_TRANSACTIONS_POST 
          },
          { 
            label: "New Debit Note (Return)", 
            href: "/transactions/ap/debit-notes/new", 
            requiredPermission: permissions.AP_TRANSACTIONS_POST 
          },
          { 
            label: "New Payment", 
            href: "/transactions/ap/payments/new", 
            requiredPermission: permissions.AP_TRANSACTIONS_POST 
          },
          { 
            label: "Allocate Transactions", 
            href: "/transactions/ap/allocations/new", 
            requiredPermission: permissions.AP_TRANSACTIONS_POST 
          },
          { 
            label: "View Transactions", 
            href: "/transactions/ap/list", 
            requiredPermission: permissions.AP_REPORTS_VIEW 
          },
        ]
      },
      {
        label: "Inventory",
        icon: Package,
        href: "/transactions/inventory",
        requiredPermission: permissions.INV_TRANSACTIONS_ADJUST,
        children: [
          { 
            label: "Adjustments", 
            href: "/transactions/inventory/adjustments", 
            requiredPermission: permissions.INV_TRANSACTIONS_ADJUST 
          },
          { 
            label: "Warehouse Transfers", 
            href: "/transactions/inventory/transfers/new", 
            requiredPermission: permissions.INV_TRANSACTIONS_ADJUST 
          },
          { 
            label: "Inventory Counts", 
            href: "/transactions/inventory/counts", 
            requiredPermission: permissions.INV_TRANSACTIONS_ADJUST 
          },
        ]
      },
      {
        label: "Order Entry",
        icon: ShoppingCart,
        children: [
          {
            label: "Sales Orders",
            children: [
              { 
                label: "New Sales Order", 
                href: "/transactions/oe/sales-orders/new", 
                requiredPermission: permissions.OE_SALES_ORDERS_MANAGE 
              },
              { 
                label: "View Sales Orders", 
                href: "/transactions/oe/sales-orders", 
                requiredPermission: permissions.OE_SALES_ORDERS_MANAGE 
              }
            ]
          },
          {
            label: "Purchase Orders",
            children: [
              { 
                label: "New Purchase Order", 
                href: "/transactions/oe/purchase-orders/new", 
                requiredPermission: permissions.OE_PURCHASE_ORDERS_MANAGE 
              },
              { 
                label: "View Purchase Orders", 
                href: "/transactions/oe/purchase-orders", 
                requiredPermission: permissions.OE_PURCHASE_ORDERS_MANAGE 
              }
            ]
          },
          {
            label: "Goods Received",
            children: [
              { 
                label: "New Goods Received Voucher", 
                href: "/transactions/oe/grvs/new", 
                requiredPermission: permissions.OE_GRV_PROCESS 
              },
              { 
                label: "View GRVs", 
                href: "/transactions/oe/grvs", 
                requiredPermission: permissions.OE_GRV_PROCESS 
              }
            ]
          }
        ]
      },
      {
        label: "BOM",
        href: "/transactions/bom",
        icon: Factory,
        requiredPermission: permissions.BOM_MANUFACTURING_PROCESS,
        children: [
          { 
            label: "New Manufacturing Order", 
            href: "/transactions/bom/manufacturing-orders/new", 
            requiredPermission: permissions.BOM_MANUFACTURING_PROCESS 
          },
          { 
            label: "View Manufacturing Orders", 
            href: "/transactions/bom/manufacturing-orders", 
            requiredPermission: permissions.BOM_MANUFACTURING_PROCESS 
          }
        ]
      },
      {
        label: "Point of Sale",
        href: "/transactions/pos",
        requiredPermission: permissions.POS_SALES_PROCESS,
        children: [
          { 
            label: "POS Terminal", 
            href: "/transactions/pos/terminal", 
            requiredPermission: permissions.POS_SALES_PROCESS 
          },
          { 
            label: "Session Management", 
            href: "/transactions/pos/sessions", 
            requiredPermission: permissions.POS_SESSION_OPEN 
          },
          { 
            label: "Cash Management", 
            href: "/transactions/pos/cash", 
            requiredPermission: permissions.POS_CASH_MANAGE 
          },
          { 
            label: "Transaction History", 
            href: "/transactions/pos/history", 
            requiredPermission: permissions.POS_SALES_PROCESS 
          },
        ]
      }
    ]
  },
  {
    label: "Reports",
    icon: BarChart3,
    children: [
      {
        label: "Financial Reports",
        href: "/reports/financial",
        requiredPermission: permissions.REPORTING_FINANCIAL_STATEMENTS,
        children: [
          { 
            label: "Balance Sheet", 
            href: "/reports/financial/balance-sheet", 
            requiredPermission: permissions.REPORTING_FINANCIAL_STATEMENTS 
          },
          { 
            label: "Income Statement", 
            href: "/reports/financial/income-statement", 
            requiredPermission: permissions.REPORTING_FINANCIAL_STATEMENTS 
          },
          { 
            label: "Cash Flow Statement", 
            href: "/reports/financial/cash-flow", 
            requiredPermission: permissions.REPORTING_FINANCIAL_STATEMENTS 
          },
          { 
            label: "Trial Balance", 
            href: "/reports/gl/trial-balance", 
            requiredPermission: permissions.GL_REPORTS_VIEW 
          },
          { 
            label: "Account Transactions", 
            href: "/reports/gl/account-transactions", 
            requiredPermission: permissions.GL_REPORTS_VIEW 
          },
        ]
      },
      {
        label: "GL Advanced Reports",
        href: "/reports/gl/advanced",
        requiredPermission: permissions.REPORTING_ADVANCED_GL,
        children: [
          { 
            label: "Chart of Accounts", 
            href: "/reports/gl/chart-of-accounts", 
            requiredPermission: permissions.REPORTING_ADVANCED_GL 
          },
          { 
            label: "Cashbook", 
            href: "/reports/gl/cashbook", 
            requiredPermission: permissions.REPORTING_ADVANCED_GL 
          },
          { 
            label: "Bank Reconciliation", 
            href: "/reports/gl/bank-reconciliation", 
            requiredPermission: permissions.REPORTING_BANK_RECONCILIATION 
          }
        ]
      },
      {
        label: "AR Advanced Reports",
        href: "/reports/ar/advanced",
        requiredPermission: permissions.REPORTING_ADVANCED_AR,
        children: [
          { 
            label: "Detailed Age Analysis", 
            href: "/reports/ar/detailed-age-analysis", 
            requiredPermission: permissions.REPORTING_ADVANCED_AR 
          },
          { 
            label: "Customer Analysis", 
            href: "/reports/ar/customer-analysis", 
            requiredPermission: permissions.REPORTING_ADVANCED_AR 
          },
          { 
            label: "Customer Aging", 
            href: "/reports/ar/aging", 
            requiredPermission: permissions.AR_REPORTS_VIEW 
          },
          { 
            label: "Customer Statement", 
            href: "/reports/ar/statement", 
            requiredPermission: permissions.AR_REPORTS_VIEW 
          },
          { 
            label: "Customer Listing", 
            href: "/reports/ar/customer-listing", 
            requiredPermission: permissions.AR_REPORTS_VIEW 
          }
        ]
      },
      {
        label: "AP Advanced Reports",
        href: "/reports/ap/advanced",
        requiredPermission: permissions.REPORTING_ADVANCED_AP,
        children: [
          { 
            label: "Detailed Age Analysis", 
            href: "/reports/ap/detailed-age-analysis", 
            requiredPermission: permissions.REPORTING_ADVANCED_AP 
          },
          { 
            label: "Supplier Analysis", 
            href: "/reports/ap/supplier-analysis", 
            requiredPermission: permissions.REPORTING_ADVANCED_AP 
          },
          { 
            label: "Age Analysis", 
            href: "/reports/ap/age-analysis", 
            requiredPermission: permissions.AP_REPORTS_VIEW 
          },
          { 
            label: "Supplier Listing", 
            href: "/reports/ap/supplier-listing", 
            requiredPermission: permissions.AP_REPORTS_VIEW 
          },
          { 
            label: "Supplier Statement", 
            href: "/reports/ap/statement", 
            requiredPermission: permissions.AP_REPORTS_VIEW 
          },
          { 
            label: "Allocation Report", 
            href: "/reports/ap/allocation-report", 
            requiredPermission: permissions.AP_REPORTS_VIEW 
          },
        ]
      },
      {
        label: "Inventory Reports",
        href: "/reports/inventory",
        requiredPermission: permissions.INV_REPORTS_VIEW,
        children: [
          { 
            label: "Item Listing", 
            href: "/reports/inventory/item-listing", 
            requiredPermission: permissions.INV_REPORTS_VIEW 
          },
          { 
            label: "Stock Quantity", 
            href: "/reports/inventory/stock-quantity", 
            requiredPermission: permissions.INV_REPORTS_VIEW 
          },
          { 
            label: "Movement Report", 
            href: "/reports/inventory/movement", 
            requiredPermission: permissions.INV_REPORTS_VIEW 
          },
          { 
            label: "Valuation Report", 
            href: "/reports/inventory/valuation", 
            requiredPermission: permissions.INV_REPORTS_VIEW 
          },
        ]
      },
      {
        label: "OE Reports",
        href: "/reports/oe",
        requiredPermission: permissions.OE_REPORTS_VIEW,
        children: [
          { 
            label: "Sales Order Listing", 
            href: "/reports/oe/sales-orders", 
            requiredPermission: permissions.OE_REPORTS_VIEW 
          },
          { 
            label: "Purchase Order Listing", 
            href: "/reports/oe/purchase-orders", 
            requiredPermission: permissions.OE_REPORTS_VIEW 
          },
          { 
            label: "GRV Listing", 
            href: "/reports/oe/grvs", 
            requiredPermission: permissions.OE_REPORTS_VIEW 
          }
        ]
      },
      {
        label: "BOM Reports",
        href: "/reports/bom",
        requiredPermission: permissions.BOM_REPORTS_VIEW,
        children: [
          { 
            label: "Material Requirements", 
            href: "/reports/bom/mrp", 
            requiredPermission: permissions.BOM_REPORTS_VIEW 
          },
          { 
            label: "Manufacturing Process", 
            href: "/reports/bom/manufacturing-process", 
            requiredPermission: permissions.BOM_REPORTS_VIEW 
          }
        ]
      },
      {
        label: "POS Reports",
        href: "/reports/pos",
        requiredPermission: permissions.POS_REPORTS_VIEW,
        children: [
          { 
            label: "Cashier Sales Report", 
            href: "/reports/pos/cashier-sales", 
            requiredPermission: permissions.POS_REPORTS_VIEW 
          },
          { 
            label: "Inventory Sales Report", 
            href: "/reports/pos/inventory-sales", 
            requiredPermission: permissions.POS_REPORTS_VIEW 
          },
          { 
            label: "Session Summary", 
            href: "/reports/pos/session-summary", 
            requiredPermission: permissions.POS_REPORTS_VIEW 
          },
        ]
      },
      {
        label: "Tax Reports",
        icon: Calculator,
        children: [
          { 
            label: "Tax Summary", 
            href: "/reports/tax/summary", 
            requiredPermission: permissions.GL_REPORTS_VIEW 
          },
          { 
            label: "Tax Details by Invoice", 
            href: "/reports/tax/details", 
            requiredPermission: permissions.GL_REPORTS_VIEW 
          }
        ]
      },
      {
        label: "Report Management",
        href: "/reports/management",
        requiredPermission: permissions.REPORTING_TEMPLATES_MANAGE,
        children: [
          { 
            label: "Report Templates", 
            href: "/reports/management/templates", 
            requiredPermission: permissions.REPORTING_TEMPLATES_MANAGE 
          },
          { 
            label: "Scheduled Reports", 
            href: "/reports/management/scheduled", 
            requiredPermission: permissions.REPORTING_TEMPLATES_MANAGE 
          }
        ]
      }
    ]
  }
];

// Add to navigationItems.ts - This would be a separate navigation for platform admins
export const platformNavItems = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/platform/dashboard",
    requiredPermission: permissions.PLATFORM_VIEW_METRICS,
  },
  {
    label: "Companies",
    icon: Building2,
    href: "/platform/companies",
    requiredPermission: permissions.PLATFORM_MANAGE_COMPANIES,
    children: [
      { label: "All Companies", href: "/platform/companies", requiredPermission: permissions.PLATFORM_MANAGE_COMPANIES },
      { label: "Subscriptions", href: "/platform/subscriptions", requiredPermission: permissions.PLATFORM_MANAGE_BILLING },
      { label: "Usage Reports", href: "/platform/usage", requiredPermission: permissions.PLATFORM_VIEW_METRICS },
    ],
  },
  {
    label: "Billing",
    icon: CreditCard,
    href: "/platform/billing",
    requiredPermission: permissions.PLATFORM_MANAGE_BILLING,
    children: [
      { label: "Plans", href: "/platform/billing/plans", requiredPermission: permissions.PLATFORM_MANAGE_BILLING },
      { label: "Invoices", href: "/platform/billing/invoices", requiredPermission: permissions.PLATFORM_MANAGE_BILLING },
      { label: "Revenue Reports", href: "/platform/billing/revenue", requiredPermission: permissions.PLATFORM_VIEW_METRICS },
    ],
  },
  {
    label: "System",
    icon: Settings,
    href: "/platform/system",
    requiredPermission: permissions.PLATFORM_SYSTEM_CONFIG,
    children: [
      { label: "Configuration", href: "/platform/system/config", requiredPermission: permissions.PLATFORM_SYSTEM_CONFIG },
      { label: "Feature Flags", href: "/platform/system/features", requiredPermission: permissions.PLATFORM_SYSTEM_CONFIG },
      { label: "Health Monitor", href: "/platform/system/health", requiredPermission: permissions.PLATFORM_VIEW_METRICS },
      { label: "Audit Logs", href: "/platform/system/audit", requiredPermission: permissions.PLATFORM_VIEW_AUDIT },
    ],
  },
  {
    label: "Platform Admins",
    icon: Users,
    href: "/platform/admins",
    requiredPermission: permissions.PLATFORM_SUPER_ADMIN,
  },
];
