from typing import Optional
from contextvars import ContextVar
from fastapi import HTTPException, status

# Create a context variable to store the current tenant ID
current_tenant_id: ContextVar[Optional[int]] = ContextVar('current_tenant_id', default=None)

def get_current_tenant_id() -> Optional[int]:
    """Get the current tenant ID from context."""
    return current_tenant_id.get()

def set_tenant_id(tenant_id: Optional[int]) -> None:
    """Set the current tenant ID in context."""
    current_tenant_id.set(tenant_id)

def reset_tenant_id() -> None:
    """Reset the tenant ID to None."""
    current_tenant_id.set(None)

def require_tenant() -> int:
    """Get current tenant ID, raising an exception if none is set."""
    tenant_id = get_current_tenant_id()
    if tenant_id is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tenant context required for this operation"
        )
    return tenant_id

def validate_tenant_access(target_tenant_id: int) -> bool:
    """Validate that the current context allows access to the target tenant."""
    current_tenant = get_current_tenant_id()
    if current_tenant is None:
        return False
    return current_tenant == target_tenant_id
