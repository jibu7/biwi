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
  Settings
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
            href: "/transactions/inventory/adjustments/new", 
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
      }
    ]
  }
];
