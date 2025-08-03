#!/usr/bin/env python3
"""
Create platform admin user only - no companies.
Platform admin can then create companies through the proper workflow.
"""

import sys
import os
from pathlib import Path

# Add the app directory to Python path
sys.path.append(str(Path(__file__).parent / "app"))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.security import get_password_hash
from app.models.core import User
from app.config import Settings

def create_platform_admin():
    """Create platform admin user"""
    
    # Get database URL
    settings = Settings()
    database_url = settings.DATABASE_URL
    print(f"Connecting to database...")
    
    # Create engine and session
    engine = create_engine(database_url)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    db = SessionLocal()
    
    try:
        # Check if platform admin already exists
        existing_admin = db.query(User).filter(User.email == "admin@biwi.com").first()
        if existing_admin:
            print("✅ Platform admin user already exists")
            return
        
        # Create platform admin user
        hashed_password = get_password_hash("admin123")
        
        platform_admin = User(
            email="admin@biwi.com",
            hashed_password=hashed_password,
            full_name="Platform Administrator",
            is_active=True,
            is_superuser=True,
            user_type="platform_admin",
            company_id=None,  # Platform admin doesn't belong to any specific company
            default_company_id=None
        )
        
        db.add(platform_admin)
        db.commit()
        db.refresh(platform_admin)
        
        print(f"✅ Created platform admin user:")
        print(f"   Email: admin@biwi.com")
        print(f"   Password: admin123")
        print(f"   User Type: platform_admin")
        print(f"   Superuser: True")
        print()
        print("🎯 Platform admin can now:")
        print("   - Log into the system")
        print("   - Create new companies")
        print("   - Manage platform-wide settings")
        print("   - Access all companies (when impersonating)")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error creating platform admin: {e}")
        return False
    finally:
        db.close()
    
    return True

if __name__ == "__main__":
    success = create_platform_admin()
    if not success:
        sys.exit(1)