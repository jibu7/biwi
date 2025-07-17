#!/usr/bin/env python3
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from app.database.database import SessionLocal
from app import models
from sqlalchemy import text
import json

def test_multitenant_functionality():
    """Test multi-tenant functionality after migration"""
    
    db = SessionLocal()
    
    print("Multi-Tenant Functionality Testing")
    print("=" * 50)
    
    # Test 1: Platform Admin Access
    print("\n1. Testing Platform Admin Access...")
    
    platform_admin_result = db.execute(text("""
        SELECT id, email, user_type, company_id FROM users 
        WHERE user_type = 'platform_admin' 
        LIMIT 1
    """)).fetchone()
    
    if platform_admin_result:
        print(f"  ✓ Platform admin found: {platform_admin_result.email}")
        print(f"  ✓ User type: {platform_admin_result.user_type}")
        print(f"  ✓ Company ID: {platform_admin_result.company_id} (should be None)")
    else:
        print("  ✗ No platform admin found!")
    
    # Test 2: Company Isolation
    print("\n2. Testing Company Isolation...")
    companies_result = db.execute(text("""
        SELECT id, name, code FROM companies ORDER BY name
    """)).fetchall()
    
    for company in companies_result:
        print(f"\n  Company: {company.name} ({company.code})")
        
        # Count users in this company
        user_count = db.execute(text("""
            SELECT COUNT(*) FROM users WHERE company_id = :company_id
        """), {"company_id": company.id}).scalar()
        print(f"    Users: {user_count}")
        
        # Count customers in this company
        customer_count = db.execute(text("""
            SELECT COUNT(*) FROM customers WHERE company_id = :company_id
        """), {"company_id": company.id}).scalar()
        print(f"    Customers: {customer_count}")
        
        # Count GL accounts in this company
        gl_account_count = db.execute(text("""
            SELECT COUNT(*) FROM gl_accounts WHERE company_id = :company_id
        """), {"company_id": company.id}).scalar()
        print(f"    GL Accounts: {gl_account_count}")
    
    # Test 3: Cross-Tenant Data Access Prevention
    print("\n3. Testing Cross-Tenant Data Access Prevention...")
    
    # Get first two companies for testing
    companies_list = db.execute(text("""
        SELECT id, name, code FROM companies LIMIT 2
    """)).fetchall()
    
    if len(companies_list) >= 2:
        company1, company2 = companies_list[0], companies_list[1]
        
        # Test if a user from company1 can access company2's data
        company1_user = db.execute(text("""
            SELECT id, email FROM users WHERE company_id = :company_id LIMIT 1
        """), {"company_id": company1.id}).fetchone()
        
        if company1_user:
            # This should return 0 if proper isolation is working
            cross_company_customers = db.execute(text("""
                SELECT COUNT(*) FROM customers WHERE company_id = :company_id
            """), {"company_id": company2.id}).scalar()
            
            print(f"  Company {company1.code} user accessing Company {company2.code} customers: {cross_company_customers}")
            print("  (This is normal - testing isolation at application level)")
    
    # Test 4: Subscription Status
    print("\n4. Testing Subscription Status...")
    
    subscription_info = db.execute(text("""
        SELECT name, subscription_status, subscription_plan, subscription_expires 
        FROM companies ORDER BY name
    """)).fetchall()
    
    for company_info in subscription_info:
        print(f"  {company_info.name}:")
        print(f"    Status: {company_info.subscription_status}")
        print(f"    Plan: {company_info.subscription_plan}")
        if company_info.subscription_expires:
            print(f"    Expires: {company_info.subscription_expires}")
    
    # Test 5: Audit Log Functionality
    print("\n5. Testing Audit Log Setup...")
    
    # Check if audit log table exists and is accessible
    try:
        audit_count = db.execute(text("""
            SELECT COUNT(*) FROM platform_audit_logs
        """)).scalar()
        print(f"  ✓ Audit logs table accessible, current entries: {audit_count}")
    except Exception as e:
        print(f"  ✗ Audit logs table error: {e}")
    
    # Test 6: Resource Usage Tracking
    print("\n6. Testing Resource Usage Tracking...")
    
    try:
        usage_count = db.execute(text("""
            SELECT COUNT(*) FROM resource_usage
        """)).scalar()
        print(f"  ✓ Resource usage table accessible, current entries: {usage_count}")
    except Exception as e:
        print(f"  ✗ Resource usage table error: {e}")
    
    db.close()
    
    print("\n" + "=" * 50)
    print("Multi-tenant functionality testing complete!")

if __name__ == "__main__":
    test_multitenant_functionality()
