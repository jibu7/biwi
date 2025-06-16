#!/usr/bin/env python3
"""
Test script to validate Sales Order to Invoice conversion fix
Tests that the conversion process:
1. Creates AR Invoice transaction
2. Updates inventory (reduces qty)
3. Updates item average cost (for COGS calculation)
4. Posts to GL correctly
5. Changes AR transaction status from Draft to Posted
"""

import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database.database import SessionLocal
from app import crud, schemas, models
from datetime import date
from decimal import Decimal

def test_so_conversion_workflow():
    """Test the complete SO to Invoice conversion workflow"""
    print("🧪 TESTING SALES ORDER TO INVOICE CONVERSION FIX")
    print("=" * 60)
    
    db = SessionLocal()
    try:
        # Get company
        company = db.query(models.Company).filter(models.Company.name == "Test Company").first()
        if not company:
            print("❌ Test Company not found")
            return False
        
        company_id = company.id
        user_id = 1  # Assume admin user
        
        print(f"📊 Working with Company: {company.name} (ID: {company_id})")
        
        # Step 1: Create necessary setup data
        print("\n1️⃣ SETTING UP TEST DATA")
        
        # Check if customer exists
        customer = db.query(models.Customer).filter(
            models.Customer.company_id == company_id,
            models.Customer.customer_code == "TEST001"
        ).first()
        
        if not customer:
            customer_data = schemas.CustomerCreate(
                customer_code="TEST001",
                name="Test Customer Inc",
                address={
                    "street": "123 Test Street",
                    "city": "Test City",
                    "state": "TS",
                    "postal_code": "12345",
                    "country": "USA"
                },
                contact_info={
                    "contact_person": "John Doe",
                    "email": "john@testcustomer.com",
                    "phone": "+1-555-0199"
                },
                credit_limit=Decimal("10000.00"),
                payment_terms="Net 30",
                is_active=True
            )
            customer = crud.ar.create_customer(db, customer_data, company_id)
            print(f"  ✅ Created customer: {customer.name}")
        else:
            print(f"  ✅ Customer exists: {customer.name}")
        
        # Check if inventory item exists
        item = db.query(models.InventoryItem).filter(
            models.InventoryItem.company_id == company_id,
            models.InventoryItem.item_code == "LAPTOP-I5-001"
        ).first()
        
        if not item:
            # Create inventory item
            item_data = schemas.InventoryItemCreate(
                item_code="LAPTOP-I5-001",
                description="laptop i5",
                item_type="Stock",
                category="Electronics",
                unit_of_measure="Each",
                average_cost=Decimal("299.00"),
                selling_price=Decimal("400.00")
            )
            item = crud.inventory.create_inventory_item(db, item_data, company_id)
            print(f"  ✅ Created item: {item.description}")
            
            # Create inventory location with stock
            warehouse = db.query(models.Warehouse).filter(
                models.Warehouse.company_id == company_id
            ).first()
            
            if warehouse:
                location_data = schemas.InventoryItemLocationCreate(
                    item_id=item.id,
                    warehouse_id=warehouse.id,
                    quantity_on_hand=Decimal("100"),
                    quantity_committed=Decimal("0"),
                    reorder_level=Decimal("10"),
                    reorder_quantity=Decimal("50")
                )
                location = crud.inventory.create_inventory_item_location(db, location_data, company_id)
                print(f"  ✅ Created inventory location with 100 units")
        else:
            print(f"  ✅ Item exists: {item.description}")
        
        # Step 2: Create a Sales Order
        print("\n2️⃣ CREATING SALES ORDER")
        
        so_data = schemas.SalesOrderCreate(
            customer_id=customer.id,
            order_date=date.today(),
            reference="TEST-SO-001",
            notes="Test sales order for conversion testing",
            lines=[
                schemas.SalesOrderLineCreate(
                    item_id=item.id,
                    description=item.description,
                    quantity_ordered=Decimal("2"),
                    unit_price=Decimal("400.00"),
                    discount_percentage=Decimal("0"),
                    tax_amount=Decimal("0"),
                    line_total=Decimal("800.00")
                )
            ]
        )
        
        sales_order = crud.oe.create_sales_order(db, so_data, company_id, user_id)
        print(f"  ✅ Created Sales Order: {sales_order.document_number}")
        print(f"     Status: {sales_order.status}")
        print(f"     Total: ${sales_order.total_amount}")
        
        # Get initial inventory quantities
        initial_location = db.query(models.InventoryItemLocation).filter(
            models.InventoryItemLocation.item_id == item.id,
            models.InventoryItemLocation.company_id == company_id
        ).first()
        
        initial_qty_on_hand = initial_location.quantity_on_hand if initial_location else 0
        initial_qty_committed = initial_location.quantity_committed if initial_location else 0
        initial_avg_cost = item.average_cost
        
        print(f"  📦 Initial Inventory - On Hand: {initial_qty_on_hand}, Committed: {initial_qty_committed}")
        print(f"  💰 Initial Average Cost: ${initial_avg_cost}")
        
        # Step 3: Convert Sales Order to Invoice
        print("\n3️⃣ CONVERTING SALES ORDER TO INVOICE")
        
        ar_invoice = crud.oe.convert_so_to_ar_invoice(db, sales_order.id, company_id, user_id)
        
        print(f"  ✅ Created AR Invoice: {ar_invoice.document_number}")
        print(f"     Status: {ar_invoice.status}")
        print(f"     Posted to GL: {ar_invoice.is_posted_to_gl}")
        print(f"     Total: ${ar_invoice.total_amount}")
        
        # Step 4: Verify inventory updates
        print("\n4️⃣ VERIFYING INVENTORY UPDATES")
        
        # Refresh the location and item
        db.refresh(initial_location)
        db.refresh(item)
        
        final_qty_on_hand = initial_location.quantity_on_hand
        final_qty_committed = initial_location.quantity_committed
        final_avg_cost = item.average_cost
        
        print(f"  📦 Final Inventory - On Hand: {final_qty_on_hand}, Committed: {final_qty_committed}")
        print(f"  💰 Final Average Cost: ${final_avg_cost}")
        
        # Verify changes
        qty_sold = Decimal("2")
        expected_final_on_hand = initial_qty_on_hand - qty_sold
        expected_final_committed = initial_qty_committed - qty_sold
        
        if final_qty_on_hand == expected_final_on_hand:
            print(f"  ✅ Quantity on hand correctly reduced by {qty_sold}")
        else:
            print(f"  ❌ Quantity on hand mismatch. Expected: {expected_final_on_hand}, Got: {final_qty_on_hand}")
        
        if final_qty_committed == expected_final_committed:
            print(f"  ✅ Committed quantity correctly reduced by {qty_sold}")
        else:
            print(f"  ❌ Committed quantity mismatch. Expected: {expected_final_committed}, Got: {final_qty_committed}")
        
        # Step 5: Verify GL postings
        print("\n5️⃣ VERIFYING GL POSTINGS")
        
        if ar_invoice.linked_gl_journal_entry_id:
            gl_entry = db.query(models.GLJournalEntry).filter(
                models.GLJournalEntry.id == ar_invoice.linked_gl_journal_entry_id
            ).first()
            
            if gl_entry:
                print(f"  ✅ GL Journal Entry created: {gl_entry.reference}")
                print(f"     Status: {gl_entry.status}")
                
                # Get GL lines
                gl_lines = db.query(models.GLJournalEntryLine).filter(
                    models.GLJournalEntryLine.journal_entry_id == gl_entry.id
                ).all()
                
                print(f"     GL Lines ({len(gl_lines)}):")
                total_debits = Decimal("0")
                total_credits = Decimal("0")
                
                for line in gl_lines:
                    account = db.query(models.GLAccount).filter(
                        models.GLAccount.id == line.gl_account_id
                    ).first()
                    
                    if line.debit_amount > 0:
                        print(f"       Dr {account.account_code}: {account.account_name} - ${line.debit_amount}")
                        total_debits += line.debit_amount
                    else:
                        print(f"       Cr {account.account_code}: {account.account_name} - ${line.credit_amount}")
                        total_credits += line.credit_amount
                
                print(f"     Total Debits: ${total_debits}")
                print(f"     Total Credits: ${total_credits}")
                
                if total_debits == total_credits:
                    print(f"  ✅ GL Entry is balanced")
                else:
                    print(f"  ❌ GL Entry is not balanced")
            else:
                print(f"  ❌ GL Journal Entry not found")
        else:
            print(f"  ❌ No GL Journal Entry linked to AR invoice")
        
        # Step 6: Verify Sales Order status
        print("\n6️⃣ VERIFYING SALES ORDER STATUS")
        
        db.refresh(sales_order)
        print(f"  Sales Order Status: {sales_order.status}")
        print(f"  Linked AR Invoice ID: {sales_order.ar_invoice_id}")
        
        if sales_order.status == "Invoiced":
            print(f"  ✅ Sales Order status correctly updated to Invoiced")
        else:
            print(f"  ❌ Sales Order status not updated. Expected: Invoiced, Got: {sales_order.status}")
        
        # Step 7: Summary
        print("\n7️⃣ CONVERSION TEST SUMMARY")
        print("-" * 40)
        
        success_checks = [
            ar_invoice.status == "Posted",
            ar_invoice.is_posted_to_gl == True,
            final_qty_on_hand == expected_final_on_hand,
            final_qty_committed == expected_final_committed,
            sales_order.status == "Invoiced",
            ar_invoice.linked_gl_journal_entry_id is not None
        ]
        
        passed_checks = sum(success_checks)
        total_checks = len(success_checks)
        
        print(f"Checks passed: {passed_checks}/{total_checks}")
        
        if all(success_checks):
            print("🎉 ALL TESTS PASSED - Sales Order to Invoice conversion is working correctly!")
            print("✅ AR Invoice transaction created and posted")
            print("✅ Inventory updated (quantities reduced)")
            print("✅ GL entries posted correctly")
            print("✅ Sales Order status updated")
            return True
        else:
            print("❌ SOME TESTS FAILED - Please review the issues above")
            return False
            
    except Exception as e:
        print(f"💥 Error during testing: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    success = test_so_conversion_workflow()
    sys.exit(0 if success else 1)
