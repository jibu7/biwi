"""
Test file to demonstrate proper test isolation with the new fixtures.
This shows how to use dynamic data and proper database isolation.
"""
import pytest
from app.models.core import Company


def test_isolation_demo_1(db_session, unique_suffix):
    """Test 1: Create a company with unique data."""
    company = Company(
        name=f"Demo Company 1 {unique_suffix}",
        code=f"DC1-{unique_suffix}",
        is_active=True
    )
    db_session.add(company)
    db_session.commit()
    
    assert company.id is not None
    assert company.name == f"Demo Company 1 {unique_suffix}"


def test_isolation_demo_2(db_session, unique_suffix):
    """Test 2: Create another company with unique data."""
    company = Company(
        name=f"Demo Company 2 {unique_suffix}",
        code=f"DC2-{unique_suffix}",
        is_active=True
    )
    db_session.add(company)
    db_session.commit()
    
    assert company.id is not None
    assert company.name == f"Demo Company 2 {unique_suffix}"


def test_isolation_demo_3(db_session, unique_suffix):
    """Test 3: Verify database is clean for each test."""
    # Query for any companies - should be empty since each test gets fresh DB
    companies = db_session.query(Company).all()
    assert len(companies) == 0  # Database should be clean
    
    # Now create a company
    company = Company(
        name=f"Demo Company 3 {unique_suffix}",
        code=f"DC3-{unique_suffix}",
        is_active=True
    )
    db_session.add(company)
    db_session.commit()
    
    # Now should have exactly one company
    companies = db_session.query(Company).all()
    assert len(companies) == 1


def test_with_test_company_fixture(test_company, db_session):
    """Test 4: Using the test_company fixture."""
    # The test_company fixture creates a company for us
    assert test_company.id is not None
    assert test_company.is_active is True
    
    # Verify it's in the database
    companies = db_session.query(Company).all()
    assert len(companies) == 1
    assert companies[0].id == test_company.id
