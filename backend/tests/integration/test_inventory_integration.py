def test_inventory_integration_basic(client, test_superuser):
    # Example: Test Inventory integration endpoint
    response = client.get("/api/inventory/items/")
    assert response.status_code == 200
