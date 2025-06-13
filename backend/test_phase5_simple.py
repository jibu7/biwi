#!/usr/bin/env python3
"""
Phase 5 Simple End-to-End Test
Creates basic test data and verifies core functionality.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.database.database import get_db
from app import crud, schemas
from datetime import date
from decimal import Decimal

def create_simple_test_data():
    """Create simple test suppliers and transactions"""
    print("🔍 Creating simple test data...")
    
    try:
        db = next(get_db())
        
        # Get company ID
        company_id = db.execute(text('SELECT id FROM companies LIMIT 1')).scalar()
        if not company_id:
            print("❌ No company found")
            return False
        
        print(f"✅ Using company ID: {company_id}")
        
        # Create test supplier with proper schema
        supplier_data = {
            "supplier_code": "TEST001",
            "name": "Test Supplier One",
            "address": {
                "street": "123 Main St",
                "city": "Test City",
                "state": "TS",
                "postal_code": "12345",
                "country": "Test Country"
            },
            "contact_info": {
                "contact_person": "John Doe",
                "email": "john@testsupplier.com",
                "phone": "123-456-7890"
            },
            "payment_terms": "Net 30"
        }
        
        # Check if supplier already exists
        existing = db.query(models.Supplier).filter(
            models.Supplier.supplier_code == supplier_data["supplier_code"],
            models.Supplier.company_id == company_id
        ).first()
        
        if existing:
            print(f"✅ Supplier {supplier_data['supplier_code']} already exists")
            supplier = existing
        else:
            supplier_create = schemas.SupplierCreate(**supplier_data)
            supplier = crud.ap.create_supplier(
                db=db, 
                supplier=supplier_create, 
                company_id=company_id
            )
            print(f"✅ Created supplier: {supplier.supplier_code} - {supplier.name}")
        
        # Get AP transaction types
        transaction_types = crud.ap.get_ap_transaction_types_by_company(db, company_id=company_id)
        invoice_type = next((t for t in transaction_types if t.base_type == "Supplier Invoice"), None)
        
        if not invoice_type:
            print("❌ Supplier Invoice transaction type not found")
            return False
        
        print(f"✅ Found invoice type: {invoice_type.name}")
        
        # Check if test invoice already exists
        existing_invoice = db.query(models.APTransaction).filter(
            models.APTransaction.reference == "TEST-INV-001",
            models.APTransaction.company_id == company_id
        ).first()
        
        if existing_invoice:
            print(f"✅ Test invoice already exists: {existing_invoice.document_number}")
            invoice = existing_invoice
        else:
            # Create test supplier invoice
            invoice_data = {
                "supplier_id": supplier.id,
                "ap_transaction_type_id": invoice_type.id,
                "reference": "TEST-INV-001",
                "transaction_date": date.today(),
                "due_date": date.today(),
                "total_amount": Decimal("1100.00")
            }
            
            invoice_create = schemas.APTransactionCreate(**invoice_data)
            invoice = crud.ap.create_ap_transaction(
                db=db,
                transaction=invoice_create,
                company_id=company_id
            )
            print(f"✅ Created supplier invoice: {invoice.document_number} for ${invoice.total_amount}")
        
        db.commit()
        db.close()
        
        return {
            'supplier': supplier,
            'invoice': invoice,
            'company_id': company_id
        }
        
    except Exception as e:
        print(f"❌ Error creating test data: {e}")
        if 'db' in locals():
            db.rollback()
            db.close()
        return False

def test_data_integrity():
    """Test that created data is accessible and correct"""
    print("\n🔍 Testing data integrity...")
    
    try:
        db = next(get_db())
        
        # Get company and check suppliers
        company_id = db.execute(text('SELECT id FROM companies LIMIT 1')).scalar()
        suppliers = crud.ap.get_suppliers_by_company(db, company_id=company_id)
        
        print(f"✅ Found {len(suppliers)} suppliers")
        
        for supplier in suppliers:
            print(f"   - {supplier.supplier_code}: {supplier.name} (Balance: ${supplier.current_balance})")
            
            # Get transactions for this supplier
            transactions = crud.ap.get_ap_transactions(
                db, 
                company_id=company_id,
                supplier_id=supplier.id
            )
            
            print(f"     Transactions: {len(transactions)}")
            for txn in transactions:
                print(f"     - {txn.document_number}: ${txn.total_amount}")
        
        db.close()
        return True
        
    except Exception as e:
        print(f"❌ Error testing data integrity: {e}")
        return False

def test_ap_transaction_types():
    """Test AP transaction types functionality"""
    print("\n🔍 Testing AP transaction types...")
    
    try:
        db = next(get_db())
        
        company_id = db.execute(text('SELECT id FROM companies LIMIT 1')).scalar()
        transaction_types = crud.ap.get_ap_transaction_types_by_company(db, company_id=company_id)
        
        print(f"✅ Found {len(transaction_types)} AP transaction types")
        
        required_types = ['Supplier Invoice', 'Payment', 'Debit Note']
        found_types = []
        
        for t in transaction_types:
            print(f"   - {t.name} ({t.base_type}) - Direction: {t.affects_balance_direction}")
            if t.base_type in required_types:
                found_types.append(t.base_type)
        
        missing_types = set(required_types) - set(found_types)
        if missing_types:
            print(f"❌ Missing transaction types: {missing_types}")
            return False
        else:
            print("✅ All required transaction types found")
        
        db.close()
        return True
        
    except Exception as e:
        print(f"❌ Error testing transaction types: {e}")
        return False

def test_supplier_crud():
    """Test basic supplier CRUD operations"""
    print("\n🔍 Testing supplier CRUD operations...")
    
    try:
        db = next(get_db())
        
        company_id = db.execute(text('SELECT id FROM companies LIMIT 1')).scalar()
        
        # Test reading suppliers
        suppliers = crud.ap.get_suppliers_by_company(db, company_id=company_id)
        if not suppliers:
            print("❌ No suppliers found")
            return False
        
        # Test reading specific supplier
        supplier = crud.ap.get_supplier(db, suppliers[0].id, company_id)
        if not supplier:
            print("❌ Could not retrieve specific supplier")
            return False
        
        print(f"✅ Successfully retrieved supplier: {supplier.supplier_code}")
        
        # Test supplier data structure
        required_fields = ['id', 'supplier_code', 'name', 'current_balance', 'company_id']
        for field in required_fields:
            if not hasattr(supplier, field):
                print(f"❌ Supplier missing required field: {field}")
                return False
        
        print(f"✅ Supplier has all required fields")
        print(f"   - ID: {supplier.id}")
        print(f"   - Code: {supplier.supplier_code}")
        print(f"   - Name: {supplier.name}")
        print(f"   - Balance: ${supplier.current_balance}")
        
        db.close()
        return True
        
    except Exception as e:
        print(f"❌ Error testing supplier CRUD: {e}")
        return False

def main():
    """Run simplified Phase 5 testing"""
    print("=" * 60)
    print("PHASE 5 SIMPLIFIED END-TO-END TESTING")
    print("=" * 60)
    
    # Import models here to avoid import issues
    global models
    from app import models
    
    tests = [
        ("Create Test Data", lambda: create_simple_test_data() is not False),
        ("Data Integrity", test_data_integrity),
        ("Transaction Types", test_ap_transaction_types),
        ("Supplier CRUD", test_supplier_crud),
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
    print("SIMPLIFIED TEST SUMMARY")
    print("=" * 60)
    print(f"✅ Tests Passed: {passed}")
    print(f"❌ Tests Failed: {failed}")
    print(f"📊 Success Rate: {(passed/(passed+failed)*100):.1f}%")
    
    if failed == 0:
        print("\n🎉 ALL TESTS PASSED! Phase 5 core functionality verified.")
        return True
    else:
        print(f"\n⚠️  {failed} tests failed. Please review the issues.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
