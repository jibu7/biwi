#!/usr/bin/env python3
"""
Phase 6 Inventory Integration Test
Tests the complete inventory lifecycle as described in the integration test
"""
import sys
import os
sys.path.append('/app')

from decimal import Decimal
from datetime import date, timedelta
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

def test_complete_inventory_lifecycle():
    """Test the complete inventory lifecycle from the integration test"""
    print("\n=== Phase 6 Complete Inventory Lifecycle Test ===")
    
    db_session = create_test_session()
    
    try:
        # Step 1: Setup Master Data
        print("\n--- Step 1: Setup Master Data ---")
        
        # Create test company
        import uuid
        company_name = f"Integration Test Company {uuid.uuid4().hex[:8]}"
        company = models.Company(name=company_name, is_active=True)
        db_session.add(company)
        db_session.commit()
        db_session.refresh(company)
        print(f"✓ Created company: {company.name}")
        
        # Create test user
        role = models.Role(
            name="Inventory Manager",
            company_id=company.id,
            permissions=["inv:setup_manage", "inv:transactions_adjust", "inv:reports_view"]
        )
        db_session.add(role)
        db_session.commit()
        
        user = models.User(
            email=f"integration_test_{uuid.uuid4().hex[:8]}@test.com",
            hashed_password=get_password_hash("password123"),
            full_name="Integration Test User",
            is_active=True,
            company_id=company.id
        )
        db_session.add(user)
        db_session.commit()
        
        user_role = models.UserRole(user_id=user.id, role_id=role.id)
        db_session.add(user_role)
        db_session.commit()
        print(f"✓ Created user: {user.email}")
        
        # Create GL accounts
        gl_accounts = {}
        for code, name, acc_type in [
            ("1200", "Inventory", "Asset"),
            ("5000", "Cost of Goods Sold", "Expense"),
            ("4000", "Sales Revenue", "Income"),
            ("5100", "Inventory Adjustment", "Expense")
        ]:
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
        print(f"✓ Created GL accounts")
        
        # Create Units of Measure
        uom_each = crud.create_unit_of_measure(
            db_session,
            schemas.UnitOfMeasureCreate(
                name="Each",
                abbreviation="EA",
                conversion_factor_to_base=Decimal("1.00")
            ),
            company.id
        )
        
        uom_box = crud.create_unit_of_measure(
            db_session,
            schemas.UnitOfMeasureCreate(
                name="Box",
                abbreviation="BX",
                conversion_factor_to_base=Decimal("12.00")
            ),
            company.id
        )
        print(f"✓ Created UoMs: {uom_each.name}, {uom_box.name}")
        
        # Create Warehouses
        main_warehouse = crud.create_warehouse(
            db_session,
            schemas.WarehouseCreate(
                name="Main Warehouse",
                location="123 Main Street",
                is_default=True
            ),
            company.id
        )
        
        branch_warehouse = crud.create_warehouse(
            db_session,
            schemas.WarehouseCreate(
                name="Branch Warehouse", 
                location="456 Branch Road",
                is_default=False
            ),
            company.id
        )
        print(f"✓ Created warehouses: {main_warehouse.name}, {branch_warehouse.name}")
        
        # Create Transaction Types
        adj_increase_type = crud.create_inventory_transaction_type(
            db_session,
            schemas.InventoryTransactionTypeCreate(
                name="Adjustment - Increase",
                description="Increase stock levels",
                base_type="AdjustmentIncrease",
                affects_quantity_direction="Increase",
                default_offsetting_gl_account_id=gl_accounts["inventory_adjustment"].id
            ),
            company.id
        )
        
        adj_decrease_type = crud.create_inventory_transaction_type(
            db_session,
            schemas.InventoryTransactionTypeCreate(
                name="Adjustment - Decrease",
                description="Decrease stock levels", 
                base_type="AdjustmentDecrease",
                affects_quantity_direction="Decrease",
                default_offsetting_gl_account_id=gl_accounts["inventory_adjustment"].id
            ),
            company.id
        )
        
        transfer_out_type = crud.create_inventory_transaction_type(
            db_session,
            schemas.InventoryTransactionTypeCreate(
                name="Transfer Out",
                base_type="WarehouseTransferOut",
                affects_quantity_direction="Decrease"
            ),
            company.id
        )
        
        transfer_in_type = crud.create_inventory_transaction_type(
            db_session,
            schemas.InventoryTransactionTypeCreate(
                name="Transfer In",
                base_type="WarehouseTransferIn",
                affects_quantity_direction="Increase"
            ),
            company.id
        )
        print(f"✓ Created transaction types")
        
        # Step 2: Create Inventory Item
        print("\n--- Step 2: Create Inventory Item ---")
        widget_item = crud.create_inventory_item(
            db_session,
            schemas.InventoryItemCreate(
                item_code="WIDGET-001",
                description="Standard Widget",
                item_type="Stock",
                unit_of_measure_id=uom_each.id,
                costing_method="WeightedAverage",
                standard_cost=Decimal("0.00"),
                selling_price=Decimal("25.00"),
                reorder_level=Decimal("50"),
                reorder_quantity=Decimal("200"),
                default_inventory_gl_account_id=gl_accounts["inventory"].id,
                default_cogs_gl_account_id=gl_accounts["cost_of_goods_sold"].id,
                default_sales_gl_account_id=gl_accounts["sales_revenue"].id
            ),
            company.id
        )
        print(f"✓ Created item: {widget_item.item_code}")
        
        # Step 3: Initial Stock Receipt
        print("\n--- Step 3: Initial Stock Receipt ---")
        initial_receipt = crud.process_inventory_adjustment(
            db_session,
            schemas.InventoryAdjustmentCreate(
                item_id=widget_item.id,
                warehouse_id=main_warehouse.id,
                quantity=Decimal("500"),
                unit_cost=Decimal("10.00"),
                inventory_transaction_type_id=adj_increase_type.id,
                reason="Initial stock receipt from supplier",
                transaction_date=date.today()
            ),
            company.id,
            user.id
        )
        
        db_session.refresh(widget_item)
        assert widget_item.average_cost == Decimal("10.00")
        print(f"✓ Initial receipt: 500 units at $10.00, avg cost: ${widget_item.average_cost}")
        
        # Step 4: Second Receipt with Different Cost
        print("\n--- Step 4: Second Receipt (Different Cost) ---")
        second_receipt = crud.process_inventory_adjustment(
            db_session,
            schemas.InventoryAdjustmentCreate(
                item_id=widget_item.id,
                warehouse_id=main_warehouse.id,
                quantity=Decimal("300"),
                unit_cost=Decimal("12.00"),
                inventory_transaction_type_id=adj_increase_type.id,
                reason="Second shipment received",
                transaction_date=date.today()
            ),
            company.id,
            user.id
        )
        
        # Verify weighted average cost calculation
        db_session.refresh(widget_item)
        expected_avg = (Decimal("500") * Decimal("10") + Decimal("300") * Decimal("12")) / Decimal("800")
        assert widget_item.average_cost == expected_avg
        print(f"✓ Second receipt: 300 units at $12.00, new avg cost: ${widget_item.average_cost}")
        
        # Step 5: Warehouse Transfer
        print("\n--- Step 5: Warehouse Transfer ---")
        transfer_result = crud.process_warehouse_transfer(
            db_session,
            schemas.WarehouseTransferCreate(
                item_id=widget_item.id,
                from_warehouse_id=main_warehouse.id,
                to_warehouse_id=branch_warehouse.id,
                quantity=Decimal("200"),
                transfer_date=date.today(),
                notes="Transfer to branch for local sales"
            ),
            company.id,
            user.id
        )
        print(f"✓ Transferred 200 units from Main to Branch warehouse")
        
        # Step 6: Stock Write-off
        print("\n--- Step 6: Stock Write-off ---")
        writeoff = crud.process_inventory_adjustment(
            db_session,
            schemas.InventoryAdjustmentCreate(
                item_id=widget_item.id,
                warehouse_id=main_warehouse.id,
                quantity=Decimal("25"),
                inventory_transaction_type_id=adj_decrease_type.id,
                reason="Damaged goods - water damage in storage",
                transaction_date=date.today()
            ),
            company.id,
            user.id
        )
        print(f"✓ Wrote off 25 units due to damage")
        
        # Step 7: Generate Reports
        print("\n--- Step 7: Generate Reports ---")
        
        # Stock Quantities Report
        stock_report = crud.get_stock_quantities(db_session, company.id, None)
        print(f"✓ Stock report generated with {len(stock_report)} entries")
        total_on_hand = sum(Decimal(str(s["quantity_on_hand"])) for s in stock_report)
        
        for stock in stock_report:
            print(f"  - {stock['item_code']}: {stock['quantity_on_hand']} @ {stock['warehouse_name']}")
        
        print(f"✓ Total stock on hand: {total_on_hand}")
        
        # Inventory Valuation Report  
        valuation = crud.get_inventory_valuation(db_session, company.id, None, date.today())
        total_value = sum(Decimal(str(v["total_value"])) for v in valuation)
        print(f"✓ Total inventory value: ${total_value}")
        
        # Movement Report
        movements = crud.get_inventory_movement(
            db_session,
            company.id,
            widget_item.id,
            None,
            date.today() - timedelta(days=1),
            date.today() + timedelta(days=1)
        )
        print(f"✓ Movement report: {len(movements)} transactions")
        
        print(f"\n🎉 Complete Inventory Lifecycle Test PASSED!")
        print(f"   Final average cost: ${widget_item.average_cost}")
        print(f"   Total stock: {total_on_hand} units")
        print(f"   Total value: ${total_value}")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Integration test failed: {e}")
        import traceback
        traceback.print_exc()
        return False
        
    finally:
        # Cleanup
        try:
            # Delete in reverse order of dependencies
            if 'company' in locals():
                db_session.query(models.InventoryTransaction).filter(
                    models.InventoryTransaction.company_id == company.id
                ).delete()
                db_session.query(models.InventoryItemLocation).filter(
                    models.InventoryItemLocation.company_id == company.id
                ).delete()
                db_session.query(models.InventoryTransactionType).filter(
                    models.InventoryTransactionType.company_id == company.id
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
    success = test_complete_inventory_lifecycle()
    sys.exit(0 if success else 1)
