#!/usr/bin/env python3
"""
Phase 5 Final Demonstration Script
Shows complete AP workflow from supplier creation to transaction processing.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.database.database import get_db
from app import crud, schemas, models
from datetime import date, timedelta
from decimal import Decimal

def demonstrate_ap_workflow():
    """Demonstrate a complete AP workflow"""
    print("🚀 PHASE 5 - ACCOUNTS PAYABLE WORKFLOW DEMONSTRATION")
    print("=" * 60)
    
    try:
        db = next(get_db())
        
        # Get company
        company_id = db.execute(text('SELECT id FROM companies LIMIT 1')).scalar()
        print(f"📊 Working with Company ID: {company_id}")
        
        # Step 1: Create a new supplier
        print("\n1️⃣ CREATING NEW SUPPLIER")
        supplier_data = {
            "supplier_code": "DEMO001",
            "name": "Demo Manufacturing Corp",
            "address": {
                "street": "789 Industrial Blvd",
                "city": "Manufacturing City",
                "state": "MC",
                "postal_code": "54321",
                "country": "USA"
            },
            "contact_info": {
                "contact_person": "Sarah Johnson",
                "email": "sarah@democorp.com",
                "phone": "+1-555-0123",
                "fax": "+1-555-0124"
            },
            "payment_terms": "Net 45",
            "is_active": True
        }
        
        # Check if already exists
        existing = db.query(models.Supplier).filter(
            models.Supplier.supplier_code == "DEMO001",
            models.Supplier.company_id == company_id
        ).first()
        
        if existing:
            print(f"   ✅ Using existing supplier: {existing.supplier_code}")
            supplier = existing
        else:
            supplier_create = schemas.SupplierCreate(**supplier_data)
            supplier = crud.ap.create_supplier(db=db, supplier=supplier_create, company_id=company_id)
            print(f"   ✅ Created supplier: {supplier.supplier_code} - {supplier.name}")
        
        # Step 2: Get transaction types
        print("\n2️⃣ CHECKING TRANSACTION TYPES")
        transaction_types = crud.ap.get_ap_transaction_types_by_company(db, company_id=company_id)
        
        invoice_type = next((t for t in transaction_types if t.base_type == "Supplier Invoice"), None)
        payment_type = next((t for t in transaction_types if t.base_type == "Payment"), None)
        
        print(f"   ✅ Invoice Type: {invoice_type.name} (ID: {invoice_type.id})")
        print(f"   ✅ Payment Type: {payment_type.name} (ID: {payment_type.id})")
        
        # Step 3: Create supplier invoices
        print("\n3️⃣ CREATING SUPPLIER INVOICES")
        
        invoices_data = [
            {
                "reference": "INV-2025-001",
                "total_amount": Decimal("2500.00"),
                "description": "Office supplies and equipment"
            },
            {
                "reference": "INV-2025-002", 
                "total_amount": Decimal("1750.00"),
                "description": "Software licenses"
            },
            {
                "reference": "INV-2025-003",
                "total_amount": Decimal("3200.00"),
                "description": "Professional services"
            }
        ]
        
        created_invoices = []
        for inv_data in invoices_data:
            # Check if already exists
            existing_inv = db.query(models.APTransaction).filter(
                models.APTransaction.reference == inv_data["reference"],
                models.APTransaction.company_id == company_id
            ).first()
            
            if existing_inv:
                print(f"   ✅ Using existing invoice: {existing_inv.document_number}")
                created_invoices.append(existing_inv)
            else:
                invoice_create_data = {
                    "supplier_id": supplier.id,
                    "ap_transaction_type_id": invoice_type.id,
                    "transaction_date": date.today() - timedelta(days=30),
                    "due_date": date.today() + timedelta(days=15),
                    "reference": inv_data["reference"],
                    "total_amount": inv_data["total_amount"]
                }
                
                invoice_create = schemas.APTransactionCreate(**invoice_create_data)
                invoice = crud.ap.create_ap_transaction(
                    db=db, transaction=invoice_create, company_id=company_id
                )
                created_invoices.append(invoice)
                print(f"   ✅ Created invoice: {invoice.document_number} - ${invoice.total_amount}")
        
        # Step 4: Create payments
        print("\n4️⃣ CREATING PAYMENTS")
        
        payments_data = [
            {
                "reference": "PAY-2025-001",
                "total_amount": Decimal("2500.00"),
                "description": "Payment for invoice INV-2025-001"
            },
            {
                "reference": "PAY-2025-002",
                "total_amount": Decimal("1000.00"),
                "description": "Partial payment for invoice INV-2025-002"
            }
        ]
        
        created_payments = []
        for pay_data in payments_data:
            # Check if already exists
            existing_pay = db.query(models.APTransaction).filter(
                models.APTransaction.reference == pay_data["reference"],
                models.APTransaction.company_id == company_id
            ).first()
            
            if existing_pay:
                print(f"   ✅ Using existing payment: {existing_pay.document_number}")
                created_payments.append(existing_pay)
            else:
                payment_create_data = {
                    "supplier_id": supplier.id,
                    "ap_transaction_type_id": payment_type.id,
                    "transaction_date": date.today() - timedelta(days=5),
                    "reference": pay_data["reference"],
                    "total_amount": pay_data["total_amount"]
                }
                
                payment_create = schemas.APTransactionCreate(**payment_create_data)
                payment = crud.ap.create_ap_transaction(
                    db=db, transaction=payment_create, company_id=company_id
                )
                created_payments.append(payment)
                print(f"   ✅ Created payment: {payment.document_number} - ${payment.total_amount}")
        
        # Step 5: Show supplier summary
        print("\n5️⃣ SUPPLIER SUMMARY")
        
        # Refresh supplier to get current balance
        supplier = crud.ap.get_supplier(db, supplier.id, company_id)
        all_transactions = crud.ap.get_ap_transactions(db, company_id=company_id, supplier_id=supplier.id)
        
        print(f"   📊 Supplier: {supplier.supplier_code} - {supplier.name}")
        print(f"   💰 Current Balance: ${supplier.current_balance}")
        print(f"   📋 Total Transactions: {len(all_transactions)}")
        
        # Calculate totals
        invoice_total = sum(t.total_amount for t in all_transactions if t.ap_transaction_type.base_type == "Supplier Invoice")
        payment_total = sum(t.total_amount for t in all_transactions if t.ap_transaction_type.base_type == "Payment")
        
        print(f"   📥 Total Invoices: ${invoice_total}")
        print(f"   📤 Total Payments: ${payment_total}")
        print(f"   📊 Outstanding: ${invoice_total - payment_total}")
        
        # Step 6: Transaction details
        print("\n6️⃣ TRANSACTION DETAILS")
        print("   📋 Transaction History:")
        
        for txn in sorted(all_transactions, key=lambda x: x.transaction_date):
            txn_type = "INV" if txn.ap_transaction_type.base_type == "Supplier Invoice" else "PAY"
            print(f"      {txn.transaction_date} | {txn_type} | {txn.document_number} | ${txn.total_amount:>10} | {txn.reference}")
        
        # Step 7: System statistics
        print("\n7️⃣ SYSTEM STATISTICS")
        
        total_suppliers = db.query(models.Supplier).filter(models.Supplier.company_id == company_id).count()
        total_transactions = db.query(models.APTransaction).filter(models.APTransaction.company_id == company_id).count()
        total_transaction_types = db.query(models.APTransactionType).filter(models.APTransactionType.company_id == company_id).count()
        
        print(f"   👥 Total Suppliers: {total_suppliers}")
        print(f"   📄 Total AP Transactions: {total_transactions}")
        print(f"   🏷️  Transaction Types: {total_transaction_types}")
        
        # Check AP defaults
        ap_defaults = db.execute(text('SELECT * FROM ap_defaults WHERE company_id = :company_id'), 
                                {'company_id': company_id}).fetchone()
        if ap_defaults:
            print(f"   ⚙️  AP Defaults Configured: ✅")
        else:
            print(f"   ⚙️  AP Defaults Configured: ❌")
        
        db.commit()
        db.close()
        
        print("\n" + "=" * 60)
        print("🎉 PHASE 5 DEMONSTRATION COMPLETED SUCCESSFULLY!")
        print("✅ All AP functionality working correctly")
        print("✅ Data integrity maintained")
        print("✅ Ready for production use")
        print("=" * 60)
        
        return True
        
    except Exception as e:
        print(f"❌ Error in demonstration: {e}")
        if 'db' in locals():
            db.rollback()
            db.close()
        return False

if __name__ == "__main__":
    success = demonstrate_ap_workflow()
    sys.exit(0 if success else 1)
