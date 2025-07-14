#!/usr/bin/env python3
from app.database.database import SessionLocal
from app import models
from app.core.security import get_password_hash

def create_platform_admin():
    db = SessionLocal()
    try:
        # Check if platform admin already exists
        existing_admin = db.query(models.User).filter(
            models.User.user_type == "platform_admin"
        ).first()
        
        if existing_admin:
            print(f"Platform admin already exists: {existing_admin.email}")
            return existing_admin
        
        # Create new platform admin
        admin = models.User(
            email="platform@vinea-erp.com",
            hashed_password=get_password_hash("platformadmin123"),
            full_name="Platform Administrator",
            user_type="platform_admin",
            is_active=True
        )
        
        db.add(admin)
        db.commit()
        db.refresh(admin)
        
        print(f"Platform admin created: {admin.email}")
        return admin
        
    except Exception as e:
        print(f"Error creating platform admin: {str(e)}")
        db.rollback()
        return None
    finally:
        db.close()

if __name__ == "__main__":
    create_platform_admin()
