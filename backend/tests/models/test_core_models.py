#!/usr/bin/env python3
"""
Test script to verify core models and database connectivity
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import sessionmaker
from app.database.database import engine
from app.models.core import Company, Role, User, UserRole, AccountingPeriod

def test_database_connection():
    """Test basic database connectivity"""
    try:
        # Create a session
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        session = SessionLocal()
        
        # Test basic query
        companies = session.query(Company).all()
        print(f"✅ Database connection successful. Found {len(companies)} companies.")
        
        session.close()
        return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

def test_model_creation():
    """Test creating sample data"""
    try:
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        session = SessionLocal()
        
        # Create a sample company
        company = Company(
            name="Test Company",
            address={"street": "123 Test St", "city": "Test City", "country": "Test Country"},
            contact_info={"email": "contact@testcompany.com", "phone": "+1234567890"},
            default_currency_code="USD",
            is_active=True
        )
        session.add(company)
        session.commit()
        session.refresh(company)
        
        # Create a sample role
        role = Role(
            name="Admin",
            description="Administrator role with full permissions",
            permissions=["create", "read", "update", "delete"],
            company_id=company.id
        )
        session.add(role)
        session.commit()
        session.refresh(role)
        
        # Create a sample user
        user = User(
            email="admin@testcompany.com",
            hashed_password="$2b$12$dummy_hash",
            full_name="Test Admin",
            is_active=True,
            is_superuser=True,
            company_id=company.id
        )
        session.add(user)
        session.commit()
        session.refresh(user)
        
        # Create user role assignment
        user_role = UserRole(user_id=user.id, role_id=role.id)
        session.add(user_role)
        session.commit()
        
        # Create accounting period
        from datetime import date
        period = AccountingPeriod(
            company_id=company.id,
            name="2025 Q1",
            start_date=date(2025, 1, 1),
            end_date=date(2025, 3, 31),
            status="Open"
        )
        session.add(period)
        session.commit()
        
        print(f"✅ Sample data created successfully:")
        print(f"   - Company: {company.name} (ID: {company.id})")
        print(f"   - Role: {role.name} (ID: {role.id})")
        print(f"   - User: {user.email} (ID: {user.id})")
        print(f"   - Accounting Period: {period.name} (ID: {period.id})")
        
        session.close()
        return True
        
    except Exception as e:
        print(f"❌ Model creation failed: {e}")
        session.rollback()
        session.close()
        return False

def test_relationships():
    """Test model relationships"""
    try:
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        session = SessionLocal()
        
        # Get the company with its related data
        company = session.query(Company).filter(Company.name == "Test Company").first()
        if not company:
            print("❌ Test company not found")
            return False
        
        print(f"✅ Testing relationships for company: {company.name}")
        print(f"   - Users: {len(company.users)}")
        print(f"   - Roles: {len(company.roles)}")
        print(f"   - Accounting Periods: {len(company.accounting_periods)}")
        
        if company.users:
            user = company.users[0]
            print(f"   - User roles: {len(user.roles)}")
            if user.roles:
                user_role = user.roles[0]
                print(f"   - Role name: {user_role.role.name}")
        
        session.close()
        return True
        
    except Exception as e:
        print(f"❌ Relationship test failed: {e}")
        session.close()
        return False

if __name__ == "__main__":
    print("🚀 Testing Core System Backend Foundation")
    print("=" * 50)
    
    # Run tests
    tests = [
        ("Database Connection", test_database_connection),
        ("Model Creation", test_model_creation),
        ("Relationships", test_relationships)
    ]
    
    all_passed = True
    for test_name, test_func in tests:
        print(f"\n📋 {test_name}:")
        if not test_func():
            all_passed = False
    
    print("\n" + "=" * 50)
    if all_passed:
        print("🎉 All tests passed! Core system backend foundation is working correctly.")
    else:
        print("⚠️  Some tests failed. Please check the errors above.")
