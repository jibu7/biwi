#!/usr/bin/env python3
"""
Test script to verify platform improvements implementation
"""
import asyncio
import sys
import os
sys.path.append('/app')

async def test_platform_improvements():
    """Test that all platform improvements are properly implemented"""
    try:
        # Test 1: Import all required modules
        from app.models.core import User, Company, PlatformAuditLog, UserType
        from app.core.platform_security import get_platform_admin, get_platform_context
        from app.api.v1.endpoints.platform import router
        from app.schemas.core import CompanyWithStats, PlatformAuditLog as PlatformAuditLogSchema
        
        print("✓ All imports successful")
        
        # Test 2: Check UserType enum
        assert UserType.PLATFORM_ADMIN == "platform_admin"
        assert UserType.COMPANY_ADMIN == "company_admin"
        assert UserType.COMPANY_USER == "company_user"
        print("✓ UserType enum working correctly")
        
        # Test 3: Check database models
        from app.database.database import SessionLocal
        from sqlalchemy import text
        db = SessionLocal()
        
        # Check if tables exist
        result = db.execute(text("SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'platform_audit_logs'"))
        assert result.fetchone()[0] == 1
        print("✓ PlatformAuditLog table exists")
        
        # Check if companies table has platform columns
        result = db.execute(text("SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'code'"))
        assert result.fetchone()[0] == 1
        print("✓ Companies table has platform columns")
        
        # Check if users table has platform columns
        result = db.execute(text("SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'user_type'"))
        assert result.fetchone()[0] == 1
        print("✓ Users table has platform columns")
        
        db.close()
        
        print("\n🎉 All platform improvements are properly implemented!")
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = asyncio.run(test_platform_improvements())
    sys.exit(0 if success else 1)
