def test_cross_module_integration_basic(client, test_superuser):
    # Example: Test cross-module transaction
    response = client.get("/api/cross-module/health/")
    assert response.status_code == 200
