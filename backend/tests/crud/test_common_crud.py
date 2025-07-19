#!/usr/bin/env python3
"""
Test CRUD operations for Currency, Tax, and Branch modules
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from decimal import Decimal
from sqlalchemy.orm import Session
from app.database.database import SessionLocal
from app import crud, schemas
from app.models.core import Company
from app.models.common import Currency, TaxType, Branch

def test_currency_crud_operations():
    """Test Currency CRUD operations"""
    db: Session = SessionLocal()
    
    try:
        print("🧪 Testing Currency CRUD Operations...")
        
        # Get test company
        company = db.query(Company).first()
        if not company:
            print("❌ No test company found")
            return False
        
        # Test 1: Create base currency
        print("\n1. Testing base currency creation...")
        currency_data = schemas.CurrencyCreate(
            currency_code="USD",
            currency_name="US Dollar",
            currency_symbol="$",
            exchange_rate=Decimal('1.00'),
            is_base_currency=True,
            is_active=True
        )
        
        # Clear existing base currency if any
        existing_base = db.query(Currency).filter(
            Currency.company_id == company.id,
            Currency.is_base_currency == True
        ).first()
        if existing_base:
            db.delete(existing_base)
            db.commit()
        
        base_currency = crud.common.create_currency(db, currency_data, company.id)
        print(f"✅ Created base currency: {base_currency.currency_code}")
        
        # Test 2: Attempt to create second base currency
        print("\n2. Testing duplicate base currency prevention...")
        try:
            duplicate_base_data = schemas.CurrencyCreate(
                currency_code="EUR",
                currency_name="Euro",
                currency_symbol="€",
                exchange_rate=Decimal('1.00'),
                is_base_currency=True,
                is_active=True
            )
            duplicate_base = crud.common.create_currency(db, duplicate_base_data, company.id)
            print("❌ ERROR: Second base currency was created")
            return False
        except ValueError as e:
            print(f"✅ Correctly prevented second base currency: {str(e)}")
        
        # Test 3: Create foreign currency
        print("\n3. Testing foreign currency creation...")
        foreign_data = schemas.CurrencyCreate(
            currency_code="GBP",
            currency_name="British Pound",
            currency_symbol="£",
            exchange_rate=Decimal('0.75'),
            is_base_currency=False,
            is_active=True
        )
        foreign_currency = crud.common.create_currency(db, foreign_data, company.id)
        print(f"✅ Created foreign currency: {foreign_currency.currency_code} (Rate: {foreign_currency.exchange_rate})")
        
        # Test 4: Update exchange rate
        print("\n4. Testing exchange rate update...")
        update_data = schemas.CurrencyUpdate(exchange_rate=Decimal('0.80'))
        updated_currency = crud.common.update_currency(db, foreign_currency.id, company.id, update_data)
        print(f"✅ Updated exchange rate: {updated_currency.exchange_rate}")
        
        # Test 5: List currencies
        print("\n5. Testing currency listing...")
        currencies = crud.common.get_currencies(db, company.id)
        print(f"✅ Found {len(currencies)} currencies")
        for curr in currencies:
            print(f"   - {curr.currency_code}: {curr.exchange_rate} (Base: {curr.is_base_currency})")
        
        print("\n✅ All Currency CRUD tests passed!")
        return True
        
    except Exception as e:
        print(f"\n❌ Currency CRUD test failed: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()

def test_tax_type_crud_operations():
    """Test TaxType CRUD operations"""
    db: Session = SessionLocal()
    
    try:
        print("\n🧪 Testing TaxType CRUD Operations...")
        
        # Get test company
        company = db.query(Company).first()
        if not company:
            print("❌ No test company found")
            return False
        
        # Test 1: Create various tax types
        print("\n1. Testing tax type creation...")
        tax_types_to_create = [
            {
                "name": "Standard VAT",
                "description": "18% Value Added Tax",
                "rate": Decimal('18.00'),
                "nature": "Sales",
                "is_active": True
            },
            {
                "name": "Input VAT",
                "description": "18% Input Tax",
                "rate": Decimal('18.00'),
                "nature": "Purchases",
                "is_active": True
            },
            {
                "name": "Exempt",
                "description": "Tax exempt items",
                "rate": Decimal('0.00'),
                "nature": "Exempt",
                "is_active": True
            },
            {
                "name": "Zero Rated",
                "description": "Zero-rated exports",
                "rate": Decimal('0.00'),
                "nature": "ZeroRated",
                "is_active": True
            }
        ]
        
        created_tax_types = []
        for tax_data in tax_types_to_create:
            tax_type_data = schemas.TaxTypeCreate(**tax_data)
            tax_type = crud.common.create_tax_type(db, tax_type_data, company.id)
            created_tax_types.append(tax_type)
            print(f"✅ Created tax type: {tax_type.name} ({tax_type.nature}) - {tax_type.rate}%")
        
        # Test 2: Get tax type by ID
        print("\n2. Testing tax type retrieval...")
        retrieved_tax = crud.common.get_tax_type(db, created_tax_types[0].id, company.id)
        if retrieved_tax:
            print(f"✅ Retrieved tax type: {retrieved_tax.name}")
        else:
            print("❌ Failed to retrieve tax type")
            return False
        
        # Test 3: Update tax type
        print("\n3. Testing tax type update...")
        update_data = schemas.TaxTypeUpdate(
            description="Updated description",
            rate=Decimal('20.00')
        )
        updated_tax = crud.common.update_tax_type(db, created_tax_types[0].id, company.id, update_data)
        print(f"✅ Updated tax type: {updated_tax.name} - New rate: {updated_tax.rate}%")
        
        # Test 4: List tax types
        print("\n4. Testing tax type listing...")
        all_tax_types = crud.common.get_tax_types(db, company.id)
        print(f"✅ Found {len(all_tax_types)} tax types")
        
        # Test 5: Filter by nature
        print("\n5. Testing tax type filtering by nature...")
        for nature in ["Sales", "Purchases", "Exempt", "ZeroRated"]:
            filtered = [t for t in all_tax_types if t.nature == nature]
            print(f"   - {nature}: {len(filtered)} tax types")
        
        print("\n✅ All TaxType CRUD tests passed!")
        return True
        
    except Exception as e:
        print(f"\n❌ TaxType CRUD test failed: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()

def test_branch_crud_operations():
    """Test Branch CRUD operations"""
    db: Session = SessionLocal()
    
    try:
        print("\n🧪 Testing Branch CRUD Operations...")
        
        # Get test company
        company = db.query(Company).first()
        if not company:
            print("❌ No test company found")
            return False
        
        # Clear existing branches for clean test
        db.query(Branch).filter(
            Branch.company_id == company.id
        ).delete()
        db.commit()
        
        # Test 1: Create main branch
        print("\n1. Testing main branch creation...")
        main_branch_data = schemas.BranchCreate(
            branch_code="HQ",
            branch_name="Headquarters",
            address={
                "street": "123 Main Street",
                "city": "New York",
                "state": "NY",
                "country": "USA",
                "postal_code": "10001"
            },
            contact_info={
                "phone": "+1-212-555-0100",
                "email": "hq@company.com",
                "fax": "+1-212-555-0101"
            },
            gl_segment_code="100",
            is_main_branch=True,
            is_active=True
        )
        main_branch = crud.common.create_company_branch(db, main_branch_data, company.id)
        print(f"✅ Created main branch: {main_branch.branch_name} (Code: {main_branch.branch_code})")
        
        # Test 2: Create additional branches
        print("\n2. Testing additional branch creation...")
        branch_data_list = [
            {
                "branch_code": "BR-NY-001",
                "branch_name": "Manhattan Branch",
                "address": {
                    "street": "456 Broadway",
                    "city": "New York",
                    "state": "NY",
                    "country": "USA",
                    "postal_code": "10002"
                },
                "gl_segment_code": "200",
                "is_main_branch": False
            },
            {
                "branch_code": "BR-CA-001",
                "branch_name": "Los Angeles Branch",
                "address": {
                    "street": "789 Sunset Blvd",
                    "city": "Los Angeles",
                    "state": "CA",
                    "country": "USA",
                    "postal_code": "90001"
                },
                "gl_segment_code": "300",
                "is_main_branch": False
            }
        ]
        
        for branch_info in branch_data_list:
            branch_create = schemas.BranchCreate(
                contact_info={"phone": "+1-555-0200"},
                is_active=True,
                **branch_info
            )
            branch = crud.common.create_company_branch(db, branch_create, company.id)
            print(f"✅ Created branch: {branch.branch_name} (GL: {branch.gl_segment_code})")
        
        # Test 3: List all branches
        print("\n3. Testing branch listing...")
        all_branches = crud.common.get_company_branches(db, company.id)
        print(f"✅ Found {len(all_branches)} branches")
        for branch in all_branches:
            print(f"   - {branch.branch_code}: {branch.branch_name} (Main: {branch.is_main_branch})")
        
        # Test 4: Update branch
        print("\n4. Testing branch update...")
        update_data = schemas.BranchUpdate(
            branch_name="Updated Manhattan Branch",
            gl_segment_code="201"
        )
        branch_to_update = next(b for b in all_branches if b.branch_code == "BR-NY-001")
        updated_branch = crud.common.update_company_branch(db, branch_to_update.id, company.id, update_data)
        print(f"✅ Updated branch: {updated_branch.branch_name} (GL: {updated_branch.gl_segment_code})")
        
        # Test 5: Test branch constraints
        print("\n5. Testing branch constraints...")
        
        # Try to create duplicate branch code
        try:
            duplicate_data = schemas.BranchCreate(
                branch_code="HQ",  # Already exists
                branch_name="Duplicate HQ",
                address={"street": "999 Test St"},
                gl_segment_code="999",
                is_main_branch=False,
                is_active=True
            )
            duplicate = crud.common.create_company_branch(db, duplicate_data, company.id)
            print("❌ ERROR: Duplicate branch code was allowed")
            return False
        except Exception as e:
            print("✅ Correctly prevented duplicate branch code")
        
        print("\n✅ All Branch CRUD tests passed!")
        return True
        
    except Exception as e:
        print(f"\n❌ Branch CRUD test failed: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()

def main():
    """Run all CRUD tests"""
    print("=" * 60)
    print("CURRENCY, TAX, AND BRANCH CRUD OPERATIONS TEST")
    print("=" * 60)
    
    all_passed = True
    
    if not test_currency_crud_operations():
        all_passed = False
    
    if not test_tax_type_crud_operations():
        all_passed = False
    
    if not test_branch_crud_operations():
        all_passed = False
    
    print("\n" + "=" * 60)
    print("CRUD TEST SUMMARY")
    print("=" * 60)
    
    if all_passed:
        print("🎉 All CRUD operation tests passed!")
    else:
        print("⚠️ Some CRUD tests failed. Please check the errors above.")
    
    return all_passed

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
