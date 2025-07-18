#!/usr/bin/env python3
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from sqlalchemy import inspect, text
from app.database.database import engine, SessionLocal
from app import models
import json

def validate_migration():
    """Validate that all tables have been properly migrated"""
    
    print("Multi-Tenant Migration Validation")
    print("=" * 50)
    
    # Check new columns exist
    print("\n1. Checking new columns...")
    
    inspector = inspect(engine)
    required_columns = {
        'users': ['user_type', 'default_company_id', 'last_login', 'mfa_secret'],
        'companies': ['code', 'subscription_status', 'subscription_plan', 'storage_limit_gb'],
        'platform_audit_logs': ['id', 'user_id', 'company_id', 'action'],
        'resource_usage': ['id', 'company_id', 'resource_type'],
    }
    
    for table, columns in required_columns.items():
        print(f"\nTable: {table}")
        try:
            table_columns = [col['name'] for col in inspector.get_columns(table)]
            for col in columns:
                if col in table_columns:
                    print(f"  ✓ {col}")
                else:
                    print(f"  ✗ {col} - MISSING!")
        except Exception as e:
            print(f"  ✗ Table doesn't exist: {e}")
    
    # Check constraints
    print("\n2. Checking constraints...")
    
    db = SessionLocal()
    try:
        constraints_to_check = [
            ('users', 'ck_company_required_for_non_platform_users'),
            ('companies', 'uq_company_code'),
            ('gl_accounts', 'uq_glaccount_code_company'),
        ]
        
        for table, constraint in constraints_to_check:
            result = db.execute(text(f"""
                SELECT COUNT(*) 
                FROM information_schema.table_constraints 
                WHERE table_name = '{table}' 
                AND constraint_name = '{constraint}'
            """)).scalar()
            
            if result > 0:
                print(f"  ✓ {table}.{constraint}")
            else:
                print(f"  ✗ {table}.{constraint} - MISSING!")
        
        db.commit()
    except Exception as e:
        print(f"  ✗ Error checking constraints: {e}")
        db.rollback()
    finally:
        db.close()
    
    # Check existing data integrity
    print("\n3. Checking data integrity...")
    
    db = SessionLocal()
    try:
        # Check all companies have codes
        companies_without_codes = db.execute(text("""
            SELECT COUNT(*) FROM companies WHERE code IS NULL
        """)).scalar()
        
        if companies_without_codes == 0:
            print("  ✓ All companies have codes")
        else:
            print(f"  ✗ {companies_without_codes} companies without codes!")
        
        # Check non-platform users have company_id
        orphaned_users = db.execute(text("""
            SELECT COUNT(*) FROM users 
            WHERE user_type != 'platform_admin' AND company_id IS NULL
        """)).scalar()
        
        if orphaned_users == 0:
            print("  ✓ All non-platform users have company_id")
        else:
            print(f"  ✗ {orphaned_users} non-platform users without company_id!")
        
        db.commit()
    except Exception as e:
        print(f"  ✗ Error checking data integrity: {e}")
        db.rollback()
    finally:
        db.close()
    
    # Check for cross-tenant references
    print("\n4. Checking for potential cross-tenant references...")
    
    db = SessionLocal()
    try:
        # Example: Check if any AR transactions reference customers from different companies
        cross_tenant_ar = db.execute(text("""
            SELECT COUNT(*) 
            FROM ar_transactions art
            JOIN customers c ON art.customer_id = c.id
            WHERE art.company_id != c.company_id
        """)).scalar()
        
        if cross_tenant_ar == 0:
            print("  ✓ No cross-tenant AR transactions")
        else:
            print(f"  ✗ {cross_tenant_ar} cross-tenant AR transactions found!")
        
        db.commit()
    except Exception as e:
        print(f"  ✗ Error checking cross-tenant references: {e}")
        db.rollback()
    finally:
        db.close()
    
    # Check platform capabilities
    print("\n5. Checking platform capabilities...")
    
    db = SessionLocal()
    try:
        # Check if platform admin users exist
        platform_admin_count = db.execute(text("""
            SELECT COUNT(*) FROM users WHERE user_type = 'platform_admin'
        """)).scalar()
        
        if platform_admin_count > 0:
            print(f"  ✓ {platform_admin_count} platform admin(s) exist")
        else:
            print("  ✗ No platform admins found!")
        
        # Check company count
        company_count = db.execute(text("""
            SELECT COUNT(*) FROM companies
        """)).scalar()
        
        print(f"  ✓ {company_count} companies in system")
        
        # Check user distribution
        user_stats = db.execute(text("""
            SELECT user_type, COUNT(*) as count 
            FROM users 
            GROUP BY user_type
        """)).fetchall()
        
        print("  User distribution:")
        for user_type, count in user_stats:
            print(f"    {user_type}: {count}")
        
        db.commit()
    except Exception as e:
        print(f"  ✗ Error checking platform capabilities: {e}")
        db.rollback()
    finally:
        db.close()
    
    print("\n" + "=" * 50)
    print("Validation complete!")

if __name__ == "__main__":
    validate_migration()
