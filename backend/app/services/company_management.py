"""
Company Management Service

This service provides comprehensive company management functionality including:
- Company user creation with role assignment
- Role management and permission handling
- Company-specific business logic
"""

from typing import Any, List, Optional, Dict
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status

from app.models.core import User, Company, Role, UserRole, UserType
from app.schemas.core import UserCreate, RoleCreate, User as UserSchema, Role as RoleSchema
from app.core.security import get_password_hash
from app.core.permissions import ALL_PERMISSIONS_LIST
from app.core.context_managers import tenant_context
from datetime import datetime


class CompanyManagementService:
    """
    Service class for managing company-specific operations including user management,
    role assignment, and permission handling.
    """

    @staticmethod
    def create_company_user(
        db: Session,
        company_id: int,
        email: str,
        password: str,
        full_name: Optional[str] = None,
        user_type: UserType = UserType.COMPANY_USER,
        role_ids: Optional[List[int]] = None,
        is_active: bool = True
    ) -> User:
        """
        Create a new company user with optional role assignment.
        
        Args:
            db: Database session
            company_id: ID of the company the user belongs to
            email: User's email address
            password: User's password (will be hashed)
            full_name: User's full name
            user_type: Type of user (COMPANY_USER or COMPANY_ADMIN)
            role_ids: List of role IDs to assign to the user
            is_active: Whether the user is active
            
        Returns:
            User: The created user object
            
        Raises:
            HTTPException: If company doesn't exist, email already exists, or validation fails
        """
        # Validate company exists
        company = db.query(Company).filter(
            Company.id == company_id,
            Company.is_active == True,
            Company.is_deleted == False
        ).first()
        
        if not company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Company not found or inactive"
            )
        
        # Check if email already exists
        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Validate user type is appropriate for company users
        if user_type not in [UserType.COMPANY_USER, UserType.COMPANY_ADMIN]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid user type for company user"
            )
        
        # Check user limit for the company
        current_user_count = db.query(User).filter(
            User.company_id == company_id,
            User.is_active == True
        ).count()
        
        if current_user_count >= company.user_limit:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Company has reached its user limit of {company.user_limit}"
            )
        
        try:
            # Create the user
            user = User(
                email=email,
                full_name=full_name,
                hashed_password=get_password_hash(password),
                is_active=is_active,
                user_type=user_type,
                company_id=company_id,
                default_company_id=company_id,
                created_at=datetime.utcnow()
            )
            
            db.add(user)
            db.flush()  # Get the user ID without committing
            
            # Assign roles if provided
            if role_ids:
                CompanyManagementService._assign_roles_to_user(
                    db, user.id, company_id, role_ids
                )
            
            db.commit()
            db.refresh(user)
            
            return user
            
        except IntegrityError as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create user due to data integrity error"
            )
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create user"
            )

    @staticmethod
    def get_available_roles(
        db: Session,
        company_id: int,
        include_permissions: bool = False
    ) -> List[Dict[str, Any]]:
        """
        Get all available roles for a specific company.
        
        Args:
            db: Database session
            company_id: ID of the company
            include_permissions: Whether to include permission details
            
        Returns:
            List[Dict]: List of available roles with their details
            
        Raises:
            HTTPException: If company doesn't exist
        """
        # Validate company exists
        company = db.query(Company).filter(
            Company.id == company_id,
            Company.is_active == True,
            Company.is_deleted == False
        ).first()
        
        if not company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Company not found or inactive"
            )
        
        # Get roles for the company
        roles = db.query(Role).filter(Role.company_id == company_id).all()
        
        result = []
        for role in roles:
            role_data = {
                "id": role.id,
                "name": role.name,
                "description": role.description,
                "company_id": role.company_id
            }
            
            if include_permissions:
                role_data["permissions"] = role.permissions or []
                role_data["permission_details"] = CompanyManagementService._get_permission_details(
                    role.permissions or []
                )
            
            result.append(role_data)
        
        return result

    @staticmethod
    def get_default_roles_for_company(db: Session, company_id: int) -> List[Role]:
        """
        Create and return default roles for a new company.
        
        Args:
            db: Database session
            company_id: ID of the company
            
        Returns:
            List[Role]: List of created default roles
        """
        default_roles = [
            {
                "name": "Administrator",
                "description": "Full access to all company features",
                "permissions": ALL_PERMISSIONS_LIST
            },
            {
                "name": "Accountant",
                "description": "Access to financial and accounting features",
                "permissions": [
                    "gl:setup_manage", "gl:journal_post", "gl:reports_view",
                    "ar:setup_manage", "ar:transactions_post", "ar:reports_view",
                    "ap:setup_manage", "ap:transactions_post", "ap:reports_view",
                    "accounting_periods:manage"
                ]
            },
            {
                "name": "Sales Manager",
                "description": "Access to sales and customer management",
                "permissions": [
                    "ar:setup_manage", "ar:transactions_post", "ar:reports_view",
                    "oe:sales_orders_manage", "oe:reports_view",
                    "users:read", "company:read"
                ]
            },
            {
                "name": "Inventory Manager",
                "description": "Access to inventory management features",
                "permissions": [
                    "inv:setup_manage", "inv:transactions_adjust", "inv:reports_view",
                    "oe:purchase_orders_manage", "oe:grv_process", "oe:reports_view",
                    "company:read"
                ]
            },
            {
                "name": "Read Only",
                "description": "View-only access to reports and data",
                "permissions": [
                    "gl:reports_view", "ar:reports_view", "ap:reports_view",
                    "inv:reports_view", "oe:reports_view", "company:read"
                ]
            }
        ]
        
        created_roles = []
        for role_data in default_roles:
            try:
                role = Role(
                    name=role_data["name"],
                    description=role_data["description"],
                    permissions=role_data["permissions"],
                    company_id=company_id
                )
                db.add(role)
                db.flush()
                created_roles.append(role)
            except IntegrityError:
                # Role already exists, skip
                db.rollback()
                existing_role = db.query(Role).filter(
                    Role.name == role_data["name"],
                    Role.company_id == company_id
                ).first()
                if existing_role:
                    created_roles.append(existing_role)
        
        db.commit()
        return created_roles

    @staticmethod
    def assign_user_roles(
        db: Session,
        user_id: int,
        company_id: int,
        role_ids: List[int]
    ) -> bool:
        """
        Assign roles to a user within a company.
        
        Args:
            db: Database session
            user_id: ID of the user
            company_id: ID of the company
            role_ids: List of role IDs to assign
            
        Returns:
            bool: True if successful
            
        Raises:
            HTTPException: If user or roles don't exist or validation fails
        """
        # Validate user exists and belongs to company
        user = db.query(User).filter(
            User.id == user_id,
            User.company_id == company_id,
            User.is_active == True
        ).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found or doesn't belong to company"
            )
        
        # Validate all roles exist and belong to company
        roles = db.query(Role).filter(
            Role.id.in_(role_ids),
            Role.company_id == company_id
        ).all()
        
        if len(roles) != len(role_ids):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="One or more roles not found or don't belong to company"
            )
        
        try:
            # Remove existing role assignments
            db.query(UserRole).filter(UserRole.user_id == user_id).delete()
            
            # Add new role assignments
            for role_id in role_ids:
                user_role = UserRole(user_id=user_id, role_id=role_id)
                db.add(user_role)
            
            db.commit()
            return True
            
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to assign roles to user"
            )

    @staticmethod
    def get_user_permissions(db: Session, user_id: int, company_id: int) -> List[str]:
        """
        Get all permissions for a user within a company.
        
        Args:
            db: Database session
            user_id: ID of the user
            company_id: ID of the company
            
        Returns:
            List[str]: List of permission strings
        """
        user = db.query(User).filter(
            User.id == user_id,
            User.company_id == company_id
        ).first()
        
        if not user:
            return []
        
        # Platform admins have all permissions
        if user.user_type == UserType.PLATFORM_ADMIN:
            return ALL_PERMISSIONS_LIST
        
        # Get user's permissions from all roles
        user_permissions = set()
        for user_role in user.roles:
            role = user_role.role
            if role and role.permissions:
                user_permissions.update(role.permissions)
        
        return list(user_permissions)

    @staticmethod
    def _assign_roles_to_user(
        db: Session,
        user_id: int,
        company_id: int,
        role_ids: List[int]
    ) -> None:
        """
        Internal method to assign roles to a user.
        
        Args:
            db: Database session
            user_id: ID of the user
            company_id: ID of the company
            role_ids: List of role IDs to assign
        """
        # Validate all roles exist and belong to company
        roles = db.query(Role).filter(
            Role.id.in_(role_ids),
            Role.company_id == company_id
        ).all()
        
        if len(roles) != len(role_ids):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="One or more roles not found or don't belong to company"
            )
        
        # Add role assignments
        for role_id in role_ids:
            user_role = UserRole(user_id=user_id, role_id=role_id)
            db.add(user_role)

    @staticmethod
    def _get_permission_details(permissions: List[str]) -> List[Dict[str, str]]:
        """
        Get detailed information about permissions.
        
        Args:
            permissions: List of permission strings
            
        Returns:
            List[Dict]: List of permission details with description and category
        """
        permission_details = []
        
        # Permission categorization and descriptions
        permission_info = {
            # User management
            "users:create": {"category": "User Management", "description": "Create new users"},
            "users:read": {"category": "User Management", "description": "View user information"},
            "users:update": {"category": "User Management", "description": "Update user information"},
            "users:delete": {"category": "User Management", "description": "Delete users"},
            "users:manage_roles": {"category": "User Management", "description": "Assign/remove user roles"},
            
            # Role management
            "roles:create": {"category": "Role Management", "description": "Create new roles"},
            "roles:read": {"category": "Role Management", "description": "View role information"},
            "roles:update": {"category": "Role Management", "description": "Update role information"},
            "roles:delete": {"category": "Role Management", "description": "Delete roles"},
            "roles:manage_permissions": {"category": "Role Management", "description": "Manage role permissions"},
            
            # Company management
            "company:read": {"category": "Company Management", "description": "View company information"},
            "company:update": {"category": "Company Management", "description": "Update company settings"},
            
            # General Ledger
            "gl:setup_manage": {"category": "General Ledger", "description": "Manage GL accounts and setup"},
            "gl:journal_post": {"category": "General Ledger", "description": "Post journal entries"},
            "gl:reports_view": {"category": "General Ledger", "description": "View GL reports"},
            
            # Accounts Receivable
            "ar:setup_manage": {"category": "Accounts Receivable", "description": "Manage AR setup and customers"},
            "ar:transactions_post": {"category": "Accounts Receivable", "description": "Post AR transactions"},
            "ar:reports_view": {"category": "Accounts Receivable", "description": "View AR reports"},
            
            # Accounts Payable
            "ap:setup_manage": {"category": "Accounts Payable", "description": "Manage AP setup and vendors"},
            "ap:transactions_post": {"category": "Accounts Payable", "description": "Post AP transactions"},
            "ap:reports_view": {"category": "Accounts Payable", "description": "View AP reports"},
            
            # Inventory
            "inv:setup_manage": {"category": "Inventory", "description": "Manage inventory setup and items"},
            "inv:transactions_adjust": {"category": "Inventory", "description": "Adjust inventory quantities"},
            "inv:reports_view": {"category": "Inventory", "description": "View inventory reports"},
            
            # Order Entry
            "oe:setup_manage": {"category": "Order Entry", "description": "Manage OE setup"},
            "oe:sales_orders_manage": {"category": "Order Entry", "description": "Manage sales orders"},
            "oe:purchase_orders_manage": {"category": "Order Entry", "description": "Manage purchase orders"},
            "oe:grv_process": {"category": "Order Entry", "description": "Process goods received vouchers"},
            "oe:reports_view": {"category": "Order Entry", "description": "View OE reports"},
            
            # Accounting Periods
            "accounting_periods:manage": {"category": "System", "description": "Manage accounting periods"},
        }
        
        for permission in permissions:
            info = permission_info.get(permission, {
                "category": "Other",
                "description": permission.replace(":", " ").replace("_", " ").title()
            })
            
            permission_details.append({
                "permission": permission,
                "category": info["category"],
                "description": info["description"]
            })
        
        return permission_details
