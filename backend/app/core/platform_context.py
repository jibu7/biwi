from contextvars import ContextVar
from typing import Optional

# Track if the current request is from a platform admin
is_platform_admin: ContextVar[bool] = ContextVar('is_platform_admin', default=False)

# Track target company_id for impersonation scenarios
target_company_id: ContextVar[Optional[int]] = ContextVar('target_company_id', default=None)

def set_platform_admin_context(is_admin: bool = True) -> None:
    """Set the platform admin context flag."""
    is_platform_admin.set(is_admin)

def is_in_platform_admin_context() -> bool:
    """Check if the current context is platform admin."""
    return is_platform_admin.get()

def set_target_company(company_id: Optional[int]) -> None:
    """Set the target company ID for platform admin operations."""
    target_company_id.set(company_id)

def get_target_company() -> Optional[int]:
    """Get the target company ID if set."""
    return target_company_id.get()

def reset_platform_context() -> None:
    """Reset platform context variables."""
    set_platform_admin_context(False)
    set_target_company(None)

def require_platform_admin() -> bool:
    """Ensure current context is platform admin, raise exception if not."""
    if not is_in_platform_admin_context():
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Platform admin access required"
        )
    return True
