import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app import crud, models, schemas

def test_create_product(client: TestClient, db: Session, test_company, test_superuser_token_headers):
    """
    Test creating a new product e2e.
    """
    product_data = {
        "name": "Test Product",
        "description": "A product for e2e testing",
        "price": 10.99,
        "sku": "TEST-SKU-001"
    }
    response = client.post(
        "/api/v1/products/",
        json=product_data,
        headers=test_superuser_token_headers
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == product_data["name"]
    assert data["sku"] == product_data["sku"]
    assert "id" in data

def test_get_product(client: TestClient, db: Session, test_company, test_superuser_token_headers):
    """
    Test fetching a product e2e.
    """
    # First, create a product to fetch
    product = models.Product(
        company_id=test_company.id,
        name="Fetchable Product",
        sku="FETCH-001",
        price=99.99
    )
    db.add(product)
    db.commit()
    db.refresh(product)

    response = client.get(
        f"/api/v1/products/{product.id}",
        headers=test_superuser_token_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == product.name
    assert data["sku"] == product.sku
