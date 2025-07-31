import pytest
from app import crud
from app.schemas.core import UserCreate, UserUpdate
from app.core.security import get_password_hash

class TestUserCRUD:
    def test_create_user(self, db, test_company):
        user_data = UserCreate(
            email="test@example.com",
            password="testpassword",
            full_name="Test User",
            company_id=test_company.id
        )
        user = user_crud.create(db=db, obj_in=user_data)
        
        assert user.email == "test@example.com"
        assert user.full_name == "Test User"
        assert user.company_id == test_company.id
        assert user.hashed_password != "testpassword"  # Should be hashed
    
    def test_get_user_by_email(self, db, test_superuser):
        retrieved_user = user_crud.get_by_email(db=db, email=test_superuser.email)
        
        assert retrieved_user is not None
        assert retrieved_user.email == test_superuser.email
        assert retrieved_user.id == test_superuser.id
    
    def test_authenticate_user(self, db, test_company):
        # Create user with known password
        user_data = UserCreate(
            email="auth@test.com",
            password="testpass123",
            full_name="Auth User",
            company_id=test_company.id
        )
        user = user_crud.create(db=db, obj_in=user_data)
        
        # Test authentication
        authenticated_user = user_crud.authenticate(
            db=db, email="auth@test.com", password="testpass123"
        )
        
        assert authenticated_user is not None
        assert authenticated_user.email == "auth@test.com"
        
        # Test failed authentication
        failed_auth = user_crud.authenticate(
            db=db, email="auth@test.com", password="wrongpassword"
        )
        
        assert failed_auth is False
    
    def test_update_user(self, db, test_superuser):
        update_data = UserUpdate(full_name="Updated Name")
        updated_user = user_crud.update(db=db, db_obj=test_superuser, obj_in=update_data)
        
        assert updated_user.full_name == "Updated Name"
        assert updated_user.email == test_superuser.email
