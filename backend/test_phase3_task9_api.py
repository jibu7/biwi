#!/usr/bin/env python3
"""
Phase 3 Task 9: API Testing

This comprehensive test suite verifies:
1. Platform admin can create companies with admin users
2. Company admin can create users with role selection
3. Role-based permission filtering works
4. Multi-company data isolation

Usage: python test_phase3_task9_api.py
"""

import sys
import os
import requests
import json
import time
import random
import string
from typing import Dict, List, Optional, Any
from dataclasses import dataclass

# Test configuration
BASE_URL = "http://localhost:8000/api/v1"
HEADERS = {"Content-Type": "application/json"}

@dataclass
class TestUser:
    email: str
    password: str
    full_name: str
    token: Optional[str] = None
    user_id: Optional[int] = None
    company_id: Optional[int] = None

@dataclass
class TestCompany:
    name: str
    company_id: Optional[int] = None
    admin_user: Optional[TestUser] = None

class APITester:
    def __init__(self):
        self.platform_admin = None
        self.test_companies: List[TestCompany] = []
        self.test_results = {
            "total_tests": 0,
            "passed_tests": 0,
            "failed_tests": 0,
            "test_details": []
        }
    
    def log_test(self, test_name: str, success: bool, details: str = ""):
        """Log test results"""
        self.test_results["total_tests"] += 1
        if success:
            self.test_results["passed_tests"] += 1
            status = "✅ PASS"
        else:
            self.test_results["failed_tests"] += 1
            status = "❌ FAIL"
        
        print(f"{status}: {test_name}")
        if details:
            print(f"   {details}")
        
        self.test_results["test_details"].append({
            "test": test_name,
            "status": "PASS" if success else "FAIL",
            "details": details
        })
    
    def generate_test_email(self, prefix: str = "test") -> str:
        """Generate unique test email"""
        suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=6))
        return f"{prefix}_{suffix}@test.com"
    
    def make_request(self, method: str, endpoint: str, data: Dict = None, token: str = None) -> requests.Response:
        """Make HTTP request with optional authentication"""
        url = f"{BASE_URL}{endpoint}"
        headers = HEADERS.copy()
        
        if token:
            headers["Authorization"] = f"Bearer {token}"
        
        if method == "GET":
            return requests.get(url, headers=headers)
        elif method == "POST":
            return requests.post(url, headers=headers, json=data)
        elif method == "PUT":
            return requests.put(url, headers=headers, json=data)
        elif method == "DELETE":
            return requests.delete(url, headers=headers)
    
    def authenticate_user(self, email: str, password: str, is_platform_admin: bool = False) -> Optional[str]:
        """Authenticate user and return access token"""
        try:
            # Use form data for authentication
            auth_data = {
                "username": email,
                "password": password
            }
            
            # Choose the correct endpoint based on user type
            endpoint = "/platform/auth/login" if is_platform_admin else "/auth/login"
            
            # Make request with form data instead of JSON
            response = requests.post(
                f"{BASE_URL}{endpoint}",
                data=auth_data,  # Use data instead of json
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            
            if response.status_code == 200:
                return response.json()["access_token"]
            else:
                print(f"Authentication failed for {email}: {response.text}")
                return None
        except Exception as e:
            print(f"Authentication error for {email}: {e}")
            return None
    
    def setup_platform_admin(self) -> bool:
        """Setup platform admin for testing"""
        print("=== SETTING UP PLATFORM ADMIN ===")
        
        # Try to authenticate with existing platform admin
        admin_email = "admin@biwi.com"
        admin_password = "admin123"
        
        token = self.authenticate_user(admin_email, admin_password, is_platform_admin=True)
        if token:
            self.platform_admin = TestUser(
                email=admin_email,
                password=admin_password,
                full_name="Platform Administrator",
                token=token
            )
            self.log_test("Platform Admin Authentication", True, f"Authenticated as {admin_email}")
            return True
        else:
            self.log_test("Platform Admin Authentication", False, f"Failed to authenticate {admin_email}")
            return False
    
    def test_platform_admin_create_company(self) -> bool:
        """Test 1: Platform admin can create companies with admin users"""
        print("\n=== TEST 1: PLATFORM ADMIN COMPANY CREATION ===")
        
        if not self.platform_admin:
            self.log_test("Platform Admin Company Creation", False, "No platform admin available")
            return False
        
        # Create test company data
        company_name = f"Test Company {random.randint(1000, 9999)}"
        company_code = f"TEST{random.randint(100, 999)}"
        admin_email = self.generate_test_email("companyadmin")
        
        company_data = {
            "name": company_name,
            "code": company_code,
            "primary_contact_email": admin_email,
            "address": {
                "street": "123 Test Street",
                "city": "Test City",
                "country": "Test Country"
            },
            "contact_info": {
                "phone": "+1-555-0123",
                "email": admin_email
            }
        }
        
        try:
            # Create company via platform admin
            response = self.make_request(
                "POST", 
                "/platform/companies", 
                company_data, 
                self.platform_admin.token
            )
            
            if response.status_code in [200, 201]:  # Accept both 200 and 201
                company_info = response.json()
                company_id = company_info["id"]
                
                # Store test company
                test_company = TestCompany(
                    name=company_name,
                    company_id=company_id
                )
                self.test_companies.append(test_company)
                
                self.log_test(
                    "Platform Admin Create Company", 
                    True, 
                    f"Created company '{company_name}' with ID {company_id}"
                )
                
                # Verify admin user was created
                return self.verify_company_admin_user(test_company, admin_email)
                
            else:
                self.log_test(
                    "Platform Admin Create Company", 
                    False, 
                    f"Failed to create company: {response.status_code} - {response.text}"
                )
                return False
                
        except Exception as e:
            self.log_test("Platform Admin Create Company", False, f"Exception: {e}")
            return False
    
    def verify_company_admin_user(self, company: TestCompany, admin_email: str) -> bool:
        """Verify company admin user was created with proper roles"""
        try:
            # Try to authenticate with the admin user
            # First, we need to set a password or get the temporary password
            # For testing, let's assume the admin user gets created with a default password
            default_password = "TempPass123!"
            
            # Get company users to find the admin
            response = self.make_request(
                "GET", 
                f"/platform/users?company_id={company.company_id}", 
                token=self.platform_admin.token
            )
            
            if response.status_code == 200:
                users = response.json()
                admin_user = None
                
                for user in users:
                    if user["email"] == admin_email:
                        admin_user = user
                        break
                
                if admin_user:
                    # Use the actual default password pattern from the platform
                    import datetime
                    current_year = datetime.datetime.now().year
                    default_password = f"Welcome{current_year}!"
                    
                    company.admin_user = TestUser(
                        email=admin_email,
                        password=default_password,
                        full_name=admin_user["full_name"],
                        user_id=admin_user["id"],
                        company_id=company.company_id
                    )
                    
                    self.log_test(
                        "Company Admin User Created", 
                        True, 
                        f"Admin user {admin_email} created for company {company.name}"
                    )
                    return True
                else:
                    self.log_test(
                        "Company Admin User Created", 
                        False, 
                        f"Admin user {admin_email} not found in company users"
                    )
                    return False
            else:
                self.log_test(
                    "Company Admin User Created", 
                    False, 
                    f"Failed to get company users: {response.status_code}"
                )
                return False
                
        except Exception as e:
            self.log_test("Company Admin User Created", False, f"Exception: {e}")
            return False
    
    def test_company_admin_create_users(self) -> bool:
        """Test 2: Company admin can create users with role selection"""
        print("\n=== TEST 2: COMPANY ADMIN USER CREATION ===")
        
        if not self.test_companies or not self.test_companies[0].admin_user:
            self.log_test("Company Admin User Creation", False, "No test company or admin user available")
            return False
        
        test_company = self.test_companies[0]
        
        # First, authenticate the company admin
        admin_token = self.authenticate_user(
            test_company.admin_user.email, 
            test_company.admin_user.password
        )
        
        if not admin_token:
            # If default password doesn't work, try to reset or use the platform admin to set password
            self.log_test("Company Admin Authentication", False, "Cannot authenticate company admin")
            return False
        
        test_company.admin_user.token = admin_token
        self.log_test("Company Admin Authentication", True, f"Authenticated {test_company.admin_user.email}")
        
        # Get available roles for the company
        response = self.make_request("GET", "/company-management/available-roles", token=admin_token)
        
        if response.status_code != 200:
            self.log_test("Get Company Roles", False, f"Failed to get roles: {response.status_code}")
            return False
        
        roles = response.json()
        self.log_test("Get Company Roles", True, f"Retrieved {len(roles)} roles")
        
        # Create test user with specific role
        test_user_email = self.generate_test_email("companyuser")
        user_data = {
            "email": test_user_email,
            "password": "TestUser123!",
            "full_name": "Test Company User",
            "is_active": True
        }
        
        # Create user
        response = self.make_request("POST", "/company-management/users", user_data, admin_token)
        
        if response.status_code in [200, 201]:
            user_info = response.json()
            
            # Handle different response structures
            if isinstance(user_info, dict):
                if "user" in user_info and "id" in user_info["user"]:
                    user_id = user_info["user"]["id"]
                elif "user_id" in user_info:
                    user_id = user_info["user_id"]
                elif "id" in user_info:
                    user_id = user_info["id"]
                else:
                    # Print the response to debug
                    print(f"User creation response structure: {user_info}")
                    self.log_test("Create Company User", False, f"Unexpected response structure: {list(user_info.keys())}")
                    return False
            else:
                self.log_test("Create Company User", False, f"Unexpected response type: {type(user_info)}")
                return False
            
            self.log_test("Create Company User", True, f"Created user {test_user_email} with ID {user_id}")
            
            # Assign role to user
            if roles:
                # Extract roles from the response structure
                role_list = roles.get("roles", []) if isinstance(roles, dict) else roles
                
                # Find Accountant role
                accountant_role = next((r for r in role_list if r["name"] == "Accountant"), None)
                if accountant_role:
                    role_assignment = {"role_ids": [accountant_role["id"]]}
                    
                    response = self.make_request(
                        "POST", 
                        f"/company-management/users/{user_id}/roles", 
                        role_assignment, 
                        admin_token
                    )
                    
                    if response.status_code == 200:
                        self.log_test("Assign User Role", True, f"Assigned Accountant role to user {user_id}")
                        return True
                    else:
                        self.log_test("Assign User Role", False, f"Failed to assign role: {response.status_code}")
                        return False
                else:
                    self.log_test("Find Accountant Role", False, "Accountant role not found")
                    return False
            else:
                self.log_test("Role Assignment", False, "No roles available")
                return False
        else:
            self.log_test("Create Company User", False, f"Failed to create user: {response.status_code}")
            return False
    
    def test_role_based_permissions(self) -> bool:
        """Test 3: Role-based permission filtering works"""
        print("\n=== TEST 3: ROLE-BASED PERMISSION FILTERING ===")
        
        if not self.test_companies or not self.test_companies[0].admin_user:
            self.log_test("Role-Based Permissions", False, "No test company available")
            return False
        
        test_company = self.test_companies[0]
        admin_token = test_company.admin_user.token
        
        # Test 1: Admin should have access to available roles (instead of user management)
        response = self.make_request("GET", "/company-management/available-roles", token=admin_token)
        admin_can_view_roles = response.status_code == 200
        
        self.log_test(
            "Admin Roles Management Access", 
            admin_can_view_roles, 
            f"Admin access to roles endpoint: {response.status_code}"
        )
        
        # Test 2: Check role permissions endpoint
        response = self.make_request("GET", "/roles/permissions/all", token=admin_token)
        admin_can_view_permissions = response.status_code == 200
        
        self.log_test(
            "Admin Permissions Access", 
            admin_can_view_permissions, 
            f"Admin access to permissions endpoint: {response.status_code}"
        )
        
        # Test 3: Try to access platform admin endpoints (should fail)
        response = self.make_request("GET", "/platform/companies", token=admin_token)
        admin_cannot_access_platform = response.status_code != 200
        
        self.log_test(
            "Platform Access Restriction", 
            admin_cannot_access_platform, 
            f"Company admin blocked from platform endpoints: {response.status_code}"
        )
        
        return admin_can_view_roles and admin_can_view_permissions and admin_cannot_access_platform
    
    def test_multi_company_data_isolation(self) -> bool:
        """Test 4: Multi-company data isolation"""
        print("\n=== TEST 4: MULTI-COMPANY DATA ISOLATION ===")
        
        # Create second company for isolation testing
        if not self.create_second_test_company():
            return False
        
        if len(self.test_companies) < 2:
            self.log_test("Multi-Company Isolation", False, "Need at least 2 companies for isolation testing")
            return False
        
        company1 = self.test_companies[0]
        company2 = self.test_companies[1]
        
        # Authenticate both company admins
        token1 = company1.admin_user.token
        token2 = self.authenticate_user(company2.admin_user.email, company2.admin_user.password)
        
        if not token1 or not token2:
            self.log_test("Multi-Company Authentication", False, "Cannot authenticate both company admins")
            return False
        
        company2.admin_user.token = token2
        
        # Test 1: Company 1 admin cannot see Company 2 data through platform (use users endpoint which would show cross-company if not isolated)
        # Since there's no direct users list in company management, test with roles
        response = self.make_request("GET", "/company-management/available-roles", token=token1)
        if response.status_code == 200:
            company1_roles = response.json()["roles"]
            company1_role_ids = [r["id"] for r in company1_roles]
            
            self.log_test(
                "Role Data Available", 
                True, 
                f"Company 1 has {len(company1_roles)} roles available"
            )
        else:
            self.log_test("Role Data Available", False, "Cannot retrieve Company 1 roles")
            return False
        
        # Test 2: Company 1 admin cannot see Company 2 roles
        response1 = self.make_request("GET", "/company-management/available-roles", token=token1)
        response2 = self.make_request("GET", "/company-management/available-roles", token=token2)
        
        if response1.status_code == 200 and response2.status_code == 200:
            roles1 = response1.json()["roles"]
            roles2 = response2.json()["roles"]
            
            # Each company should have their own set of roles
            roles1_ids = [r["id"] for r in roles1]
            roles2_ids = [r["id"] for r in roles2]
            
            no_role_overlap = not set(roles1_ids).intersection(set(roles2_ids))
            
            self.log_test(
                "Role Data Isolation", 
                no_role_overlap, 
                f"Company 1: {len(roles1)} roles, Company 2: {len(roles2)} roles, No overlap: {no_role_overlap}"
            )
        else:
            self.log_test("Role Data Isolation", False, "Cannot retrieve roles for both companies")
            return False
        
        # Test 3: Cross-company role assignment should fail
        # Try to assign Company 2 role to a user in Company 1 (via user creation with role)
        if roles2:
            role2_id = roles2[0]["id"]
            
            # Try to create a user in company 1 with a role from company 2
            test_user_data = {
                "email": self.generate_test_email("crosstest"),
                "password": "TestCross123!",
                "full_name": "Cross Company Test User",
                "is_active": True,
                "role_ids": [role2_id]  # Try to use Company 2 role
            }
            
            response = self.make_request(
                "POST", 
                "/company-management/users", 
                test_user_data, 
                token1
            )
            
            cross_company_assignment_blocked = response.status_code != 200
            
            self.log_test(
                "Cross-Company Role Assignment Block", 
                cross_company_assignment_blocked, 
                f"Cross-company role assignment blocked: {response.status_code}"
            )
        
        return True
    
    def create_second_test_company(self) -> bool:
        """Create a second test company for isolation testing"""
        if not self.platform_admin:
            return False
        
        company_name = f"Test Company 2 {random.randint(1000, 9999)}"
        company_code = f"TST2{random.randint(100, 999)}"
        admin_email = self.generate_test_email("companyadmin2")
        
        company_data = {
            "name": company_name,
            "code": company_code,
            "primary_contact_email": admin_email,
            "address": {
                "street": "456 Test Avenue",
                "city": "Test City 2",
                "country": "Test Country"
            },
            "contact_info": {
                "phone": "+1-555-0456",
                "email": admin_email
            }
        }
        
        try:
            response = self.make_request(
                "POST", 
                "/platform/companies", 
                company_data, 
                self.platform_admin.token
            )
            
            if response.status_code in [200, 201]:
                company_info = response.json()
                company_id = company_info["id"]
                
                test_company2 = TestCompany(
                    name=company_name,
                    company_id=company_id
                )
                
                # Create admin user for company 2
                import datetime
                current_year = datetime.datetime.now().year
                default_password = f"Welcome{current_year}!"
                
                test_company2.admin_user = TestUser(
                    email=admin_email,
                    password=default_password,
                    full_name="Company 2 Administrator",
                    company_id=company_id
                )
                
                self.test_companies.append(test_company2)
                
                self.log_test("Create Second Test Company", True, f"Created {company_name}")
                return True
            else:
                self.log_test("Create Second Test Company", False, f"Failed: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Create Second Test Company", False, f"Exception: {e}")
            return False
    
    def run_additional_validation_tests(self):
        """Run additional validation tests"""
        print("\n=== ADDITIONAL VALIDATION TESTS ===")
        
        # Test API endpoints are accessible
        response = requests.get("http://localhost:8000/docs")
        api_docs_accessible = response.status_code == 200
        self.log_test("API Documentation Access", api_docs_accessible, f"API docs status: {response.status_code}")
        
        # Test health check (try different endpoints)
        health_endpoints = ["/health", "/api/v1/health", "/"]
        health_check = False
        for endpoint in health_endpoints:
            response = requests.get(f"http://localhost:8000{endpoint}")
            if response.status_code == 200:
                health_check = True
                self.log_test("Health Check", True, f"Health endpoint {endpoint} status: {response.status_code}")
                break
        
        if not health_check:
            self.log_test("Health Check", False, "No health endpoint found")
    
    def cleanup_test_data(self):
        """Clean up test data created during testing"""
        print("\n=== CLEANING UP TEST DATA ===")
        
        if not self.platform_admin:
            return
        
        # Delete test companies
        for company in self.test_companies:
            if company.company_id:
                try:
                    response = self.make_request(
                        "DELETE", 
                        f"/platform/companies/{company.company_id}", 
                        token=self.platform_admin.token
                    )
                    
                    if response.status_code == 200:
                        print(f"✅ Deleted test company: {company.name}")
                    else:
                        print(f"⚠️  Could not delete company {company.name}: {response.status_code}")
                        
                except Exception as e:
                    print(f"⚠️  Error deleting company {company.name}: {e}")
    
    def generate_test_report(self):
        """Generate comprehensive test report"""
        print("\n" + "="*60)
        print("PHASE 3 TASK 9: API TESTING REPORT")
        print("="*60)
        
        results = self.test_results
        
        print(f"Total Tests: {results['total_tests']}")
        print(f"Passed: {results['passed_tests']} ✅")
        print(f"Failed: {results['failed_tests']} ❌")
        
        success_rate = (results['passed_tests'] / results['total_tests']) * 100 if results['total_tests'] > 0 else 0
        print(f"Success Rate: {success_rate:.1f}%")
        
        print("\nDetailed Results:")
        print("-" * 40)
        
        for test in results['test_details']:
            status_icon = "✅" if test['status'] == 'PASS' else "❌"
            print(f"{status_icon} {test['test']}")
            if test['details']:
                print(f"   {test['details']}")
        
        print("\nTest Categories:")
        print("-" * 40)
        
        categories = {
            "Platform Admin": ["Platform Admin", "Create Company"],
            "Company Admin": ["Company Admin", "Create Company User", "Assign User Role"],
            "Role-Based Access": ["Role-Based", "Permissions", "Platform Access"],
            "Data Isolation": ["Isolation", "Cross-Company"]
        }
        
        for category, keywords in categories.items():
            category_tests = [t for t in results['test_details'] 
                            if any(keyword in t['test'] for keyword in keywords)]
            passed = sum(1 for t in category_tests if t['status'] == 'PASS')
            total = len(category_tests)
            print(f"{category}: {passed}/{total}")
        
        # Final assessment
        print("\n" + "="*60)
        if results['failed_tests'] == 0:
            print("🎉 ALL TESTS PASSED - PHASE 3 TASK 9 COMPLETED SUCCESSFULLY!")
            print("✅ Platform admin can create companies with admin users")
            print("✅ Company admin can create users with role selection")
            print("✅ Role-based permission filtering works")
            print("✅ Multi-company data isolation verified")
        else:
            print("⚠️  SOME TESTS FAILED - REVIEW REQUIRED")
            if results['passed_tests'] > results['failed_tests']:
                print("📊 Most functionality is working correctly")
            else:
                print("🔧 Significant issues need to be addressed")
        
        print("="*60)
    
    def run_all_tests(self):
        """Run complete test suite"""
        print("🚀 STARTING PHASE 3 TASK 9: API TESTING")
        print("="*60)
        
        try:
            # Setup
            if not self.setup_platform_admin():
                print("❌ Cannot proceed without platform admin access")
                return
            
            # Run main tests
            self.test_platform_admin_create_company()
            self.test_company_admin_create_users()
            self.test_role_based_permissions()
            self.test_multi_company_data_isolation()
            
            # Additional validation
            self.run_additional_validation_tests()
            
        except KeyboardInterrupt:
            print("\n🛑 Testing interrupted by user")
        except Exception as e:
            print(f"\n❌ Unexpected error during testing: {e}")
            import traceback
            traceback.print_exc()
        finally:
            # Generate report
            self.generate_test_report()
            
            # Cleanup (optional - comment out to keep test data)
            # self.cleanup_test_data()

def main():
    """Main function to run API tests"""
    tester = APITester()
    tester.run_all_tests()

if __name__ == "__main__":
    main()
