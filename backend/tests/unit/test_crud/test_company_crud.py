import pytest
from app import crud
from app.schemas.core import CompanyCreate, CompanyUpdate

class TestCompanyCRUD:
    def test_create_company(self, db):
        company_data = CompanyCreate(
            name="Test Company",
            address={"street": "123 Main St"},
            contact_info={"phone": "555-0123"}
        )
        company = company_crud.create(db=db, obj_in=company_data)
        
        assert company.name == "Test Company"
        assert company.address["street"] == "123 Main St"
        assert company.contact_info["phone"] == "555-0123"
    
    def test_get_company(self, db, test_company):
        retrieved_company = company_crud.get(db=db, id=test_company.id)
        
        assert retrieved_company is not None
        assert retrieved_company.id == test_company.id
        assert retrieved_company.name == test_company.name
    
    def test_update_company(self, db, test_company):
        update_data = CompanyUpdate(name="Updated Company Name")
        updated_company = company_crud.update(db=db, db_obj=test_company, obj_in=update_data)
        
        assert updated_company.name == "Updated Company Name"
        assert updated_company.id == test_company.id
    
    def test_delete_company(self, db, test_company):
        company_crud.remove(db=db, id=test_company.id)
        deleted_company = company_crud.get(db=db, id=test_company.id)
        
        assert deleted_company is None
