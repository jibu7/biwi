"""
Company Management Endpoints

This module provides API endpoints for company administrators to manage users and roles
within their company. It includes endpoints for creating users with role assignment
and retrieving available roles with permission details.
"""

from typing import Any, List, Dict, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr

from app.database.database import get_db
from app.models.core import User, UserType
from app.schemas.core import User as UserSchema, Role as RoleSchema, UserCreate
from app.services.company_management import CompanyManagementService
from app.core.permissions import PermissionChecker, USER_CREATE, ROLE_READ, USER_MANAGE_ROLES, USER_READ
from app.api.deps import get_current_active_user

router = APIRouter()

# Request/Response schemas specific to company management
class CompanyUserCreateRequest(BaseModel):
    """Request schema for creating a company user."""
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    user_type: UserType = UserType.COMPANY_USER
    role_ids: Optional[List[int]] = []
    is_active: bool = True

class CompanyUserCreateResponse(BaseModel):
    """Response schema for company user creation."""
    user: UserSchema
    assigned_roles: List[str]
    message: str

class AvailableRoleResponse(BaseModel):
    """Response schema for available roles."""
    id: int
    name: str
    description: Optional[str]
    company_id: int
    permissions: Optional[List[str]] = None
    permission_details: Optional[List[Dict[str, str]]] = None

class AvailableRolesResponse(BaseModel):
    """Response schema for the available roles endpoint."""
    roles: List[AvailableRoleResponse]
    total_count: int

@router.post(
    "/users",
    response_model=CompanyUserCreateResponse,
    dependencies=[Depends(PermissionChecker([USER_CREATE], require_all=True))],
    summary="Create Company User",
    description="Create a new user within the company with optional role assignment. Only company admins can create users."
)
def create_company_user(
    *,
    db: Session = Depends(get_db),
    user_request: CompanyUserCreateRequest,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Create a new company user with role assignment.
    
    This endpoint allows company administrators to create new users within their company
    and assign roles during the creation process.
    
    **Requirements:**
    - Current user must have USER_CREATE permission
    - Current user must belong to a company (not platform admin)
    - Email must not already exist in the system
    - Company must not exceed its user limit
    
    **Permissions Required:** USER_CREATE
    """
    # Ensure the current user is not a platform admin for this endpoint
    if current_user.user_type == UserType.PLATFORM_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Platform admins cannot create company users through this endpoint. Use platform endpoints instead."
        )
    
    # Ensure current user belongs to a company
    if not current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current user must belong to a company to create company users"
        )
    
    try:
        # Create the user using the CompanyManagementService
        new_user = CompanyManagementService.create_company_user(
            db=db,
            company_id=current_user.company_id,
            email=user_request.email,
            password=user_request.password,
            full_name=user_request.full_name,
            user_type=user_request.user_type,
            role_ids=user_request.role_ids,
            is_active=user_request.is_active
        )
        
        # Get the assigned role names for response
        assigned_roles = []
        if user_request.role_ids:
            roles = CompanyManagementService.get_available_roles(
                db=db, 
                company_id=current_user.company_id,
                include_permissions=False
            )
            role_dict = {role["id"]: role["name"] for role in roles}
            assigned_roles = [role_dict.get(role_id, f"Role {role_id}") for role_id in user_request.role_ids]
        
        return CompanyUserCreateResponse(
            user=UserSchema.model_validate(new_user),
            assigned_roles=assigned_roles,
            message=f"User {new_user.email} created successfully with {len(assigned_roles)} role(s) assigned"
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions from the service
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create user: {str(e)}"
        )

@router.get(
    "/available-roles",
    response_model=AvailableRolesResponse,
    dependencies=[Depends(PermissionChecker([ROLE_READ], require_all=True))],
    summary="Get Available Roles",
    description="Retrieve all available roles for the current company with optional permission details."
)
def get_available_roles(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    include_permissions: bool = False,
    include_permission_details: bool = False
) -> Any:
    """
    Get all available roles for the current company.
    
    This endpoint returns all roles available within the current user's company,
    with optional permission information.
    
    **Query Parameters:**
    - `include_permissions`: Include the list of permission strings for each role
    - `include_permission_details`: Include detailed permission information with categories and descriptions
    
    **Requirements:**
    - Current user must have ROLE_READ permission
    - Current user must belong to a company
    
    **Permissions Required:** ROLE_READ
    """
    # Ensure current user belongs to a company
    if not current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current user must belong to a company to view company roles"
        )
    
    try:
        # Get roles using the CompanyManagementService
        roles_data = CompanyManagementService.get_available_roles(
            db=db,
            company_id=current_user.company_id,
            include_permissions=include_permissions or include_permission_details
        )
        
        # Format the response
        formatted_roles = []
        for role_data in roles_data:
            role_response = AvailableRoleResponse(
                id=role_data["id"],
                name=role_data["name"],
                description=role_data["description"],
                company_id=role_data["company_id"]
            )
            
            # Add permissions if requested
            if include_permissions or include_permission_details:
                role_response.permissions = role_data.get("permissions", [])
            
            # Add permission details if requested
            if include_permission_details:
                role_response.permission_details = role_data.get("permission_details", [])
            
            formatted_roles.append(role_response)
        
        return AvailableRolesResponse(
            roles=formatted_roles,
            total_count=len(formatted_roles)
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions from the service
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve roles: {str(e)}"
        )

@router.post(
    "/users/{user_id}/roles",
    dependencies=[Depends(PermissionChecker([USER_MANAGE_ROLES], require_all=True))],
    summary="Assign User Roles",
    description="Assign roles to an existing user within the company."
)
def assign_user_roles(
    *,
    db: Session = Depends(get_db),
    user_id: int,
    role_ids: List[int],
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Assign roles to an existing user within the company.
    
    This endpoint allows company administrators to assign or update roles
    for existing users within their company.
    
    **Requirements:**
    - Current user must have USER_MANAGE_ROLES permission
    - Target user must belong to the same company
    - All specified roles must exist within the company
    
    **Permissions Required:** USER_MANAGE_ROLES
    """
    # Ensure current user belongs to a company
    if not current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current user must belong to a company"
        )
    
    try:
        # Assign roles using the CompanyManagementService
        success = CompanyManagementService.assign_user_roles(
            db=db,
            user_id=user_id,
            company_id=current_user.company_id,
            role_ids=role_ids
        )
        
        if success:
            # Get the assigned role names for response
            roles_data = CompanyManagementService.get_available_roles(
                db=db, 
                company_id=current_user.company_id,
                include_permissions=False
            )
            role_dict = {role["id"]: role["name"] for role in roles_data}
            assigned_role_names = [role_dict.get(role_id, f"Role {role_id}") for role_id in role_ids]
            
            return {
                "message": f"Successfully assigned {len(role_ids)} role(s) to user {user_id}",
                "assigned_roles": assigned_role_names,
                "user_id": user_id
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to assign roles"
            )
            
    except HTTPException:
        # Re-raise HTTP exceptions from the service
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to assign roles: {str(e)}"
        )

@router.get(
    "/users/{user_id}/permissions",
    dependencies=[Depends(PermissionChecker([USER_READ], require_all=True))],
    summary="Get User Permissions",
    description="Get all permissions for a specific user within the company."
)
def get_user_permissions(
    *,
    db: Session = Depends(get_db),
    user_id: int,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get all permissions for a specific user within the company.
    
    This endpoint returns all permissions granted to a user through their roles
    within the current company.
    
    **Requirements:**
    - Current user must have USER_READ permission
    - Target user must belong to the same company
    
    **Permissions Required:** USER_READ
    """
    # Ensure current user belongs to a company
    if not current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current user must belong to a company"
        )
    
    try:
        # Get user permissions using the CompanyManagementService
        permissions = CompanyManagementService.get_user_permissions(
            db=db,
            user_id=user_id,
            company_id=current_user.company_id
        )
        
        return {
            "user_id": user_id,
            "company_id": current_user.company_id,
            "permissions": permissions,
            "permission_count": len(permissions)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve user permissions: {str(e)}"
        )
