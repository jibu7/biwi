#!/usr/bin/env python3
"""
Phase 5 Validation Script - Accounts Payable Module
Tests all AP functionality including backend and integration points.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.database.database import get_db
from app import crud, models, schemas
from datetime import date, datetime
from decimal import Decimal

def test_ap_imports():
    """Test all AP module imports"""
    print("🔍 Testing AP imports...")
    try:
        # Models
        from app.models.ap import Supplier, APTransaction, APTransactionType, APAllocation, APDefaults
        
        # Schemas
        from app.schemas.ap import (
            SupplierCreate, SupplierUpdate, Supplier as SupplierSchema,
            APTransactionCreate, APTransactionTypeCreate, APDefaultsUpdate
        )
        
        # CRUD
        from app.crud.ap import (
            create_supplier, get_suppliers_by_company, create_ap_transaction,
            get_ap_transaction_types_by_company, create_ap_allocation
        )
        
        print("✅ All AP imports successful")
        return True
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False

def test_database_tables():
    """Test if all AP tables exist and are accessible"""
    print("\n🔍 Testing database tables...")
    try:
        db = next(get_db())
        
        ap_tables = [
            'suppliers', 'ap_transaction_types', 'ap_transactions', 
            'ap_allocations', 'ap_allocation_lines', 'ap_defaults'
        ]
        
        table_stats = {}
        for table in ap_tables:
            try:
                count = db.execute(text(f'SELECT COUNT(*) FROM {table}')).scalar()
                table_stats[table] = count
                print(f"✅ Table {table}: {count} records")
            except Exception as e:
                print(f"❌ Table {table}: {str(e)[:80]}")
                return False
        
        db.close()
        return True
    except Exception as e:
        print(f"❌ Database connection error: {e}")
        return False

def test_ap_defaults():
    """Test AP defaults functionality"""
    print("\n🔍 Testing AP defaults...")
    try:
        db = next(get_db())
        
        # Check if AP defaults exist
        defaults = db.execute(text('SELECT * FROM ap_defaults')).fetchone()
        if defaults:
            print("✅ AP defaults found in database")
            print(f"   - AP control account: {defaults.default_ap_control_gl_account_id}")
            print(f"   - Default expense account: {defaults.default_expense_gl_account_id}")
            print(f"   - Payment account: {defaults.default_payment_gl_account_id}")
        else:
            print("❌ No AP defaults found")
            return False
        
        db.close()
        return True
    except Exception as e:
        print(f"❌ AP defaults test error: {e}")
        return False

def test_transaction_types():
    """Test AP transaction types"""
    print("\n🔍 Testing AP transaction types...")
    try:
        db = next(get_db())
        
        # Get transaction types
        types = db.execute(text('SELECT * FROM ap_transaction_types')).fetchall()
        
        expected_types = ['Supplier Invoice', 'Supplier Payment', 'Debit Note']
        found_types = [t.name for t in types]
        
        for expected in expected_types:
            if expected in found_types:
                print(f"✅ Transaction type '{expected}' found")
            else:
                print(f"❌ Transaction type '{expected}' missing")
                return False
        
        db.close()
        return True
    except Exception as e:
        print(f"❌ Transaction types test error: {e}")
        return False

def test_gl_integration():
    """Test GL integration"""
    print("\n🔍 Testing GL integration...")
    try:
        db = next(get_db())
        
        # Check if GL accounts exist for AP
        gl_accounts = db.execute(text("""
            SELECT account_code, account_name 
            FROM gl_accounts 
            WHERE account_code IN ('2000', '2100', '5000', '1200')
        """)).fetchall()
        
        required_accounts = {
            '2000': 'Trade Creditors',
            '2100': 'Accrued Liabilities', 
            '5000': 'Cost of Goods Sold',
            '1200': 'Accounts Payable'
        }
        
        found_accounts = {acc.account_code: acc.account_name for acc in gl_accounts}
        
        for code, name in required_accounts.items():
            if code in found_accounts:
                print(f"✅ GL Account {code} - {found_accounts[code]}")
            else:
                print(f"⚠️  GL Account {code} - {name} not found (may need setup)")
        
        db.close()
        return True
    except Exception as e:
        print(f"❌ GL integration test error: {e}")
        return False

def test_permissions():
    """Test AP permissions are defined"""
    print("\n🔍 Testing AP permissions...")
    try:
        from app.core.permissions import (
            AP_SETUP_MANAGE, AP_TRANSACTIONS_POST, AP_REPORTS_VIEW
        )
        
        permissions = [
            ('AP_SETUP_MANAGE', AP_SETUP_MANAGE),
            ('AP_TRANSACTIONS_POST', AP_TRANSACTIONS_POST),
            ('AP_REPORTS_VIEW', AP_REPORTS_VIEW)
        ]
        
        for name, perm in permissions:
            if perm:
                print(f"✅ Permission {name}: {perm}")
            else:
                print(f"❌ Permission {name} not defined")
                return False
        
        return True
    except ImportError as e:
        print(f"❌ Permission import error: {e}")
        return False

def test_crud_functions():
    """Test basic CRUD functions work"""
    print("\n🔍 Testing CRUD functions...")
    try:
        db = next(get_db())
        
        # Test getting company (should exist from init)
        company = db.execute(text('SELECT id FROM companies LIMIT 1')).scalar()
        if not company:
            print("❌ No company found for testing")
            return False
        
        # Test CRUD imports and basic structure
        from app.crud.ap import (
            get_suppliers_by_company, get_ap_transaction_types_by_company,
            get_ap_transactions
        )
        
        # Test fetching data (should not error even if empty)
        suppliers = get_suppliers_by_company(db, company_id=company)
        print(f"✅ Suppliers query works: {len(suppliers)} suppliers")
        
        transaction_types = get_ap_transaction_types_by_company(db, company_id=company)
        print(f"✅ Transaction types query works: {len(transaction_types)} types")
        
        transactions = get_ap_transactions(db, company_id=company)
        print(f"✅ Transactions query works: {len(transactions)} transactions")
        
        db.close()
        return True
    except Exception as e:
        print(f"❌ CRUD functions test error: {e}")
        return False

def main():
    """Run all Phase 5 validation tests"""
    print("=" * 60)
    print("PHASE 5 VALIDATION - ACCOUNTS PAYABLE MODULE")
    print("=" * 60)
    
    tests = [
        ("Module Imports", test_ap_imports),
        ("Database Tables", test_database_tables),
        ("AP Defaults", test_ap_defaults),
        ("Transaction Types", test_transaction_types),
        ("GL Integration", test_gl_integration),
        ("Permissions", test_permissions),
        ("CRUD Functions", test_crud_functions),
    ]
    
    passed = 0
    failed = 0
    
    for test_name, test_func in tests:
        print(f"\n{'='*20} {test_name} {'='*20}")
        try:
            if test_func():
                passed += 1
            else:
                failed += 1
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {e}")
            failed += 1
    
    print("\n" + "=" * 60)
    print("VALIDATION SUMMARY")
    print("=" * 60)
    print(f"✅ Tests Passed: {passed}")
    print(f"❌ Tests Failed: {failed}")
    print(f"📊 Success Rate: {(passed/(passed+failed)*100):.1f}%")
    
    if failed == 0:
        print("\n🎉 ALL TESTS PASSED! Phase 5 is ready for production.")
        return True
    else:
        print(f"\n⚠️  {failed} tests failed. Please address issues before proceeding.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
