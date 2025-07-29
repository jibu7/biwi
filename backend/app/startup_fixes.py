"""
Auto-fix permissions on startup
"""
from sqlalchemy.orm import Session
from app.database.database import SessionLocal
from app.models.core import User, Role, UserRole, Company
from app.core.permissions import ALL_PERMISSIONS_LIST
from app import crud, schemas

def auto_fix_permissions():
    """Auto-fix permissions when backend starts"""
    try:
        db = SessionLocal()
        
        # Get first company
        company = db.query(Company).first()
        if not company:
            return
        
        # Update Company Administrator role with all permissions
        company_admin = db.query(Role).filter(
            Role.name == "Company Administrator",
            Role.company_id == company.id
        ).first()
        
        if company_admin:
            # Ensure it has all permissions including frontend compatibility ones
            admin_permissions = list(set(ALL_PERMISSIONS_LIST))
            company_admin.permissions = admin_permissions
            db.commit()
            print(f"✅ Updated Company Administrator with {len(admin_permissions)} permissions")
        
        # Create Financial Manager role if it doesn't exist
        financial_manager = db.query(Role).filter(
            Role.name == "Financial Manager",
            Role.company_id == company.id
        ).first()
        
        if not financial_manager:
            financial_manager_permissions = [
                # Standard permissions
                "gl:setup_manage", "gl:journal_post", "gl:reports_view",
                "ar:setup_manage", "ar:transactions_post", "ar:reports_view", "ar:writeoff_approve",
                "ap:setup_manage", "ap:transactions_post", "ap:reports_view",
                
                # Advanced reporting permissions (both formats for compatibility)
                "reporting:financial_statements_view", "reporting:financial_statements",
                "reporting:gl_advanced_view", "reporting:advanced_gl",
                "reporting:ar_aging_view", "reporting:advanced_ar",
                "reporting:ap_aging_view", "reporting:advanced_ap",
                "reporting:financial_statements_generate",
                "reporting:templates_manage",
                "reporting:schedules_manage", 
                "reporting:bank_reconciliation_manage", "reporting:bank_reconciliation",
                "reporting:comparative_analysis",
                "reporting:cash_flow_view",
                
                # Basic permissions
                "company:read", "users:read"
            ]
            
            role_in = schemas.RoleCreate(
                name="Financial Manager",
                description="Complete access to all financial modules and advanced reporting",
                permissions=financial_manager_permissions
            )
            financial_manager = crud.core.create_role(db, role=role_in, company_id=company.id)
            print(f"✅ Created Financial Manager role with {len(financial_manager_permissions)} permissions")
        
        db.close()
        
    except Exception as e:
        print(f"❌ Auto-fix permissions error: {e}")
        pass  # Don't break startup if this fails
