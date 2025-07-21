import pytest
from decimal import Decimal
from datetime import date, timedelta
from sqlalchemy.exc import IntegrityError
from app.models.oe import SalesOrder, SalesOrderLine, PurchaseOrder, PurchaseOrderLine

class TestSalesOrderModel:
    def test_create_sales_order(self, db, test_company):
        # Create customer first (assuming ARCustomer exists)
        from app.models.ar import ARCustomer
        customer = ARCustomer(
            company_id=test_company.id,
            customer_code="CUST001",
            name="Test Customer"
        )
        db.add(customer)
        db.commit()
        
        sales_order = SalesOrder(
            company_id=test_company.id,
            customer_id=customer.id,
            order_number="SO-001",
            order_date=date.today(),
            delivery_date=date.today() + timedelta(days=7),
            status="Draft",
            subtotal=Decimal("1000.00"),
            tax_amount=Decimal("100.00"),
            total_amount=Decimal("1100.00"),
            notes="Test sales order"
        )
        db.add(sales_order)
        db.commit()
        
        assert sales_order.id is not None
        assert sales_order.order_number == "SO-001"
        assert sales_order.status == "Draft"
        assert sales_order.total_amount == Decimal("1100.00")
        assert sales_order.customer_id == customer.id
    
    def test_sales_order_unique_number_per_company(self, db, test_company):
        from app.models.ar import ARCustomer
        customer = ARCustomer(company_id=test_company.id, customer_code="CUST001", name="Test Customer")
        db.add(customer)
        db.commit()
        
        so1 = SalesOrder(company_id=test_company.id, customer_id=customer.id, order_number="SO-001")
        db.add(so1)
        db.commit()
        
        so2 = SalesOrder(company_id=test_company.id, customer_id=customer.id, order_number="SO-001")
        db.add(so2)
        with pytest.raises(IntegrityError):
            db.commit()

class TestSalesOrderLineModel:
    def test_create_sales_order_line(self, db, test_company):
        # Create prerequisites
        from app.models.ar import ARCustomer
        from app.models.inventory import InventoryItem, UnitOfMeasure
        
        customer = ARCustomer(company_id=test_company.id, customer_code="CUST001", name="Test Customer")
        db.add(customer)
        db.commit()
        
        uom = UnitOfMeasure(company_id=test_company.id, name="Each", abbreviation="EA")
        db.add(uom)
        db.commit()
        
        item = InventoryItem(
            company_id=test_company.id,
            item_code="ITEM001",
            name="Test Item",
            unit_of_measure_id=uom.id
        )
        db.add(item)
        db.commit()
        
        sales_order = SalesOrder(
            company_id=test_company.id,
            customer_id=customer.id,
            order_number="SO-001",
            order_date=date.today()
        )
        db.add(sales_order)
        db.commit()
        
        order_line = SalesOrderLine(
            company_id=test_company.id,
            sales_order_id=sales_order.id,
            item_id=item.id,
            line_number=1,
            quantity=Decimal("10"),
            unit_price=Decimal("50.00"),
            line_total=Decimal("500.00"),
            description="Test item line"
        )
        db.add(order_line)
        db.commit()
        
        assert order_line.id is not None
        assert order_line.line_number == 1
        assert order_line.quantity == Decimal("10")
        assert order_line.unit_price == Decimal("50.00")
        assert order_line.line_total == Decimal("500.00")
        assert order_line.sales_order_id == sales_order.id

class TestPurchaseOrderModel:
    def test_create_purchase_order(self, db, test_company):
        # Create vendor first
        from app.models.ap import APVendor
        vendor = APVendor(
            company_id=test_company.id,
            vendor_code="VEND001",
            name="Test Vendor"
        )
        db.add(vendor)
        db.commit()
        
        purchase_order = PurchaseOrder(
            company_id=test_company.id,
            vendor_id=vendor.id,
            order_number="PO-001",
            order_date=date.today(),
            delivery_date=date.today() + timedelta(days=14),
            status="Draft",
            subtotal=Decimal("2000.00"),
            tax_amount=Decimal("200.00"),
            total_amount=Decimal("2200.00"),
            notes="Test purchase order"
        )
        db.add(purchase_order)
        db.commit()
        
        assert purchase_order.id is not None
        assert purchase_order.order_number == "PO-001"
        assert purchase_order.status == "Draft"
        assert purchase_order.total_amount == Decimal("2200.00")
        assert purchase_order.vendor_id == vendor.id

class TestPurchaseOrderLineModel:
    def test_create_purchase_order_line(self, db, test_company):
        # Create prerequisites
        from app.models.ap import APVendor
        from app.models.inventory import InventoryItem, UnitOfMeasure
        
        vendor = APVendor(company_id=test_company.id, vendor_code="VEND001", name="Test Vendor")
        db.add(vendor)
        db.commit()
        
        uom = UnitOfMeasure(company_id=test_company.id, name="Each", abbreviation="EA")
        db.add(uom)
        db.commit()
        
        item = InventoryItem(
            company_id=test_company.id,
            item_code="ITEM001",
            name="Test Item",
            unit_of_measure_id=uom.id
        )
        db.add(item)
        db.commit()
        
        purchase_order = PurchaseOrder(
            company_id=test_company.id,
            vendor_id=vendor.id,
            order_number="PO-001",
            order_date=date.today()
        )
        db.add(purchase_order)
        db.commit()
        
        order_line = PurchaseOrderLine(
            company_id=test_company.id,
            purchase_order_id=purchase_order.id,
            item_id=item.id,
            line_number=1,
            quantity=Decimal("25"),
            unit_cost=Decimal("40.00"),
            line_total=Decimal("1000.00"),
            description="Test item purchase line"
        )
        db.add(order_line)
        db.commit()
        
        assert order_line.id is not None
        assert order_line.line_number == 1
        assert order_line.quantity == Decimal("25")
        assert order_line.unit_cost == Decimal("40.00")
        assert order_line.line_total == Decimal("1000.00")
        assert order_line.purchase_order_id == purchase_order.id
