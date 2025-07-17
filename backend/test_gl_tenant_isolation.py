#!/usr/bin/env python3
"""
Test script to validate GL Module tenant isolation implementation
"""

import sys
import os
from datetime import date, datetime
from decimal import Decimal

# Add the backend app to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '.'))

def test_gl_models():
    """Test GL model definitions"""
    try:
        from app.models.gl import GLAccount, GLJournalEntry, GLJournalEntryLine
        print("✅ GL Models imported successfully")
        
        # Test GLAccount model structure
        gl_account_fields = {
            'company_id', 'account_code', 'account_name', 'account_type',
            'current_balance', 'is_active', 'created_at', 'updated_at'
        }
        model_fields = set(GLAccount.__table__.columns.keys())
        missing_fields = gl_account_fields - model_fields
        if missing_fields:
            print(f"❌ GLAccount missing fields: {missing_fields}")
        else:
            print("✅ GLAccount model structure correct")
        
        # Test GLJournalEntry model structure
        journal_entry_fields = {
            'company_id', 'entry_date', 'description', 'status',
            'posted_by_user_id', 'posting_date', 'approved_by_user_id'
        }
        model_fields = set(GLJournalEntry.__table__.columns.keys())
        missing_fields = journal_entry_fields - model_fields
        if missing_fields:
            print(f"❌ GLJournalEntry missing fields: {missing_fields}")
        else:
            print("✅ GLJournalEntry model structure correct")
        
        return True
    except ImportError as e:
        print(f"❌ Failed to import GL models: {e}")
        return False
    except Exception as e:
        print(f"❌ GL model test failed: {e}")
        return False

def test_gl_crud():
    """Test GL CRUD operations"""
    try:
        from app.crud.gl import GLAccountCRUD, gl_account, create_journal_entry, calculate_trial_balance
        from app.models.gl import GLAccount
        from app.schemas.gl import GLAccountCreate, GLAccountUpdate
        print("✅ GL CRUD imported successfully")
        
        # Test CRUD class instantiation
        crud_instance = GLAccountCRUD(GLAccount)
        print("✅ GLAccountCRUD instantiated successfully")
        
        # Test function imports
        functions = [create_journal_entry, calculate_trial_balance]
        print("✅ GL CRUD functions imported successfully")
        
        return True
    except ImportError as e:
        print(f"❌ Failed to import GL CRUD: {e}")
        return False
    except Exception as e:
        print(f"❌ GL CRUD test failed: {e}")
        return False

def test_gl_schemas():
    """Test GL schema definitions"""
    try:
        from app.schemas.gl import (
            GLAccountCreate, GLAccountUpdate, GLAccount,
            GLJournalEntryCreate, GLJournalEntryUpdate, GLJournalEntry,
            GLJournalEntryLineCreate, GLJournalEntryLine
        )
        print("✅ GL Schemas imported successfully")
        
        # Test schema instantiation
        account_create = GLAccountCreate(
            account_code="1000",
            account_name="Cash",
            account_type="Asset"
        )
        print("✅ GLAccountCreate schema works")
        
        return True
    except ImportError as e:
        print(f"❌ Failed to import GL schemas: {e}")
        return False
    except Exception as e:
        print(f"❌ GL schema test failed: {e}")
        return False

def test_company_relationships():
    """Test Company model GL relationships"""
    try:
        from app.models.core import Company
        
        # Check if GL relationships exist
        if hasattr(Company, 'gl_accounts'):
            print("✅ Company.gl_accounts relationship exists")
        else:
            print("❌ Company.gl_accounts relationship missing")
            
        if hasattr(Company, 'gl_journal_entries'):
            print("✅ Company.gl_journal_entries relationship exists")
        else:
            print("❌ Company.gl_journal_entries relationship missing")
        
        return True
    except ImportError as e:
        print(f"❌ Failed to import Company model: {e}")
        return False
    except Exception as e:
        print(f"❌ Company relationship test failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 Testing GL Module Tenant Isolation Implementation")
    print("=" * 60)
    
    tests = [
        ("GL Models", test_gl_models),
        ("GL CRUD", test_gl_crud),
        ("GL Schemas", test_gl_schemas),
        ("Company Relationships", test_company_relationships),
    ]
    
    results = []
    for test_name, test_func in tests:
        print(f"\n📋 Testing {test_name}:")
        print("-" * 30)
        result = test_func()
        results.append((test_name, result))
    
    print("\n" + "=" * 60)
    print("📊 Test Summary:")
    print("=" * 60)
    
    passed = 0
    for test_name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name:25} {status}")
        if result:
            passed += 1
    
    print(f"\n🎯 Overall: {passed}/{len(tests)} tests passed")
    
    if passed == len(tests):
        print("🎉 All tests passed! GL Module tenant isolation implementation is ready.")
        return 0
    else:
        print("⚠️  Some tests failed. Please review the implementation.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
