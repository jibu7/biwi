from fastapi import APIRouter

from app.api.v1.endpoints import auth, users, companies, gl, ar, ap, inventory, oe
from app.api.v1.endpoints import platform_auth, platform

api_router = APIRouter()

# Regular authentication
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])

# Platform authentication and management
api_router.include_router(platform_auth.router, prefix="/platform/auth", tags=["platform-auth"])
api_router.include_router(platform.router, prefix="/platform", tags=["platform"])

# Business module endpoints
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(companies.router, prefix="/companies", tags=["companies"])
api_router.include_router(gl.router, prefix="/gl", tags=["general-ledger"])
api_router.include_router(ar.router, prefix="/ar", tags=["accounts-receivable"])
api_router.include_router(ap.router, prefix="/ap", tags=["accounts-payable"])
api_router.include_router(inventory.router, prefix="/inventory", tags=["inventory"])
api_router.include_router(oe.router, prefix="/oe", tags=["order-entry"])
