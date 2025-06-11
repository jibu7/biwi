#!/usr/bin/env python3
"""
Test script to verify GL models and operations
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from decimal import Decimal
from datetime import date, datetime
from sqlalchemy.orm import sessionmaker
from app.database.database import engine
from app.models.core import Company, User
from app.models.gl import GLAccount, GLJournalEntry, GLJournalEntryLine, GLTransactionType, GLDefaults
from app import crud

def test_gl_models():
    """Test GL model creation and relationships"""
    try:
        # Create a session
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        session = SessionLocal()
        
        print("Testing GL models...")
        
        # Get or create test company
        company = session.query(Company).first()
        if not company:
            print("No company found. Please run test_core_models.py first.")
            return False
        
        # Get or create test user
        user = session.query(User).first()
        if not user:
            print("No user found. Please run test_core_models.py first.")
            return False
        
        print(f"Using company: {company.name} (ID: {company.id})")
        print(f"Using user: {user.email} (ID: {user.id})")
        
        # Test GL Account creation
        print("\n1. Testing GL Account creation...")
        
        # Create some basic GL accounts
        accounts_data = [
            {"code": "1000", "name": "Cash", "type": "Asset"},
            {"code": "1200", "name": "Accounts Receivable", "type": "Asset"},
            {"code": "2000", "name": "Accounts Payable", "type": "Liability"},
            {"code": "3000", "name": "Owner's Equity", "type": "Equity"},
            {"code": "4000", "name": "Sales Revenue", "type": "Income"},
            {"code": "5000", "name": "Cost of Goods Sold", "type": "Expense"},
        ]
        
        created_accounts = {}
        for acc_data in accounts_data:
            # Check if account already exists
            existing_account = session.query(GLAccount).filter(
                GLAccount.account_code == acc_data["code"],
                GLAccount.company_id == company.id
            ).first()
            
            if existing_account:
                print(f"  Account {acc_data['code']} already exists")
                created_accounts[acc_data["code"]] = existing_account
            else:
                account = GLAccount(
                    company_id=company.id,
                    account_code=acc_data["code"],
                    account_name=acc_data["name"],
                    account_type=acc_data["type"],
                    current_balance=Decimal('0.00'),
                    is_active=True
                )
                session.add(account)
                session.flush()
                created_accounts[acc_data["code"]] = account
                print(f"  Created account: {acc_data['code']} - {acc_data['name']}")
        
        session.commit()
        print(f"  Successfully created/verified {len(created_accounts)} GL accounts")
        
        # Test Transaction Type creation
        print("\n2. Testing GL Transaction Type creation...")
        
        # Check if transaction type already exists
        existing_type = session.query(GLTransactionType).filter(
            GLTransactionType.name == "Cash Sale",
            GLTransactionType.company_id == company.id
        ).first()
        
        if existing_type:
            print("  Transaction type 'Cash Sale' already exists")
            transaction_type = existing_type
        else:
            transaction_type = GLTransactionType(
                company_id=company.id,
                name="Cash Sale",
                description="Direct cash sale transaction",
                default_debit_account_id=created_accounts["1000"].id,  # Cash
                default_credit_account_id=created_accounts["4000"].id,  # Sales Revenue
                is_active=True
            )
            session.add(transaction_type)
            session.commit()
            print("  Created transaction type: Cash Sale")
        
        # Test GL Defaults creation
        print("\n3. Testing GL Defaults creation...")
        
        # Check if defaults already exist
        existing_defaults = session.query(GLDefaults).filter(
            GLDefaults.company_id == company.id
        ).first()
        
        if existing_defaults:
            print("  GL Defaults already exist")
            gl_defaults = existing_defaults
        else:
            gl_defaults = GLDefaults(
                company_id=company.id,
                retained_earnings_account_id=created_accounts["3000"].id,  # Owner's Equity
                default_cash_account_id=created_accounts["1000"].id,  # Cash
                default_ar_control_account_id=created_accounts["1200"].id,  # AR
                default_ap_control_account_id=created_accounts["2000"].id   # AP
            )
            session.add(gl_defaults)
            session.commit()
            print("  Created GL defaults")
        
        # Test Journal Entry creation
        print("\n4. Testing Journal Entry creation...")
        
        # Create a simple journal entry (Cash sale of $1000)
        journal_entry = GLJournalEntry(
            company_id=company.id,
            entry_date=date.today(),
            reference="TEST-001",
            description="Test cash sale transaction",
            posted_by_user_id=user.id,
            status="Draft"
        )
        session.add(journal_entry)
        session.flush()
        
        # Add journal entry lines
        # Debit Cash
        line1 = GLJournalEntryLine(
            journal_entry_id=journal_entry.id,
            gl_account_id=created_accounts["1000"].id,
            description="Cash received",
            debit_amount=Decimal('1000.00'),
            credit_amount=Decimal('0.00')
        )
        
        # Credit Sales Revenue
        line2 = GLJournalEntryLine(
            journal_entry_id=journal_entry.id,
            gl_account_id=created_accounts["4000"].id,
            description="Sales revenue",
            debit_amount=Decimal('0.00'),
            credit_amount=Decimal('1000.00')
        )
        
        session.add(line1)
        session.add(line2)
        session.commit()
        
        print(f"  Created journal entry: {journal_entry.reference}")
        print(f"  Entry ID: {journal_entry.id}")
        print(f"  Number of lines: {len(journal_entry.lines)}")
        
        # Test relationships
        print("\n5. Testing model relationships...")
        
        # Reload the journal entry with relationships
        journal_entry = session.query(GLJournalEntry).filter(
            GLJournalEntry.id == journal_entry.id
        ).first()
        
        print(f"  Journal entry company: {journal_entry.company.name}")
        print(f"  Posted by user: {journal_entry.posted_by.email}")
        print(f"  Number of lines: {len(journal_entry.lines)}")
        
        for line in journal_entry.lines:
            print(f"    Line: {line.gl_account.account_code} - {line.gl_account.account_name}")
            print(f"      Debit: ${line.debit_amount}, Credit: ${line.credit_amount}")
        
        # Test parent-child account relationships
        print("\n6. Testing parent-child account relationships...")
        
        # Create a sub-account
        sub_account = GLAccount(
            company_id=company.id,
            account_code="1010",
            account_name="Petty Cash",
            account_type="Asset",
            parent_account_id=created_accounts["1000"].id,  # Parent is Cash
            current_balance=Decimal('0.00'),
            is_active=True
        )
        session.add(sub_account)
        session.commit()
        
        # Test the relationship
        parent_account = session.query(GLAccount).filter(
            GLAccount.id == created_accounts["1000"].id
        ).first()
        
        print(f"  Parent account: {parent_account.account_code} - {parent_account.account_name}")
        print(f"  Number of child accounts: {len(parent_account.children)}")
        
        for child in parent_account.children:
            print(f"    Child: {child.account_code} - {child.account_name}")
        
        print("\n✅ All GL model tests passed successfully!")
        return True
        
    except Exception as e:
        print(f"\n❌ Error testing GL models: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        session.close()

def test_gl_crud_operations():
    """Test GL CRUD operations"""
    try:
        # Create a session
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        session = SessionLocal()
        
        print("\nTesting GL CRUD operations...")
        
        # Get test company
        company = session.query(Company).first()
        if not company:
            print("No company found for CRUD tests")
            return False
        
        # Test account balance updates
        print("\n1. Testing account balance updates...")
        
        cash_account = session.query(GLAccount).filter(
            GLAccount.account_code == "1000",
            GLAccount.company_id == company.id
        ).first()
        
        if cash_account:
            original_balance = cash_account.current_balance
            print(f"  Original cash balance: ${original_balance}")
            
            # Simulate posting a journal entry (update balances)
            test_amount = Decimal('500.00')
            
            # For asset accounts, debits increase balance
            cash_account.current_balance += test_amount
            session.commit()
            
            print(f"  New cash balance after $500 debit: ${cash_account.current_balance}")
            
            # Verify the balance update
            if cash_account.current_balance == original_balance + test_amount:
                print("  ✅ Balance update successful")
            else:
                print("  ❌ Balance update failed")
                return False
        
        print("\n✅ All GL CRUD operation tests passed!")
        return True
        
    except Exception as e:
        print(f"\n❌ Error testing GL CRUD operations: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        session.close()

if __name__ == "__main__":
    print("=" * 60)
    print("GL MODELS AND OPERATIONS TEST")
    print("=" * 60)
    
    # Test model creation and relationships
    models_test_passed = test_gl_models()
    
    # Test CRUD operations
    crud_test_passed = test_gl_crud_operations()
    
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    
    if models_test_passed and crud_test_passed:
        print("🎉 ALL TESTS PASSED! GL functionality is working correctly.")
        sys.exit(0)
    else:
        print("💥 SOME TESTS FAILED! Please check the output above.")
        sys.exit(1)
