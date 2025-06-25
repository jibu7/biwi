// User Permissions
export const USER_CREATE = "users:create";
export const USER_READ = "users:read";
export const USER_UPDATE = "users:update";
export const USER_DELETE = "users:delete";
export const USER_MANAGE_ROLES = "users:manage_roles";

// Role Permissions
export const ROLE_CREATE = "roles:create";
export const ROLE_READ = "roles:read";
export const ROLE_UPDATE = "roles:update";
export const ROLE_DELETE = "roles:delete";
export const ROLE_MANAGE_PERMISSIONS = "roles:manage_permissions";

// Company Permissions
export const COMPANY_CREATE = "company:create";
export const COMPANY_READ = "company:read";
export const COMPANY_UPDATE = "company:update";

// Accounting Period Permissions
export const ACCOUNTING_PERIOD_MANAGE = "accounting_periods:manage";

// GL Permissions
export const GL_SETUP_MANAGE = "gl:setup_manage";
export const GL_JOURNAL_POST = "gl:journal_post";
export const GL_REPORTS_VIEW = "gl:reports_view";

// AR Permissions
export const AR_SETUP_MANAGE = "ar:setup_manage";
export const AR_TRANSACTIONS_POST = "ar:transactions_post";
export const AR_REPORTS_VIEW = "ar:reports_view";
export const AR_WRITEOFF_APPROVE = "ar:writeoff_approve";

// AP Permissions
export const AP_SETUP_MANAGE = "ap:setup_manage";
export const AP_TRANSACTIONS_POST = "ap:transactions_post";
export const AP_REPORTS_VIEW = "ap:reports_view";

// Inventory Permissions
export const INV_SETUP_MANAGE = "inv:setup_manage";
export const INV_TRANSACTIONS_ADJUST = "inv:transactions_adjust";
export const INV_REPORTS_VIEW = "inv:reports_view";

// OE Permissions
export const OE_SETUP_MANAGE = "oe:setup_manage";
export const OE_SALES_ORDERS_MANAGE = "oe:sales_orders_manage";
export const OE_PURCHASE_ORDERS_MANAGE = "oe:purchase_orders_manage";
export const OE_GRV_PROCESS = "oe:grv_process";
export const OE_REPORTS_VIEW = "oe:reports_view";

// Common Permissions
export const COMMON_SETUP_CURRENCIES = "common:setup_currencies";
export const COMMON_SETUP_TAXES = "common:setup_taxes";
export const COMMON_SETUP_BRANCHES = "common:setup_branches";

// Reporting Permissions
export const REPORTING_FINANCIAL_STATEMENTS = "reporting:financial_statements";
export const REPORTING_ADVANCED_GL = "reporting:advanced_gl";
export const REPORTING_ADVANCED_AR = "reporting:advanced_ar";
export const REPORTING_ADVANCED_AP = "reporting:advanced_ap";
export const REPORTING_TEMPLATES_MANAGE = "reporting:templates_manage";
export const REPORTING_BANK_RECONCILIATION = "reporting:bank_reconciliation";

// BOM Permissions
export const BOM_SETUP_MANAGE = "bom:setup_manage";
export const BOM_MANUFACTURING_PROCESS = "bom:manufacturing_process";
export const BOM_REPORTS_VIEW = "bom:reports_view";
