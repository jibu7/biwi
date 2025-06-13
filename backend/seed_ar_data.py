"""
Seed default AR transaction types and sample data for Phase 4
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.database.database import SessionLocal
from app.models.ar import ARTransactionType, SalesRepresentative
from app.models.core import Company

def create_default_ar_transaction_types():
    """Create default AR transaction types for all companies"""
    db = SessionLocal()
    try:
        companies = db.query(Company).all()
        
        for company in companies:
            print(f"Creating AR transaction types for company: {company.name}")
            
            # Default AR transaction types
            transaction_types_data = [
                {
                    "name": "Sales Invoice",
                    "description": "Standard sales invoice for goods/services",
                    "base_type": "Invoice",
                    "affects_balance_direction": "Debit",
                    "is_active": True,
                },
                {
                    "name": "Service Invoice", 
                    "description": "Invoice for services rendered",
                    "base_type": "Invoice",
                    "affects_balance_direction": "Debit",
                    "is_active": True,
                },
                {
                    "name": "Customer Receipt",
                    "description": "Payment received from customer",
                    "base_type": "Receipt", 
                    "affects_balance_direction": "Credit",
                    "is_active": True,
                },
                {
                    "name": "Bank Receipt",
                    "description": "Payment received via bank transfer",
                    "base_type": "Receipt",
                    "affects_balance_direction": "Credit", 
                    "is_active": True,
                },
                {
                    "name": "Sales Return",
                    "description": "Credit note for returned goods",
                    "base_type": "Credit Note",
                    "affects_balance_direction": "Credit",
                    "is_active": True,
                },
                {
                    "name": "Price Adjustment",
                    "description": "Credit note for price adjustments",
                    "base_type": "Credit Note", 
                    "affects_balance_direction": "Credit",
                    "is_active": True,
                },
                {
                    "name": "AR Journal Entry",
                    "description": "Manual AR adjustment entry",
                    "base_type": "Journal",
                    "affects_balance_direction": "Debit",
                    "is_active": True,
                },
            ]
            
            for type_data in transaction_types_data:
                # Check if transaction type already exists
                existing_type = db.query(ARTransactionType).filter(
                    ARTransactionType.company_id == company.id,
                    ARTransactionType.name == type_data["name"]
                ).first()
                
                if not existing_type:
                    transaction_type = ARTransactionType(
                        company_id=company.id,
                        **type_data
                    )
                    db.add(transaction_type)
                    print(f"  ✓ Created transaction type: {type_data['name']}")
                else:
                    print(f"  - Transaction type already exists: {type_data['name']}")
        
        db.commit()
        print("✅ Default AR transaction types created successfully!")
        
    except Exception as e:
        print(f"❌ Error creating AR transaction types: {e}")
        db.rollback()
    finally:
        db.close()

def create_sample_sales_representatives():
    """Create sample sales representatives"""
    db = SessionLocal()
    try:
        companies = db.query(Company).all()
        
        for company in companies:
            print(f"Creating sample sales representatives for company: {company.name}")
            
            sales_reps_data = [
                {
                    "name": "John Smith",
                    "contact_info": {
                        "email": "john.smith@company.com",
                        "phone": "+1-555-0101",
                        "extension": "101"
                    },
                    "is_active": True,
                },
                {
                    "name": "Sarah Johnson", 
                    "contact_info": {
                        "email": "sarah.johnson@company.com",
                        "phone": "+1-555-0102",
                        "extension": "102"
                    },
                    "is_active": True,
                },
                {
                    "name": "Mike Davis",
                    "contact_info": {
                        "email": "mike.davis@company.com", 
                        "phone": "+1-555-0103",
                        "extension": "103"
                    },
                    "is_active": True,
                },
            ]
            
            for rep_data in sales_reps_data:
                # Check if sales rep already exists
                existing_rep = db.query(SalesRepresentative).filter(
                    SalesRepresentative.company_id == company.id,
                    SalesRepresentative.name == rep_data["name"]
                ).first()
                
                if not existing_rep:
                    sales_rep = SalesRepresentative(
                        company_id=company.id,
                        **rep_data
                    )
                    db.add(sales_rep)
                    print(f"  ✓ Created sales representative: {rep_data['name']}")
                else:
                    print(f"  - Sales representative already exists: {rep_data['name']}")
        
        db.commit()
        print("✅ Sample sales representatives created successfully!")
        
    except Exception as e:
        print(f"❌ Error creating sales representatives: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("🚀 Phase 4 AR Data Seeding Started...")
    print("=" * 50)
    
    create_default_ar_transaction_types()
    print()
    create_sample_sales_representatives()
    
    print()
    print("=" * 50)
    print("✅ Phase 4 AR Data Seeding Completed!")
