from fastapi import APIRouter
from .endpoints import auth, users, roles, companies, accounting_periods, gl, ar, ap, inventory, oe

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(roles.router, prefix="/roles", tags=["roles"])
api_router.include_router(companies.router, prefix="/companies", tags=["companies"])
api_router.include_router(accounting_periods.router, prefix="/accounting-periods", tags=["accounting-periods"])
api_router.include_router(gl.router, prefix="/gl", tags=["general-ledger"])

# Accounts Receivable endpoints (Phase 4)
api_router.include_router(ar.router, prefix="/ar", tags=["accounts-receivable"])

# Accounts Payable endpoints (Phase 5)
api_router.include_router(ap.router, prefix="/ap", tags=["accounts-payable"])

# Inventory endpoints (Phase 6)
api_router.include_router(inventory.router, prefix="/inventory", tags=["inventory"])

# Order Entry endpoints (Phase 7)
api_router.include_router(oe.router, prefix="/oe", tags=["order-entry"])
