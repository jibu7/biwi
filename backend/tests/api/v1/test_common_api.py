#!/usr/bin/env python3
"""
Test script for Currency, Tax, and Branch API endpoints
"""

import requests
import json
from decimal import Decimal

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

def test_currency_endpoints(token):
    """Test Currency API endpoints"""
    headers = {"Authorization": f"Bearer {token}"}
    
    print("\n=== Testing Currency Endpoints ===")
    
    # Test 1: Create base currency
    print("\n1. Creating base currency...")
    currency_data = {
        "currency_code": "USD",
        "currency_name": "US Dollar",
        "currency_symbol": "$",
        "exchange_rate": 1.0,
        "is_base_currency": True,
        "is_active": True
    }
    
    response = requests.post(
        f"{BASE_URL}/api/v1/common/currencies",
        json=currency_data,
        headers=headers
    )
    
    if response.status_code in [200, 201]:
        created_currency = response.json()
        print(f"✅ Created base currency: {created_currency['currency_code']}")
        base_currency_id = created_currency['id']
    else:
        print(f"❌ Failed to create base currency: {response.status_code} - {response.text}")
        return False
    
    # Test 2: Attempt to create second base currency
    print("\n2. Testing duplicate base currency prevention...")
    duplicate_base = {
        "currency_code": "EUR",
        "currency_name": "Euro",
        "currency_symbol": "€",
        "exchange_rate": 1.0,
        "is_base_currency": True,
        "is_active": True
    }
    
    response = requests.post(
        f"{BASE_URL}/api/v1/common/currencies",
        json=duplicate_base,
        headers=headers
    )
    
    if response.status_code >= 400:
        print(f"✅ Correctly prevented second base currency: {response.status_code}")
    else:
        print(f"❌ ERROR: Second base currency was allowed")
        return False
    
    # Test 3: Create foreign currency
    print("\n3. Creating foreign currency...")
    foreign_currency = {
        "currency_code": "GBP",
        "currency_name": "British Pound",
        "currency_symbol": "£",
        "exchange_rate": 0.75,
        "is_base_currency": False,
        "is_active": True
    }
    
    response = requests.post(
        f"{BASE_URL}/api/v1/common/currencies",
        json=foreign_currency,
        headers=headers
    )
    
    if response.status_code in [200, 201]:
        foreign = response.json()
        print(f"✅ Created foreign currency: {foreign['currency_code']} (Rate: {foreign['exchange_rate']})")
        foreign_currency_id = foreign['id']
    else:
        print(f"❌ Failed to create foreign currency: {response.status_code}")
        return False
    
    # Test 4: List currencies
    print("\n4. Listing currencies...")
    response = requests.get(f"{BASE_URL}/api/v1/common/currencies", headers=headers)
    
    if response.status_code == 200:
        currencies = response.json()
        print(f"✅ Found {len(currencies)} currencies")
        for curr in currencies[:3]:  # Show first 3
            print(f"   - {curr['currency_code']}: {curr['exchange_rate']} (Base: {curr['is_base_currency']})")
    else:
        print(f"❌ Failed to list currencies: {response.status_code}")
        return False
    
    # Test 5: Update exchange rate
    print("\n5. Updating exchange rate...")
    update_data = {"exchange_rate": 0.80}
    
    response = requests.put(
        f"{BASE_URL}/api/v1/common/currencies/{foreign_currency_id}",
        json=update_data,
        headers=headers
    )
    
    if response.status_code == 200:
        updated = response.json()
        print(f"✅ Updated exchange rate to: {updated['exchange_rate']}")
    else:
        print(f"❌ Failed to update exchange rate: {response.status_code}")
        return False
    
    return True

def test_tax_type_endpoints(token):
    """Test TaxType API endpoints"""
    headers = {"Authorization": f"Bearer {token}"}
    
    print("\n=== Testing Tax Type Endpoints ===")
    
    # Test 1: Create tax types
    print("\n1. Creating tax types...")
    tax_types = [
        {
            "name": "Standard VAT",
            "description": "18% VAT",
            "rate": 18.0,
            "nature": "Sales",
            "is_active": True
        },
        {
            "name": "Input VAT",
            "description": "18% Input Tax",
            "rate": 18.0,
            "nature": "Purchases",
            "is_active": True
        },
        {
            "name": "Tax Exempt",
            "description": "0% Exempt",
            "rate": 0.0,
            "nature": "Exempt",
            "is_active": True
        },
        {
            "name": "Zero Rated",
            "description": "0% Zero-rated",
            "rate": 0.0,
            "nature": "ZeroRated",
            "is_active": True
        }
    ]
    
    created_ids = []
    for tax_data in tax_types:
        response = requests.post(
            f"{BASE_URL}/api/v1/common/tax-types",
            json=tax_data,
            headers=headers
        )
        
        if response.status_code in [200, 201]:
            created_tax = response.json()
            created_ids.append(created_tax['id'])
            print(f"✅ Created tax type: {created_tax['name']} ({created_tax['nature']}) - {created_tax['rate']}%")
        else:
            print(f"❌ Failed to create tax type {tax_data['name']}: {response.status_code}")
            return False
    
    # Test 2: List tax types
    print("\n2. Listing tax types...")
    response = requests.get(f"{BASE_URL}/api/v1/common/tax-types", headers=headers)
    
    if response.status_code == 200:
        tax_list = response.json()
        print(f"✅ Found {len(tax_list)} tax types")
        
        # Group by nature
        by_nature = {}
        for tax in tax_list:
            nature = tax['nature']
            if nature not in by_nature:
                by_nature[nature] = []
            by_nature[nature].append(tax)
        
        for nature, taxes in by_nature.items():
            print(f"   - {nature}: {len(taxes)} tax types")
    else:
        print(f"❌ Failed to list tax types: {response.status_code}")
        return False
    
    # Test 3: Update tax type
    if created_ids:
        print("\n3. Updating tax type...")
        update_data = {
            "description": "Updated VAT description",
            "rate": 20.0
        }
        
        response = requests.put(
            f"{BASE_URL}/api/v1/common/tax-types/{created_ids[0]}",
            json=update_data,
            headers=headers
        )
        
        if response.status_code == 200:
            updated = response.json()
            print(f"✅ Updated tax type: New rate = {updated['rate']}%")
        else:
            print(f"❌ Failed to update tax type: {response.status_code}")
    
    return True

def test_branch_endpoints(token):
    """Test Branch API endpoints"""
    headers = {"Authorization": f"Bearer {token}"}
    
    print("\n=== Testing Branch Endpoints ===")
    
    # Test 1: Create main branch
    print("\n1. Creating main branch...")
    main_branch_data = {
        "branch_code": "HQ",
        "branch_name": "Headquarters",
        "address": {
            "street": "123 Main St",
            "city": "New York",
            "state": "NY",
            "country": "USA",
            "postal_code": "10001"
        },
        "contact_info": {
            "phone": "+1-212-555-0100",
            "email": "hq@company.com"
        },
        "gl_segment_code": "100",
        "is_main_branch": True,
        "is_active": True
    }
    
    response = requests.post(
        f"{BASE_URL}/api/v1/common/branches",
        json=main_branch_data,
        headers=headers
    )
    
    if response.status_code in [200, 201]:
        main_branch = response.json()
        print(f"✅ Created main branch: {main_branch['branch_name']} (Code: {main_branch['branch_code']})")
        main_branch_id = main_branch['id']
    else:
        print(f"❌ Failed to create main branch: {response.status_code} - {response.text}")
        return False
    
    # Test 2: Create additional branches
    print("\n2. Creating additional branches...")
    additional_branches = [
        {
            "branch_code": "BR-001",
            "branch_name": "Downtown Branch",
            "address": {
                "street": "456 Commerce St",
                "city": "New York",
                "state": "NY",
                "country": "USA"
            },
            "contact_info": {"phone": "+1-212-555-0200"},
            "gl_segment_code": "200",
            "is_main_branch": False,
            "is_active": True
        },
        {
            "branch_code": "BR-002",
            "branch_name": "Uptown Branch",
            "address": {
                "street": "789 Park Ave",
                "city": "New York",
                "state": "NY",
                "country": "USA"
            },
            "contact_info": {"phone": "+1-212-555-0300"},
            "gl_segment_code": "300",
            "is_main_branch": False,
            "is_active": True
        }
    ]
    
    for branch_data in additional_branches:
        response = requests.post(
            f"{BASE_URL}/api/v1/common/branches",
            json=branch_data,
            headers=headers
        )
        
        if response.status_code in [200, 201]:
            branch = response.json()
            print(f"✅ Created branch: {branch['branch_name']} (GL: {branch['gl_segment_code']})")
        else:
            print(f"❌ Failed to create branch {branch_data['branch_name']}: {response.status_code}")
    
    # Test 3: List branches
    print("\n3. Listing branches...")
    response = requests.get(f"{BASE_URL}/api/v1/common/branches", headers=headers)
    
    if response.status_code == 200:
        branches = response.json()
        print(f"✅ Found {len(branches)} branches")
        for branch in branches:
            print(f"   - {branch['branch_code']}: {branch['branch_name']} (Main: {branch['is_main_branch']})")
    else:
        print(f"❌ Failed to list branches: {response.status_code}")
        return False
    
    # Test 4: Test branch constraints
    print("\n4. Testing duplicate branch code prevention...")
    duplicate_branch = {
        "branch_code": "HQ",  # Already exists
        "branch_name": "Duplicate HQ",
        "address": {"street": "999 Test St"},
        "gl_segment_code": "999",
        "is_main_branch": False,
        "is_active": True
    }
    
    response = requests.post(
        f"{BASE_URL}/api/v1/common/branches",
        json=duplicate_branch,
        headers=headers
    )
    
    if response.status_code >= 400:
        print(f"✅ Correctly prevented duplicate branch code: {response.status_code}")
    else:
        print(f"❌ ERROR: Duplicate branch code was allowed")
        return False
    
    return True

def test_permission_based_access():
    """Test permission-based access control"""
    print("\n=== Testing Permission-Based Access ===")
    
    # This would require creating a user without common setup permissions
    # For now, we'll just verify the endpoints require authentication
    
    print("\n1. Testing unauthenticated access...")
    endpoints = [
        "/api/v1/common/currencies",
        "/api/v1/common/tax-types",
        "/api/v1/common/branches"
    ]
    
    for endpoint in endpoints:
        response = requests.get(f"{BASE_URL}{endpoint}")
        if response.status_code == 401:
            print(f"✅ {endpoint} requires authentication")
        else:
            print(f"❌ {endpoint} allowed unauthenticated access")
            return False
    
    return True

def main():
    print("=" * 60)
    print("TESTING CURRENCY, TAX, AND BRANCH API ENDPOINTS")
    print("=" * 60)
    
    # Get authentication token
    token = get_auth_token()
    if not token:
        print("❌ Failed to authenticate")
        return
    
    print("✅ Authentication successful!")
    
    # Run tests
    all_passed = True
    
    if not test_currency_endpoints(token):
        all_passed = False
    
    if not test_tax_type_endpoints(token):
        all_passed = False
    
    if not test_branch_endpoints(token):
        all_passed = False
    
    if not test_permission_based_access():
        all_passed = False
    
    print("\n" + "=" * 60)
    print("API TEST SUMMARY")
    print("=" * 60)
    
    if all_passed:
        print("🎉 All API tests passed!")
    else:
        print("⚠️ Some API tests failed.")

if __name__ == "__main__":
    main()
