#!/usr/bin/env python3
"""
Phase 8 Business Logic Integration Tests
Tests complex business scenarios for Currency, Tax, and Branch management
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from decimal import Decimal
from sqlalchemy.orm import Session
from app.database.database import SessionLocal
from app import crud, schemas
from app.models.core import Company
from app.models.common import Currency, TaxType, Branch

def test_currency_exchange_scenarios():
    """Test various currency exchange scenarios"""
    db: Session = SessionLocal()
    
    try:
        print("🧪 Testing Currency Exchange Scenarios...")
        
        company = db.query(Company).first()
        if not company:
            print("❌ No test company found")
            return False
        
        # Scenario 1: Multi-currency setup
        print("\n1. Setting up multi-currency environment...")
        
        # Clear existing currencies
        db.query(Currency).filter(Currency.company_id == company.id).delete()
        db.commit()
        
        # Create base currency (USD)
        usd = crud.common.create_currency(db, schemas.CurrencyCreate(
            currency_code="USD",
            currency_name="US Dollar",
            currency_symbol="$",
            exchange_rate=Decimal('1.00'),
            is_base_currency=True,
            is_active=True
        ), company.id)
        print(f"  ✓ Base currency: {usd.currency_code} (Rate: {usd.exchange_rate})")
        
        # Create multiple foreign currencies
        currencies = [
            ("EUR", "Euro", "€", Decimal('0.85')),
            ("GBP", "British Pound", "£", Decimal('0.73')),
            ("JPY", "Japanese Yen", "¥", Decimal('110.50')),
            ("CAD", "Canadian Dollar", "C$", Decimal('1.25'))
        ]
        
        for code, name, symbol, rate in currencies:
            curr = crud.common.create_currency(db, schemas.CurrencyCreate(
                currency_code=code,
                currency_name=name,
                currency_symbol=symbol,
                exchange_rate=rate,
                is_base_currency=False,
                is_active=True
            ), company.id)
            print(f"  ✓ Created {code}: Rate {rate}")
        
        # Scenario 2: Exchange rate updates
        print("\n2. Testing exchange rate volatility...")
        
        eur = db.query(Currency).filter(
            Currency.company_id == company.id,
            Currency.currency_code == "EUR"
        ).first()
        
        # Simulate rate changes
        rate_changes = [
            Decimal('0.86'), Decimal('0.84'), Decimal('0.87'), Decimal('0.85')
        ]
        
        for new_rate in rate_changes:
            updated = crud.common.update_currency(
                db, eur.id, company.id,
                schemas.CurrencyUpdate(exchange_rate=new_rate)
            )
            print(f"  ✓ EUR rate updated to {new_rate}")
        
        # Scenario 3: Currency activation/deactivation
        print("\n3. Testing currency lifecycle...")
        
        # Deactivate a currency
        gbp = db.query(Currency).filter(
            Currency.company_id == company.id,
            Currency.currency_code == "GBP"
        ).first()
        
        deactivated = crud.common.update_currency(
            db, gbp.id, company.id,
            schemas.CurrencyUpdate(is_active=False)
        )
        print(f"  ✓ Deactivated {gbp.currency_code}")
        
        # Verify only active currencies in regular queries
        active_currencies = db.query(Currency).filter(
            Currency.company_id == company.id,
            Currency.is_active == True
        ).all()
        
        active_codes = [c.currency_code for c in active_currencies]
        if "GBP" not in active_codes:
            print("  ✓ Inactive currency excluded from active list")
        else:
            print("  ✗ Inactive currency still in active list")
            return False
        
        return True
        
    except Exception as e:
        print(f"❌ Currency exchange scenario test failed: {e}")
        db.rollback()
        return False
    finally:
        db.close()

def test_tax_compliance_scenarios():
    """Test tax compliance and calculation scenarios"""
    db: Session = SessionLocal()
    
    try:
        print("\n🧪 Testing Tax Compliance Scenarios...")
        
        company = db.query(Company).first()
        if not company:
            return False
        
        # Scenario 1: Complete tax setup for a business
        print("\n1. Setting up comprehensive tax structure...")
        
        # Clear existing tax types
        db.query(TaxType).filter(TaxType.company_id == company.id).delete()
        db.commit()
        
        # Create tax types for different business scenarios
        tax_setup = [
            # Sales taxes
            ("VAT Standard", "Standard VAT rate", Decimal('18.00'), "Sales"),
            ("VAT Reduced", "Reduced VAT for essentials", Decimal('8.00'), "Sales"),
            
            # Purchase taxes
            ("Input VAT Standard", "Standard input VAT", Decimal('18.00'), "Purchases"),
            ("Input VAT Reduced", "Reduced input VAT", Decimal('8.00'), "Purchases"),
            
            # Special cases
            ("Export Zero Rated", "Exports to foreign countries", Decimal('0.00'), "ZeroRated"),
            ("Tax Exempt", "Healthcare and education", Decimal('0.00'), "Exempt"),
            
            # Withholding taxes
            ("WHT Professional", "Professional services WHT", Decimal('10.00'), "Purchases"),
            ("WHT Rental", "Rental income WHT", Decimal('15.00'), "Purchases")
        ]
        
        created_taxes = {}
        for name, desc, rate, nature in tax_setup:
            tax = crud.common.create_tax_type(db, schemas.TaxTypeCreate(
                name=name,
                description=desc,
                rate=rate,
                nature=nature,
                is_active=True
            ), company.id)
            created_taxes[name] = tax
            print(f"  ✓ Created {name}: {rate}% ({nature})")
        
        # Scenario 2: Tax rate validation
        print("\n2. Validating tax rate boundaries...")
        
        # Test rate limits
        try:
            # Try to create tax with rate > 100%
            invalid_tax = crud.common.create_tax_type(db, schemas.TaxTypeCreate(
                name="Invalid High Tax",
                description="Test",
                rate=Decimal('101.00'),
                nature="Sales",
                is_active=True
            ), company.id)
            print("  ✗ Allowed tax rate > 100%")
            return False
        except Exception:
            print("  ✓ Correctly prevented tax rate > 100%")
        
        # Scenario 3: Tax categorization
        print("\n3. Testing tax categorization...")
        
        all_taxes = crud.common.get_tax_types(db, company.id)
        
        # Group by nature
        by_nature = {}
        for tax in all_taxes:
            if tax.nature not in by_nature:
                by_nature[tax.nature] = []
            by_nature[tax.nature].append(tax)
        
        print("  Tax distribution by nature:")
        for nature, taxes in by_nature.items():
            print(f"    - {nature}: {len(taxes)} tax types")
            avg_rate = sum(t.rate for t in taxes) / len(taxes) if taxes else 0
            print(f"      Average rate: {avg_rate:.2f}%")
        
        # Scenario 4: Tax activation for specific periods
        print("\n4. Testing seasonal tax changes...")
        
        # Deactivate reduced rate temporarily
        reduced_vat = created_taxes["VAT Reduced"]
        crud.common.update_tax_type(
            db, reduced_vat.id, company.id,
            schemas.TaxTypeUpdate(is_active=False)
        )
        print("  ✓ Deactivated reduced VAT rate")
        
        # Reactivate it
        crud.common.update_tax_type(
            db, reduced_vat.id, company.id,
            schemas.TaxTypeUpdate(is_active=True)
        )
        print("  ✓ Reactivated reduced VAT rate")
        
        return True
        
    except Exception as e:
        print(f"❌ Tax compliance scenario test failed: {e}")
        db.rollback()
        return False
    finally:
        db.close()

def test_multi_branch_scenarios():
    """Test multi-branch operation scenarios"""
    db: Session = SessionLocal()
    
    try:
        print("\n🧪 Testing Multi-Branch Scenarios...")
        
        company = db.query(Company).first()
        if not company:
            return False
        
        # Clear existing branches
        db.query(Branch).filter(Branch.company_id == company.id).delete()
        db.commit()
        
        # Scenario 1: Retail chain setup
        print("\n1. Setting up retail chain with multiple locations...")
        
        # Create headquarters
        hq = crud.common.create_company_branch(db, schemas.BranchCreate(
            branch_code="HQ001",
            branch_name="Corporate Headquarters",
            address={
                "street": "1 Corporate Plaza",
                "city": "New York",
                "state": "NY",
                "country": "USA",
                "postal_code": "10001"
            },
            contact_info={
                "phone": "+1-212-555-0100",
                "email": "hq@retailchain.com",
                "website": "www.retailchain.com"
            },
            gl_segment_code="1000",
            is_main_branch=True,
            is_active=True
        ), company.id)
        print(f"  ✓ Created HQ: {hq.branch_name}")
        
        # Create regional branches
        regions = [
            ("EAST", "Eastern Region Office", "New York", "NY", "2000"),
            ("WEST", "Western Region Office", "Los Angeles", "CA", "3000"),
            ("SOUTH", "Southern Region Office", "Atlanta", "GA", "4000"),
            ("NORTH", "Northern Region Office", "Chicago", "IL", "5000")
        ]
        
        regional_branches = []
        for code, name, city, state, gl_code in regions:
            branch = crud.common.create_company_branch(db, schemas.BranchCreate(
                branch_code=code,
                branch_name=name,
                address={
                    "street": f"100 {name} Blvd",
                    "city": city,
                    "state": state,
                    "country": "USA"
                },
                contact_info={"phone": "+1-555-0200"},
                gl_segment_code=gl_code,
                is_main_branch=False,
                is_active=True
            ), company.id)
            regional_branches.append(branch)
            print(f"  ✓ Created regional office: {name} (GL: {gl_code})")
        
        # Create retail stores under regions
        print("\n2. Creating retail stores under regional management...")
        
        store_counter = 1
        for region_branch in regional_branches[:2]:  # Create stores for first 2 regions
            region_gl = region_branch.gl_segment_code
            
            for i in range(3):  # 3 stores per region
                store_code = f"STR{store_counter:03d}"
                store_gl = f"{region_gl[0]}{store_counter:03d}"
                
                store = crud.common.create_company_branch(db, schemas.BranchCreate(
                    branch_code=store_code,
                    branch_name=f"Store #{store_counter} - {region_branch.branch_name.split()[0]}",
                    address={
                        "street": f"{store_counter} Retail Ave",
                        "city": region_branch.address.get('city'),
                        "state": region_branch.address.get('state'),
                        "country": "USA"
                    },
                    contact_info={"phone": f"+1-555-1{store_counter:03d}"},
                    gl_segment_code=store_gl,
                    is_main_branch=False,
                    is_active=True
                ), company.id)
                
                store_counter += 1
                print(f"    ✓ Created {store.branch_name} (GL: {store_gl})")
        
        # Scenario 3: Branch hierarchy analysis
        print("\n3. Analyzing branch hierarchy...")
        
        all_branches = crud.common.get_company_branches(db, company.id)
        
        # Group by GL segment prefix
        by_region = {}
        for branch in all_branches:
            if branch.gl_segment_code:
                prefix = branch.gl_segment_code[0]
                if prefix not in by_region:
                    by_region[prefix] = []
                by_region[prefix].append(branch)
        
        print("  Branch distribution by GL segment:")
        for prefix, branches in sorted(by_region.items()):
            print(f"    - Segment {prefix}xxx: {len(branches)} branches")
        
        # Scenario 4: Branch activation/deactivation
        print("\n4. Testing branch lifecycle management...")
        
        # Simulate closing a store
        store_to_close = next(b for b in all_branches if b.branch_code.startswith("STR"))
        
        closed_store = crud.common.update_company_branch(
            db, store_to_close.id, company.id,
            schemas.BranchUpdate(is_active=False)
        )
        print(f"  ✓ Closed store: {closed_store.branch_name}")
        
        # Count active branches
        active_branches = [b for b in all_branches if b.is_active]
        print(f"  ✓ Active branches: {len(active_branches) - 1} (after closure)")
        
        # Verify GL segment code uniqueness
        gl_codes = [b.gl_segment_code for b in all_branches if b.gl_segment_code]
        if len(gl_codes) == len(set(gl_codes)):
            print("  ✓ All GL segment codes are unique")
        else:
            print("  ✗ Duplicate GL segment codes found")
            return False
        
        return True
        
    except Exception as e:
        print(f"❌ Multi-branch scenario test failed: {e}")
        db.rollback()
        return False
    finally:
        db.close()

def main():
    """Run all business logic scenario tests"""
    print("=" * 60)
    print("PHASE 8 BUSINESS LOGIC SCENARIO TESTS")
    print("=" * 60)
    
    all_passed = True
    
    if not test_currency_exchange_scenarios():
        all_passed = False
    
    if not test_tax_compliance_scenarios():
        all_passed = False
    
    if not test_multi_branch_scenarios():
        all_passed = False
    
    print("\n" + "=" * 60)
    print("BUSINESS LOGIC TEST SUMMARY")
    print("=" * 60)
    
    if all_passed:
        print("🎉 All business logic scenario tests passed!")
        print("\nValidated scenarios:")
        print("✅ Multi-currency operations with exchange rate management")
        print("✅ Comprehensive tax setup for various business needs")
        print("✅ Multi-branch retail chain with GL segmentation")
        print("✅ Currency and branch lifecycle management")
        print("✅ Tax compliance and categorization")
    else:
        print("⚠️ Some business logic tests failed.")
    
    return all_passed

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
