#!/usr/bin/env python3
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from app.database.database import SessionLocal
from app import models
from app.core.security import get_password_hash
from datetime import date, timedelta

def create_test_data():
    """Create test data for multi-tenant testing"""
    
    db = SessionLocal()
    
    print("Creating test multi-tenant data...")
    
    # Create platform admin
    platform_admin = db.query(models.User).filter(
        models.User.email == "platform@vinea.com"
    ).first()
    
    if not platform_admin:
        platform_admin = models.User(
            email="platform@vinea.com",
            hashed_password=get_password_hash("platform123"),
            full_name="Platform Administrator",
            user_type="platform_admin",
            company_id=None,
            is_active=True,
            is_superuser=True
        )
        db.add(platform_admin)
        db.commit()
        print(f"Created platform admin: {platform_admin.email}")
    
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
        company = db.query(models.Company).filter(
            models.Company.code == company_data["code"]
        ).first()
        
        if not company:
            company = models.Company(**company_data)
            db.add(company)
            db.commit()
            print(f"Created company: {company.name}")
            
            # Create admin user for company
            admin_user = models.User(
                email=f"admin@{company.code.lower()}.com",
                hashed_password=get_password_hash("admin123"),
                full_name=f"{company.name} Admin",
                user_type="company_admin",
                company_id=company.id,
                is_active=True
            )
            db.add(admin_user)
            db.commit()
            print(f"  Created admin user: {admin_user.email}")
    
    db.close()
    print("\nTest data creation complete!")

if __name__ == "__main__":
    create_test_data()
