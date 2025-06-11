from fastapi.testclient import TestClient

def test_login_success(client: TestClient):
    # First create a test user
    # Then test login
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "admin@biwi.com", "password": "admin123"}
    )
    assert response.status_code == 200
    assert "access_token" in response.json()
    assert response.json()["token_type"] == "bearer"

def test_login_fail(client: TestClient):
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "wrong@email.com", "password": "wrongpass"}
    )
    assert response.status_code == 401

def test_me_endpoint(client: TestClient):
    # Login first
    login_response = client.post(
        "/api/v1/auth/login",
        data={"username": "admin@biwi.com", "password": "admin123"}
    )
    token = login_response.json()["access_token"]
    
    # Test /me endpoint
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    assert response.json()["email"] == "admin@biwi.com"
