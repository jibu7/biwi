from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import crud, models, schemas
from app.core.permissions import PermissionChecker, USER_CREATE, USER_READ, USER_UPDATE, USER_DELETE, USER_MANAGE_ROLES
from app.core.security import get_current_active_user
from app.database.database import get_db

router = APIRouter()

@router.post("/", response_model=schemas.User, dependencies=[Depends(PermissionChecker([USER_CREATE]))])
def create_user(
    *,
    db: Session = Depends(get_db),
    user_in: schemas.UserCreate,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Create new user"""
    user = crud.core.get_user_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
    user = crud.core.create_user(db, user=user_in, company_id=current_user.company_id)
    
    # Auto-assign default role based on user type to prevent 0 permission issues
    if user and current_user.company_id:
        from app.models.core import Role, UserRole, UserType
        
        # Determine the appropriate default role based on user type
        default_role_name = None
        user_type = getattr(user_in, 'user_type', 'company_user')
        
        if user_type == UserType.COMPANY_ADMIN.value:
            default_role_name = "Company Administrator"
        else:  # Default to company_user
            default_role_name = "Data Entry Clerk"
        
        # Find and assign the default role
        default_role = db.query(Role).filter(
            Role.company_id == current_user.company_id,
            Role.name == default_role_name
        ).first()
        
        if default_role:
            # Check if role assignment already exists to prevent duplicates
            existing_assignment = db.query(UserRole).filter(
                UserRole.user_id == user.id,
                UserRole.role_id == default_role.id
            ).first()
            
            if not existing_assignment:
                user_role = UserRole(
                    user_id=user.id,
                    role_id=default_role.id
                )
                db.add(user_role)
                db.commit()
    
    return user

@router.get("/", response_model=List[schemas.User], dependencies=[Depends(PermissionChecker([USER_READ]))])
def read_users(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Retrieve users"""
    users = crud.core.get_users_by_company(
        db, company_id=current_user.company_id, skip=skip, limit=limit
    )
    return users

@router.get("/{user_id}", response_model=schemas.User, dependencies=[Depends(PermissionChecker([USER_READ]))])
def read_user(
    user_id: int,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    """Get user by ID"""
    user = crud.core.get_user(db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.company_id != current_user.company_id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return user

@router.put("/{user_id}", response_model=schemas.User, dependencies=[Depends(PermissionChecker([USER_UPDATE]))])
def update_user(
    *,
    db: Session = Depends(get_db),
    user_id: int,
    user_in: schemas.UserUpdate,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Update user"""
    user = crud.core.get_user(db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.company_id != current_user.company_id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    user = crud.core.update_user(db, user_db_obj=user, user_in=user_in)
    return user

@router.delete("/{user_id}", response_model=schemas.User, dependencies=[Depends(PermissionChecker([USER_DELETE]))])
def delete_user(
    *,
    db: Session = Depends(get_db),
    user_id: int,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Delete user"""
    user = crud.core.get_user(db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.company_id != current_user.company_id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    user = crud.core.delete_user(db, user_id=user_id)
    return user

@router.post("/{user_id}/roles/{role_id}", response_model=schemas.User, dependencies=[Depends(PermissionChecker([USER_MANAGE_ROLES]))])
def assign_role_to_user(
    user_id: int,
    role_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Assign role to user"""
    user = crud.core.assign_role_to_user(
        db, user_id=user_id, role_id=role_id, company_id=current_user.company_id
    )
    if not user:
        raise HTTPException(status_code=404, detail="User or role not found")
    return user

@router.delete("/{user_id}/roles/{role_id}", response_model=schemas.User, dependencies=[Depends(PermissionChecker([USER_MANAGE_ROLES]))])
def revoke_role_from_user(
    user_id: int,
    role_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Revoke role from user"""
    user = crud.core.remove_role_from_user(
        db, user_id=user_id, role_id=role_id
    )
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
