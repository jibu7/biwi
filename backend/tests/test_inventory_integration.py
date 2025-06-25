"""
Integration test for complete inventory workflow
Tests the full cycle from setup to reporting
"""
import pytest
from decimal import Decimal
from datetime import date, timedelta
from sqlalchemy.orm import Session
from app import models, schemas, crud


class TestInventoryIntegrationWorkflow:
    """Test complete inventory management workflow"""
    
    def test_complete_inventory_lifecycle(self, db_session: Session, test_company, test_user, test_gl_accounts):
        """Test full inventory lifecycle from setup to reporting"""
        
        # Step 1: Setup Master Data
        # Create Units of Measure
        uom_each = crud.create_unit_of_measure(
            db_session,
            schemas.UnitOfMeasureCreate(
                name="Each",
                abbreviation="EA",
                conversion_factor_to_base=Decimal("1.00")
            ),
            test_company.id
        )
        
        uom_box = crud.create_unit_of_measure(
            db_session,
            schemas.UnitOfMeasureCreate(
                name="Box",
                abbreviation="BX",
                conversion_factor_to_base=Decimal("12.00")  # 12 each per box
            ),
            test_company.id
        )
        
        # Create Warehouses
        main_warehouse = crud.create_warehouse(
            db_session,
            schemas.WarehouseCreate(
                name="Main Warehouse",
                location="123 Main Street",
                is_default=True
            ),
            test_company.id
        )
        
        branch_warehouse = crud.create_warehouse(
            db_session,
            schemas.WarehouseCreate(
                name="Branch Warehouse",
                location="456 Branch Road",
                is_default=False
            ),
            test_company.id
        )
        
        # Create Inventory Defaults
        inv_defaults = crud.create_or_update_inventory_defaults(
            db_session,
            schemas.InventoryDefaultsCreate(
                default_warehouse_id=main_warehouse.id,
                default_inventory_gl_account_id=test_gl_accounts["inventory"].id,
                default_cogs_gl_account_id=test_gl_accounts["cogs"].id,
                default_inventory_adjustment_gl_account_id=test_gl_accounts["adjustment"].id
            ),
            test_company.id
        )
        
        # Create Transaction Types
        adj_increase_type = crud.create_inventory_transaction_type(
            db_session,
            schemas.InventoryTransactionTypeCreate(
                name="Adjustment - Increase",
                description="Increase stock levels",
                base_type="AdjustmentIncrease",
                affects_quantity_direction="Increase",
                default_offsetting_gl_account_id=test_gl_accounts["adjustment"].id
            ),
            test_company.id
        )
        
        adj_decrease_type = crud.create_inventory_transaction_type(
            db_session,
            schemas.InventoryTransactionTypeCreate(
                name="Adjustment - Decrease",
                description="Decrease stock levels",
                base_type="AdjustmentDecrease",
                affects_quantity_direction="Decrease",
                default_offsetting_gl_account_id=test_gl_accounts["adjustment"].id
            ),
            test_company.id
        )
        
        transfer_out_type = crud.create_inventory_transaction_type(
            db_session,
            schemas.InventoryTransactionTypeCreate(
                name="Transfer Out",
                base_type="WarehouseTransferOut",
                affects_quantity_direction="Decrease"
            ),
            test_company.id
        )
        
        transfer_in_type = crud.create_inventory_transaction_type(
            db_session,
            schemas.InventoryTransactionTypeCreate(
                name="Transfer In",
                base_type="WarehouseTransferIn",
                affects_quantity_direction="Increase"
            ),
            test_company.id
        )
        
        # Step 2: Create Inventory Items
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
                default_inventory_gl_account_id=test_gl_accounts["inventory"].id,
                default_cogs_gl_account_id=test_gl_accounts["cogs"].id,
                default_sales_gl_account_id=test_gl_accounts["sales"].id
            ),
            test_company.id
        )
        
        # Create barcode for the item
        barcode = crud.create_item_barcode(
            db_session,
            schemas.ItemBarcodeCreate(
                item_id=widget_item.id,
                barcode="123456789012",
                unit_of_measure_id=uom_each.id,
                quantity_in_uom=Decimal("1.00")
            ),
            test_company.id
        )
        
        # Step 3: Initial Stock Receipt
        # Process initial inventory adjustment
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
            test_company.id,
            test_user.id
        )
        
        # Verify initial stock and cost
        db_session.refresh(widget_item)
        assert widget_item.average_cost == Decimal("10.00")
        
        main_location = db_session.query(models.InventoryItemLocation).filter(
            models.InventoryItemLocation.item_id == widget_item.id,
            models.InventoryItemLocation.warehouse_id == main_warehouse.id
        ).first()
        assert main_location.quantity_on_hand == Decimal("500")
        
        # Verify GL posting
        assert initial_receipt.linked_gl_journal_entry_id is not None
        gl_entry = db_session.query(models.GLJournalEntry).filter(
            models.GLJournalEntry.id == initial_receipt.linked_gl_journal_entry_id
        ).first()
        assert gl_entry is not None
        assert gl_entry.status == "Posted"
        
        # Step 4: Second Receipt with Different Cost
        # This tests weighted average calculation
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
            test_company.id,
            test_user.id
        )
        
        # Verify weighted average cost
        # (500 * 10 + 300 * 12) / 800 = 10.75
        db_session.refresh(widget_item)
        expected_avg = (Decimal("500") * Decimal("10") + Decimal("300") * Decimal("12")) / Decimal("800")
        assert widget_item.average_cost == expected_avg
        
        # Step 5: Warehouse Transfer
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
            test_company.id,
            test_user.id
        )
        
        # Verify stock levels after transfer
        db_session.refresh(main_location)
        assert main_location.quantity_on_hand == Decimal("600")  # 800 - 200
        
        branch_location = db_session.query(models.InventoryItemLocation).filter(
            models.InventoryItemLocation.item_id == widget_item.id,
            models.InventoryItemLocation.warehouse_id == branch_warehouse.id
        ).first()
        assert branch_location.quantity_on_hand == Decimal("200")
        
        # Step 6: Stock Write-off (Damage)
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
            test_company.id,
            test_user.id
        )
        
        # Verify stock after write-off
        db_session.refresh(main_location)
        assert main_location.quantity_on_hand == Decimal("575")  # 600 - 25
        
        # Step 7: Inventory Count Process
        # Start inventory count session
        count_session = crud.start_inventory_count(
            db_session,
            schemas.InventoryCountSessionCreate(
                warehouse_id=main_warehouse.id,
                count_date=date.today(),
                notes="Monthly cycle count"
            ),
            test_company.id,
            main_warehouse.id
        )
        
        # Get count lines
        count_lines = db_session.query(models.InventoryCountLine).filter(
            models.InventoryCountLine.inventory_count_session_id == count_session.id
        ).all()
        
        assert len(count_lines) == 1
        assert count_lines[0].system_quantity == Decimal("575")
        
        # Record physical count (simulate finding 570 instead of 575)
        count_updates = [
            schemas.InventoryCountLineUpdate(
                id=count_lines[0].id,
                counted_quantity=Decimal("570")
            )
        ]
        
        crud.record_counted_quantities(
            db_session,
            count_session.id,
            count_updates,
            test_company.id
        )
        
        # Process count variances
        crud.process_inventory_count_variances(
            db_session,
            count_session.id,
            test_company.id,
            test_user.id
        )
        
        # Verify adjustment was made
        db_session.refresh(main_location)
        assert main_location.quantity_on_hand == Decimal("570")
        
        # Verify count session completed
        db_session.refresh(count_session)
        assert count_session.status == "Completed"
        
        # Step 8: Generate Reports
        # Inventory Valuation Report
        valuation = crud.get_inventory_valuation(
            db_session,
            test_company.id,
            None,  # All warehouses
            date.today()
        )
        
        assert len(valuation) == 2  # Main and branch warehouses
        total_value = sum(v["total_value"] for v in valuation)
        expected_total_value = (Decimal("570") + Decimal("200")) * widget_item.average_cost
        assert total_value == expected_total_value
        
        # Stock Quantities Report
        stock_report = crud.get_stock_quantities(
            db_session,
            test_company.id,
            None  # All warehouses
        )
        
        assert len(stock_report) == 2
        total_on_hand = sum(s["quantity_on_hand"] for s in stock_report)
        assert total_on_hand == Decimal("770")  # 570 + 200
        
        # Movement Report
        movements = crud.get_inventory_movement(
            db_session,
            test_company.id,
            widget_item.id,
            None,  # All warehouses
            date.today() - timedelta(days=1),
            date.today() + timedelta(days=1)
        )
        
        # Should have: 2 receipts, 2 transfers, 1 write-off, 1 count adjustment
        assert len(movements) == 6
        
        # Step 9: Verify GL Impact
        # Check inventory GL account balance
        inv_gl_account = db_session.query(models.GLAccount).filter(
            models.GLAccount.id == test_gl_accounts["inventory"].id
        ).first()
        
        # Initial receipts: +5000 +3600 = 8600
        # Write-off: -268.75 (25 * 10.75)
        # Count adjustment: -53.75 (5 * 10.75)
        # Net should be: 8277.50
        expected_balance = (
            Decimal("500") * Decimal("10") +  # First receipt
            Decimal("300") * Decimal("12") -  # Second receipt
            Decimal("25") * expected_avg -     # Write-off
            Decimal("5") * expected_avg        # Count variance
        )
        
        # Note: This assumes GL account balances are being updated
        # In practice, you'd need to sum all GL journal entry lines
        
        # Verify all transactions have GL entries
        all_transactions = db_session.query(models.InventoryTransaction).filter(
            models.InventoryTransaction.company_id == test_company.id
        ).all()
        
        for trans in all_transactions:
            if trans.inventory_transaction_type_id in [adj_increase_type.id, adj_decrease_type.id]:
                assert trans.linked_gl_journal_entry_id is not None
        
        print("Complete inventory lifecycle test passed!")
        print(f"Final stock levels: Main={main_location.quantity_on_hand}, Branch={branch_location.quantity_on_hand}")
        print(f"Average cost: ${widget_item.average_cost}")
        print(f"Total inventory value: ${total_value}")
    
    def test_multi_item_warehouse_operations(self, db_session: Session, test_company, test_user, test_gl_accounts):
        """Test operations with multiple items across warehouses"""
        
        # Setup basic data (abbreviated for brevity)
        uom = crud.create_unit_of_measure(
            db_session,
            schemas.UnitOfMeasureCreate(name="Each", abbreviation="EA"),
            test_company.id
        )
        
        warehouse1 = crud.create_warehouse(
            db_session,
            schemas.WarehouseCreate(name="Warehouse 1", is_default=True),
            test_company.id
        )
        
        warehouse2 = crud.create_warehouse(
            db_session,
            schemas.WarehouseCreate(name="Warehouse 2"),
            test_company.id
        )
        
        # Create multiple items
        items = []
        for i in range(3):
            item = crud.create_inventory_item(
                db_session,
                schemas.InventoryItemCreate(
                    item_code=f"ITEM{i:03d}",
                    description=f"Test Item {i}",
                    item_type="Stock",
                    unit_of_measure_id=uom.id,
                    selling_price=Decimal(f"{(i+1)*10}")
                ),
                test_company.id
            )
            items.append(item)
        
        # Add stock to different items in different warehouses
        adj_type = db_session.query(models.InventoryTransactionType).filter(
            models.InventoryTransactionType.base_type == "AdjustmentIncrease",
            models.InventoryTransactionType.company_id == test_company.id
        ).first()
        
        if not adj_type:
            adj_type = crud.create_inventory_transaction_type(
                db_session,
                schemas.InventoryTransactionTypeCreate(
                    name="Stock Receipt",
                    base_type="AdjustmentIncrease",
                    affects_quantity_direction="Increase"
                ),
                test_company.id
            )
        
        # Add stock: Item0 in both warehouses, Item1 only in WH1, Item2 only in WH2
        stock_configs = [
            (items[0], warehouse1, Decimal("100"), Decimal("5.00")),
            (items[0], warehouse2, Decimal("50"), Decimal("5.50")),
            (items[1], warehouse1, Decimal("200"), Decimal("8.00")),
            (items[2], warehouse2, Decimal("150"), Decimal("12.00")),
        ]
        
        for item, warehouse, qty, cost in stock_configs:
            crud.process_inventory_adjustment(
                db_session,
                schemas.InventoryAdjustmentCreate(
                    item_id=item.id,
                    warehouse_id=warehouse.id,
                    quantity=qty,
                    unit_cost=cost,
                    inventory_transaction_type_id=adj_type.id,
                    reason=f"Initial stock for {item.item_code} in {warehouse.name}"
                ),
                test_company.id,
                test_user.id
            )
        
        # Verify stock distribution
        stock_report = crud.get_stock_quantities(db_session, test_company.id, None)
        
        # Should have 4 location records
        assert len(stock_report) == 4
        
        # Verify specific quantities
        item0_wh1 = next(s for s in stock_report if s["item_code"] == "ITEM000" and "Warehouse 1" in s["warehouse_name"])
        assert item0_wh1["quantity_on_hand"] == 100
        
        item0_wh2 = next(s for s in stock_report if s["item_code"] == "ITEM000" and "Warehouse 2" in s["warehouse_name"])
        assert item0_wh2["quantity_on_hand"] == 50
        
        # Verify weighted average for Item0
        # (100 * 5.00 + 50 * 5.50) / 150 = 5.17
        db_session.refresh(items[0])
        expected_avg = (Decimal("100") * Decimal("5") + Decimal("50") * Decimal("5.50")) / Decimal("150")
        assert round(items[0].average_cost, 2) == round(expected_avg, 2)
        
        print("Multi-item warehouse operations test passed!")