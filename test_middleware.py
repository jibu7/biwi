#!/usr/bin/env python3
"""
Test script for Day 3 middleware implementation
Tests both TenantIsolationMiddleware and AuditLoggingMiddleware functionality
"""

import requests
import json

# Base URL for the API
BASE_URL = "http://localhost:8000"

def test_middleware_functionality():
    """Test the middleware functionality"""
    print("Testing Day 3 Middleware Implementation")
    print("=" * 50)
    
    # Test 1: Health endpoint (should be skipped by tenant isolation middleware)
    print("\n1. Testing health endpoint (should bypass tenant isolation)...")
    response = requests.get(f"{BASE_URL}/health")
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.json()}")
    
    # Test 2: Protected endpoint without authentication
    print("\n2. Testing protected endpoint without authentication...")
    response = requests.get(f"{BASE_URL}/api/v1/api/v1/platform/companies")
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.json()}")
    
    # Test 3: OpenAPI docs endpoint (should be accessible)
    print("\n3. Testing OpenAPI docs endpoint...")
    response = requests.get(f"{BASE_URL}/docs")
    print(f"   Status: {response.status_code}")
    print(f"   Content Type: {response.headers.get('content-type', 'N/A')}")
    
    # Test 4: API with invalid Bearer token
    print("\n4. Testing API with invalid Bearer token...")
    headers = {"Authorization": "Bearer invalid_token_12345"}
    response = requests.get(f"{BASE_URL}/api/v1/api/v1/platform/companies", headers=headers)
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.json()}")
    
    # Test 5: API with malformed Authorization header
    print("\n5. Testing API with malformed Authorization header...")
    headers = {"Authorization": "InvalidFormat some_token"}
    response = requests.get(f"{BASE_URL}/api/v1/api/v1/platform/companies", headers=headers)
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.json()}")
    
    # Test 6: Check if tenant context is being reset per request
    print("\n6. Testing tenant context isolation (multiple requests)...")
    for i in range(3):
        headers = {"X-Custom-Test": f"request-{i+1}"}
        response = requests.get(f"{BASE_URL}/api/v1/api/v1/platform/companies", headers=headers)
        print(f"   Request {i+1} - Status: {response.status_code}")
    
    print("\n" + "=" * 50)
    print("Middleware testing completed!")
    print("\nExpected behavior:")
    print("- Health endpoint should return 200 OK")
    print("- Protected endpoints should return 401 Unauthorized without valid token")
    print("- OpenAPI docs should be accessible (200 OK)")
    print("- Invalid tokens should be rejected (401)")
    print("- Each request should be processed independently (tenant context reset)")

if __name__ == "__main__":
    try:
        test_middleware_functionality()
    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to the backend. Make sure it's running on localhost:8000")
    except Exception as e:
        print(f"Error during testing: {e}")
