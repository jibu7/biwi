#!/usr/bin/env python3
"""
Direct test of platform models in Docker environment
"""

import sys
import os

# Add the backend directory to Python path
sys.path.append('/home/ubuntu24/proj/biwi/backend')

def test_platform_imports():
    """Test importing platform models and schemas"""
    try:
        print("🧪 Testing platform model imports...")
        
        # Test importing models
        from app.models.platform import (
            PlatformAdmin, BillingPlan, CompanySubscription, UsageMetric,
            PlatformInvoice, SystemHealth, AuditLog, SystemConfiguration, FeatureFlag,
            UsageMetricType, BillingPlanType, AuditActionType
        )
        print("✅ Platform models imported successfully")
        
        # Test importing schemas
        from app.schemas.platform import (
            PlatformAdminCreate, BillingPlanCreate, CompanySubscriptionCreate,
            UsageMetricCreate, PlatformInvoiceCreate, SystemHealthCreate,
            AuditLogCreate, SystemConfigurationCreate, FeatureFlagCreate,
            PlatformStats, CompanyUsageStats
        )
        print("✅ Platform schemas imported successfully")
        
        # Test importing permissions
        from app.core.permissions import (
            PLATFORM_SUPER_ADMIN, PLATFORM_VIEW_METRICS, PLATFORM_MANAGE_COMPANIES,
            PLATFORM_VIEW_AUDIT, PLATFORM_MANAGE_BILLING, PLATFORM_SYSTEM_CONFIG
        )
        print("✅ Platform permissions imported successfully")
        
        return True
        
    except Exception as e:
        print(f"❌ Import test failed: {e}")
        return False

def test_model_creation():
    """Test creating platform model instances"""
    try:
        print("\n🧪 Testing platform model instantiation...")
        
        from app.models.platform import (
            PlatformAdmin, BillingPlan, UsageMetricType, BillingPlanType
        )
        from app.schemas.platform import (
            PlatformAdminCreate, BillingPlanCreate
        )
        from datetime import datetime
        from decimal import Decimal
        
        # Test creating a platform admin schema
        admin_data = PlatformAdminCreate(
            email="admin@platform.com",
            password="secure123",
            full_name="Platform Administrator",
            permissions=["platform:super_admin"]
        )
        print("✅ Platform admin schema created successfully")
        
        # Test creating a billing plan schema
        plan_data = BillingPlanCreate(
            name="Test Plan",
            plan_type=BillingPlanType.STARTER,
            monthly_price=Decimal("29.99"),
            annual_price=Decimal("299.99"),
            max_users=10,
            max_transactions_per_month=1000,
            features={"feature1": True, "feature2": False}
        )
        print("✅ Billing plan schema created successfully")
        
        # Test enum values
        assert UsageMetricType.API_CALLS == "api_calls"
        assert BillingPlanType.STARTER == "starter"
        print("✅ Enum values working correctly")
        
        return True
        
    except Exception as e:
        print(f"❌ Model creation test failed: {e}")
        return False

def test_docker_environment():
    """Test Docker environment specifics"""
    try:
        print("\n🧪 Testing Docker environment...")
        
        # Check if we're in Docker
        if os.path.exists('/.dockerenv'):
            print("✅ Running inside Docker container")
        else:
            print("ℹ️  Not running inside Docker (testing from host)")
        
        # Test database import (should work if container is configured correctly)
        try:
            from app.database.database import SessionLocal, Base
            print("✅ Database modules imported successfully")
        except Exception as e:
            print(f"⚠️  Database import warning: {e}")
        
        return True
        
    except Exception as e:
        print(f"❌ Docker environment test failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 Testing Platform Models & Schemas (Direct Import Test)")
    print("=" * 70)
    
    tests = [
        ("Platform Imports", test_platform_imports),
        ("Model Creation", test_model_creation),
        ("Docker Environment", test_docker_environment),
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name} test crashed: {e}")
            results.append((test_name, False))
    
    print("\n" + "=" * 70)
    print("📊 DIRECT TEST RESULTS SUMMARY:")
    print("=" * 70)
    
    passed = 0
    failed = 0
    
    for test_name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name:<20} {status}")
        if result:
            passed += 1
        else:
            failed += 1
    
    print(f"\nTotal: {passed} passed, {failed} failed")
    
    if failed == 0:
        print("🎉 All direct tests passed! Platform implementation is working.")
        return 0
    else:
        print(f"⚠️  {failed} test(s) failed.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
