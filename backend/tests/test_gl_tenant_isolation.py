import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app import crud, models, schemas
from app.core.security import get_password_hash

def test_gl_account_isolation(client: TestClient, db: Session):
    """Test that GL accounts are isolated between companies"""
    # Create two companies
    company1 = models.Company(name="Company 1")
    company2 = models.Company(name="Company 2")
    db.add_all([company1, company2])
    db.commit()
    
    # Create users for each company
    user1 = models.User(
        email="user1@test.com",
        hashed_password=get_password_hash("password"),
        company_id=company1.id,
        is_active=True
    )
    user2 = models.User(
        email="user2@test.com",
        hashed_password=get_password_hash("password"),
        company_id=company2.id,
        is_active=True
    )
    db.add_all([user1, user2])
    db.commit()
    
    # Create GL accounts for company 1
    account1 = models.GLAccount(
        company_id=company1.id,
        account_code="1000",
        account_name="Cash",
        account_type="Asset"
    )
    db.add(account1)
    db.commit()
    
    # Login as user1
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "user1@test.com", "password": "password"}
    )
    token1 = response.json()["access_token"]
    
    # Login as user2
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "user2@test.com", "password": "password"}
    )
    token2 = response.json()["access_token"]
    
    # User1 should see their account
    response = client.get(
        "/api/v1/gl/accounts",
        headers={"Authorization": f"Bearer {token1}"}
    )
    assert response.status_code == 200
    accounts = response.json()
    assert len(accounts) == 1
    assert accounts[0]["account_code"] == "1000"
    
    # User2 should see no accounts
    response = client.get(
        "/api/v1/gl/accounts",
        headers={"Authorization": f"Bearer {token2}"}
    )
    assert response.status_code == 200
    accounts = response.json()
    assert len(accounts) == 0
    
    # User2 cannot access company1's account
    response = client.get(
        f"/api/v1/gl/accounts/{account1.id}",
        headers={"Authorization": f"Bearer {token2}"}
    )
    assert response.status_code == 404

def test_journal_entry_cross_company_validation(client: TestClient, db: Session):
    """Test that journal entries cannot use accounts from different companies"""
    # Setup companies and accounts
    company1 = models.Company(name="Company 1")
    company2 = models.Company(name="Company 2")
    db.add_all([company1, company2])
    db.commit()
    
    account1 = models.GLAccount(
        company_id=company1.id,
        account_code="1000",
        account_name="Cash",
        account_type="Asset"
    )
    account2 = models.GLAccount(
        company_id=company2.id,
        account_code="2000",
        account_name="Revenue",
        account_type="Income"
    )
    db.add_all([account1, account2])
    db.commit()
    
    # Create user for company1
    user1 = models.User(
        email="user1@test.com",
        hashed_password=get_password_hash("password"),
        company_id=company1.id,
        is_active=True
    )
    db.add(user1)
    db.commit()
    
    # Login
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "user1@test.com", "password": "password"}
    )
    token = response.json()["access_token"]
    
    # Try to create journal entry with account from different company
    journal_data = {
        "entry_date": "2024-01-01",
        "description": "Invalid cross-company entry",
        "lines": [
            {
                "gl_account_id": account1.id,  # Company 1
                "description": "Debit",
                "debit_amount": 100,
                "credit_amount": 0
            },
            {
                "gl_account_id": account2.id,  # Company 2 - should fail
                "description": "Credit",
                "debit_amount": 0,
                "credit_amount": 100
            }
        ]
    }
    
    response = client.post(
        "/api/v1/gl/journal-entries",
        json=journal_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 400
    assert "different company" in response.json()["detail"].lower()
