from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.api import api_router
from app.config import settings

# Import middleware
from app.middleware.tenant_isolation import TenantIsolationMiddleware
from app.middleware.audit_logging import AuditLoggingMiddleware

app = FastAPI(
    title=settings.PROJECT_NAME, 
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Set all CORS enabled origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add custom middleware (order matters!)
app.add_middleware(AuditLoggingMiddleware)
app.add_middleware(TenantIsolationMiddleware)

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.get("/")
async def root():
    return {"message": "Vinea ERP Backend is running"}
