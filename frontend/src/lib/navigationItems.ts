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
  MessageSquare,
} from 'lucide-react';
import * as permissions from './permissions';

export interface QuickAction {
  label: string;
  icon: any;
  href: string;
  requiredPermission?: string;
  category: string;
  keywords?: string[];
}

export interface NavItem {
  id?: string; // Made optional for backward compatibility
  label: string;
  href?: string;
  icon?: any;
  requiredPermission?: string;
  children?: NavItem[];
  // Modern SaaS enhancements
  badge?: {
    text: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success';
    pulse?: boolean;
  };
  description?: string;
  searchKeywords?: string[];
  quickActions?: QuickAction[];
  meta?: {
    category: 'setup' | 'operations' | 'analytics' | 'administration';
    priority: 'high' | 'medium' | 'low';
    frequency: 'daily' | 'weekly' | 'monthly' | 'occasional';
  };
}

export const navItems: NavItem[] = [
  {
    id: "setup-configuration",
    label: "Setup & Configuration",
    icon: Cog,
    description: "Configure your system settings and master data",
    searchKeywords: ["setup", "configuration", "maintenance", "settings"],
    meta: {
      category: 'setup',
      priority: 'high',
      frequency: 'occasional'
    },
    children: [
      {
        id: "organization-setup",
        label: "Organization",
        href: "/maintenance/system",
        icon: Building,
        requiredPermission: permissions.COMPANY_READ,
        description: "Manage company details, users, and system settings",
        searchKeywords: ["company", "organization", "users", "system"],
        quickActions: [
          { 
            label: "Add New User", 
            icon: Users, 
            href: "/maintenance/system/users/new", 
            requiredPermission: permissions.USER_CREATE,
            category: "User Management",
            keywords: ["user", "add", "create", "team"]
          },
          { 
            label: "Manage Roles", 
            icon: UserCheck, 
            href: "/maintenance/system/roles", 
            requiredPermission: permissions.ROLE_READ,
            category: "Access Control",
            keywords: ["roles", "permissions", "access"]
          },
          { 
            label: "Company Settings", 
            icon: Settings, 
            href: "/maintenance/system/company/edit", 
            requiredPermission: permissions.COMPANY_UPDATE,
            category: "Configuration",
            keywords: ["company", "settings", "details"]
          }
        ],
        children: [
          { 
            id: "company-details",
            label: "Company Details", 
            href: "/maintenance/system/company", 
            requiredPermission: permissions.COMPANY_READ,
            description: "View and edit company information",
            searchKeywords: ["company", "details", "information", "profile"]
          },
          { 
            id: "users-management",
            label: "Users", 
            href: "/maintenance/system/users", 
            requiredPermission: permissions.USER_READ,
            description: "Manage user accounts and access",
            searchKeywords: ["users", "accounts", "team", "staff"],
            badge: { text: "Active", variant: "success" }
          },
          { 
            id: "roles-permissions",
            label: "Roles & Permissions", 
            href: "/maintenance/system/roles", 
            requiredPermission: permissions.ROLE_READ,
            description: "Configure user roles and permissions",
            searchKeywords: ["roles", "permissions", "access", "security"]
          },
          { 
            id: "accounting-periods",
            label: "Accounting Periods", 
            href: "/maintenance/system/accounting-periods", 
            requiredPermission: permissions.ACCOUNTING_PERIOD_MANAGE,
            description: "Set up and manage accounting periods",
            searchKeywords: ["accounting", "periods", "fiscal", "year"]
          },
        ]
      },
      {
        id: "financial-setup",
        label: "Financial Setup",
        href: "/maintenance/gl",
        icon: BookOpen,
        requiredPermission: permissions.GL_SETUP_MANAGE,
        description: "Configure chart of accounts and financial settings",
        searchKeywords: ["gl", "general ledger", "accounts", "financial", "chart"],
        quickActions: [
          { 
            label: "Add Account", 
            icon: DollarSign, 
            href: "/maintenance/gl/accounts/new", 
            requiredPermission: permissions.GL_SETUP_MANAGE,
            category: "Accounts",
            keywords: ["account", "add", "create", "gl"]
          },
          { 
            label: "Import COA", 
            icon: FileText, 
            href: "/maintenance/gl/accounts/import", 
            requiredPermission: permissions.GL_SETUP_MANAGE,
            category: "Setup",
            keywords: ["import", "chart", "accounts", "coa"]
          }
        ],
        children: [
          { 
            id: "chart-of-accounts",
            label: "Chart of Accounts", 
            href: "/maintenance/gl/accounts", 
            requiredPermission: permissions.GL_SETUP_MANAGE,
            description: "Manage your general ledger account structure",
            searchKeywords: ["chart", "accounts", "gl", "ledger", "structure"]
          },
          { 
            id: "transaction-types-gl",
            label: "Transaction Types", 
            href: "/maintenance/gl/transaction-types", 
            requiredPermission: permissions.GL_SETUP_MANAGE,
            description: "Configure GL transaction types",
            searchKeywords: ["transaction", "types", "gl", "journal"]
          },
          { 
            id: "gl-defaults",
            label: "GL Defaults", 
            href: "/maintenance/gl/defaults", 
            requiredPermission: permissions.GL_SETUP_MANAGE,
            description: "Set default GL configurations",
            searchKeywords: ["defaults", "gl", "configuration", "settings"]
          },
        ]
      },
      {
        id: "accounts-receivable-setup",
        label: "Accounts Receivable",
        href: "/maintenance/ar",
        icon: UserCheck,
        requiredPermission: permissions.AR_SETUP_MANAGE,
        description: "Configure customer accounts and AR settings",
        searchKeywords: ["ar", "accounts receivable", "customers", "sales", "invoicing"],
        quickActions: [
          { 
            label: "Add Customer", 
            icon: Users, 
            href: "/maintenance/ar/customers/new", 
            requiredPermission: permissions.AR_SETUP_MANAGE,
            category: "Customer Management",
            keywords: ["customer", "add", "create", "new"]
          },
          { 
            label: "Sales Rep Setup", 
            icon: UserCheck, 
            href: "/maintenance/ar/sales-reps/new", 
            requiredPermission: permissions.AR_SETUP_MANAGE,
            category: "Sales Management",
            keywords: ["sales", "rep", "representative", "add"]
          },
          { 
            label: "AR Settings", 
            icon: Settings, 
            href: "/maintenance/ar/defaults", 
            requiredPermission: permissions.AR_SETUP_MANAGE,
            category: "Configuration",
            keywords: ["ar", "defaults", "settings", "configuration"]
          }
        ],
        meta: {
          category: 'setup',
          priority: 'high',
          frequency: 'weekly'
        },
        children: [
          { 
            id: "ar-customers",
            label: "Customers", 
            href: "/maintenance/ar/customers", 
            requiredPermission: permissions.AR_SETUP_MANAGE,
            description: "Manage customer information and accounts",
            searchKeywords: ["customers", "clients", "accounts", "ar"],
            badge: { text: "Core", variant: "default" }
          },
          { 
            id: "ar-sales-reps",
            label: "Sales Representatives", 
            href: "/maintenance/ar/sales-reps", 
            requiredPermission: permissions.AR_SETUP_MANAGE,
            description: "Configure sales representatives and territories",
            searchKeywords: ["sales", "representatives", "reps", "territory"]
          },
          { 
            id: "ar-transaction-types",
            label: "Transaction Types", 
            href: "/maintenance/ar/transaction-types", 
            requiredPermission: permissions.AR_SETUP_MANAGE,
            description: "Set up AR transaction types and workflows",
            searchKeywords: ["transaction", "types", "ar", "invoices"]
          },
          { 
            id: "ar-defaults",
            label: "Defaults", 
            href: "/maintenance/ar/defaults", 
            requiredPermission: permissions.AR_SETUP_MANAGE,
            description: "Configure AR default settings and parameters",
            searchKeywords: ["defaults", "settings", "ar", "configuration"]
          }
        ]
      },
      {
        id: "accounts-payable-setup",
        label: "AP Setup",
        href: "/maintenance/ap",
        icon: CreditCard,
        requiredPermission: permissions.AP_SETUP_MANAGE,
        description: "Configure supplier accounts and AP settings",
        searchKeywords: ["ap", "accounts payable", "suppliers", "vendors", "purchasing"],
        quickActions: [
          { 
            label: "Add Supplier", 
            icon: Building, 
            href: "/maintenance/ap/suppliers/new", 
            requiredPermission: permissions.AP_SETUP_MANAGE,
            category: "Supplier Management",
            keywords: ["supplier", "vendor", "add", "create", "new"]
          },
          { 
            label: "AP Settings", 
            icon: Settings, 
            href: "/maintenance/ap/defaults", 
            requiredPermission: permissions.AP_SETUP_MANAGE,
            category: "Configuration",
            keywords: ["ap", "defaults", "settings", "configuration"]
          },
          { 
            label: "Payment Terms", 
            icon: Calendar, 
            href: "/maintenance/ap/payment-terms", 
            requiredPermission: permissions.AP_SETUP_MANAGE,
            category: "Payment Management",
            keywords: ["payment", "terms", "due", "dates"]
          }
        ],
        meta: {
          category: 'setup',
          priority: 'high',
          frequency: 'weekly'
        },
        children: [
          { 
            id: "ap-suppliers",
            label: "Suppliers", 
            href: "/maintenance/ap/suppliers", 
            requiredPermission: permissions.AP_SETUP_MANAGE,
            description: "Manage supplier information and accounts",
            searchKeywords: ["suppliers", "vendors", "accounts", "ap"],
            badge: { text: "Core", variant: "default" }
          },
          { 
            id: "ap-transaction-types",
            label: "Transaction Types", 
            href: "/maintenance/ap/transaction-types", 
            requiredPermission: permissions.AP_SETUP_MANAGE,
            description: "Set up AP transaction types and workflows",
            searchKeywords: ["transaction", "types", "ap", "invoices", "payments"]
          },
          { 
            id: "ap-defaults",
            label: "Defaults", 
            href: "/maintenance/ap/defaults", 
            requiredPermission: permissions.AP_SETUP_MANAGE,
            description: "Configure AP default settings and parameters",
            searchKeywords: ["defaults", "settings", "ap", "configuration"]
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
    id: "operations-transactions",
    label: "Operations & Transactions",
    icon: FileText,
    description: "Process daily business transactions and operations",
    searchKeywords: ["transactions", "operations", "daily", "business", "process"],
    meta: {
      category: 'operations',
      priority: 'high',
      frequency: 'daily'
    },
    children: [
      {
        id: "general-ledger-transactions",
        label: "General Ledger",
        icon: BookOpen,
        href: "/transactions/gl",
        requiredPermission: permissions.GL_JOURNAL_POST,
        description: "Record journal entries and GL transactions",
        searchKeywords: ["journal", "entries", "gl", "general", "ledger"],
        badge: { text: "Daily", variant: "default" },
        quickActions: [
          { 
            label: "New Journal Entry", 
            icon: FileText, 
            href: "/transactions/gl/journal-entry/new", 
            requiredPermission: permissions.GL_JOURNAL_POST,
            category: "Quick Actions",
            keywords: ["journal", "entry", "new", "create"]
          },
          { 
            label: "Recurring Entries", 
            icon: Calendar, 
            href: "/transactions/gl/recurring", 
            requiredPermission: permissions.GL_JOURNAL_POST,
            category: "Automation",
            keywords: ["recurring", "automatic", "schedule"]
          }
        ],
        children: [
          { 
            id: "new-journal-entry",
            label: "New Journal Entry", 
            href: "/transactions/gl/journal-entry/new", 
            requiredPermission: permissions.GL_JOURNAL_POST,
            description: "Create a new journal entry",
            searchKeywords: ["new", "journal", "entry", "create"]
          },
          { 
            id: "journal-entries-list",
            label: "View Journal Entries", 
            href: "/transactions/gl/journal-entries", 
            requiredPermission: permissions.GL_REPORTS_VIEW,
            description: "Browse and search journal entries",
            searchKeywords: ["view", "journal", "entries", "list", "search"]
          },
        ]
      },
      {
        id: "accounts-receivable-transactions",
        label: "Accounts Receivable",
        icon: UserCheck,
        href: "/transactions/ar",
        requiredPermission: permissions.AR_TRANSACTIONS_POST,
        description: "Process customer invoices, receipts, and credit notes",
        searchKeywords: ["ar", "customer", "invoice", "receipt", "credit note"],
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
        id: "accounts-payable-transactions",
        label: "Accounts Payable",
        href: "/transactions/ap",
        requiredPermission: permissions.AP_TRANSACTIONS_POST,
        description: "Manage supplier invoices, payments, and returns",
        searchKeywords: ["ap", "supplier", "invoice", "payment", "debit note"],
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
        id: "inventory-transactions",
        label: "Inventory",
        icon: Package,
        href: "/transactions/inventory",
        requiredPermission: permissions.INV_TRANSACTIONS_ADJUST,
        description: "Process inventory adjustments and transfers",
        searchKeywords: ["inventory", "stock", "adjustment", "transfer"],
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
        id: "order-entry-transactions",
        label: "Order Entry", 
        href: "/transactions/oe",
        icon: ShoppingCart,
        description: "Manage sales orders, purchase orders, and goods receipts",
        searchKeywords: ["sales", "purchase", "orders", "oe", "grv"],
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
        id: "bom-transactions",
        label: "BOM",
        href: "/transactions/bom",
        icon: Factory,
        requiredPermission: permissions.BOM_MANUFACTURING_PROCESS,
        description: "Manufacturing orders and bill of materials processing",
        searchKeywords: ["bom", "manufacturing", "orders", "production"],
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
        id: "pos-transactions",
        label: "Point of Sale",
        href: "/transactions/pos",
        requiredPermission: permissions.POS_SALES_PROCESS,
        description: "Process point of sale transactions and manage cash",
        searchKeywords: ["pos", "point of sale", "cash", "terminal"],
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
    id: "analytics-insights",
    label: "Analytics & Insights", 
    icon: BarChart3,
    description: "Business intelligence, reports, and analytics",
    searchKeywords: ["reports", "analytics", "insights", "business", "intelligence"],
    meta: {
      category: 'analytics',
      priority: 'medium',
      frequency: 'weekly'
    },
    children: [
      {
        id: "executive-dashboard",
        label: "Executive Dashboard",
        href: "/analytics/dashboard/executive",
        icon: LayoutDashboard,
        description: "High-level business metrics and KPIs",
        searchKeywords: ["dashboard", "executive", "kpi", "metrics", "overview"],
        badge: { text: "Live", variant: "success", pulse: true },
        quickActions: [
          { 
            label: "Export Dashboard", 
            icon: FileText, 
            href: "/analytics/dashboard/executive/export", 
            category: "Export",
            keywords: ["export", "pdf", "dashboard", "report"]
          },
          { 
            label: "Schedule Report", 
            icon: Calendar, 
            href: "/analytics/dashboard/executive/schedule", 
            category: "Automation",
            keywords: ["schedule", "automatic", "email", "report"]
          }
        ]
      },
      {
        id: "financial-reporting",
        label: "Reports",
        href: "/reports",
        icon: FileText,
        description: "Core reports and statements",
        searchKeywords: ["reports", "financial", "statements", "balance", "income", "cash flow", "custom"],
        badge: { text: "Core", variant: "default" },
        children: [
          {
            label: "Financial Reports",
            href: "/reports/financial",
            requiredPermission: permissions.REPORTS_FINANCIAL_VIEW,
            children: [
              { 
                label: "Balance Sheet", 
                href: "/reports/financial/balance-sheet", 
                requiredPermission: permissions.REPORTS_FINANCIAL_VIEW,
                description: "Statement of financial position",
                searchKeywords: ["balance", "sheet", "assets", "liabilities", "equity"]
              },
              { 
                label: "Income Statement", 
                href: "/reports/financial/income-statement", 
                requiredPermission: permissions.REPORTS_FINANCIAL_VIEW,
                description: "Profit and loss statement",
                searchKeywords: ["income", "statement", "profit", "loss", "revenue"]
              },
              { 
                label: "Cash Flow Statement", 
                href: "/reports/financial/cash-flow", 
                requiredPermission: permissions.REPORTS_FINANCIAL_VIEW,
                description: "Statement of cash flows",
                searchKeywords: ["cash", "flow", "statement", "operating", "investing"]
              },
              { 
                label: "Trial Balance", 
                href: "/reports/gl/trial-balance", 
                requiredPermission: permissions.GL_REPORTS_VIEW 
              },
            ]
          },
          {
            label: "Custom Reports",
            href: "/reports/custom",
            requiredPermission: permissions.REPORTS_CUSTOM_CREATE,
            children: [
              { 
                label: "Report Builder", 
                href: "/reports/custom/builder", 
                requiredPermission: permissions.REPORTS_CUSTOM_CREATE,
                description: "Build custom reports with drag-and-drop interface"
              },
              { 
                label: "Saved Reports", 
                href: "/reports/custom/saved", 
                requiredPermission: permissions.REPORTS_FINANCIAL_VIEW,
                description: "Access saved custom reports"
              },
            ]
          },
          {
            label: "Report Scheduling",
            href: "/reports/scheduling",
            requiredPermission: permissions.REPORTS_SCHEDULE_MANAGE,
            children: [
              { 
                label: "Schedules", 
                href: "/reports/scheduling/list", 
                requiredPermission: permissions.REPORTS_SCHEDULE_MANAGE,
                description: "View and manage report schedules"
              },
              { 
                label: "Create Schedule", 
                href: "/reports/scheduling/new", 
                requiredPermission: permissions.REPORTS_SCHEDULE_MANAGE,
                description: "Create new automated report schedule"
              },
              { 
                label: "Report History", 
                href: "/reports/history", 
                requiredPermission: permissions.REPORTS_FINANCIAL_VIEW,
                description: "View report generation history"
              },
            ]
          },
          {
            label: "AR Reports",
            href: "/reports/ar",
            requiredPermission: permissions.AR_REPORTS_VIEW,
            children: [
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
            label: "AP Reports",
            href: "/reports/ap",
            requiredPermission: permissions.AP_REPORTS_VIEW,
            children: [
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
            ]
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
        id: "tax-reports",
        label: "Tax Reports",
        icon: Calculator,
        description: "Tax reporting and analysis tools",
        searchKeywords: ["tax", "reports", "vat", "gst", "sales tax"],
        children: [
          { 
            label: "Tax Summary", 
            href: "/reports/tax/summary", 
            requiredPermission: permissions.GL_REPORTS_VIEW,
            description: "Summary of tax collected and paid"
          },
          { 
            label: "Tax Details by Invoice", 
            href: "/reports/tax/details", 
            requiredPermission: permissions.GL_REPORTS_VIEW,
            description: "Detailed tax breakdown by invoice"
          }
        ]
      },
      {
        id: "report-management",
        label: "Report Management",
        href: "/reports/management",
        icon: Settings,
        requiredPermission: permissions.REPORTING_TEMPLATES_MANAGE,
        description: "Manage report templates and schedules",
        searchKeywords: ["templates", "schedules", "automation", "management"],
        children: [
          { 
            label: "Report Templates", 
            href: "/reports/management/templates", 
            requiredPermission: permissions.REPORTING_TEMPLATES_MANAGE,
            description: "Create and manage custom report templates"
          },
          { 
            label: "Scheduled Reports", 
            href: "/reports/management/scheduled", 
            requiredPermission: permissions.REPORTING_TEMPLATES_MANAGE,
            description: "Configure automated report generation"
          }
        ]
      }
    ]
  },
  {
    id: "administration",
    label: "Administration",
    icon: Settings,
    description: "Administrative tools and management",
    searchKeywords: ["administration", "admin", "management", "feedback"],
    meta: {
      category: 'administration',
      priority: 'medium',
      frequency: 'daily'
    },
    children: [
      {
        id: "feedback-management",
        label: "Feedback Management",
        href: "/feedback",
        icon: MessageSquare,
        requiredPermission: permissions.USER_READ,
        description: "Manage user feedback and feature requests",
        searchKeywords: ["feedback", "requests", "features", "bugs", "suggestions"],
        badge: {
          text: "New",
          variant: "secondary" as const
        },
        quickActions: [
          {
            label: "View Feedback Summary",
            icon: BarChart3,
            href: "/feedback",
            category: "Analytics",
            keywords: ["summary", "stats", "dashboard"]
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
