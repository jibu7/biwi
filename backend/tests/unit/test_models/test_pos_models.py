import pytest
from decimal import Decimal
from datetime import datetime, date
from sqlalchemy.exc import IntegrityError
from app.models.pos import POSTransaction, POSTransactionLine, POSPayment, POSTerminal

class TestPOSTransactionModel:
    def test_create_pos_transaction(self, db, test_company):
        # Create POS terminal first
        terminal = POSTerminal(
            company_id=test_company.id,
            terminal_code="TERM001",
            name="Main Terminal",
            location="Store Front"
        )
        db.add(terminal)
        db.commit()
        
        transaction = POSTransaction(
            company_id=test_company.id,
            terminal_id=terminal.id,
            transaction_number="POS-001",
            transaction_date=datetime.now(),
            subtotal=Decimal("100.00"),
            tax_amount=Decimal("10.00"),
            total_amount=Decimal("110.00"),
            status="Completed",
            cashier_id=None,  # Assuming no user required for this test
            receipt_number="RCP-001"
        )
        db.add(transaction)
        db.commit()
        
        assert transaction.id is not None
        assert transaction.transaction_number == "POS-001"
        assert transaction.subtotal == Decimal("100.00")
        assert transaction.tax_amount == Decimal("10.00")
        assert transaction.total_amount == Decimal("110.00")
        assert transaction.status == "Completed"
        assert transaction.terminal_id == terminal.id
    
    def test_pos_transaction_unique_number_per_company(self, db, test_company):
        terminal = POSTerminal(company_id=test_company.id, terminal_code="TERM001", name="Main Terminal")
        db.add(terminal)
        db.commit()
        
        pos1 = POSTransaction(company_id=test_company.id, terminal_id=terminal.id, transaction_number="POS-001")
        db.add(pos1)
        db.commit()
        
        pos2 = POSTransaction(company_id=test_company.id, terminal_id=terminal.id, transaction_number="POS-001")
        db.add(pos2)
        with pytest.raises(IntegrityError):
            db.commit()

class TestPOSTransactionLineModel:
    def test_create_pos_transaction_line(self, db, test_company):
        # Create prerequisites
        from app.models.inventory import InventoryItem, UnitOfMeasure
        
        uom = UnitOfMeasure(company_id=test_company.id, name="Each", abbreviation="EA")
        db.add(uom)
        db.commit()
        
        item = InventoryItem(
            company_id=test_company.id,
            item_code="ITEM001",
            name="Test Item",
            unit_of_measure_id=uom.id,
            selling_price=Decimal("25.00")
        )
        db.add(item)
        db.commit()
        
        terminal = POSTerminal(company_id=test_company.id, terminal_code="TERM001", name="Main Terminal")
        db.add(terminal)
        db.commit()
        
        transaction = POSTransaction(
            company_id=test_company.id,
            terminal_id=terminal.id,
            transaction_number="POS-001",
            transaction_date=datetime.now()
        )
        db.add(transaction)
        db.commit()
        
        transaction_line = POSTransactionLine(
            company_id=test_company.id,
            transaction_id=transaction.id,
            item_id=item.id,
            line_number=1,
            quantity=Decimal("2"),
            unit_price=Decimal("25.00"),
            line_total=Decimal("50.00"),
            discount_amount=Decimal("0.00"),
            tax_amount=Decimal("5.00")
        )
        db.add(transaction_line)
        db.commit()
        
        assert transaction_line.id is not None
        assert transaction_line.line_number == 1
        assert transaction_line.quantity == Decimal("2")
        assert transaction_line.unit_price == Decimal("25.00")
        assert transaction_line.line_total == Decimal("50.00")
        assert transaction_line.transaction_id == transaction.id
        assert transaction_line.item_id == item.id

class TestPOSPaymentModel:
    def test_create_pos_payment(self, db, test_company):
        # Create prerequisites
        terminal = POSTerminal(company_id=test_company.id, terminal_code="TERM001", name="Main Terminal")
        db.add(terminal)
        db.commit()
        
        transaction = POSTransaction(
            company_id=test_company.id,
            terminal_id=terminal.id,
            transaction_number="POS-001",
            transaction_date=datetime.now(),
            total_amount=Decimal("110.00")
        )
        db.add(transaction)
        db.commit()
        
        payment = POSPayment(
            company_id=test_company.id,
            transaction_id=transaction.id,
            payment_method="Cash",
            amount=Decimal("110.00"),
            payment_date=datetime.now(),
            reference="CASH-001",
            change_amount=Decimal("0.00")
        )
        db.add(payment)
        db.commit()
        
        assert payment.id is not None
        assert payment.payment_method == "Cash"
        assert payment.amount == Decimal("110.00")
        assert payment.change_amount == Decimal("0.00")
        assert payment.transaction_id == transaction.id

class TestPOSTerminalModel:
    def test_create_pos_terminal(self, db, test_company):
        terminal = POSTerminal(
            company_id=test_company.id,
            terminal_code="TERM001",
            name="Main Cash Register",
            location="Store Front",
            is_active=True,
            last_sync_date=datetime.now(),
            settings={"tax_rate": "0.10", "receipt_printer": "enabled"}
        )
        db.add(terminal)
        db.commit()
        
        assert terminal.id is not None
        assert terminal.terminal_code == "TERM001"
        assert terminal.name == "Main Cash Register"
        assert terminal.location == "Store Front"
        assert terminal.is_active == True
        assert terminal.settings["tax_rate"] == "0.10"
    
    def test_terminal_unique_code_per_company(self, db, test_company):
        terminal1 = POSTerminal(company_id=test_company.id, terminal_code="TERM001", name="Terminal 1")
        db.add(terminal1)
        db.commit()
        
        terminal2 = POSTerminal(company_id=test_company.id, terminal_code="TERM001", name="Terminal 2")
        db.add(terminal2)
        with pytest.raises(IntegrityError):
            db.commit()
