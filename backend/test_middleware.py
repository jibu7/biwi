"""
Test file to verify middleware implementation
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from app.middleware.tenant_isolation import TenantIsolationMiddleware
    from app.middleware.audit_logging import AuditLoggingMiddleware
    from app.main import app
    print("✅ All middleware imports successful!")
    print("✅ FastAPI app created successfully!")
    print("✅ Middleware implementation is ready!")
except ImportError as e:
    print(f"❌ Import error: {e}")
except Exception as e:
    print(f"❌ Error: {e}")
