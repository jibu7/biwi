from typing import List
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.database import get_db
from app import models
from app.core.security import get_current_active_user

# User Permissions
USER_CREATE = "users:create"
USER_READ = "users:read"
USER_UPDATE = "users:update"
USER_DELETE = "users:delete"
USER_MANAGE_ROLES = "users:manage_roles"

# Role Permissions
ROLE_CREATE = "roles:create"
ROLE_READ = "roles:read"
ROLE_UPDATE = "roles:update"
ROLE_DELETE = "roles:delete"
ROLE_MANAGE_PERMISSIONS = "roles:manage_permissions"

# Company Permissions
COMPANY_CREATE = "company:create"
COMPANY_READ = "company:read"
COMPANY_UPDATE = "company:update"

# Accounting Period Permissions
ACCOUNTING_PERIOD_MANAGE = "accounting_periods:manage"

# GL Permissions (for future phases)
GL_SETUP_MANAGE = "gl:setup_manage"
GL_JOURNAL_POST = "gl:journal_post"
GL_REPORTS_VIEW = "gl:reports_view"

# AR Permissions (for future phases)
AR_SETUP_MANAGE = "ar:setup_manage"
AR_TRANSACTIONS_POST = "ar:transactions_post"
AR_REPORTS_VIEW = "ar:reports_view"
AR_WRITEOFF_APPROVE = "ar:writeoff_approve"

# AP Permissions (for future phases)
AP_SETUP_MANAGE = "ap:setup_manage"
AP_TRANSACTIONS_POST = "ap:transactions_post"
AP_REPORTS_VIEW = "ap:reports_view"

# Inventory Permissions (for future phases)
INV_SETUP_MANAGE = "inv:setup_manage"
INV_TRANSACTIONS_ADJUST = "inv:transactions_adjust"
INV_REPORTS_VIEW = "inv:reports_view"

# OE Permissions
OE_SETUP_MANAGE = "oe:setup_manage"
OE_SALES_ORDERS_MANAGE = "oe:sales_orders_manage"
OE_PURCHASE_ORDERS_MANAGE = "oe:purchase_orders_manage"
OE_GRV_PROCESS = "oe:grv_process"
OE_REPORTS_VIEW = "oe:reports_view"

# Common Setup Permissions (for future phases)
COMMON_SETUP_CURRENCIES = "common:setup_currencies"
COMMON_SETUP_TAXES = "common:setup_taxes"
COMMON_SETUP_BRANCHES = "common:setup_branches"

# Reporting Permissions
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

# BOM Permissions
BOM_SETUP_MANAGE = "bom:setup_manage"
BOM_MANUFACTURING_PROCESS = "bom:manufacturing_process"
BOM_REPORTS_VIEW = "bom:reports_view"

# POS Permissions
POS_SETUP_MANAGE = "pos:setup_manage"
POS_TILL_MANAGE = "pos:till_manage"
POS_SESSION_OPEN = "pos:session_open"
POS_SESSION_CLOSE = "pos:session_close"
POS_SALES_PROCESS = "pos:sales_process"
POS_RETURNS_PROCESS = "pos:returns_process"
POS_CASH_MANAGE = "pos:cash_manage"
POS_REPORTS_VIEW = "pos:reports_view"

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
    BOM_SETUP_MANAGE, BOM_MANUFACTURING_PROCESS, BOM_REPORTS_VIEW,
    POS_SETUP_MANAGE, POS_TILL_MANAGE, POS_SESSION_OPEN, POS_SESSION_CLOSE,
    POS_SALES_PROCESS, POS_RETURNS_PROCESS, POS_CASH_MANAGE, POS_REPORTS_VIEW,
]

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
        user: models.User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
    ):
        if user.is_superuser:
            return user
        
        # Get user's permissions from all roles
        user_permissions = []
        for user_role in user.roles:
            role = db.query(models.Role).filter(
                models.Role.id == user_role.role_id
            ).first()
            if role and role.permissions:
                user_permissions.extend(role.permissions)
        
        if self.require_all:
            # Check if user has ALL required permissions (AND logic)
            for permission in self.required_permissions:
                if permission not in user_permissions:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Not enough permissions"
                    )
        else:
            # Check if user has AT LEAST ONE required permission (OR logic)
            if not any(permission in user_permissions for permission in self.required_permissions):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not enough permissions"
                )
        
        return user

def get_all_permissions() -> List[str]:
    return ALL_PERMISSIONS_LIST

def require_permission(user: models.User, required_permission: str) -> None:
    """
    Check if a user has a specific permission. Raises HTTPException if not.
    
    Args:
        user: The user to check permissions for
        required_permission: The permission string to check
        
    Raises:
        HTTPException: If user doesn't have the required permission
    """
    if user.is_superuser:
        return
    
    # Get user's permissions from all roles
    user_permissions = []
    for user_role in user.roles:
        role = user_role.role
        if role and role.permissions:
            user_permissions.extend(role.permissions)
    
    # Check if user has the required permission
    if required_permission not in user_permissions:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Permission '{required_permission}' required"
        )
