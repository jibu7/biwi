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
export const SYSTEM_ADVANCED_SETUP = "system:advanced_setup";

// Reporting Permissions  
export const REPORTING_FINANCIAL_STATEMENTS_VIEW = "reporting:financial_statements_view";
export const REPORTING_FINANCIAL_STATEMENTS_GENERATE = "reporting:financial_statements_generate";
export const REPORTING_GL_ADVANCED_VIEW = "reporting:gl_advanced_view";
export const REPORTING_AR_AGING_VIEW = "reporting:ar_aging_view";
export const REPORTING_AP_AGING_VIEW = "reporting:ap_aging_view";
export const REPORTING_TEMPLATES_MANAGE = "reporting:templates_manage";
export const REPORTING_SCHEDULES_MANAGE = "reporting:schedules_manage";
export const REPORTING_BANK_RECONCILIATION_MANAGE = "reporting:bank_reconciliation_manage";
export const REPORTING_COMPARATIVE_ANALYSIS = "reporting:comparative_analysis";
export const REPORTING_CASH_FLOW_VIEW = "reporting:cash_flow_view";

// New Report Permissions
export const REPORTS_FINANCIAL_VIEW = "reports:financial_view";
export const REPORTS_CUSTOM_CREATE = "reports:custom_create";
export const REPORTS_SCHEDULE_MANAGE = "reports:schedule_manage";

// Legacy aliases for backwards compatibility
export const REPORTING_FINANCIAL_STATEMENTS = REPORTING_FINANCIAL_STATEMENTS_VIEW;
export const REPORTING_ADVANCED_GL = REPORTING_GL_ADVANCED_VIEW;
export const REPORTING_ADVANCED_AR = REPORTING_AR_AGING_VIEW;
export const REPORTING_ADVANCED_AP = REPORTING_AP_AGING_VIEW;
export const REPORTING_BANK_RECONCILIATION = REPORTING_BANK_RECONCILIATION_MANAGE;

// BOM Permissions
export const BOM_SETUP_MANAGE = "bom:setup_manage";
export const BOM_MANUFACTURING_CREATE = "bom:manufacturing_create";
export const BOM_MANUFACTURING_PROCESS = "bom:manufacturing_process";
export const BOM_REPORTS_VIEW = "bom:reports_view";
export const BOM_MRP_RUN = "bom:mrp_run";

// POS Permissions
export const POS_SETUP_MANAGE = "pos:setup_manage";
export const POS_TILL_MANAGE = "pos:till_manage";
export const POS_SESSION_OPEN = "pos:session_open";
export const POS_SESSION_CLOSE = "pos:session_close";
export const POS_SALES_PROCESS = "pos:sales_process";
export const POS_RETURNS_PROCESS = "pos:returns_process";
export const POS_CASH_MANAGE = "pos:cash_manage";
export const POS_REPORTS_VIEW = "pos:reports_view";

// Platform Permissions
export const PLATFORM_SUPER_ADMIN = "platform:super_admin";
export const PLATFORM_VIEW_METRICS = "platform:view_metrics";
export const PLATFORM_MANAGE_COMPANIES = "platform:manage_companies";
export const PLATFORM_VIEW_AUDIT = "platform:view_audit";
export const PLATFORM_MANAGE_BILLING = "platform:manage_billing";
export const PLATFORM_SYSTEM_CONFIG = "platform:system_config";

// Feedback Permissions
export const FEEDBACK_CREATE = "feedback:create";
export const FEEDBACK_VIEW_OWN = "feedback:view_own";
export const FEEDBACK_MANAGE = "feedback:manage";
export const FEEDBACK_VIEW_ALL = "feedback:view_all";
export const FEEDBACK_COMMENT = "feedback:comment";
export const FEEDBACK_ASSIGN = "feedback:assign";
export const FEEDBACK_STATUS_UPDATE = "feedback:status_update";

export const hasPermission = (userPermissions: string[], requiredPermission: string) => {
    return userPermissions.includes(requiredPermission);
};
