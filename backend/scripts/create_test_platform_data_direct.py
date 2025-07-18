#!/usr/bin/env python3
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from sqlalchemy import text
from app.database.database import SessionLocal
from app.core.security import get_password_hash
from datetime import date, timedelta

def create_test_data_direct():
    """Create test data using direct SQL to avoid enum issues"""
    
    db = SessionLocal()
    
    print("Creating test multi-tenant data using direct SQL...")
    
    try:
        # Create platform admin using direct SQL
        platform_admin_exists = db.execute(text("""
            SELECT COUNT(*) FROM users WHERE email = 'platform@vinea.com'
        """)).scalar()
        
        if platform_admin_exists == 0:
            db.execute(text("""
                INSERT INTO users (email, hashed_password, full_name, is_active, is_superuser, user_type, company_id)
                VALUES (:email, :password, :full_name, :is_active, :is_superuser, :user_type, :company_id)
            """), {
                "email": "platform@vinea.com",
                "password": get_password_hash("platform123"),
                "full_name": "Platform Administrator",
                "is_active": True,
                "is_superuser": True,
                "user_type": "platform_admin",
                "company_id": None
            })
            print("Created platform admin: platform@vinea.com")
        else:
            print("Platform admin already exists: platform@vinea.com")
        
        # Create test companies
        test_companies = [
            {
                "name": "Acme Corporation",
                "code": "ACME001",
                "subscription_plan": "professional",
                "subscription_status": "active",
            },
            {
                "name": "TechStart Inc",
                "code": "TECH001",
                "subscription_plan": "basic",
                "subscription_status": "active",
            },
            {
                "name": "Trial Company",
                "code": "TRIAL001",
                "subscription_plan": "trial",
                "subscription_status": "trial",
                "subscription_expires": date.today() + timedelta(days=7),
            },
        ]
        
        for company_data in test_companies:
            # Check if company exists
            company_exists = db.execute(text("""
                SELECT COUNT(*) FROM companies WHERE code = :code
            """), {"code": company_data["code"]}).scalar()
            
            if company_exists == 0:
                # Create company
                company_id = db.execute(text("""
                    INSERT INTO companies (name, code, subscription_plan, subscription_status, subscription_expires)
                    VALUES (:name, :code, :subscription_plan, :subscription_status, :subscription_expires)
                    RETURNING id
                """), {
                    "name": company_data["name"],
                    "code": company_data["code"],
                    "subscription_plan": company_data["subscription_plan"],
                    "subscription_status": company_data["subscription_status"],
                    "subscription_expires": company_data.get("subscription_expires")
                }).scalar()
                
                print(f"Created company: {company_data['name']}")
                
                # Create admin user for company
                admin_email = f"admin@{company_data['code'].lower()}.com"
                admin_exists = db.execute(text("""
                    SELECT COUNT(*) FROM users WHERE email = :email
                """), {"email": admin_email}).scalar()
                
                if admin_exists == 0:
                    db.execute(text("""
                        INSERT INTO users (email, hashed_password, full_name, is_active, user_type, company_id)
                        VALUES (:email, :password, :full_name, :is_active, :user_type, :company_id)
                    """), {
                        "email": admin_email,
                        "password": get_password_hash("admin123"),
                        "full_name": f"{company_data['name']} Admin",
                        "is_active": True,
                        "user_type": "company_admin",
                        "company_id": company_id
                    })
                    print(f"  Created admin user: {admin_email}")
            else:
                print(f"Company already exists: {company_data['name']}")
        
        db.commit()
        print("\nTest data creation complete!")
        
    except Exception as e:
        print(f"Error creating test data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_test_data_direct()
