from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.api import api_router
from app.config import settings
from app.middleware.tenant_isolation import TenantIsolationMiddleware
from app.middleware.audit_logging import AuditLoggingMiddleware
from app.middleware.database_connection import DatabaseConnectionMiddleware
from app.middleware.audit import AuditMiddleware

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom middleware - ORDER MATTERS!
# Database connection middleware should be first to handle connection errors
app.add_middleware(DatabaseConnectionMiddleware)
app.add_middleware(AuditLoggingMiddleware)
app.add_middleware(AuditMiddleware)
app.add_middleware(TenantIsolationMiddleware)

# Include API router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.get("/")
async def root():
    return {"message": "Vinea ERP Backend is running"}
