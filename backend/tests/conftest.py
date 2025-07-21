import pytest
import os
import uuid
from decimal import Decimal
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient
from app.database.database import Base, get_db
from app.main import app
from app import models
from app.core.security import get_password_hash

# Use existing database for testing with proper transaction isolation
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://Biwi_user:Biwi_password@localhost:5432/Biwi_db")
SQLALCHEMY_DATABASE_URL = DATABASE_URL

engine = create_engine(SQLALCHEMY_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db_session():
    """Create a fresh database session for each test with transaction isolation."""
    # Create a connection and transaction for isolation
    connection = engine.connect()
    transaction = connection.begin()
    
    try:
        # Ensure tables exist - create them if needed
        Base.metadata.create_all(bind=connection)
        
        # Create a session bound to the connection
        session = TestingSessionLocal(bind=connection)
        
        yield session
        
    except Exception as e:
        # If there's any error, make sure we rollback
        print(f"Error in test setup: {e}")
        raise
    finally:
        if 'session' in locals():
            session.close()
        # Rollback the transaction to undo all changes
        try:
            transaction.rollback()
        except Exception:
            pass  # Transaction might already be closed
        connection.close()

@pytest.fixture(scope="function")
def client(db_session):
    """Create a test client with database dependency override."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest.fixture
def unique_suffix():
    """Generate unique suffix for test data to avoid conflicts."""
    return str(uuid.uuid4())[:8]

@pytest.fixture
def test_company(db_session, unique_suffix):
    """Create a test company with unique data."""
    company = models.Company(
        name=f"Test Company {unique_suffix}",
        code=f"TC{unique_suffix}",
        address={"street": f"123 Test St {unique_suffix}"},
        is_active=True
    )
    db_session.add(company)
    db_session.commit()
    db_session.refresh(company)
    return company

@pytest.fixture
def test_superuser(db_session, test_company, unique_suffix):
    """Create a test superuser with unique data."""
    user = models.User(
        email=f"admin{unique_suffix}@test.com",
        hashed_password=get_password_hash("testpass123"),
        full_name=f"Test Admin {unique_suffix}",
        is_active=True,
        is_superuser=True,
        company_id=test_company.id
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture
def test_user(db_session, test_company, unique_suffix):
    """Create a test user with inventory permissions and unique data."""
    # Create role with inventory permissions
    role = models.Role(
        name=f"Inventory Manager {unique_suffix}",
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
        email=f"inv_manager{unique_suffix}@test.com",
        hashed_password=get_password_hash("password123"),
        full_name=f"Inventory Manager {unique_suffix}",
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
def test_gl_accounts(db_session, test_company, unique_suffix):
    """Create test GL accounts with unique data."""
    accounts = {
        "inventory": models.GLAccount(
            company_id=test_company.id,
            account_code=f"1200-{unique_suffix}",
            account_name=f"Inventory {unique_suffix}",
            account_type="Asset",
            current_balance=Decimal("0.00"),
            is_active=True
        ),
        "cogs": models.GLAccount(
            company_id=test_company.id,
            account_code=f"5000-{unique_suffix}",
            account_name=f"Cost of Goods Sold {unique_suffix}",
            account_type="Expense",
            current_balance=Decimal("0.00"),
            is_active=True
        ),
        "sales": models.GLAccount(
            company_id=test_company.id,
            account_code=f"4000-{unique_suffix}",
            account_name=f"Sales Revenue {unique_suffix}",
            account_type="Income",
            current_balance=Decimal("0.00"),
            is_active=True
        ),
        "adjustment": models.GLAccount(
            company_id=test_company.id,
            account_code=f"5100-{unique_suffix}",
            account_name=f"Inventory Adjustment {unique_suffix}",
            account_type="Expense",
            current_balance=Decimal("0.00"),
            is_active=True
        )
    }
    
    for account in accounts.values():
        db_session.add(account)
    
    db_session.commit()
    return accounts
