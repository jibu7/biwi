#!/usr/bin/env python3
"""
Simple test to verify BOM API functionality
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_bom_endpoints():
    """Test BOM API endpoints without authentication (just check they exist)"""
    
    # List of BOM endpoints to test
    endpoints = [
        "/api/v1/bom/headers",
        "/api/v1/bom/manufacturing-orders", 
        "/api/v1/bom/defaults",
        "/api/v1/bom/mrp-calculation",
        "/api/v1/bom/cost-calculation"
    ]
    
    print("Testing BOM API endpoints...")
    print("=" * 50)
    
    for endpoint in endpoints:
        try:
            response = requests.get(f"{BASE_URL}{endpoint}", timeout=5)
            
            if response.status_code == 401:
                status = "✅ EXISTS (Auth Required)"
            elif response.status_code == 404:
                status = "❌ NOT FOUND"
            elif response.status_code == 200:
                status = "✅ EXISTS (Working)"
            else:
                status = f"⚠️  STATUS: {response.status_code}"
                
            print(f"{endpoint:<40} {status}")
            
        except requests.exceptions.RequestException as e:
            print(f"{endpoint:<40} ❌ ERROR: {str(e)}")
    
    print("\n" + "=" * 50)
    print("BOM API Endpoint Test Complete")

def check_docs():
    """Check if Swagger documentation is accessible"""
    try:
        response = requests.get(f"{BASE_URL}/docs", timeout=5)
        if response.status_code == 200:
            print("✅ Swagger docs available at: http://localhost:8000/docs")
        else:
            print(f"⚠️  Swagger docs status: {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"❌ Cannot access docs: {str(e)}")

if __name__ == "__main__":
    print("BOM API Verification Test")
    print("=" * 50)
    
    # Test if backend is running
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        print("✅ Backend is running")
    except:
        try:
            response = requests.get(BASE_URL, timeout=5)
            print("✅ Backend is running")
        except:
            print("❌ Backend is not responding")
            exit(1)
    
    print()
    check_docs()
    print()
    test_bom_endpoints()
