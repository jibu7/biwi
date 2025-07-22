#!/usr/bin/env python3
"""
Fix admin permissions by ensuring admin role has all available permissions
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.database.database import get_db
from app import models
from app.core.permissions import ALL_PERMISSIONS_LIST

def fix_admin_permissions():
    """Ensure admin role has all available permissions"""
    print("🔧 Fixing Admin Permissions")
    print("=" * 50)
    
    try:
        db = next(get_db())
        
        # Get admin user (try common admin emails)
        admin_emails = ['admin@acme001.com', 'admin@company.com', 'admin@localhost', 'admin@test.com']
        admin = None
        
        for email in admin_emails:
            admin = db.query(models.User).filter(models.User.email == email).first()
            if admin:
                break
        
        # If no specific admin email found, get the first user with admin role or superuser
        if not admin:
            admin = db.query(models.User).filter(models.User.is_superuser == True).first()
        
        if not admin:
            print("❌ No admin user found")
            return
            
        print(f"👤 Found admin user: {admin.email}")
        print(f"🏢 Company ID: {admin.company_id}")
        
        # Get or create Company Administrator role
        admin_role = db.query(models.Role).filter(
            models.Role.name == "Company Administrator",
            models.Role.company_id == admin.company_id
        ).first()
        
        if not admin_role:
            # Create the admin role
            admin_role = models.Role(
                name="Company Administrator",
                description="Full access to all company features and settings",
                company_id=admin.company_id,
                is_active=True
            )
            db.add(admin_role)
            db.commit()
            db.refresh(admin_role)
            print(f"✨ Created admin role: {admin_role.name}")
        else:
            print(f"🛡️ Found existing admin role: {admin_role.name}")
            
        print(f"🛡️ Found admin role: {admin_role.name}")
        
        # Get current permissions for this role (stored in JSONB column)
        current_perms = admin_role.permissions or []
        current_perm_strings = set(current_perms)
        print(f"📋 Current permissions: {len(current_perm_strings)}")
        
        # Create comprehensive list of all permissions
        all_permissions = ALL_PERMISSIONS_LIST.copy()
        
        # Also add the new enum-style permissions
        additional_permissions = [
            "gl_account:create",
            "gl_account:read", 
            "gl_account:update",
            "gl_account:delete",
            "gl_journal:post",
            "gl_reports:view",
            "ar_customer:manage",
            "ar_transactions:post",
            "ar_reports:view",
            "ap_supplier:manage", 
            "ap_transactions:post",
            "ap_reports:view",
            "company:create",
            "company:delete",
            "platform:admin",
            "platform:company_manage",
            "platform:user_manage",
            "platform:audit_view"
        ]
        
        all_permissions.extend(additional_permissions)
        
        # Remove duplicates
        all_permissions = list(set(all_permissions))
        
        # Find missing permissions
        missing_perms = [perm for perm in all_permissions if perm not in current_perm_strings]
        
        print(f"🔍 Missing permissions: {len(missing_perms)}")
        
        if missing_perms:
            # Update the permissions list
            updated_permissions = list(current_perm_strings) + missing_perms
            admin_role.permissions = updated_permissions
            
            print(f"🆕 Adding {len(missing_perms)} new permissions...")
            for perm in missing_perms:
                print(f"  ✅ Added: {perm}")
        else:
            print("✅ All permissions already present")
        
        # Ensure admin user has the admin role assigned
        user_role = db.query(models.UserRole).filter(
            models.UserRole.user_id == admin.id,
            models.UserRole.role_id == admin_role.id
        ).first()
        
        if not user_role:
            user_role = models.UserRole(
                user_id=admin.id,
                role_id=admin_role.id
            )
            db.add(user_role)
            print("👑 Assigned admin role to admin user")
        else:
            print("👑 Admin role already assigned")
            
        # Commit all changes
        db.commit()
        
        # Verify final state
        final_perms = admin_role.permissions or []
        
        print(f"\n📊 Final permission count: {len(final_perms)}")
        print("✅ Admin permissions fixed successfully!")
        
        # List some key permissions to verify
        key_perms = ["gl:setup_manage", "gl:reports_view", "gl_account:read", "gl_account:create"]
        print(f"\n🔑 Key permissions verification:")
        for perm in key_perms:
            has_perm = perm in final_perms
            print(f"  {perm}: {'✅' if has_perm else '❌'}")
            
        print("\n🔄 Deployment permissions update complete!")
        
    except Exception as e:
        print(f"❌ Error fixing admin permissions: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    fix_admin_permissions()
