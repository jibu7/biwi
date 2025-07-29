from fastapi import APIRouter

from app.api.v1.endpoints import (
    auth, users, companies, roles, accounting_periods,
    gl, ar, ap, inventory, oe, common, company_management, reporting
)
from app.api.v1.endpoints import platform_auth, platform  # Platform endpoints

api_router = APIRouter()

# Regular endpoints
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(companies.router, prefix="/companies", tags=["companies"])
api_router.include_router(roles.router, prefix="/roles", tags=["roles"])
api_router.include_router(accounting_periods.router, prefix="/accounting-periods", tags=["accounting-periods"])

# Company management endpoints
api_router.include_router(company_management.router, prefix="/company-management", tags=["company-management"])

# Module endpoints
api_router.include_router(gl.router, prefix="/gl", tags=["general-ledger"])
api_router.include_router(ar.router, prefix="/ar", tags=["accounts-receivable"])
api_router.include_router(ap.router, prefix="/ap", tags=["accounts-payable"])
api_router.include_router(inventory.router, prefix="/inventory", tags=["inventory"])
api_router.include_router(oe.router, prefix="/oe", tags=["order-entry"])
api_router.include_router(common.router, prefix="/common", tags=["common"])
api_router.include_router(reporting.router, prefix="/reporting", tags=["reporting"])

# Platform endpoints - MUST be registered
api_router.include_router(platform_auth.router, prefix="/platform/auth", tags=["platform-auth"])
api_router.include_router(platform.router, prefix="/platform", tags=["platform"])
