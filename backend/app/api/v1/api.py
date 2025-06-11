from fastapi import APIRouter
from .endpoints import auth, users, roles, companies, accounting_periods, gl

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(roles.router, prefix="/roles", tags=["roles"])
api_router.include_router(companies.router, prefix="/companies", tags=["companies"])
api_router.include_router(accounting_periods.router, prefix="/accounting-periods", tags=["accounting-periods"])

# General Ledger endpoints (consolidated)
api_router.include_router(gl.router, prefix="/gl", tags=["general-ledger"])
