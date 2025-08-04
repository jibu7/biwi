from enum import Enum
from typing import List, Optional, Callable
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.core import User, Role, UserRole, UserType
from app.core.tenant_context import get_current_tenant_id
from app.api.deps import get_current_active_user
from app.core.platform_context import is_in_platform_admin_context

class Permission(str, Enum):
    # Company management
    COMPANY_CREATE = "company:create"
    COMPANY_READ = "company:read"
    COMPANY_UPDATE = "company:update"
    COMPANY_DELETE = "company:delete"
    
    # User management
    USER_CREATE = "user:create"
    USER_READ = "user:read"
    USER_UPDATE = "user:update"
    USER_DELETE = "user:delete"
    USER_MANAGE_ROLES = "user:manage_roles"
    
    # Role management
    ROLE_CREATE = "role:create"
    ROLE_READ = "role:read"
    ROLE_UPDATE = "role:update"
    ROLE_DELETE = "role:delete"
    ROLE_MANAGE_PERMISSIONS = "role:manage_permissions"
    
    # GL permissions
    GL_ACCOUNT_CREATE = "gl_account:create"
    GL_ACCOUNT_READ = "gl_account:read"
    GL_ACCOUNT_UPDATE = "gl_account:update"
    GL_ACCOUNT_DELETE = "gl_account:delete"
    GL_JOURNAL_POST = "gl_journal:post"
    GL_REPORTS_VIEW = "gl_reports:view"
    
    # AR permissions
    AR_CUSTOMER_MANAGE = "ar_customer:manage"
    AR_TRANSACTIONS_POST = "ar_transactions:post"
    AR_REPORTS_VIEW = "ar_reports:view"
    
    # AP permissions
    AP_SUPPLIER_MANAGE = "ap_supplier:manage"
    AP_TRANSACTIONS_POST = "ap_transactions:post"
    AP_REPORTS_VIEW = "ap_reports:view"
    
    # Platform permissions
    PLATFORM_ADMIN = "platform:admin"
    PLATFORM_COMPANY_MANAGE = "platform:company_manage"
    PLATFORM_USER_MANAGE = "platform:user_manage"
    PLATFORM_AUDIT_VIEW = "platform:audit_view"

# Platform Permissions
PLATFORM_SUPER_ADMIN = "platform:super_admin"
PLATFORM_VIEW_METRICS = "platform:view_metrics"
PLATFORM_MANAGE_COMPANIES = "platform:manage_companies"
PLATFORM_VIEW_AUDIT = "platform:view_audit"
PLATFORM_MANAGE_BILLING = "platform:manage_billing"
PLATFORM_SYSTEM_CONFIG = "platform:system_config"

# Legacy permission constants for backward compatibility
USER_CREATE = "users:create"
USER_READ = "users:read"
USER_UPDATE = "users:update"
USER_DELETE = "users:delete"
USER_MANAGE_ROLES = "users:manage_roles"

ROLE_CREATE = "roles:create"
ROLE_READ = "roles:read"
ROLE_UPDATE = "roles:update"
ROLE_DELETE = "roles:delete"
ROLE_MANAGE_PERMISSIONS = "roles:manage_permissions"

COMPANY_CREATE = "company:create"
COMPANY_READ = "company:read"
COMPANY_UPDATE = "company:update"

ACCOUNTING_PERIOD_MANAGE = "accounting_periods:manage"

GL_SETUP_MANAGE = "gl:setup_manage"
GL_JOURNAL_POST = "gl:journal_post"
GL_REPORTS_VIEW = "gl:reports_view"

AR_SETUP_MANAGE = "ar:setup_manage"
AR_TRANSACTIONS_POST = "ar:transactions_post"
AR_REPORTS_VIEW = "ar:reports_view"
AR_WRITEOFF_APPROVE = "ar:writeoff_approve"

AP_SETUP_MANAGE = "ap:setup_manage"
AP_TRANSACTIONS_POST = "ap:transactions_post"
AP_REPORTS_VIEW = "ap:reports_view"

INV_SETUP_MANAGE = "inv:setup_manage"
INV_TRANSACTIONS_ADJUST = "inv:transactions_adjust"
INV_REPORTS_VIEW = "inv:reports_view"

OE_SETUP_MANAGE = "oe:setup_manage"
OE_SALES_ORDERS_MANAGE = "oe:sales_orders_manage"
OE_PURCHASE_ORDERS_MANAGE = "oe:purchase_orders_manage"
OE_GRV_PROCESS = "oe:grv_process"
OE_REPORTS_VIEW = "oe:reports_view"

COMMON_SETUP_CURRENCIES = "common:setup_currencies"
COMMON_SETUP_TAXES = "common:setup_taxes"
COMMON_SETUP_BRANCHES = "common:setup_branches"

REPORTING_FINANCIAL_STATEMENTS_VIEW = "reporting:financial_statements_view"
REPORTING_FINANCIAL_STATEMENTS_GENERATE = "reporting:financial_statements_generate"
REPORTING_TEMPLATES_MANAGE = "reporting:templates_manage"
REPORTING_SCHEDULES_MANAGE = "reporting:schedules_manage"
REPORTING_BANK_RECONCILIATION_MANAGE = "reporting:bank_reconciliation_manage"
REPORTING_AR_AGING_VIEW = "reporting:ar_aging_view"
REPORTING_AP_AGING_VIEW = "reporting:ap_aging_view"
REPORTING_GL_ADVANCED_VIEW = "reporting:gl_advanced_view"
REPORTING_COMPARATIVE_ANALYSIS = "reporting:comparative_analysis"
REPORTING_CASH_FLOW_VIEW = "reporting:cash_flow_view"

# Advanced Reporting Permissions for Phase 9
REPORTS_FINANCIAL_VIEW = "reports:financial_view"
REPORTS_FINANCIAL_EXPORT = "reports:financial_export"
REPORTS_CUSTOM_CREATE = "reports:custom_create"
REPORTS_CUSTOM_EDIT = "reports:custom_edit"
REPORTS_SCHEDULE_MANAGE = "reports:schedule_manage"
REPORTS_DASHBOARD_VIEW = "reports:dashboard_view"
REPORTS_TRIAL_BALANCE_VIEW = "reports:trial_balance_view"
REPORTS_INVENTORY_VALUATION_VIEW = "reports:inventory_valuation_view"

# BOM Permissions
BOM_SETUP_MANAGE = "bom:setup_manage"
BOM_MANUFACTURING_CREATE = "bom:manufacturing_create"
BOM_MANUFACTURING_PROCESS = "bom:manufacturing_process"
BOM_REPORTS_VIEW = "bom:reports_view"
BOM_MRP_RUN = "bom:mrp_run"

# POS Permissions
POS_SETUP_MANAGE = "pos:setup_manage"
POS_TILL_OPERATE = "pos:till_operate"
POS_TILL_MANAGE = "pos:till_manage"
POS_SALES_CREATE = "pos:sales_create"
POS_SALES_PROCESS = "pos:sales_process"
POS_RETURNS_PROCESS = "pos:returns_process"
POS_REPORTS_VIEW = "pos:reports_view"
POS_RECONCILE = "pos:reconcile"
POS_SESSION_OPEN = "pos:session_open"
POS_SESSION_CLOSE = "pos:session_close"
POS_SALES_REFUND = "pos:sales_refund"
POS_CASH_MANAGE = "pos:cash_manage"

# Frontend compatibility aliases for reporting permissions
REPORTING_FINANCIAL_STATEMENTS = "reporting:financial_statements"
REPORTING_ADVANCED_GL = "reporting:advanced_gl"
REPORTING_ADVANCED_AR = "reporting:advanced_ar"
REPORTING_ADVANCED_AP = "reporting:advanced_ap"
REPORTING_BANK_RECONCILIATION = "reporting:bank_reconciliation"

ALL_PERMISSIONS_LIST = [
    USER_CREATE, USER_READ, USER_UPDATE, USER_DELETE, USER_MANAGE_ROLES,
    ROLE_CREATE, ROLE_READ, ROLE_UPDATE, ROLE_DELETE, ROLE_MANAGE_PERMISSIONS,
    COMPANY_READ, COMPANY_UPDATE, ACCOUNTING_PERIOD_MANAGE,
    GL_SETUP_MANAGE, GL_JOURNAL_POST, GL_REPORTS_VIEW,
    AR_SETUP_MANAGE, AR_TRANSACTIONS_POST, AR_REPORTS_VIEW, AR_WRITEOFF_APPROVE,
    AP_SETUP_MANAGE, AP_TRANSACTIONS_POST, AP_REPORTS_VIEW,
    INV_SETUP_MANAGE, INV_TRANSACTIONS_ADJUST, INV_REPORTS_VIEW,
    OE_SETUP_MANAGE, OE_SALES_ORDERS_MANAGE, OE_PURCHASE_ORDERS_MANAGE, 
    OE_GRV_PROCESS, OE_REPORTS_VIEW,
    COMMON_SETUP_CURRENCIES, COMMON_SETUP_TAXES, COMMON_SETUP_BRANCHES,
    REPORTING_FINANCIAL_STATEMENTS_VIEW, REPORTING_FINANCIAL_STATEMENTS_GENERATE,
    REPORTING_TEMPLATES_MANAGE, REPORTING_SCHEDULES_MANAGE,
    REPORTING_BANK_RECONCILIATION_MANAGE, REPORTING_AR_AGING_VIEW,
    REPORTING_AP_AGING_VIEW, REPORTING_GL_ADVANCED_VIEW,
    REPORTING_COMPARATIVE_ANALYSIS, REPORTING_CASH_FLOW_VIEW,
    # Phase 9 Advanced Reporting Permissions
    REPORTS_FINANCIAL_VIEW, REPORTS_FINANCIAL_EXPORT,
    REPORTS_CUSTOM_CREATE, REPORTS_CUSTOM_EDIT, REPORTS_SCHEDULE_MANAGE,
    REPORTS_DASHBOARD_VIEW, REPORTS_TRIAL_BALANCE_VIEW, REPORTS_INVENTORY_VALUATION_VIEW,
    # Frontend compatibility permissions
    REPORTING_FINANCIAL_STATEMENTS, REPORTING_ADVANCED_GL,
    REPORTING_ADVANCED_AR, REPORTING_ADVANCED_AP, REPORTING_BANK_RECONCILIATION,
    BOM_SETUP_MANAGE, BOM_MANUFACTURING_CREATE, BOM_MANUFACTURING_PROCESS, BOM_REPORTS_VIEW, BOM_MRP_RUN,
    POS_SETUP_MANAGE, POS_TILL_OPERATE, POS_TILL_MANAGE, POS_SALES_CREATE,
    POS_RETURNS_PROCESS, POS_REPORTS_VIEW, POS_RECONCILE,
]

def check_permissions(required_permissions: List[Permission]) -> Callable:
    """
    Dependency to check if the current user has the required permissions.
    Platform admins automatically have all permissions.
    """
    def _check_permissions(
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_active_user),
    ) -> bool:
        # Platform admins have all permissions
        if is_in_platform_admin_context() or current_user.is_superuser:
            return True
        
        # Get tenant ID from context
        tenant_id = get_current_tenant_id()
        if not tenant_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tenant context available",
            )
        
        # Get user's roles for the current tenant
        user_roles = db.query(UserRole).filter(
            UserRole.user_id == current_user.id
        ).all()
        
        if not user_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User has no roles assigned",
            )
        
        role_ids = [ur.role_id for ur in user_roles]
        
        # Get the roles to check permissions
        roles = db.query(Role).filter(
            Role.id.in_(role_ids),
            Role.company_id == tenant_id,
        ).all()
        
        # Check if any of the roles have the required permissions
        user_permissions = set()
        for role in roles:
            if role.permissions:
                user_permissions.update(role.permissions)
        
        # Check if user has all required permissions
        missing_permissions = [
            p for p in required_permissions if p.value not in user_permissions
        ]
        
        if missing_permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Missing required permissions: {', '.join([p.value for p in missing_permissions])}",
            )
        
        return True
    
    return _check_permissions

def has_permission(user: User, permission: Permission, db: Session, tenant_id: Optional[int] = None) -> bool:
    """Check if a user has a specific permission."""
    # Platform admins have all permissions
    if user.user_type == UserType.PLATFORM_ADMIN or user.is_superuser:
        return True
    
    # Use provided tenant_id or get from context
    if tenant_id is None:
        tenant_id = get_current_tenant_id()
        if not tenant_id:
            return False
    
    # Get user's roles for the tenant
    user_roles = db.query(UserRole).filter(
        UserRole.user_id == user.id
    ).all()
    
    role_ids = [ur.role_id for ur in user_roles]
    
    # Get the roles and check permissions
    roles = db.query(Role).filter(
        Role.id.in_(role_ids),
        Role.company_id == tenant_id,
    ).all()
    
    # Check if any role has the required permission
    for role in roles:
        if role.permissions and permission.value in role.permissions:
            return True
    
    return False

class PermissionChecker:
    def __init__(self, required_permissions: List[str], require_all: bool = False):
        """
        Initialize permission checker.
        
        Args:
            required_permissions: List of permissions to check
            require_all: If True, user must have ALL permissions (AND logic).
                        If False, user must have AT LEAST ONE permission (OR logic).
                        Default is False for backward compatibility.
        """
        self.required_permissions = required_permissions
        self.require_all = require_all
    
    async def __call__(
        self,
        user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
    ):
        if user.is_superuser or (hasattr(user, 'user_type') and user.user_type == UserType.PLATFORM_ADMIN):
            return user
        
        # Get user's permissions from all roles using proper query
        from app.crud.core import get_user_roles
        user_roles_list = get_user_roles(db, user.id)
        
        user_permissions = []
        for role in user_roles_list:
            if role and role.permissions:
                user_permissions.extend(role.permissions)
        
        if self.require_all:
            # Check if user has ALL required permissions (AND logic)
            for permission in self.required_permissions:
                if permission not in user_permissions:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail=f"Missing required permission: {permission}"
                    )
        else:
            # Check if user has AT LEAST ONE required permission (OR logic)
            if not any(permission in user_permissions for permission in self.required_permissions):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Missing required permissions. Need one of: {', '.join(self.required_permissions)}"
                )
        
        return user

def require_permission(required_permission: str):
    """
    Dependency to require a specific permission.
    
    Args:
        required_permission: The permission string to check
    
    Raises:
        HTTPException: If user doesn't have the required permission
    """
    def check_permission(
        user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
    ):
        if user.is_superuser or user.user_type == UserType.PLATFORM_ADMIN:
            return user
        
        # Get user's permissions from all roles using proper query
        from app.crud.core import get_user_roles
        user_roles_list = get_user_roles(db, user.id)
        
        user_permissions = []
        for role in user_roles_list:
            if role and role.permissions:
                user_permissions.extend(role.permissions)
        
        # Check if user has the required permission
        if required_permission not in user_permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission '{required_permission}' required"
            )
        
        return user
    
    return check_permission

def get_all_permissions() -> List[str]:
    return ALL_PERMISSIONS_LIST

# Create a permissions object for dot notation access
class PermissionsNamespace:
    # Company management
    COMPANY_CREATE = "company:create"
    COMPANY_READ = "company:read" 
    COMPANY_UPDATE = "company:update"
    COMPANY_DELETE = "company:delete"
    
    # User management
    USER_CREATE = "user:create"
    USER_READ = "user:read"
    USER_UPDATE = "user:update"
    USER_DELETE = "user:delete"
    USER_MANAGE_ROLES = "user:manage_roles"
    
    # Role management
    ROLE_CREATE = "role:create"
    ROLE_READ = "role:read"
    ROLE_UPDATE = "role:update"
    ROLE_DELETE = "role:delete"
    ROLE_MANAGE_PERMISSIONS = "role:manage_permissions"
    
    # GL permissions
    GL_SETUP_MANAGE = "gl:setup_manage"
    GL_JOURNAL_POST = "gl:journal_post"
    GL_REPORTS_VIEW = "gl:reports_view"
    
    # AR permissions
    AR_SETUP_MANAGE = "ar:setup_manage"
    AR_TRANSACTIONS_POST = "ar:transactions_post" 
    AR_REPORTS_VIEW = "ar:reports_view"
    AR_WRITEOFF_APPROVE = "ar:writeoff_approve"
    
    # AP permissions
    AP_SETUP_MANAGE = "ap:setup_manage"
    AP_TRANSACTIONS_POST = "ap:transactions_post"
    AP_REPORTS_VIEW = "ap:reports_view"
    
    # Inventory permissions
    INV_SETUP_MANAGE = "inv:setup_manage"
    INV_TRANSACTIONS_ADJUST = "inv:transactions_adjust"
    INV_REPORTS_VIEW = "inv:reports_view"
    
    # OE permissions
    OE_SETUP_MANAGE = "oe:setup_manage"
    OE_SALES_ORDERS_MANAGE = "oe:sales_orders_manage"
    OE_PURCHASE_ORDERS_MANAGE = "oe:purchase_orders_manage"
    OE_GRV_PROCESS = "oe:grv_process"
    OE_REPORTS_VIEW = "oe:reports_view"
    
    # Common permissions
    COMMON_SETUP_CURRENCIES = "common:setup_currencies"
    COMMON_SETUP_TAXES = "common:setup_taxes"
    COMMON_SETUP_BRANCHES = "common:setup_branches"

# Create a module-level permissions object for dot notation access
permissions = PermissionsNamespace()
