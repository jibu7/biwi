import pytest
from sqlalchemy.exc import IntegrityError
from app.models.core import Company, User, Role, AccountingPeriod
from datetime import date

class TestCompanyModel:
    def test_create_company(self, db_session, unique_suffix):
        """Test creating a company with dynamic unique data."""
        company = Company(
            name=f"Test Corp {unique_suffix}",
            code=f"TC{unique_suffix}",
            address={"street": f"123 Main St {unique_suffix}"},
            contact_info={"phone": "555-0123"},
            is_active=True
        )
        db_session.add(company)
        db_session.commit()
        
        assert company.id is not None
        assert company.name == f"Test Corp {unique_suffix}"
        assert company.code == f"TC{unique_suffix}"
        assert company.is_active == True
    
    def test_company_unique_name(self, db_session, unique_suffix):
        """Test that company names must be unique."""
        company_name = f"Unique Corp {unique_suffix}"
        
        company1 = Company(
            name=company_name,
            code=f"UNQ001-{unique_suffix}"
        )
        db_session.add(company1)
        db_session.commit()
        
        company2 = Company(
            name=company_name,  # Same name should cause conflict
            code=f"UNQ002-{unique_suffix}"  # Different code
        )
        db_session.add(company2)
        with pytest.raises(IntegrityError):
            db_session.commit()

    def test_company_required_fields(self, db_session, unique_suffix):
        """Test that required fields are enforced for Company model."""
        from sqlalchemy.exc import IntegrityError
        
        # Test missing name (required field)
        with pytest.raises(IntegrityError):
            company = Company(
                code=f"TC{unique_suffix}",  # has code but missing name
                is_active=True
            )
            db_session.add(company)
            db_session.commit()
        
        # Rollback the failed transaction
        db_session.rollback()
        
        # Test missing code (required field)
        with pytest.raises(IntegrityError):
            company = Company(
                name=f"Test Company {unique_suffix}",  # has name but missing code
                is_active=True
            )
            db_session.add(company)
            db_session.commit()
        
        # Rollback the failed transaction  
        db_session.rollback()
        
        # Test that valid company with all required fields works
        valid_company = Company(
            name=f"Valid Test Company {unique_suffix}",
            code=f"VTC{unique_suffix}",
            is_active=True
        )
        db_session.add(valid_company)
        db_session.commit()
        
        assert valid_company.id is not None
        assert valid_company.name == f"Valid Test Company {unique_suffix}"
        assert valid_company.code == f"VTC{unique_suffix}"

class TestUserModel:
    def test_create_user(self, db_session, test_company, unique_suffix):
        """Test creating a user with dynamic unique data."""
        user = User(
            email=f"test{unique_suffix}@example.com",
            hashed_password="hashed_password",
            full_name=f"Test User {unique_suffix}",
            company_id=test_company.id
        )
        db_session.add(user)
        db_session.commit()
        
        assert user.id is not None
        assert user.email == f"test{unique_suffix}@example.com"
        assert user.company_id == test_company.id
    
    def test_user_role_relationship(self, db_session, test_company, unique_suffix):
        """Test many-to-many relationship between users and roles."""
        role = Role(
            name=f"Accountant {unique_suffix}", 
            company_id=test_company.id
        )
        user = User(
            email=f"accountant{unique_suffix}@test.com", 
            hashed_password="hash", 
            company_id=test_company.id,
            full_name=f"Test Accountant {unique_suffix}"
        )
        db_session.add_all([role, user])
        db_session.commit()
        
        # Add user-role relationship
        from app.models.core import UserRole
        user_role = UserRole(user_id=user.id, role_id=role.id)
        db_session.add(user_role)
        db_session.commit()
        
        # Refresh to get relationships
        db_session.refresh(user)
        assert len(user.roles) == 1
        assert user.roles[0].role_id == role.id

    def test_user_unique_email(self, db_session, test_company, unique_suffix):
        """Test that user emails must be unique within a company."""
        email = f"unique{unique_suffix}@test.com"
        
        user1 = User(
            email=email,
            hashed_password="hash1",
            full_name=f"User One {unique_suffix}",
            company_id=test_company.id
        )
        db_session.add(user1)
        db_session.commit()
        
        user2 = User(
            email=email,  # Same email should cause conflict
            hashed_password="hash2",
            full_name=f"User Two {unique_suffix}",
            company_id=test_company.id
        )
        db_session.add(user2)
        with pytest.raises(IntegrityError):
            db_session.commit()

class TestRoleModel:
    def test_create_role(self, db_session, test_company, unique_suffix):
        """Test creating a role with dynamic unique data."""
        role = Role(
            name=f"Manager {unique_suffix}",
            company_id=test_company.id,
            permissions=["read", "write", "delete"]
        )
        db_session.add(role)
        db_session.commit()
        
        assert role.id is not None
        assert role.name == f"Manager {unique_suffix}"
        assert role.company_id == test_company.id
        assert "read" in role.permissions

class TestAccountingPeriod:
    def test_create_accounting_period(self, db_session, test_company, unique_suffix):
        """Test creating an accounting period with dynamic unique data."""
        period = AccountingPeriod(
            company_id=test_company.id,
            name=f"Jan 2024 {unique_suffix}",
            start_date=date(2024, 1, 1),
            end_date=date(2024, 1, 31),
            status="Open"
        )
        db_session.add(period)
        db_session.commit()
        
        assert period.id is not None
        assert period.name == f"Jan 2024 {unique_suffix}"
        assert period.status == "Open"
