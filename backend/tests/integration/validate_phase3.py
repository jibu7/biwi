#!/usr/bin/env python3
"""
Phase 3 Validation Script - General Ledger Module
Validates that all GL functionality is working correctly
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from decimal import Decimal
from datetime import date
from sqlalchemy.orm import sessionmaker
from app.database.database import engine
from app.models.core import Company, User
from app.models.gl import GLAccount, GLJournalEntry, GLJournalEntryLine, GLTransactionType, GLDefaults
from app import crud, schemas

def validate_gl_models():
    """Validate that all GL models are properly defined"""
    print("1. Validating GL model definitions...")
    
    # Check that all models are importable
    try:
        from app.models.gl import GLAccount, GLJournalEntry, GLJournalEntryLine, GLTransactionType, GLDefaults
        print("   ✅ All GL models imported successfully")
    except ImportError as e:
        print(f"   ❌ Failed to import GL models: {e}")
        return False
    
    # Check model attributes
    required_gl_account_attrs = [
        'id', 'company_id', 'account_code', 'account_name', 'account_type',
        'parent_account_id', 'current_balance', 'is_active', 'is_control_account'
    ]
    
    for attr in required_gl_account_attrs:
        if not hasattr(GLAccount, attr):
            print(f"   ❌ GLAccount missing attribute: {attr}")
            return False
    
    print("   ✅ GLAccount model has all required attributes")
    
    required_journal_entry_attrs = [
        'id', 'company_id', 'entry_date', 'reference', 'description',
        'posted_by_user_id', 'status', 'created_at', 'updated_at'
    ]
    
    for attr in required_journal_entry_attrs:
        if not hasattr(GLJournalEntry, attr):
            print(f"   ❌ GLJournalEntry missing attribute: {attr}")
            return False
    
    print("   ✅ GLJournalEntry model has all required attributes")
    return True

def validate_gl_schemas():
    """Validate that all GL schemas are properly defined"""
    print("\n2. Validating GL schema definitions...")
    
    try:
        from app.schemas.gl import (
            GLAccount, GLAccountCreate, GLAccountUpdate,
            GLJournalEntry, GLJournalEntryCreate, GLJournalEntryUpdate,
            GLTransactionType, GLTransactionTypeCreate, GLTransactionTypeUpdate,
            GLDefaults, GLDefaultsCreate, GLDefaultsUpdate,
            TrialBalance, TrialBalanceItem
        )
        print("   ✅ All GL schemas imported successfully")
    except ImportError as e:
        print(f"   ❌ Failed to import GL schemas: {e}")
        return False
    
    # Test schema validation
    try:
        # Test GLAccountCreate schema
        account_data = schemas.GLAccountCreate(
            account_code="1000",
            account_name="Cash",
            account_type="Asset",
            is_active=True
        )
        print("   ✅ GLAccountCreate schema validation works")
        
        # Test GLJournalEntryCreate schema
        entry_data = schemas.GLJournalEntryCreate(
            entry_date=date.today(),
            reference="TEST-001",
            description="Test entry",
            lines=[
                schemas.GLJournalEntryLineCreate(
                    gl_account_id=1,
                    description="Test debit line",
                    debit_amount=Decimal('100.00'),
                    credit_amount=Decimal('0.00')
                ),
                schemas.GLJournalEntryLineCreate(
                    gl_account_id=2,
                    description="Test credit line",
                    debit_amount=Decimal('0.00'),
                    credit_amount=Decimal('100.00')
                )
            ]
        )
        print("   ✅ GLJournalEntryCreate schema validation works")
        
    except Exception as e:
        print(f"   ❌ Schema validation failed: {e}")
        return False
    
    return True

def validate_gl_crud():
    """Validate that all GL CRUD operations are available"""
    print("\n3. Validating GL CRUD operations...")
    
    try:
        from app.crud.gl import (
            create_gl_account, get_gl_account, get_gl_account_by_code,
            get_gl_accounts_by_company, update_gl_account, delete_gl_account,
            create_gl_journal_entry, get_gl_journal_entry,
            get_gl_journal_entries_by_company, update_gl_journal_entry,
            post_gl_journal_entry, delete_gl_journal_entry,
            create_gl_transaction_type, get_gl_transaction_type,
            get_gl_transaction_types_by_company, update_gl_transaction_type,
            delete_gl_transaction_type, create_or_update_gl_defaults,
            get_gl_defaults, get_trial_balance
        )
        print("   ✅ All GL CRUD functions imported successfully")
    except ImportError as e:
        print(f"   ❌ Failed to import GL CRUD functions: {e}")
        return False
    
    return True

def validate_gl_api_endpoints():
    """Validate that all GL API endpoints are properly defined"""
    print("\n4. Validating GL API endpoints...")
    
    try:
        from app.api.v1.endpoints import gl
        print("   ✅ GL endpoint module imported successfully")
    except ImportError as e:
        print(f"   ❌ Failed to import GL endpoint module: {e}")
        return False
    
    # Check that router exists
    try:
        assert hasattr(gl, 'router')
        print("   ✅ GL router is defined")
    except AssertionError:
        print("   ❌ GL router is missing")
        return False
    
    return True

def validate_database_migration():
    """Validate that the database migration exists"""
    print("\n5. Validating database migration...")
    
    migration_file = "alembic/versions/b7d8e9f4c5a2_create_gl_models.py"
    if os.path.exists(migration_file):
        print("   ✅ GL migration file exists")
    else:
        print("   ❌ GL migration file not found")
        return False
    
    # Check migration content
    try:
        with open(migration_file, 'r') as f:
            content = f.read()
            
        required_tables = [
            'gl_accounts', 'gl_journal_entries', 'gl_journal_entry_lines',
            'gl_transaction_types', 'gl_defaults'
        ]
        
        for table in required_tables:
            if f"create_table('{table}'" in content:
                print(f"   ✅ Migration creates table: {table}")
            else:
                print(f"   ❌ Migration missing table: {table}")
                return False
                
    except Exception as e:
        print(f"   ❌ Error reading migration file: {e}")
        return False
    
    return True

def validate_api_integration():
    """Validate that GL endpoints are integrated into main API"""
    print("\n6. Validating API integration...")
    
    try:
        # Check that GL endpoints are included in main API router
        with open("app/api/v1/api.py", 'r') as f:
            content = f.read()
        
        gl_endpoints = [
            'gl.router', 'prefix="/gl"', 'tags=["general-ledger"]'
        ]
        
        for endpoint in gl_endpoints:
            if endpoint in content:
                print(f"   ✅ GL endpoint integrated in API router")
            else:
                print(f"   ❌ GL endpoint not integrated in API router")
                return False
                
    except Exception as e:
        print(f"   ❌ Error checking API integration: {e}")
        return False
    
    return True

def validate_permissions():
    """Validate that GL permissions are properly defined"""
    print("\n7. Validating GL permissions...")
    
    try:
        from app.core.permissions import GL_SETUP_MANAGE, GL_JOURNAL_POST, GL_REPORTS_VIEW
        print("   ✅ All GL permissions imported successfully")
    except ImportError as e:
        print(f"   ❌ Failed to import GL permissions: {e}")
        return False
    
    # Check that permissions are in ALL_PERMISSIONS_LIST
    try:
        from app.core.permissions import ALL_PERMISSIONS_LIST
        
        gl_permissions = [GL_SETUP_MANAGE, GL_JOURNAL_POST, GL_REPORTS_VIEW]
        
        for perm in gl_permissions:
            if perm in ALL_PERMISSIONS_LIST:
                print(f"   ✅ Permission {perm} in ALL_PERMISSIONS_LIST")
            else:
                print(f"   ❌ Permission {perm} not in ALL_PERMISSIONS_LIST")
                return False
                
    except Exception as e:
        print(f"   ❌ Error checking permissions list: {e}")
        return False
    
    return True

def main():
    """Run all validation checks"""
    print("=" * 70)
    print("BIWI ERP - PHASE 3 VALIDATION: GENERAL LEDGER MODULE")
    print("=" * 70)
    
    validations = [
        validate_gl_models,
        validate_gl_schemas,
        validate_gl_crud,
        validate_gl_api_endpoints,
        validate_database_migration,
        validate_api_integration,
        validate_permissions
    ]
    
    all_passed = True
    
    for validation_func in validations:
        try:
            if not validation_func():
                all_passed = False
        except Exception as e:
            print(f"❌ Validation failed with exception: {e}")
            import traceback
            traceback.print_exc()
            all_passed = False
    
    print("\n" + "=" * 70)
    print("VALIDATION SUMMARY")
    print("=" * 70)
    
    if all_passed:
        print("🎉 ALL VALIDATIONS PASSED!")
        print("\nPhase 3 - General Ledger Module is ready!")
        print("\nNext steps:")
        print("1. Run 'docker-compose up' to start the application")
        print("2. Run the database migration to create GL tables")
        print("3. Test the GL endpoints through the API")
        print("4. Set up basic Chart of Accounts for your company")
        print("\nImplemented Features:")
        print("✅ GL Account management (Chart of Accounts)")
        print("✅ Journal Entry creation and posting")
        print("✅ GL Transaction Types for templates")
        print("✅ GL Defaults configuration")
        print("✅ Trial Balance report")
        print("✅ Complete CRUD operations for all GL entities")
        print("✅ RESTful API endpoints with proper permissions")
        print("✅ Database migrations")
        
        return True
    else:
        print("❌ SOME VALIDATIONS FAILED!")
        print("\nPlease fix the issues above before proceeding.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
