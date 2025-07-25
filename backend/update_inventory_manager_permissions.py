#!/usr/bin/env python3
"""
Update Inventory Manager Role Permissions Script

This script adds the 'oe:setup_manage' permission to all existing 
Inventory Manager roles to allow access to OE Setup > Order Defaults.

Usage: python update_inventory_manager_permissions.py
"""

import sys
import os
from sqlalchemy.orm import Session

# Add the app directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.database.database import get_db
from app.models.core import Company, Role


def update_inventory_manager_permissions(db: Session):
    """
    Update all Inventory Manager roles to include oe:setup_manage permission.
    """
    print("=== UPDATING INVENTORY MANAGER PERMISSIONS ===")
    print("Adding 'oe:setup_manage' permission to all Inventory Manager roles...")
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
    
    for role in inventory_manager_roles:
        company = db.query(Company).filter(Company.id == role.company_id).first()
        company_name = company.name if company else f"ID {role.company_id}"
        
        print(f"Checking Inventory Manager role for company: {company_name}")
        
        # Check if oe:setup_manage permission already exists
        current_permissions = role.permissions or []
        
        if "oe:setup_manage" in current_permissions:
            print(f"  ✅ Permission already exists - no update needed")
            already_updated_count += 1
        else:
            # Add the missing permission
            updated_permissions = current_permissions.copy()
            
            # Find the right position to insert oe:setup_manage (after inv permissions, before oe:purchase_orders_manage)
            insert_index = None
            for i, perm in enumerate(updated_permissions):
                if perm == "oe:purchase_orders_manage":
                    insert_index = i
                    break
            
            if insert_index is not None:
                updated_permissions.insert(insert_index, "oe:setup_manage")
            else:
                # If oe:purchase_orders_manage not found, add at the end
                updated_permissions.append("oe:setup_manage")
            
            role.permissions = updated_permissions
            updated_count += 1
            print(f"  ✅ Added 'oe:setup_manage' permission")
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
            print("Inventory Managers can now access Maintenance > OE Setup > Order Defaults")
        else:
            print()
            print("ℹ️  All Inventory Manager roles already had the correct permissions.")
            
    except Exception as e:
        db.rollback()
        print(f"❌ Error updating roles: {str(e)}")
        raise


def verify_update(db: Session):
    """
    Verify that all Inventory Manager roles now have the oe:setup_manage permission.
    """
    print()
    print("=== VERIFICATION ===")
    
    inventory_manager_roles = db.query(Role).filter(
        Role.name == "Inventory Manager"
    ).all()
    
    all_correct = True
    
    for role in inventory_manager_roles:
        company = db.query(Company).filter(Company.id == role.company_id).first()
        company_name = company.name if company else f"ID {role.company_id}"
        
        current_permissions = role.permissions or []
        has_permission = "oe:setup_manage" in current_permissions
        
        status = "✅" if has_permission else "❌"
        print(f"{status} {company_name}: {'Has' if has_permission else 'Missing'} oe:setup_manage permission")
        
        if not has_permission:
            all_correct = False
    
    print()
    if all_correct:
        print("✅ VERIFICATION PASSED: All Inventory Manager roles have the required permission!")
    else:
        print("❌ VERIFICATION FAILED: Some roles are still missing the permission.")
    
    return all_correct


def main():
    """
    Main function to update Inventory Manager permissions.
    """
    try:
        print("Starting Inventory Manager Permission Update")
        print("=" * 50)
        
        # Get database session
        db = next(get_db())
        
        # Update the permissions
        update_inventory_manager_permissions(db)
        
        # Verify the update
        verify_update(db)
        
        db.close()
        
    except Exception as e:
        print(f"❌ Error during update: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()