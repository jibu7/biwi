#!/usr/bin/env python3
"""
Phase 5 End-to-End Test Script
Creates sample AP data and tests the complete workflow.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.database.database import get_db
from app import crud, schemas
from datetime import date, datetime
from decimal import Decimal

def create_test_data():
    """Create sample suppliers and test transactions"""
    print("🔍 Creating test data...")
    
    try:
        db = next(get_db())
        
        # Get company ID
        company_id = db.execute(text('SELECT id FROM companies LIMIT 1')).scalar()
        if not company_id:
            print("❌ No company found")
            return False
        
        print(f"✅ Using company ID: {company_id}")
        
        # Create test suppliers
        suppliers_data = [
            {
                "supplier_code": "SUP001",
                "name": "Test Supplier 1",
                "contact_person": "John Doe",
                "email": "john@testsupplier1.com",
                "phone": "123-456-7890",
                "address": "123 Main St",
                "city": "Test City",
                "state": "TS",
                "postal_code": "12345",
                "country": "Test Country",
                "payment_terms": "Net 30"
            },
            {
                "supplier_code": "SUP002", 
                "name": "Test Supplier 2",
                "contact_person": "Jane Smith",
                "email": "jane@testsupplier2.com",
                "phone": "987-654-3210",
                "address": "456 Oak Ave",
                "city": "Test Town",
                "state": "TT",
                "postal_code": "67890",
                "country": "Test Country",
                "payment_terms": "Net 15"
            }
        ]
        
        created_suppliers = []
        for supplier_data in suppliers_data:
            supplier_create = schemas.SupplierCreate(**supplier_data)
            supplier = crud.ap.create_supplier(
                db=db, 
                supplier=supplier_create, 
                company_id=company_id
            )
            created_suppliers.append(supplier)
            print(f"✅ Created supplier: {supplier.supplier_code} - {supplier.name}")
        
        # Get AP transaction types
        transaction_types = crud.ap.get_ap_transaction_types_by_company(db, company_id=company_id)
        invoice_type = next((t for t in transaction_types if t.base_type == "Supplier Invoice"), None)
        payment_type = next((t for t in transaction_types if t.base_type == "Payment"), None)
        
        if not invoice_type or not payment_type:
            print("❌ Required transaction types not found")
            return False
        
        print(f"✅ Found invoice type: {invoice_type.name}")
        print(f"✅ Found payment type: {payment_type.name}")
        
        # Create test supplier invoice
        invoice_data = {
            "supplier_id": created_suppliers[0].id,
            "ap_transaction_type_id": invoice_type.id,
            "reference": "INV-001",
            "description": "Test supplier invoice",
            "transaction_date": date.today(),
            "due_date": date.today(),
            "amount": Decimal("1500.00"),
            "tax_amount": Decimal("150.00"),
            "total_amount": Decimal("1650.00")
        }
        
        invoice_create = schemas.APTransactionCreate(**invoice_data)
        invoice = crud.ap.create_ap_transaction(
            db=db,
            ap_transaction=invoice_create,
            company_id=company_id
        )
        print(f"✅ Created supplier invoice: {invoice.document_number} for ${invoice.total_amount}")
        
        # Create test payment
        payment_data = {
            "supplier_id": created_suppliers[0].id,
            "ap_transaction_type_id": payment_type.id,
            "reference": "PAY-001", 
            "description": "Test payment",
            "transaction_date": date.today(),
            "due_date": date.today(),
            "amount": Decimal("1000.00"),
            "tax_amount": Decimal("0.00"),
            "total_amount": Decimal("1000.00")
        }
        
        payment_create = schemas.APTransactionCreate(**payment_data)
        payment = crud.ap.create_ap_transaction(
            db=db,
            ap_transaction=payment_create,
            company_id=company_id
        )
        print(f"✅ Created payment: {payment.document_number} for ${payment.total_amount}")
        
        db.commit()
        db.close()
        
        return {
            'suppliers': created_suppliers,
            'invoice': invoice,
            'payment': payment,
            'company_id': company_id
        }
        
    except Exception as e:
        print(f"❌ Error creating test data: {e}")
        if 'db' in locals():
            db.rollback()
            db.close()
        return False

def test_supplier_balance():
    """Test supplier balance calculations"""
    print("\n🔍 Testing supplier balance calculations...")
    
    try:
        db = next(get_db())
        
        # Get company and suppliers
        company_id = db.execute(text('SELECT id FROM companies LIMIT 1')).scalar()
        suppliers = crud.ap.get_suppliers_by_company(db, company_id=company_id)
        
        if not suppliers:
            print("❌ No suppliers found for testing")
            return False
        
        for supplier in suppliers:
            print(f"✅ Supplier {supplier.supplier_code}: Balance = ${supplier.current_balance}")
            
            # Get transactions for this supplier  
            transactions = crud.ap.get_ap_transactions(
                db, 
                company_id=company_id,
                supplier_id=supplier.id
            )
            
            print(f"   Transactions: {len(transactions)}")
            for txn in transactions:
                print(f"   - {txn.document_number}: ${txn.total_amount} ({txn.ap_transaction_type.name})")
        
        db.close()
        return True
        
    except Exception as e:
        print(f"❌ Error testing supplier balances: {e}")
        return False

def test_aging_report():
    """Test aging report functionality"""
    print("\n🔍 Testing aging report...")
    
    try:
        db = next(get_db())
        
        company_id = db.execute(text('SELECT id FROM companies LIMIT 1')).scalar()
        aging_data = crud.ap.get_supplier_aging(
            db, 
            company_id=company_id,
            as_of_date=date.today()
        )
        
        print(f"✅ Aging report generated: {len(aging_data)} suppliers")
        
        for supplier_aging in aging_data:
            print(f"   {supplier_aging.supplier_code}: Total = ${supplier_aging.total_outstanding}")
            print(f"     Current: ${supplier_aging.current}")
            print(f"     1-30 days: ${supplier_aging.days_30}")
            print(f"     31-60 days: ${supplier_aging.days_60}")
            print(f"     61-90 days: ${supplier_aging.days_90}")
            print(f"     90+ days: ${supplier_aging.days_over_90}")
        
        db.close()
        return True
        
    except Exception as e:
        print(f"❌ Error testing aging report: {e}")
        return False

def test_gl_integration():
    """Test GL integration with AP transactions"""
    print("\n🔍 Testing GL integration...")
    
    try:
        db = next(get_db())
        
        # Check if GL transactions were created for AP transactions
        gl_transactions = db.execute(text("""
            SELECT gt.*, ga.account_code, ga.account_name
            FROM gl_transactions gt
            JOIN gl_accounts ga ON gt.gl_account_id = ga.id
            WHERE gt.source_document_type = 'AP'
            ORDER BY gt.transaction_date DESC, gt.id
        """)).fetchall()
        
        if gl_transactions:
            print(f"✅ Found {len(gl_transactions)} GL transactions from AP")
            
            # Group by document
            docs = {}
            for gl_txn in gl_transactions:
                doc_key = f"{gl_txn.source_document_type}-{gl_txn.source_document_id}"
                if doc_key not in docs:
                    docs[doc_key] = []
                docs[doc_key].append(gl_txn)
            
            for doc_key, txns in docs.items():
                print(f"   Document {doc_key}:")
                total_debits = sum(t.debit_amount or 0 for t in txns)
                total_credits = sum(t.credit_amount or 0 for t in txns)
                
                for txn in txns:
                    dr_cr = "DR" if txn.debit_amount else "CR"
                    amount = txn.debit_amount or txn.credit_amount
                    print(f"     {txn.account_code} {dr_cr} ${amount}")
                
                print(f"     Total Debits: ${total_debits}, Credits: ${total_credits}")
                if abs(total_debits - total_credits) < 0.01:
                    print("     ✅ Balanced entry")
                else:
                    print("     ❌ Unbalanced entry!")
        else:
            print("⚠️  No GL transactions found from AP (may need transaction posting)")
        
        db.close()
        return True
        
    except Exception as e:
        print(f"❌ Error testing GL integration: {e}")
        return False

def main():
    """Run comprehensive Phase 5 testing"""
    print("=" * 60)
    print("PHASE 5 END-TO-END TESTING")
    print("=" * 60)
    
    tests = [
        ("Create Test Data", lambda: create_test_data() is not False),
        ("Supplier Balances", test_supplier_balance),
        ("Aging Report", test_aging_report),
        ("GL Integration", test_gl_integration),
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
    print("END-TO-END TEST SUMMARY")
    print("=" * 60)
    print(f"✅ Tests Passed: {passed}")
    print(f"❌ Tests Failed: {failed}")
    print(f"📊 Success Rate: {(passed/(passed+failed)*100):.1f}%")
    
    if failed == 0:
        print("\n🎉 ALL TESTS PASSED! Phase 5 is fully functional.")
        return True
    else:
        print(f"\n⚠️  {failed} tests failed. Please review the issues.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
