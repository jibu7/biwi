#!/usr/bin/env python3
"""
CRUD Operations Validation Script for Phase 1
This script validates that all CRUD operations work correctly.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.database.database import SessionLocal
from app import crud, schemas, models
from datetime import date

def test_crud_operations():
    """Test all CRUD operations"""
    db: Session = SessionLocal()
    
    try:
        print("🧪 Testing CRUD Operations...")
        
        # Test Company CRUD
        print("\n1. Testing Company CRUD...")
        company_data = schemas.CompanyCreate(
            name="Test Company",
            address="123 Test St",
            email="test@company.com",
            phone="123-456-7890",
            tax_id="12345"
        )
        company = crud.create_company(db, company_data)
        print(f"✅ Created company: {company.name} (ID: {company.id})")
        
        # Test fetching company
        fetched_company = crud.get_company(db, company.id)
        assert fetched_company is not None
        print(f"✅ Fetched company: {fetched_company.name}")
        
        # Test User CRUD
        print("\n2. Testing User CRUD...")
        user_data = schemas.UserCreate(
            email="test@example.com",
            password="testpassword123",
            full_name="Test User",
            is_active=True,
            is_superuser=False
        )
        user = crud.create_user(db, user_data, company.id)
        print(f"✅ Created user: {user.email} (ID: {user.id})")
        
        # Test fetching user by email
        fetched_user = crud.get_user_by_email(db, user.email)
        assert fetched_user is not None
        print(f"✅ Fetched user by email: {fetched_user.email}")
        
        # Test Role CRUD
        print("\n3. Testing Role CRUD...")
        role_data = schemas.RoleCreate(
            name="Test Role",
            description="A test role",
            permissions=["users:read", "companies:read"]
        )
        role = crud.create_role(db, role_data, company.id)
        print(f"✅ Created role: {role.name} (ID: {role.id})")
        
        # Test role assignment
        assigned_user = crud.assign_role_to_user(db, user.id, role.id, company.id)
        assert assigned_user is not None
        print(f"✅ Assigned role to user: {assigned_user.email}")
        
        # Test Accounting Period CRUD
        print("\n4. Testing Accounting Period CRUD...")
        period_data = schemas.AccountingPeriodCreate(
            name="2024 Q1",
            start_date=date(2024, 1, 1),
            end_date=date(2024, 3, 31),
            status="active"
        )
        period = crud.create_accounting_period(db, period_data, company.id)
        print(f"✅ Created accounting period: {period.name} (ID: {period.id})")
        
        # Test list operations
        print("\n5. Testing List Operations...")
        users = crud.get_users_by_company(db, company.id)
        print(f"✅ Found {len(users)} users in company")
        
        roles = crud.get_roles_by_company(db, company.id)
        print(f"✅ Found {len(roles)} roles in company")
        
        periods = crud.get_accounting_periods_by_company(db, company.id)
        print(f"✅ Found {len(periods)} accounting periods in company")
        
        companies = crud.get_companies(db)
        print(f"✅ Found {len(companies)} companies total")
        
        print("\n🎉 All CRUD operations working correctly!")
        return True
        
    except Exception as e:
        print(f"\n❌ Error testing CRUD operations: {e}")
        return False
    finally:
        db.close()

if __name__ == "__main__":
    success = test_crud_operations()
    sys.exit(0 if success else 1)
