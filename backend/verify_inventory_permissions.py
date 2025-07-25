#!/usr/bin/env python3
"""
Verify Inventory Manager Permissions Script

This script verifies that Inventory Manager users can access OE Setup functionality.
"""

import sys
import os
from sqlalchemy.orm import Session

sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.database.database import get_db
from app.models.core import User, Role, UserRole
from app.services.company_management import CompanyManagementService


def test_inventory_manager_permissions():
    """
    Test that users with Inventory Manager role have the required OE setup permissions.
    """
    print("=== TESTING INVENTORY MANAGER PERMISSIONS ===")
    print()
    
    db = next(get_db())
    
    try:
        # Find users with Inventory Manager role
        inventory_manager_users = db.query(User).join(UserRole).join(Role).filter(
            Role.name == "Inventory Manager"
        ).all()
        
        if not inventory_manager_users:
            print("❌ No users found with Inventory Manager role")
            return False
        
        print(f"Found {len(inventory_manager_users)} users with Inventory Manager role:")
        print()
        
        all_passed = True
        
        for user in inventory_manager_users:
            print(f"Testing user: {user.email} (Company ID: {user.company_id})")
            
            # Get user permissions
            permissions = CompanyManagementService.get_user_permissions(
                db, user.id, user.company_id
            )
            
            # Check for required OE setup permission
            has_oe_setup = "oe:setup_manage" in permissions
            status = "✅" if has_oe_setup else "❌"
            
            print(f"  {status} oe:setup_manage permission: {'Present' if has_oe_setup else 'Missing'}")
            print(f"  Total permissions: {len(permissions)}")
            
            # List some relevant permissions
            oe_permissions = [p for p in permissions if p.startswith('oe:')]
            if oe_permissions:
                print(f"  OE permissions: {', '.join(oe_permissions)}")
            else:
                print("  No OE permissions found")
            
            if not has_oe_setup:
                all_passed = False
            
            print()
        
        if all_passed:
            print("✅ SUCCESS: All Inventory Manager users have oe:setup_manage permission!")
            print("Users can now access Maintenance > OE Setup > Order Defaults")
        else:
            print("❌ FAILURE: Some Inventory Manager users are missing the required permission")
        
        return all_passed
        
    except Exception as e:
        print(f"❌ Error during verification: {str(e)}")
        return False
    finally:
        db.close()


def main():
    """
    Main verification function.
    """
    try:
        print("Starting Inventory Manager Permission Verification")
        print("=" * 50)
        
        success = test_inventory_manager_permissions()
        
        if success:
            print("\n🎉 VERIFICATION COMPLETED SUCCESSFULLY!")
        else:
            print("\n⚠️  VERIFICATION FAILED - Issues found")
        
    except Exception as e:
        print(f"❌ Error during verification: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()