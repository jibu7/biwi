#!/usr/bin/env python3
"""
Setup GL Accounts for Trial Balance with required accounts
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.database.database import get_db
from app import crud, schemas, models
from decimal import Decimal

def setup_gl_accounts():
    """Setup required GL accounts for trial balance"""
    print("🔧 Setting up GL Accounts for Trial Balance")
    print("=" * 50)
    
    try:
        db = next(get_db())
        
        # Get or create company
        company = db.query(models.Company).first()
        if not company:
            print("No company found. Creating test company...")
            company = models.Company(
                name="Test Company",
                code="TEST001",
                registration_number="REG123",
                tax_id="TAX123",
                is_active=True
            )
            db.add(company)
            db.commit()
            db.refresh(company)
        
        company_id = company.id
        print(f"📊 Working with Company: {company.name} (ID: {company_id})")
        
        # Required accounts for trial balance
        required_accounts = [
            {
                "account_code": "1200",
                "account_name": "Accounts Receivable",
                "account_type": "Asset",
                "is_active": True,
                "current_balance": Decimal("15000.00")
            },
            {
                "account_code": "4000",
                "account_name": "Sales Revenue",
                "account_type": "Income",
                "is_active": True,
                "current_balance": Decimal("50000.00")
            },
            {
                "account_code": "5000",
                "account_name": "Cost of Goods Sold",
                "account_type": "Expense",
                "is_active": True,
                "current_balance": Decimal("30000.00")
            },
            {
                "account_code": "1300",
                "account_name": "Inventory",
                "account_type": "Asset",
                "is_active": True,
                "current_balance": Decimal("25000.00")
            },
            # Additional accounts to make trial balance complete
            {
                "account_code": "1000",
                "account_name": "Cash",
                "account_type": "Asset",
                "is_active": True,
                "current_balance": Decimal("10000.00")
            },
            {
                "account_code": "2000",
                "account_name": "Accounts Payable",
                "account_type": "Liability",
                "is_active": True,
                "current_balance": Decimal("8000.00")
            },
            {
                "account_code": "3000",
                "account_name": "Owner's Equity",
                "account_type": "Equity",
                "is_active": True,
                "current_balance": Decimal("42000.00")
            }
        ]
        
        print("\n🏗️ Creating GL Accounts:")
        for account_data in required_accounts:
            # Check if account already exists
            existing = db.query(models.GLAccount).filter(
                models.GLAccount.company_id == company_id,
                models.GLAccount.account_code == account_data["account_code"]
            ).first()
            
            if existing:
                print(f"  ✅ {account_data['account_code']}: {account_data['account_name']} (already exists)")
                # Update balance if different
                if existing.current_balance != account_data["current_balance"]:
                    existing.current_balance = account_data["current_balance"]
                    db.commit()
                    print(f"     Updated balance to {account_data['current_balance']}")
            else:
                # Create new account
                account = models.GLAccount(
                    company_id=company_id,
                    account_code=account_data["account_code"],
                    account_name=account_data["account_name"],
                    account_type=account_data["account_type"],
                    is_active=account_data["is_active"],
                    current_balance=account_data["current_balance"]
                )
                db.add(account)
                db.commit()
                print(f"  ✨ {account_data['account_code']}: {account_data['account_name']} (created)")
        
        # Verify trial balance totals
        print("\n📊 Verifying Trial Balance:")
        accounts = db.query(models.GLAccount).filter(
            models.GLAccount.company_id == company_id,
            models.GLAccount.is_active == True
        ).all()
        
        total_debits = Decimal('0.00')
        total_credits = Decimal('0.00')
        
        for account in accounts:
            balance = account.current_balance
            if balance == 0:
                continue
                
            if account.account_type in ["Asset", "Expense"]:
                # Normal debit balance accounts
                if balance >= 0:
                    debit_balance = balance
                    credit_balance = Decimal('0.00')
                    total_debits += balance
                    print(f"  {account.account_code}: {account.account_name} - Debit: {debit_balance}")
                else:
                    debit_balance = Decimal('0.00')
                    credit_balance = abs(balance)
                    total_credits += abs(balance)
                    print(f"  {account.account_code}: {account.account_name} - Credit: {credit_balance}")
            else:
                # Normal credit balance accounts (Liability, Equity, Income)
                if balance >= 0:
                    debit_balance = Decimal('0.00')
                    credit_balance = balance
                    total_credits += balance
                    print(f"  {account.account_code}: {account.account_name} - Credit: {credit_balance}")
                else:
                    debit_balance = abs(balance)
                    credit_balance = Decimal('0.00')
                    total_debits += abs(balance)
                    print(f"  {account.account_code}: {account.account_name} - Debit: {debit_balance}")
        
        print(f"\n💰 Total Debits: {total_debits}")
        print(f"💰 Total Credits: {total_credits}")
        print(f"⚖️  Balanced: {'✅ YES' if total_debits == total_credits else '❌ NO'}")
        
        print("\n✅ GL Accounts setup complete!")
        
    except Exception as e:
        print(f"❌ Error setting up GL accounts: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    setup_gl_accounts()
