#!/usr/bin/env python3
"""
Add AR Permissions to Inventory Manager Role Script

This script adds the 'ar:setup_manage' and 'ar:reports_view' permissions 
to all existing Inventory Manager roles.

Usage: python add_ar_permissions_to_inventory_manager.py
"""

import sys
import os
from sqlalchemy.orm import Session

# Add the app directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.database.database import get_db
from app.models.core import Company, Role


def add_ar_permissions_to_inventory_manager(db: Session):
    """
    Add AR permissions to all Inventory Manager roles.
    """
    print("=== ADDING AR PERMISSIONS TO INVENTORY MANAGER ROLES ===")
    print("Adding 'ar:setup_manage' and 'ar:reports_view' permissions...")
    print()
    
    # Find all Inventory Manager roles across all companies
    inventory_manager_roles = db.query(Role).filter(
        Role.name == "Inventory Manager"
    ).all()
    
    if not inventory_manager_roles:
        print("❌ No Inventory Manager roles found in the database.")
        return
    
    updated_count = 0
    already_updated_count = 0
    
    required_permissions = ["ar:setup_manage", "ar:reports_view"]
    
    for role in inventory_manager_roles:
        company = db.query(Company).filter(Company.id == role.company_id).first()
        company_name = company.name if company else f"ID {role.company_id}"
        
        print(f"Checking Inventory Manager role for company: {company_name}")
        
        # Check current permissions
        current_permissions = role.permissions or []
        missing_permissions = [p for p in required_permissions if p not in current_permissions]
        
        if not missing_permissions:
            print(f"  ✅ All AR permissions already exist - no update needed")
            already_updated_count += 1
        else:
            # Add the missing permissions in the correct order
            updated_permissions = current_permissions.copy()
            
            # Insert AR permissions after inventory permissions and before OE permissions
            insert_index = None
            for i, perm in enumerate(updated_permissions):
                if perm.startswith("oe:"):
                    insert_index = i
                    break
            
            if insert_index is not None:
                # Insert AR permissions before OE permissions
                for i, perm in enumerate(required_permissions):
                    updated_permissions.insert(insert_index + i, perm)
            else:
                # If no OE permissions found, add at the end
                updated_permissions.extend(required_permissions)
            
            role.permissions = updated_permissions
            updated_count += 1
            print(f"  ✅ Added missing AR permissions: {', '.join(missing_permissions)}")
            print(f"     Total permissions: {len(updated_permissions)}")
    
    try:
        db.commit()
        print()
        print("=== UPDATE SUMMARY ===")
        print(f"Roles updated: {updated_count}")
        print(f"Roles already correct: {already_updated_count}")
        print(f"Total Inventory Manager roles: {len(inventory_manager_roles)}")
        
        if updated_count > 0:
            print()
            print("✅ SUCCESS: Inventory Manager roles have been updated!")
            print("Inventory Managers can now access AR functionality including sales representatives")
        else:
            print()
            print("ℹ️  All Inventory Manager roles already had the correct permissions.")
            
    except Exception as e:
        db.rollback()
        print(f"❌ Error updating roles: {str(e)}")
        raise


def verify_update(db: Session):
    """
    Verify that all Inventory Manager roles now have the required AR permissions.
    """
    print()
    print("=== VERIFICATION ===")
    
    inventory_manager_roles = db.query(Role).filter(
        Role.name == "Inventory Manager"
    ).all()
    
    required_permissions = ["ar:setup_manage", "ar:reports_view"]
    all_correct = True
    
    for role in inventory_manager_roles:
        company = db.query(Company).filter(Company.id == role.company_id).first()
        company_name = company.name if company else f"ID {role.company_id}"
        
        current_permissions = role.permissions or []
        missing_permissions = [p for p in required_permissions if p not in current_permissions]
        
        if missing_permissions:
            print(f"❌ {company_name}: Missing {', '.join(missing_permissions)}")
            all_correct = False
        else:
            print(f"✅ {company_name}: Has all required AR permissions")
    
    print()
    if all_correct:
        print("✅ VERIFICATION PASSED: All Inventory Manager roles have the required AR permissions!")
    else:
        print("❌ VERIFICATION FAILED: Some roles are still missing AR permissions.")
    
    return all_correct


def main():
    """
    Main function to add AR permissions to Inventory Manager roles.
    """
    try:
        print("Starting AR Permission Addition for Inventory Manager")
        print("=" * 55)
        
        # Get database session
        db = next(get_db())
        
        # Add the permissions
        add_ar_permissions_to_inventory_manager(db)
        
        # Verify the update
        verify_update(db)
        
        db.close()
        
    except Exception as e:
        print(f"❌ Error during update: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()