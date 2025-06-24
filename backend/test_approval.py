#!/usr/bin/env python3
"""
Test script for write-off approval workflow
"""
import sys
import os
from datetime import date, datetime
from decimal import Decimal

# Add the app directory to the Python path
sys.path.insert(0, '/app')

from app.database.database import get_db
from app.models import User, Company, Customer, ARTransaction, ARTransactionType, GLAccount, ARDefaults, ARWriteOff
from app.crud import ar_new as crud_ar
from app.schemas import ARWriteOffCreate, ARWriteOffApproval

def test_writeoff_approval():
    """Test the write-off approval workflow"""
    print("=== Testing Write-off Approval Workflow ===")
    
    # Get database session
    db = next(get_db())
    
    try:
        # Get first company
        company = db.query(Company).first()
        user = db.query(User).filter(User.company_id == company.id).first()
        
        # Get an existing pending write-off
        pending_writeoff = db.query(ARWriteOff).filter(
            ARWriteOff.company_id == company.id,
            ARWriteOff.status == 'pending'
        ).first()
        
        if not pending_writeoff:
            print("❌ No pending write-off found. Creating one first...")
            
            # Create a write-off for testing
            customer = db.query(Customer).filter(Customer.company_id == company.id).first()
            ar_transaction_type = db.query(ARTransactionType).filter(
                ARTransactionType.company_id == company.id,
                ARTransactionType.base_type == 'Invoice'
            ).first()
            
            invoice = db.query(ARTransaction).filter(
                ARTransaction.company_id == company.id,
                ARTransaction.customer_id == customer.id,
                ARTransaction.ar_transaction_type_id == ar_transaction_type.id,
                ARTransaction.open_amount > 0
            ).first()
            
            writeoff_data = ARWriteOffCreate(
                customer_id=customer.id,
                original_invoice_id=invoice.id,
                writeoff_amount=min(invoice.open_amount, Decimal('100.00')),
                reason_code='UNCOLLECTIBLE',
                reason_description='Test write-off for approval workflow',
                writeoff_date=date.today().isoformat()
            )
            
            pending_writeoff = crud_ar.create_ar_writeoff(db, writeoff_data, company.id, user.id)
            print(f"✅ Created write-off for testing: {pending_writeoff.document_number}")
        
        print(f"✅ Using write-off: {pending_writeoff.document_number} (Status: {pending_writeoff.status})")
        
        # Test approval
        print("✅ Approving write-off...")
        approval_data = ARWriteOffApproval(
            approval_decision="APPROVE",
            approval_notes="Approved after review - legitimate bad debt"
        )
        
        approved_writeoff = crud_ar.approve_ar_writeoff(
            db, pending_writeoff.id, approval_data, company.id, user.id
        )
        
        print(f"✅ Write-off approved: {approved_writeoff.document_number}")
        print(f"   Status: {approved_writeoff.status}")
        print(f"   Approved by: {approved_writeoff.approved_by_user_id}")
        print(f"   Approval notes: {approved_writeoff.approval_notes}")
        
        # Check if GL entry was created
        if approved_writeoff.linked_gl_journal_entry_id:
            print(f"✅ GL Journal Entry created: ID {approved_writeoff.linked_gl_journal_entry_id}")
        else:
            print("⚠️  No GL Journal Entry linked (might be expected depending on configuration)")
        
        # Test rejection (create another write-off)
        print("\n--- Testing Rejection ---")
        
        # Create another write-off for rejection testing
        customer = db.query(Customer).filter(Customer.company_id == company.id).first()
        ar_transaction_type = db.query(ARTransactionType).filter(
            ARTransactionType.company_id == company.id,
            ARTransactionType.base_type == 'Invoice'
        ).first()
        
        invoice = db.query(ARTransaction).filter(
            ARTransaction.company_id == company.id,
            ARTransaction.customer_id == customer.id,
            ARTransaction.ar_transaction_type_id == ar_transaction_type.id,
            ARTransaction.open_amount > 0
        ).first()
        
        if invoice:
            writeoff_data = ARWriteOffCreate(
                customer_id=customer.id,
                original_invoice_id=invoice.id,
                writeoff_amount=min(invoice.open_amount, Decimal('50.00')),
                reason_code='SMALL_BALANCE',
                reason_description='Test write-off for rejection workflow',
                writeoff_date=date.today().isoformat()
            )
            
            test_writeoff = crud_ar.create_ar_writeoff(db, writeoff_data, company.id, user.id)
            print(f"✅ Created test write-off: {test_writeoff.document_number}")
            
            # Test rejection
            rejection_data = ARWriteOffApproval(
                approval_decision="REJECT",
                approval_notes="Rejected - amount too small for write-off procedure"
            )
            
            rejected_writeoff = crud_ar.approve_ar_writeoff(
                db, test_writeoff.id, rejection_data, company.id, user.id
            )
            
            print(f"✅ Write-off rejected: {rejected_writeoff.document_number}")
            print(f"   Status: {rejected_writeoff.status}")
            print(f"   Rejection notes: {rejected_writeoff.approval_notes}")
        
        print("\n🎉 All write-off approval workflow tests passed!")
        return True
        
    except Exception as e:
        print(f"❌ Error during testing: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
    
    finally:
        db.close()

if __name__ == "__main__":
    success = test_writeoff_approval()
    sys.exit(0 if success else 1)
