from fastapi import APIRouter
from .endpoints import auth, users, roles, companies, accounting_periods, gl, ar, ap, inventory, oe, common, reporting, bom, pos

api_router = APIRouter(prefix="/api/v1")

# Health check endpoint
@api_router.get("/health")
async def health_check():
    return {"status": "ok", "message": "Backend is healthy"}

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

# Common setup endpoints (Phase 8)
api_router.include_router(common.router, prefix="/common", tags=["common-setup"])

# Financial reporting endpoints (Phase 9)
api_router.include_router(reporting.router, prefix="/reporting", tags=["reporting"])

# Bill of Materials endpoints (Phase 10)
api_router.include_router(bom.router, prefix="/bom", tags=["bill-of-materials"])

# Point of Sales endpoints (Phase 11)
api_router.include_router(pos.router, prefix="/pos", tags=["point-of-sales"])
