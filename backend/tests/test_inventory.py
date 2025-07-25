import pytest
from sqlalchemy.orm import Session
from fastapi.testclient import TestClient
from decimal import Decimal
from datetime import date
from app import models, schemas, crud
from app.main import app
from app.database.database import get_db
from app.core.security import get_password_hash

# Test database fixture
@pytest.fixture
def db_session():
    """Create a test database session"""
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from app.database.database import Base
    
    SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
    engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    Base.metadata.create_all(bind=engine)
    
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture
def test_client(db_session):
    """Create a test client with database override"""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    
    with TestClient(app) as client:
        yield client
    
    app.dependency_overrides.clear()

@pytest.fixture
def test_company(db_session):
    """Create a test company"""
    company = models.Company(
        name="Test Company",
        is_active=True
    )
    db_session.add(company)
    db_session.commit()
    db_session.refresh(company)
    return company

@pytest.fixture
def test_user(db_session, test_company):
    """Create a test user with inventory permissions"""
    # Create role with inventory permissions
    role = models.Role(
        name="Inventory Manager",
        company_id=test_company.id,
        permissions=[
            "inv:setup_manage",
            "inv:transactions_adjust",
            "inv:reports_view"
        ]
    )
    db_session.add(role)
    db_session.commit()
    
    # Create user
    user = models.User(
        email="inv_manager@test.com",
        hashed_password=get_password_hash("password123"),
        full_name="Inventory Manager",
        is_active=True,
        is_superuser=False,
        company_id=test_company.id
    )
    db_session.add(user)
    db_session.commit()
    
    # Assign role to user
    user_role = models.UserRole(
        user_id=user.id,
        role_id=role.id
    )
    db_session.add(user_role)
    db_session.commit()
    
    db_session.refresh(user)
    return user

@pytest.fixture
def auth_headers(test_client, test_user):
    """Get authentication headers"""
    response = test_client.post(
        "/api/v1/auth/login",
        data={"username": test_user.email, "password": "password123"}
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def test_gl_accounts(db_session, test_company):
    """Create test GL accounts"""
    accounts = {
        "inventory": models.GLAccount(
            company_id=test_company.id,
            account_code="1200",
            account_name="Inventory",
            account_type="Asset",
            current_balance=Decimal("0.00"),
            is_active=True
        ),
        "cogs": models.GLAccount(
            company_id=test_company.id,
            account_code="5000",
            account_name="Cost of Goods Sold",
            account_type="Expense",
            current_balance=Decimal("0.00"),
            is_active=True
        ),
        "sales": models.GLAccount(
            company_id=test_company.id,
            account_code="4000",
            account_name="Sales Revenue",
            account_type="Income",
            current_balance=Decimal("0.00"),
            is_active=True
        ),
        "adjustment": models.GLAccount(
            company_id=test_company.id,
            account_code="5100",
            account_name="Inventory Adjustment",
            account_type="Expense",
            current_balance=Decimal("0.00"),
            is_active=True
        )
    }
    
    for account in accounts.values():
        db_session.add(account)
    
    db_session.commit()
    return accounts

class TestInventorySetup:
    """Test inventory setup endpoints"""
    
    def test_create_unit_of_measure(self, test_client, auth_headers):
        """Test creating a unit of measure"""
        uom_data = {
            "name": "Each",
            "abbreviation": "EA",
            "conversion_factor_to_base": 1.0,
            "is_active": True
        }
        
        response = test_client.post(
            "/api/v1/inventory/units-of-measure",
            json=uom_data,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Each"
        assert data["abbreviation"] == "EA"
        assert data["conversion_factor_to_base"] == 1.0
    
    def test_create_warehouse(self, test_client, auth_headers):
        """Test creating a warehouse"""
        warehouse_data = {
            "name": "Main Warehouse",
            "warehouse_code": "WH-MAIN",
            "location": "123 Main St",
            "is_default": True,
            "is_active": True
        }
        
        response = test_client.post(
            "/api/v1/inventory/warehouses",
            json=warehouse_data,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Main Warehouse"
        assert data["warehouse_code"] == "WH-MAIN"
        assert data["is_default"] == True

    def test_warehouse_code_uniqueness_within_company(self, test_client, auth_headers):
        """Test that warehouse_code must be unique within a company"""
        warehouse_data_1 = {
            "name": "Warehouse One",
            "warehouse_code": "WH-001",
            "location": "Location 1",
            "is_default": False,
            "is_active": True
        }
        
        warehouse_data_2 = {
            "name": "Warehouse Two", 
            "warehouse_code": "WH-001",  # Same code - should fail
            "location": "Location 2",
            "is_default": False,
            "is_active": True
        }
        
        # Create first warehouse - should succeed
        response1 = test_client.post(
            "/api/v1/inventory/warehouses",
            json=warehouse_data_1,
            headers=auth_headers
        )
        assert response1.status_code == 200
        
        # Create second warehouse with same code - should fail
        response2 = test_client.post(
            "/api/v1/inventory/warehouses", 
            json=warehouse_data_2,
            headers=auth_headers
        )
        assert response2.status_code == 400
        assert "warehouse_code" in response2.json()["detail"].lower()

    def test_warehouse_code_required(self, test_client, auth_headers):
        """Test that warehouse_code is required"""
        warehouse_data = {
            "name": "Test Warehouse",
            "location": "Test Location",
            "is_default": False,
            "is_active": True
            # Missing warehouse_code
        }
        
        response = test_client.post(
            "/api/v1/inventory/warehouses",
            json=warehouse_data,
            headers=auth_headers
        )
        
        assert response.status_code == 422
        error_detail = response.json()["detail"][0]
        assert error_detail["loc"] == ["body", "warehouse_code"]
        assert error_detail["type"] == "missing"
    
    def test_create_inventory_item(self, test_client, auth_headers, db_session, test_company, test_gl_accounts):
        """Test creating an inventory item"""
        # First create UoM
        uom = models.UnitOfMeasure(
            company_id=test_company.id,
            name="Each",
            abbreviation="EA",
            conversion_factor_to_base=Decimal("1.00")
        )
        db_session.add(uom)
        db_session.commit()
        
        item_data = {
            "item_code": "ITEM001",
            "description": "Test Item",
            "item_type": "Stock",
            "unit_of_measure_id": uom.id,
            "costing_method": "WeightedAverage",
            "standard_cost": 10.00,
            "selling_price": 15.00,
            "is_active": True,
            "reorder_level": 10,
            "reorder_quantity": 50,
            "default_inventory_gl_account_id": test_gl_accounts["inventory"].id,
            "default_cogs_gl_account_id": test_gl_accounts["cogs"].id,
            "default_sales_gl_account_id": test_gl_accounts["sales"].id
        }
        
        response = test_client.post(
            "/api/v1/inventory/items",
            json=item_data,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["item_code"] == "ITEM001"
        assert data["description"] == "Test Item"
        assert data["average_cost"] == 0.0  # Initially zero
    
    def test_create_inventory_transaction_type(self, test_client, auth_headers, test_gl_accounts):
        """Test creating an inventory transaction type"""
        trans_type_data = {
            "name": "Stock Adjustment - Increase",
            "description": "Adjustment to increase stock",
            "base_type": "AdjustmentIncrease",
            "affects_quantity_direction": "Increase",
            "default_offsetting_gl_account_id": test_gl_accounts["adjustment"].id
        }
        
        response = test_client.post(
            "/api/v1/inventory/transaction-types",
            json=trans_type_data,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Stock Adjustment - Increase"
        assert data["base_type"] == "AdjustmentIncrease"

class TestInventoryTransactions:
    """Test inventory transaction processing"""
    
    @pytest.fixture
    def setup_inventory(self, db_session, test_company, test_gl_accounts):
        """Setup basic inventory data"""
        # Create UoM
        uom = models.UnitOfMeasure(
            company_id=test_company.id,
            name="Each",
            abbreviation="EA"
        )
        db_session.add(uom)
        
        # Create warehouse
        warehouse = models.Warehouse(
            company_id=test_company.id,
            name="Main Warehouse",
            is_default=True
        )
        db_session.add(warehouse)
        
        # Create inventory defaults
        inv_defaults = models.InventoryDefaults(
            company_id=test_company.id,
            default_warehouse_id=warehouse.id,
            default_inventory_gl_account_id=test_gl_accounts["inventory"].id,
            default_cogs_gl_account_id=test_gl_accounts["cogs"].id,
            default_inventory_adjustment_gl_account_id=test_gl_accounts["adjustment"].id
        )
        db_session.add(inv_defaults)
        
        # Create transaction types
        trans_types = {
            "increase": models.InventoryTransactionType(
                company_id=test_company.id,
                name="Adjustment Increase",
                base_type="AdjustmentIncrease",
                affects_quantity_direction="Increase",
                default_offsetting_gl_account_id=test_gl_accounts["adjustment"].id
            ),
            "decrease": models.InventoryTransactionType(
                company_id=test_company.id,
                name="Adjustment Decrease",
                base_type="AdjustmentDecrease",
                affects_quantity_direction="Decrease",
                default_offsetting_gl_account_id=test_gl_accounts["adjustment"].id
            )
        }
        
        for trans_type in trans_types.values():
            db_session.add(trans_type)
        
        db_session.commit()
        
        # Create item
        item = models.InventoryItem(
            company_id=test_company.id,
            item_code="TEST001",
            description="Test Item",
            item_type="Stock",
            unit_of_measure_id=uom.id,
            average_cost=Decimal("0.00"),
            selling_price=Decimal("20.00"),
            default_inventory_gl_account_id=test_gl_accounts["inventory"].id
        )
        db_session.add(item)
        db_session.commit()
        
        # Create item location
        location = models.InventoryItemLocation(
            company_id=test_company.id,
            item_id=item.id,
            warehouse_id=warehouse.id,
            quantity_on_hand=Decimal("0.00")
        )
        db_session.add(location)
        db_session.commit()
        
        return {
            "item": item,
            "warehouse": warehouse,
            "location": location,
            "trans_types": trans_types,
            "inv_defaults": inv_defaults
        }
    
    def test_inventory_adjustment_increase(self, test_client, auth_headers, setup_inventory):
        """Test inventory adjustment to increase stock"""
        adjustment_data = {
            "item_id": setup_inventory["item"].id,
            "warehouse_id": setup_inventory["warehouse"].id,
            "quantity": 100,
            "unit_cost": 10.00,
            "inventory_transaction_type_id": setup_inventory["trans_types"]["increase"].id,
            "reason": "Initial stock receipt",
            "transaction_date": str(date.today())
        }
        
        response = test_client.post(
            "/api/v1/inventory/adjustments",
            json=adjustment_data,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["quantity"] == 100
        assert data["unit_cost"] == 10.00
        assert data["total_value"] == 1000.00
        
        # Verify stock level was updated
        response = test_client.get(
            "/api/v1/inventory/reports/stock-quantity",
            headers=auth_headers
        )
        stock_data = response.json()
        assert len(stock_data) == 1
        assert stock_data[0]["quantity_on_hand"] == 100
    
    def test_inventory_adjustment_decrease(self, test_client, auth_headers, setup_inventory, db_session):
        """Test inventory adjustment to decrease stock"""
        # First add some stock
        setup_inventory["location"].quantity_on_hand = Decimal("50.00")
        setup_inventory["item"].average_cost = Decimal("10.00")
        db_session.commit()
        
        adjustment_data = {
            "item_id": setup_inventory["item"].id,
            "warehouse_id": setup_inventory["warehouse"].id,
            "quantity": 20,
            "inventory_transaction_type_id": setup_inventory["trans_types"]["decrease"].id,
            "reason": "Damaged goods write-off",
            "transaction_date": str(date.today())
        }
        
        response = test_client.post(
            "/api/v1/inventory/adjustments",
            json=adjustment_data,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["quantity"] == -20  # Negative for decrease
        
        # Verify stock level was updated
        response = test_client.get(
            "/api/v1/inventory/reports/stock-quantity",
            headers=auth_headers
        )
        stock_data = response.json()
        assert stock_data[0]["quantity_on_hand"] == 30  # 50 - 20
    
    def test_weighted_average_costing(self, db_session, test_company, setup_inventory, test_user):
        """Test weighted average cost calculation"""
        # First adjustment: 100 units at $10
        adjustment1 = schemas.InventoryAdjustmentCreate(
            item_id=setup_inventory["item"].id,
            warehouse_id=setup_inventory["warehouse"].id,
            quantity=Decimal("100"),
            unit_cost=Decimal("10.00"),
            inventory_transaction_type_id=setup_inventory["trans_types"]["increase"].id,
            reason="First receipt"
        )
        
        result1 = crud.process_inventory_adjustment(
            db_session,
            adjustment1,
            test_company.id,
            test_user.id
        )
        
        # Verify average cost
        db_session.refresh(setup_inventory["item"])
        assert setup_inventory["item"].average_cost == Decimal("10.00")
        
        # Second adjustment: 50 units at $15
        adjustment2 = schemas.InventoryAdjustmentCreate(
            item_id=setup_inventory["item"].id,
            warehouse_id=setup_inventory["warehouse"].id,
            quantity=Decimal("50"),
            unit_cost=Decimal("15.00"),
            inventory_transaction_type_id=setup_inventory["trans_types"]["increase"].id,
            reason="Second receipt"
        )
        
        result2 = crud.process_inventory_adjustment(
            db_session,
            adjustment2,
            test_company.id,
            test_user.id
        )
        
        # Verify weighted average cost: (100*10 + 50*15) / 150 = 11.67
        db_session.refresh(setup_inventory["item"])
        expected_avg = (Decimal("100") * Decimal("10") + Decimal("50") * Decimal("15")) / Decimal("150")
        assert round(setup_inventory["item"].average_cost, 2) == round(expected_avg, 2)

class TestWarehouseTransfers:
    """Test warehouse transfer functionality"""
    
    @pytest.fixture
    def setup_two_warehouses(self, db_session, test_company, setup_inventory):
        """Setup two warehouses with stock"""
        # Create second warehouse
        warehouse2 = models.Warehouse(
            company_id=test_company.id,
            name="Secondary Warehouse",
            is_default=False
        )
        db_session.add(warehouse2)
        db_session.commit()
        
        # Create location in second warehouse
        location2 = models.InventoryItemLocation(
            company_id=test_company.id,
            item_id=setup_inventory["item"].id,
            warehouse_id=warehouse2.id,
            quantity_on_hand=Decimal("0.00")
        )
        db_session.add(location2)
        
        # Add transfer transaction types
        trans_types = {
            "transfer_out": models.InventoryTransactionType(
                company_id=test_company.id,
                name="Warehouse Transfer Out",
                base_type="WarehouseTransferOut",
                affects_quantity_direction="Decrease"
            ),
            "transfer_in": models.InventoryTransactionType(
                company_id=test_company.id,
                name="Warehouse Transfer In",
                base_type="WarehouseTransferIn",
                affects_quantity_direction="Increase"
            )
        }
        
        for trans_type in trans_types.values():
            db_session.add(trans_type)
        
        # Add stock to first warehouse
        setup_inventory["location"].quantity_on_hand = Decimal("100.00")
        setup_inventory["item"].average_cost = Decimal("10.00")
        
        db_session.commit()
        
        return {
            "warehouse2": warehouse2,
            "location2": location2,
            "trans_types": trans_types
        }
    
    def test_warehouse_transfer(self, test_client, auth_headers, setup_inventory, setup_two_warehouses):
        """Test transferring stock between warehouses"""
        transfer_data = {
            "item_id": setup_inventory["item"].id,
            "from_warehouse_id": setup_inventory["warehouse"].id,
            "to_warehouse_id": setup_two_warehouses["warehouse2"].id,
            "quantity": 30,
            "transfer_date": str(date.today()),
            "notes": "Transfer to secondary location"
        }
        
        response = test_client.post(
            "/api/v1/inventory/warehouse-transfers",
            json=transfer_data,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2  # Two transactions created
        
        # Verify stock levels
        response = test_client.get(
            "/api/v1/inventory/reports/stock-quantity",
            headers=auth_headers
        )
        stock_data = response.json()
        
        # Find stock for each warehouse
        main_stock = next(s for s in stock_data if s["warehouse_name"] == "Main Warehouse")
        secondary_stock = next(s for s in stock_data if s["warehouse_name"] == "Secondary Warehouse")
        
        assert main_stock["quantity_on_hand"] == 70  # 100 - 30
        assert secondary_stock["quantity_on_hand"] == 30

class TestInventoryCount:
    """Test inventory count functionality"""
    
    def test_inventory_count_process(self, test_client, auth_headers, setup_inventory, db_session):
        """Test complete inventory count process"""
        # Add initial stock
        setup_inventory["location"].quantity_on_hand = Decimal("100.00")
        setup_inventory["item"].average_cost = Decimal("10.00")
        db_session.commit()
        
        # Start inventory count
        count_data = {
            "warehouse_id": setup_inventory["warehouse"].id,
            "count_date": str(date.today()),
            "notes": "Monthly inventory count"
        }
        
        response = test_client.post(
            "/api/v1/inventory/counts/sessions",
            json=count_data,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        session_data = response.json()
        session_id = session_data["id"]
        assert session_data["status"] == "Open"
        
        # Get count lines
        response = test_client.get(
            f"/api/v1/inventory/counts/sessions/{session_id}/lines",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        lines = response.json()
        assert len(lines) == 1
        assert lines[0]["system_quantity"] == 100
        
        # Record counted quantities (simulate physical count found 95)
        count_updates = [
            {
                "id": lines[0]["id"],
                "counted_quantity": 95
            }
        ]
        
        response = test_client.put(
            f"/api/v1/inventory/counts/sessions/{session_id}/lines",
            json=count_updates,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        
        # Process variances
        response = test_client.post(
            f"/api/v1/inventory/counts/sessions/{session_id}/process-variances",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        
        # Verify stock was adjusted
        response = test_client.get(
            "/api/v1/inventory/reports/stock-quantity",
            headers=auth_headers
        )
        stock_data = response.json()
        assert stock_data[0]["quantity_on_hand"] == 95  # Adjusted to counted quantity

class TestInventoryReports:
    """Test inventory reporting functionality"""
    
    def test_inventory_valuation_report(self, test_client, auth_headers, setup_inventory, db_session):
        """Test inventory valuation report"""
        # Add stock with known cost
        setup_inventory["location"].quantity_on_hand = Decimal("100.00")
        setup_inventory["item"].average_cost = Decimal("10.00")
        db_session.commit()
        
        response = test_client.get(
            "/api/v1/inventory/reports/valuation",
            params={"as_of_date": str(date.today())},
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["quantity_on_hand"] == 100
        assert data[0]["average_cost"] == 10.00
        assert data[0]["total_value"] == 1000.00
    
    def test_inventory_movement_report(self, test_client, auth_headers, setup_inventory, db_session, test_user):
        """Test inventory movement report"""
        # Create some movements
        for i in range(3):
            adjustment = schemas.InventoryAdjustmentCreate(
                item_id=setup_inventory["item"].id,
                warehouse_id=setup_inventory["warehouse"].id,
                quantity=Decimal("10"),
                unit_cost=Decimal("10.00"),
                inventory_transaction_type_id=setup_inventory["trans_types"]["increase"].id,
                reason=f"Receipt {i+1}"
            )
            crud.process_inventory_adjustment(
                db_session,
                adjustment,
                setup_inventory["item"].company_id,
                test_user.id
            )
        
        response = test_client.get(
            "/api/v1/inventory/reports/movement",
            params={
                "item_id": setup_inventory["item"].id,
                "start_date": str(date.today()),
                "end_date": str(date.today())
            },
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3
        assert all(t["quantity"] == 10 for t in data)