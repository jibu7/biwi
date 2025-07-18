from contextlib import contextmanager
from typing import Optional
from app.core.tenant_context import set_tenant_id, reset_tenant_id, get_current_tenant_id
from app.core.platform_context import set_target_company, reset_platform_context, set_platform_admin_context

@contextmanager
def tenant_context(tenant_id: int):
    """Context manager for operating in a specific tenant context."""
    previous_tenant = get_current_tenant_id()
    try:
        set_tenant_id(tenant_id)
        yield
    finally:
        if previous_tenant is not None:
            set_tenant_id(previous_tenant)
        else:
            reset_tenant_id()

@contextmanager
def platform_admin_context(target_company_id: Optional[int] = None):
    """Context manager for platform admin operations."""
    try:
        set_platform_admin_context(True)
        if target_company_id:
            set_target_company(target_company_id)
        yield
    finally:
        reset_platform_context()
