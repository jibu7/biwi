def test_oe_integration_basic(client, test_superuser):
    # Example: Test OE integration endpoint
    response = client.get("/api/oe/orders/")
    assert response.status_code == 200
