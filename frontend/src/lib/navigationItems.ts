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
  GitBranch
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
          }
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
            label: "Customer Categories", 
            href: "/maintenance/ar/customer-categories", 
            requiredPermission: permissions.AR_SETUP_MANAGE 
          },
          { 
            label: "Payment Terms", 
            href: "/maintenance/ar/payment-terms", 
            requiredPermission: permissions.AR_SETUP_MANAGE 
          }
        ]
      },
      {
        label: "Accounts Payable",
        href: "/maintenance/ap",
        icon: CreditCard,
        requiredPermission: permissions.AP_SETUP_MANAGE,
        children: [
          { 
            label: "Supplier Categories", 
            href: "/maintenance/ap/supplier-categories", 
            requiredPermission: permissions.AP_SETUP_MANAGE 
          },
          { 
            label: "Payment Terms", 
            href: "/maintenance/ap/payment-terms", 
            requiredPermission: permissions.AP_SETUP_MANAGE 
          }
        ]
      },
      {
        label: "Inventory",
        href: "/maintenance/inventory",
        icon: Package,
        requiredPermission: permissions.INV_SETUP_MANAGE,
        children: [
          { 
            label: "Product Categories", 
            href: "/maintenance/inventory/product-categories", 
            requiredPermission: permissions.INV_SETUP_MANAGE 
          },
          { 
            label: "Units of Measure", 
            href: "/maintenance/inventory/units-of-measure", 
            requiredPermission: permissions.INV_SETUP_MANAGE 
          }
        ]
      },
      {
        label: "Order Entry",
        href: "/maintenance/oe",
        icon: ShoppingCart,
        requiredPermission: permissions.OE_SETUP_MANAGE,
        children: [
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
        label: "Common",
        href: "/maintenance/common",
        icon: Globe,
        children: [
          { 
            label: "Currencies", 
            href: "/maintenance/common/currencies", 
            requiredPermission: permissions.COMMON_SETUP_CURRENCIES 
          },
          { 
            label: "Tax Codes", 
            href: "/maintenance/common/tax-codes", 
            requiredPermission: permissions.COMMON_SETUP_TAXES 
          },
          { 
            label: "Branches", 
            href: "/maintenance/common/branches", 
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
            label: "Customer Invoices", 
            href: "/transactions/ar/invoices", 
            requiredPermission: permissions.AR_TRANSACTIONS_POST 
          },
          { 
            label: "Customer Receipts", 
            href: "/transactions/ar/receipts", 
            requiredPermission: permissions.AR_TRANSACTIONS_POST 
          }
        ]
      },
      {
        label: "Accounts Payable",
        icon: CreditCard,
        href: "/transactions/ap",
        requiredPermission: permissions.AP_TRANSACTIONS_POST,
        children: [
          { 
            label: "Supplier Invoices", 
            href: "/transactions/ap/invoices", 
            requiredPermission: permissions.AP_TRANSACTIONS_POST 
          },
          { 
            label: "Supplier Payments", 
            href: "/transactions/ap/payments", 
            requiredPermission: permissions.AP_TRANSACTIONS_POST 
          }
        ]
      },
      {
        label: "Inventory",
        icon: Package,
        href: "/transactions/inventory",
        requiredPermission: permissions.INV_TRANSACTIONS_ADJUST,
        children: [
          { 
            label: "Stock Adjustments", 
            href: "/transactions/inventory/adjustments", 
            requiredPermission: permissions.INV_TRANSACTIONS_ADJUST 
          }
        ]
      },
      {
        label: "Order Entry",
        icon: ShoppingCart,
        href: "/transactions/oe",
        children: [
          { 
            label: "Sales Orders", 
            href: "/transactions/oe/sales-orders", 
            requiredPermission: permissions.OE_SALES_ORDERS_MANAGE 
          },
          { 
            label: "Purchase Orders", 
            href: "/transactions/oe/purchase-orders", 
            requiredPermission: permissions.OE_PURCHASE_ORDERS_MANAGE 
          },
          { 
            label: "Goods Received Vouchers", 
            href: "/transactions/oe/grv", 
            requiredPermission: permissions.OE_GRV_PROCESS 
          }
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
        href: "/reports/gl",
        requiredPermission: permissions.GL_REPORTS_VIEW,
        children: [
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
        label: "Accounts Receivable",
        href: "/reports/ar",
        requiredPermission: permissions.AR_REPORTS_VIEW,
        children: [
          { 
            label: "Customer Aging", 
            href: "/reports/ar/customer-aging", 
            requiredPermission: permissions.AR_REPORTS_VIEW 
          }
        ]
      },
      {
        label: "Accounts Payable",
        href: "/reports/ap",
        requiredPermission: permissions.AP_REPORTS_VIEW,
        children: [
          { 
            label: "Supplier Aging", 
            href: "/reports/ap/supplier-aging", 
            requiredPermission: permissions.AP_REPORTS_VIEW 
          }
        ]
      },
      {
        label: "Inventory",
        href: "/reports/inventory",
        requiredPermission: permissions.INV_REPORTS_VIEW,
        children: [
          { 
            label: "Stock Valuation", 
            href: "/reports/inventory/stock-valuation", 
            requiredPermission: permissions.INV_REPORTS_VIEW 
          }
        ]
      },
      {
        label: "Order Entry",
        href: "/reports/oe",
        requiredPermission: permissions.OE_REPORTS_VIEW,
        children: [
          { 
            label: "Sales Analysis", 
            href: "/reports/oe/sales-analysis", 
            requiredPermission: permissions.OE_REPORTS_VIEW 
          }
        ]
      }
    ]
  }
];
