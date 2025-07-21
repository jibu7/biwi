def test_gl_integration_basic(client, test_superuser):
    # Example: Test GL integration endpoint
    response = client.get("/api/gl/accounts/")
    assert response.status_code == 200
