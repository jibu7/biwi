#!/usr/bin/env python3
import sys
import os
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

# Set environment variable to use local SQLite for testing
os.environ['DATABASE_URL'] = 'sqlite:///./test.db'

from sqlalchemy import inspect, text, create_engine
from sqlalchemy.orm import sessionmaker
from app import models
import json

def validate_migration():
    """Validate that all tables have been properly migrated"""
    
    # Create engine and session for local testing
    SQLALCHEMY_DATABASE_URL = os.environ.get('DATABASE_URL', 'sqlite:///./test.db')
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    db = SessionLocal()
    inspector = inspect(engine)
    
    print("Multi-Tenant Migration Validation")
    print("=" * 50)
    print(f"Database: {SQLALCHEMY_DATABASE_URL}")
    
    # Check new columns exist
    print("\n1. Checking new columns...")
    
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
    
    # Check constraints (skip for SQLite as constraint checking is different)
    if 'postgresql' in SQLALCHEMY_DATABASE_URL:
        print("\n2. Checking constraints...")
        
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
    else:
        print("\n2. Skipping constraint checks for SQLite...")
    
    # Check existing data integrity
    print("\n3. Checking data integrity...")
    
    try:
        # Check all companies have codes
        companies_without_codes = db.query(models.Company).filter(
            models.Company.code == None
        ).count()
        
        if companies_without_codes == 0:
            print("  ✓ All companies have codes")
        else:
            print(f"  ✗ {companies_without_codes} companies without codes!")
    except Exception as e:
        print(f"  ✗ Error checking companies: {e}")
    
    try:
        # Check non-platform users have company_id
        orphaned_users = db.query(models.User).filter(
            models.User.user_type != models.UserType.PLATFORM_ADMIN,
            models.User.company_id == None
        ).count()
        
        if orphaned_users == 0:
            print("  ✓ All non-platform users have company_id")
        else:
            print(f"  ✗ {orphaned_users} non-platform users without company_id!")
    except Exception as e:
        print(f"  ✗ Error checking users: {e}")
    
    # Check for cross-tenant references
    print("\n4. Checking for potential cross-tenant references...")
    
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
    except Exception as e:
        print(f"  ✗ Error checking cross-tenant references: {e}")
    
    db.close()
    
    print("\n" + "=" * 50)
    print("Validation complete!")

if __name__ == "__main__":
    validate_migration()
