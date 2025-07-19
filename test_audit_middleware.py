#!/usr/bin/env python3
"""
Test script specifically for the new audit middleware
"""

import requests
import json
import time

BASE_URL = "http://localhost:8000"

def test_audit_middleware():
    """Test the audit middleware functionality"""
    print("🧪 Testing Audit Middleware Implementation")
    print("=" * 50)
    
    # Test 1: Health endpoint (should not be audited)
    print("\n1. Testing health endpoint (should bypass audit middleware)...")
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.json()}")
        if response.status_code == 200:
            print("   ✅ Health endpoint working correctly")
        else:
            print("   ❌ Health endpoint failed")
    except Exception as e:
        print(f"   ❌ Health endpoint error: {e}")
    
    # Test 2: Platform endpoint (should trigger audit middleware)
    print("\n2. Testing platform endpoint (should trigger audit middleware)...")
    try:
        response = requests.get(f"{BASE_URL}/api/v1/platform/companies", timeout=5)
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text[:100]}...")
        if response.status_code in [503, 401, 403]:
            print("   ✅ Platform endpoint accessible (expected auth/db error)")
        else:
            print(f"   ⚠️  Unexpected status code: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Platform endpoint error: {e}")
    
    # Test 3: Test API docs (should work)
    print("\n3. Testing API documentation endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/docs", timeout=5)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            print("   ✅ API docs accessible")
        else:
            print(f"   ❌ API docs failed with status: {response.status_code}")
    except Exception as e:
        print(f"   ❌ API docs error: {e}")
    
    # Test 4: Test OpenAPI spec
    print("\n4. Testing OpenAPI specification...")
    try:
        response = requests.get(f"{BASE_URL}/api/v1/openapi.json", timeout=5)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            print("   ✅ OpenAPI spec accessible")
            # Check if it's valid JSON
            try:
                spec = response.json()
                if "openapi" in spec:
                    print("   ✅ Valid OpenAPI specification")
                else:
                    print("   ⚠️  OpenAPI spec missing version info")
            except:
                print("   ⚠️  OpenAPI spec not valid JSON")
        else:
            print(f"   ❌ OpenAPI spec failed with status: {response.status_code}")
    except Exception as e:
        print(f"   ❌ OpenAPI spec error: {e}")
    
    print("\n" + "=" * 50)
    print("Audit Middleware testing completed!")
    print("\nExpected behavior:")
    print("- Health endpoint should return 200 OK")
    print("- Platform endpoints should be accessible (may return auth errors)")
    print("- API docs should be accessible (200 OK)")
    print("- OpenAPI spec should be accessible (200 OK)")
    print("- Middleware should not break any requests")

if __name__ == "__main__":
    test_audit_middleware()
