import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database.database import Base, get_db
from app.main import app
from app.config import settings
from decimal import Decimal
from app import models, schemas, crud
from app.core.security import get_password_hash

# Use PostgreSQL for tests - same as production
import os
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://Biwi_user:Biwi_password@db:5432/Biwi_db")

engine = create_engine(SQLALCHEMY_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Don't create/drop tables - use existing database
# Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def test_db():
    return TestingSessionLocal()

@pytest.fixture
def db_session():
    """Create a test database session"""
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

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
