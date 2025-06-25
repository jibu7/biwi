#!/usr/bin/env python3
"""
Simple inventory test runner
Tests the basic inventory functionality without pytest complications
"""
import sys
import os
sys.path.append('/app')

from decimal import Decimal
from datetime import date
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine

# Import app modules
from app import models, schemas, crud
from app.core.security import get_password_hash

def create_test_session():
    """Create a database session for testing"""
    DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://Biwi_user:Biwi_password@db:5432/Biwi_db")
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return SessionLocal()

def setup_test_data(db_session):
    """Set up test company, user, and GL accounts"""
    # Create test company
    company = models.Company(
        name="Test Company - Phase 6",
        is_active=True
    )
    db_session.add(company)
    db_session.commit()
    db_session.refresh(company)
    print(f"✓ Created test company: {company.name}")
    
    # Create test user with role
    role = models.Role(
        name="Inventory Manager",
        company_id=company.id,
        permissions=[
            "inv:setup_manage",
            "inv:transactions_adjust", 
            "inv:reports_view"
        ]
    )
    db_session.add(role)
    db_session.commit()
    
    user = models.User(
        email="inv_test@test.com",
        hashed_password=get_password_hash("password123"),
        full_name="Inventory Test User",
        is_active=True,
        is_superuser=False,
        company_id=company.id
    )
    db_session.add(user)
    db_session.commit()
    
    user_role = models.UserRole(
        user_id=user.id,
        role_id=role.id
    )
    db_session.add(user_role)
    db_session.commit()
    db_session.refresh(user)
    print(f"✓ Created test user: {user.email}")
    
    # Create GL accounts
    gl_accounts = {}
    account_configs = [
        ("1200", "Inventory", "Asset"),
        ("5000", "Cost of Goods Sold", "Expense"), 
        ("4000", "Sales Revenue", "Income"),
        ("5100", "Inventory Adjustment", "Expense")
    ]
    
    for code, name, acc_type in account_configs:
        account = models.GLAccount(
            company_id=company.id,
            account_code=code,
            account_name=name,
            account_type=acc_type,
            current_balance=Decimal("0.00"),
            is_active=True
        )
        db_session.add(account)
        gl_accounts[name.lower().replace(" ", "_")] = account
    
    db_session.commit()
    print(f"✓ Created {len(gl_accounts)} GL accounts")
    
    return company, user, gl_accounts

def test_inventory_basic_operations():
    """Test basic inventory operations"""
    print("\n=== Phase 6 Inventory Tests ===")
    
    db_session = create_test_session()
    
    try:
        # Setup test data
        company, user, gl_accounts = setup_test_data(db_session)
        
        # Test 1: Create Unit of Measure
        print("\n--- Test 1: Unit of Measure ---")
        uom = crud.create_unit_of_measure(
            db_session,
            schemas.UnitOfMeasureCreate(
                name="Each",
                abbreviation="EA",
                conversion_factor_to_base=Decimal("1.00")
            ),
            company.id
        )
        print(f"✓ Created UoM: {uom.name} ({uom.abbreviation})")
        
        # Test 2: Create Warehouse
        print("\n--- Test 2: Warehouse ---")
        warehouse = crud.create_warehouse(
            db_session,
            schemas.WarehouseCreate(
                name="Test Warehouse",
                location="Test Location",
                is_default=True
            ),
            company.id
        )
        print(f"✓ Created warehouse: {warehouse.name}")
        
        # Test 3: Create Inventory Item
        print("\n--- Test 3: Inventory Item ---")
        item = crud.create_inventory_item(
            db_session,
            schemas.InventoryItemCreate(
                item_code="TEST-001",
                description="Test Widget",
                item_type="Stock",
                unit_of_measure_id=uom.id,
                costing_method="WeightedAverage",
                selling_price=Decimal("25.00"),
                reorder_level=Decimal("10"),
                reorder_quantity=Decimal("100"),
                default_inventory_gl_account_id=gl_accounts["inventory"].id,
                default_cogs_gl_account_id=gl_accounts["cost_of_goods_sold"].id,
                default_sales_gl_account_id=gl_accounts["sales_revenue"].id
            ),
            company.id
        )
        print(f"✓ Created item: {item.item_code} - {item.description}")
        
        # Test 4: Create Transaction Type
        print("\n--- Test 4: Transaction Type ---")
        trans_type = crud.create_inventory_transaction_type(
            db_session,
            schemas.InventoryTransactionTypeCreate(
                name="Stock Receipt",
                description="Initial stock receipt",
                base_type="AdjustmentIncrease",
                affects_quantity_direction="Increase",
                default_offsetting_gl_account_id=gl_accounts["inventory_adjustment"].id
            ),
            company.id
        )
        print(f"✓ Created transaction type: {trans_type.name}")
        
        # Test 5: Process Inventory Adjustment
        print("\n--- Test 5: Inventory Adjustment ---")
        adjustment = crud.process_inventory_adjustment(
            db_session,
            schemas.InventoryAdjustmentCreate(
                item_id=item.id,
                warehouse_id=warehouse.id,
                quantity=Decimal("100"),
                unit_cost=Decimal("10.00"),
                inventory_transaction_type_id=trans_type.id,
                reason="Initial stock receipt for testing",
                transaction_date=date.today()
            ),
            company.id,
            user.id
        )
        print(f"✓ Processed adjustment: {adjustment.quantity} units at ${adjustment.unit_cost}")
        
        # Verify results
        db_session.refresh(item)
        print(f"✓ Item average cost updated to: ${item.average_cost}")
        
        # Check stock levels
        location = db_session.query(models.InventoryItemLocation).filter(
            models.InventoryItemLocation.item_id == item.id,
            models.InventoryItemLocation.warehouse_id == warehouse.id
        ).first()
        
        if location:
            print(f"✓ Stock quantity: {location.quantity_on_hand}")
        else:
            print("✗ No stock location found")
        
        # Test 6: Generate Stock Report
        print("\n--- Test 6: Stock Report ---")
        stock_report = crud.get_stock_quantities(db_session, company.id, None)
        print(f"✓ Stock report generated with {len(stock_report)} entries")
        
        for stock in stock_report:
            print(f"  - {stock['item_code']}: {stock['quantity_on_hand']} @ {stock['warehouse_name']}")
        
        print("\n🎉 All inventory tests PASSED!")
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        return False
        
    finally:
        # Cleanup - remove test data
        try:
            db_session.query(models.InventoryTransaction).filter(
                models.InventoryTransaction.company_id == company.id
            ).delete()
            db_session.query(models.InventoryItemLocation).filter(
                models.InventoryItemLocation.item_id == item.id
            ).delete()
            db_session.query(models.InventoryItem).filter(
                models.InventoryItem.company_id == company.id
            ).delete()
            db_session.query(models.Warehouse).filter(
                models.Warehouse.company_id == company.id
            ).delete()
            db_session.query(models.UnitOfMeasure).filter(
                models.UnitOfMeasure.company_id == company.id
            ).delete()
            db_session.query(models.GLAccount).filter(
                models.GLAccount.company_id == company.id
            ).delete()
            db_session.query(models.UserRole).filter(
                models.UserRole.user_id == user.id
            ).delete()
            db_session.query(models.User).filter(
                models.User.company_id == company.id
            ).delete()
            db_session.query(models.Role).filter(
                models.Role.company_id == company.id
            ).delete()
            db_session.query(models.Company).filter(
                models.Company.id == company.id
            ).delete()
            db_session.commit()
            print("✓ Cleanup completed")
        except:
            pass
        finally:
            db_session.close()

if __name__ == "__main__":
    success = test_inventory_basic_operations()
    sys.exit(0 if success else 1)
