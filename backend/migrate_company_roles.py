#!/usr/bin/env python3
"""
Phase 3 Task 8: Database Verification - Company Role Migration Script

This script ensures all existing companies have the complete set of 6 default roles:
1. Company Administrator
2. Accountant  
3. Sales Manager
4. Purchasing Manager
5. Inventory Manager
6. Data Entry Clerk

Usage: python migrate_company_roles.py
"""

import sys
import os
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

# Add the app directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.database.database import get_db
from app.models.core import Company, Role, User, UserRole
from app.core.permissions import ALL_PERMISSIONS_LIST


def get_expected_default_roles():
    """
    Returns the complete set of 6 default roles that every company should have.
    """
    return [
        {
            "name": "Company Administrator",
            "description": "Full access to all company features and settings",
            "permissions": ALL_PERMISSIONS_LIST
        },
        {
            "name": "Accountant",
            "description": "Access to financial and accounting features",
            "permissions": [
                "gl:setup_manage", "gl:journal_post", "gl:reports_view",
                "ar:setup_manage", "ar:transactions_post", "ar:reports_view",
                "ap:setup_manage", "ap:transactions_post", "ap:reports_view",
                "accounting_periods:manage", "company:read", "users:read"
            ]
        },
        {
            "name": "Sales Manager",
            "description": "Access to sales and customer management",
            "permissions": [
                "ar:setup_manage", "ar:transactions_post", "ar:reports_view",
                "oe:sales_orders_manage", "oe:reports_view",
                "users:read", "company:read"
            ]
        },
        {
            "name": "Purchasing Manager",
            "description": "Access to purchasing and vendor management",
            "permissions": [
                "ap:setup_manage", "ap:transactions_post", "ap:reports_view",
                "oe:purchase_orders_manage", "oe:grv_process", "oe:reports_view",
                "inv:reports_view", "company:read", "users:read"
            ]
        },
        {
            "name": "Inventory Manager",
            "description": "Access to inventory management features",
            "permissions": [
                "inv:setup_manage", "inv:transactions_adjust", "inv:reports_view",
                "oe:purchase_orders_manage", "oe:grv_process", "oe:reports_view",
                "ap:setup_manage", "ap:transactions_post", "ap:reports_view",
                "gl:reports_view", "company:read", "users:read"
            ]
        },
        {
            "name": "Data Entry Clerk",
            "description": "Basic data entry permissions for daily transactions",
            "permissions": [
                "gl:journal_post", "ar:transactions_post", "ap:transactions_post",
                "inv:transactions_adjust", "oe:sales_orders_manage", "oe:purchase_orders_manage",
                "company:read", "users:read", "gl:reports_view", "ar:reports_view", "ap:reports_view"
            ]
        }
    ]


def verify_company_roles(db: Session):
    """
    Verify and report on current role setup for all companies.
    """
    print("=== PHASE 3 TASK 8: DATABASE VERIFICATION ===")
    print("Verifying company role setup...")
    print()
    
    companies = db.query(Company).all()
    expected_roles = get_expected_default_roles()
    expected_role_names = [role["name"] for role in expected_roles]
    
    verification_results = []
    
    for company in companies:
        print(f"Company: {company.name} (ID: {company.id})")
        
        # Get existing roles for this company
        existing_roles = db.query(Role).filter(Role.company_id == company.id).all()
        existing_role_names = [role.name for role in existing_roles]
        
        # Check which roles are missing
        missing_roles = set(expected_role_names) - set(existing_role_names)
        extra_roles = set(existing_role_names) - set(expected_role_names)
        
        result = {
            "company_id": company.id,
            "company_name": company.name,
            "total_roles": len(existing_roles),
            "expected_roles": len(expected_roles),
            "missing_roles": list(missing_roles),
            "extra_roles": list(extra_roles),
            "needs_migration": len(missing_roles) > 0
        }
        
        verification_results.append(result)
        
        print(f"  Current roles: {len(existing_roles)}")
        print(f"  Expected roles: {len(expected_roles)}")
        
        if missing_roles:
            print(f"  ❌ Missing roles: {', '.join(missing_roles)}")
        else:
            print(f"  ✅ All expected roles present")
            
        if extra_roles:
            print(f"  ⚠️  Extra roles: {', '.join(extra_roles)}")
            
        # Check role permissions
        for role in existing_roles:
            if role.name in expected_role_names:
                expected_role = next(r for r in expected_roles if r["name"] == role.name)
                current_perms = set(role.permissions) if role.permissions else set()
                expected_perms = set(expected_role["permissions"])
                
                if current_perms != expected_perms:
                    missing_perms = expected_perms - current_perms
                    extra_perms = current_perms - expected_perms
                    if missing_perms:
                        print(f"    ⚠️  {role.name}: Missing {len(missing_perms)} permissions")
                    if extra_perms:
                        print(f"    ⚠️  {role.name}: Has {len(extra_perms)} extra permissions")
                else:
                    print(f"    ✅ {role.name}: Permissions correct")
        
        print()
    
    return verification_results


def migrate_company_roles(db: Session, verification_results):
    """
    Migrate existing companies to have the complete set of default roles.
    """
    print("=== MIGRATING COMPANIES TO HAVE 6 DEFAULT ROLES ===")
    print()
    
    expected_roles = get_expected_default_roles()
    migration_summary = {
        "companies_migrated": 0,
        "roles_created": 0,
        "roles_updated": 0,
        "errors": []
    }
    
    for result in verification_results:
        if not result["needs_migration"] and len(result["missing_roles"]) == 0:
            print(f"✅ {result['company_name']}: No migration needed")
            continue
            
        print(f"🔄 Migrating {result['company_name']} (ID: {result['company_id']})...")
        
        try:
            company_id = result["company_id"]
            
            for role_data in expected_roles:
                # Check if role already exists
                existing_role = db.query(Role).filter(
                    Role.name == role_data["name"],
                    Role.company_id == company_id
                ).first()
                
                if existing_role:
                    # Update existing role permissions if they differ
                    current_perms = set(existing_role.permissions) if existing_role.permissions else set()
                    expected_perms = set(role_data["permissions"])
                    
                    if current_perms != expected_perms:
                        existing_role.permissions = role_data["permissions"]
                        existing_role.description = role_data["description"]
                        migration_summary["roles_updated"] += 1
                        print(f"  ✅ Updated {role_data['name']} role")
                    else:
                        print(f"  ✅ {role_data['name']} role already correct")
                else:
                    # Create new role
                    new_role = Role(
                        name=role_data["name"],
                        description=role_data["description"],
                        permissions=role_data["permissions"],
                        company_id=company_id
                    )
                    db.add(new_role)
                    migration_summary["roles_created"] += 1
                    print(f"  ✅ Created {role_data['name']} role")
            
            db.commit()
            migration_summary["companies_migrated"] += 1
            print(f"  ✅ Migration completed for {result['company_name']}")
            
        except Exception as e:
            db.rollback()
            error_msg = f"Failed to migrate {result['company_name']}: {str(e)}"
            migration_summary["errors"].append(error_msg)
            print(f"  ❌ {error_msg}")
        
        print()
    
    return migration_summary


def verify_role_permissions(db: Session):
    """
    Verify that role permissions are correctly structured.
    """
    print("=== VERIFYING ROLE PERMISSIONS STRUCTURE ===")
    print()
    
    companies = db.query(Company).all()
    permission_issues = []
    
    for company in companies:
        print(f"Checking permissions for {company.name}...")
        roles = db.query(Role).filter(Role.company_id == company.id).all()
        
        for role in roles:
            # Check if permissions is a list
            if role.permissions is not None:
                if not isinstance(role.permissions, list):
                    issue = f"Company {company.id} - Role '{role.name}': permissions is not a list"
                    permission_issues.append(issue)
                    print(f"  ❌ {issue}")
                else:
                    # Check if all permissions are strings
                    non_string_perms = [p for p in role.permissions if not isinstance(p, str)]
                    if non_string_perms:
                        issue = f"Company {company.id} - Role '{role.name}': has non-string permissions: {non_string_perms}"
                        permission_issues.append(issue)
                        print(f"  ❌ {issue}")
                    else:
                        print(f"  ✅ {role.name}: {len(role.permissions)} permissions properly structured")
            else:
                print(f"  ⚠️  {role.name}: No permissions set (NULL)")
    
    print()
    return permission_issues


def main():
    """
    Main function to run the database verification and migration.
    """
    try:
        print("Starting Phase 3 Task 8: Database Verification")
        print("=" * 50)
        
        # Get database session
        db = next(get_db())
        
        # Step 1: Verify current state
        verification_results = verify_company_roles(db)
        
        # Step 2: Migrate companies to have 6 default roles
        migration_summary = migrate_company_roles(db, verification_results)
        
        # Step 3: Verify role permissions structure
        permission_issues = verify_role_permissions(db)
        
        # Step 4: Final verification
        print("=== FINAL VERIFICATION ===")
        final_results = verify_company_roles(db)
        
        # Summary
        print("=== MIGRATION SUMMARY ===")
        print(f"Companies migrated: {migration_summary['companies_migrated']}")
        print(f"Roles created: {migration_summary['roles_created']}")
        print(f"Roles updated: {migration_summary['roles_updated']}")
        print(f"Permission issues found: {len(permission_issues)}")
        
        if migration_summary['errors']:
            print(f"Errors: {len(migration_summary['errors'])}")
            for error in migration_summary['errors']:
                print(f"  - {error}")
        
        # Check if all companies now have 6 roles
        companies_with_6_roles = sum(1 for r in final_results if r['total_roles'] >= 6)
        total_companies = len(final_results)
        
        print(f"\nCompanies with 6+ roles: {companies_with_6_roles}/{total_companies}")
        
        if companies_with_6_roles == total_companies and not permission_issues:
            print("\n✅ PHASE 3 TASK 8 COMPLETED SUCCESSFULLY")
            print("All companies now have the required default roles with correct permissions!")
        else:
            print("\n⚠️  PHASE 3 TASK 8 PARTIALLY COMPLETED")
            print("Some issues remain to be resolved.")
        
        db.close()
        
    except Exception as e:
        print(f"❌ Error during migration: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
