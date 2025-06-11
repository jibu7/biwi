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

# AP Permissions (for future phases)
AP_SETUP_MANAGE = "ap:setup_manage"
AP_TRANSACTIONS_POST = "ap:transactions_post"
AP_REPORTS_VIEW = "ap:reports_view"

# Inventory Permissions (for future phases)
INV_SETUP_MANAGE = "inv:setup_manage"
INV_TRANSACTIONS_ADJUST = "inv:transactions_adjust"
INV_REPORTS_VIEW = "inv:reports_view"

# OE Permissions (for future phases)
OE_SETUP_MANAGE = "oe:setup_manage"
OE_SALES_ORDERS_MANAGE = "oe:sales_orders_manage"
OE_PURCHASE_ORDERS_MANAGE = "oe:purchase_orders_manage"
OE_GRV_PROCESS = "oe:grv_process"
OE_REPORTS_VIEW = "oe:reports_view"

# Common Setup Permissions (for future phases)
COMMON_SETUP_CURRENCIES = "common:setup_currencies"
COMMON_SETUP_TAXES = "common:setup_taxes"
COMMON_SETUP_BRANCHES = "common:setup_branches"

ALL_PERMISSIONS_LIST = [
    USER_CREATE, USER_READ, USER_UPDATE, USER_DELETE, USER_MANAGE_ROLES,
    ROLE_CREATE, ROLE_READ, ROLE_UPDATE, ROLE_DELETE, ROLE_MANAGE_PERMISSIONS,
    COMPANY_READ, COMPANY_UPDATE, ACCOUNTING_PERIOD_MANAGE,
    GL_SETUP_MANAGE, GL_JOURNAL_POST, GL_REPORTS_VIEW,
    AR_SETUP_MANAGE, AR_TRANSACTIONS_POST, AR_REPORTS_VIEW,
    AP_SETUP_MANAGE, AP_TRANSACTIONS_POST, AP_REPORTS_VIEW,
    INV_SETUP_MANAGE, INV_TRANSACTIONS_ADJUST, INV_REPORTS_VIEW,
    OE_SETUP_MANAGE, OE_SALES_ORDERS_MANAGE, OE_PURCHASE_ORDERS_MANAGE, 
    OE_GRV_PROCESS, OE_REPORTS_VIEW,
    COMMON_SETUP_CURRENCIES, COMMON_SETUP_TAXES, COMMON_SETUP_BRANCHES,
]

class PermissionChecker:
    def __init__(self, required_permissions: List[str]):
        self.required_permissions = required_permissions
    
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
        
        # Check if user has all required permissions
        for permission in self.required_permissions:
            if permission not in user_permissions:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not enough permissions"
                )
        
        return user

def get_all_permissions() -> List[str]:
    return ALL_PERMISSIONS_LIST
