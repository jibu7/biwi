#!/usr/bin/env python3
"""
Test script for GL API endpoints
"""

import requests
import json

# Configuration
BASE_URL = "http://localhost:8000"
USERNAME = "admin@biwi.com"
PASSWORD = "admin123"

def get_auth_token():
    """Get authentication token"""
    login_data = {
        "username": USERNAME,
        "password": PASSWORD
    }
    
    response = requests.post(
        f"{BASE_URL}/api/v1/auth/login",
        data=login_data,
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    
    if response.status_code == 200:
        return response.json()["access_token"]
    else:
        print(f"Login failed: {response.status_code} - {response.text}")
        return None

def test_gl_accounts(token):
    """Test GL accounts endpoint"""
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.get(f"{BASE_URL}/api/v1/gl/accounts", headers=headers)
    
    print(f"GL Accounts API Status: {response.status_code}")
    if response.status_code == 200:
        accounts = response.json()
        print(f"Found {len(accounts)} GL accounts:")
        for account in accounts[:5]:  # Show first 5
            print(f"  {account['account_code']} - {account['account_name']} ({account['account_type']})")
        if len(accounts) > 5:
            print(f"  ... and {len(accounts) - 5} more")
    else:
        print(f"Error: {response.text}")

def test_gl_defaults(token):
    """Test GL defaults endpoint"""
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.get(f"{BASE_URL}/api/v1/gl/defaults", headers=headers)
    
    print(f"\nGL Defaults API Status: {response.status_code}")
    if response.status_code == 200:
        defaults = response.json()
        print("GL Defaults:")
        print(f"  Cash Account ID: {defaults.get('default_cash_account_id')}")
        print(f"  AR Control Account ID: {defaults.get('default_ar_control_account_id')}")
        print(f"  AP Control Account ID: {defaults.get('default_ap_control_account_id')}")
        print(f"  Retained Earnings Account ID: {defaults.get('retained_earnings_account_id')}")
    else:
        print(f"Error: {response.text}")

def test_available_endpoints():
    """Test what endpoints are available"""
    try:
        response = requests.get(f"{BASE_URL}/docs")
        print(f"OpenAPI docs status: {response.status_code}")
        
        # Test basic API root
        response = requests.get(f"{BASE_URL}/api/v1/")
        print(f"API v1 root status: {response.status_code}")
        
    except Exception as e:
        print(f"Error testing endpoints: {e}")

def main():
    print("Testing GL API endpoints...")
    
    # Test available endpoints
    test_available_endpoints()
    
    # Get authentication token
    token = get_auth_token()
    if not token:
        return
    
    print("Authentication successful!")
    
    # Test GL endpoints
    test_gl_accounts(token)
    test_gl_defaults(token)
    
    print("\nGL API testing completed!")

if __name__ == "__main__":
    main()
