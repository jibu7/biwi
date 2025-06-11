from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import crud, models, schemas
from app.core.permissions import (
    PermissionChecker, ROLE_CREATE, ROLE_READ, ROLE_UPDATE, 
    ROLE_DELETE, ROLE_MANAGE_PERMISSIONS, get_all_permissions
)
from app.core.security import get_current_active_user
from app.database.database import get_db

router = APIRouter()

@router.post("/", response_model=schemas.Role, dependencies=[Depends(PermissionChecker([ROLE_CREATE]))])
def create_role(
    *,
    db: Session = Depends(get_db),
    role_in: schemas.RoleCreate,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Create new role"""
    role = crud.core.create_role(db, role=role_in, company_id=current_user.company_id)
    return role

@router.get("/", response_model=List[schemas.Role], dependencies=[Depends(PermissionChecker([ROLE_READ]))])
def read_roles(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Retrieve roles"""
    roles = crud.core.get_roles_by_company(
        db, company_id=current_user.company_id, skip=skip, limit=limit
    )
    return roles

@router.get("/permissions/all", response_model=List[str])
def get_all_available_permissions(
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Get all available permissions"""
    return get_all_permissions()

@router.get("/{role_id}", response_model=schemas.Role, dependencies=[Depends(PermissionChecker([ROLE_READ]))])
def read_role(
    role_id: int,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    """Get role by ID"""
    role = crud.core.get_role(db, role_id=role_id, company_id=current_user.company_id)
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    return role

@router.put("/{role_id}", response_model=schemas.Role, dependencies=[Depends(PermissionChecker([ROLE_UPDATE, ROLE_MANAGE_PERMISSIONS]))])
def update_role(
    *,
    db: Session = Depends(get_db),
    role_id: int,
    role_in: schemas.RoleUpdate,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Update role"""
    role = crud.core.get_role(db, role_id=role_id, company_id=current_user.company_id)
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    role = crud.core.update_role(db, role_db_obj=role, role_in=role_in)
    return role

@router.delete("/{role_id}", response_model=schemas.Role, dependencies=[Depends(PermissionChecker([ROLE_DELETE]))])
def delete_role(
    *,
    db: Session = Depends(get_db),
    role_id: int,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Delete role"""
    role = crud.core.delete_role(db, role_id=role_id, company_id=current_user.company_id)
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    return role
