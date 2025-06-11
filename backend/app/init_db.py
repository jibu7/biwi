from sqlalchemy.orm import Session
from decimal import Decimal
from app.database.database import SessionLocal, engine, Base
from app.config import settings
from app import crud, schemas
from app.models import core as models
from app.models import gl as gl_models
from app.core.security import get_password_hash
from app.core.permissions import ALL_PERMISSIONS_LIST

def create_default_gl_accounts(db: Session, company_id: int):
    """Create a basic chart of accounts"""
    default_accounts = [
        # Assets
        {"code": "1000", "name": "Cash", "type": "Asset"},
        {"code": "1100", "name": "Accounts Receivable", "type": "Asset", "is_control": True},
        {"code": "1200", "name": "Inventory", "type": "Asset"},
        {"code": "1500", "name": "Fixed Assets", "type": "Asset"},
        
        # Liabilities
        {"code": "2000", "name": "Accounts Payable", "type": "Liability", "is_control": True},
        {"code": "2100", "name": "Loans Payable", "type": "Liability"},
        
        # Equity
        {"code": "3000", "name": "Share Capital", "type": "Equity"},
        {"code": "3100", "name": "Retained Earnings", "type": "Equity"},
        
        # Income
        {"code": "4000", "name": "Sales Revenue", "type": "Income"},
        {"code": "4100", "name": "Service Revenue", "type": "Income"},
        
        # Expenses
        {"code": "5000", "name": "Cost of Goods Sold", "type": "Expense"},
        {"code": "5100", "name": "Salaries Expense", "type": "Expense"},
        {"code": "5200", "name": "Rent Expense", "type": "Expense"},
        {"code": "5300", "name": "Utilities Expense", "type": "Expense"},
    ]
    
    for acc_data in default_accounts:
        existing = db.query(gl_models.GLAccount).filter(
            gl_models.GLAccount.account_code == acc_data["code"],
            gl_models.GLAccount.company_id == company_id
        ).first()
        
        if not existing:
            account = gl_models.GLAccount(
                company_id=company_id,
                account_code=acc_data["code"],
                account_name=acc_data["name"],
                account_type=acc_data["type"],
                is_control_account=acc_data.get("is_control", False),
                current_balance=Decimal('0.00'),
                is_active=True
            )
            db.add(account)
    
    db.commit()
    
    # Create GL defaults
    cash_account = db.query(gl_models.GLAccount).filter(
        gl_models.GLAccount.account_code == "1000",
        gl_models.GLAccount.company_id == company_id
    ).first()
    
    ar_account = db.query(gl_models.GLAccount).filter(
        gl_models.GLAccount.account_code == "1100",
        gl_models.GLAccount.company_id == company_id
    ).first()
    
    ap_account = db.query(gl_models.GLAccount).filter(
        gl_models.GLAccount.account_code == "2000",
        gl_models.GLAccount.company_id == company_id
    ).first()
    
    retained_earnings = db.query(gl_models.GLAccount).filter(
        gl_models.GLAccount.account_code == "3100",
        gl_models.GLAccount.company_id == company_id
    ).first()
    
    gl_defaults = schemas.GLDefaultsCreate(
        default_cash_account_id=cash_account.id if cash_account else None,
        default_ar_control_account_id=ar_account.id if ar_account else None,
        default_ap_control_account_id=ap_account.id if ap_account else None,
        retained_earnings_account_id=retained_earnings.id if retained_earnings else None
    )
    
    crud.gl.create_or_update_gl_defaults(db, defaults=gl_defaults, company_id=company_id)
    print("Created default GL accounts and defaults")

def init_db():
    db = SessionLocal()
    
    # Create default company if none exists
    company = crud.core.get_companies(db, skip=0, limit=1)
    if not company:
        company_in = schemas.CompanyCreate(
            name="Vinea Corp Default",
            is_active=True
        )
        company = crud.core.create_company(db, company=company_in)
        print(f"Created default company: {company.name}")
    else:
        company = company[0]
    
    # Create Administrator role with all permissions
    admin_role = db.query(models.Role).filter(
        models.Role.name == "Administrator",
        models.Role.company_id == company.id
    ).first()
    
    if not admin_role:
        role_in = schemas.RoleCreate(
            name="Administrator",
            description="Full system access",
            permissions=ALL_PERMISSIONS_LIST
        )
        admin_role = crud.core.create_role(db, role=role_in, company_id=company.id)
        print("Created Administrator role")
    
    # Create default admin user
    admin_user = crud.core.get_user_by_email(db, email="admin@biwi.com")
    if not admin_user:
        user_in = schemas.UserCreate(
            email="admin@biwi.com",
            password="admin123",
            full_name="System Administrator",
            is_active=True,
            is_superuser=True
        )
        admin_user = crud.core.create_user(db, user=user_in, company_id=company.id)
        print("Created admin user")
        
        # Assign Administrator role
        crud.core.assign_role_to_user(
            db, user_id=admin_user.id, role_id=admin_role.id, company_id=company.id
        )
        print("Assigned Administrator role to admin user")
    
    # Create other default roles
    default_roles = [
        {
            "name": "Accountant",
            "description": "Manages financial transactions and reports",
            "permissions": [
                "gl:setup_manage", "gl:journal_post", "gl:reports_view",
                "ar:transactions_post", "ar:reports_view",
                "ap:transactions_post", "ap:reports_view"
            ]
        },
        {
            "name": "Sales Manager",
            "description": "Manages sales and customer relationships",
            "permissions": [
                "ar:setup_manage", "ar:transactions_post", "ar:reports_view",
                "oe:sales_orders_manage", "oe:reports_view"
            ]
        },
        {
            "name": "Clerk",
            "description": "Basic data entry permissions",
            "permissions": [
                "company:read", "users:read", "gl:reports_view",
                "ar:reports_view", "ap:reports_view"
            ]
        }
    ]
    
    for role_data in default_roles:
        existing_role = db.query(models.Role).filter(
            models.Role.name == role_data["name"],
            models.Role.company_id == company.id
        ).first()
        
        if not existing_role:
            role_in = schemas.RoleCreate(**role_data)
            crud.core.create_role(db, role=role_in, company_id=company.id)
            print(f"Created {role_data['name']} role")
    
    # Create default GL accounts and defaults
    create_default_gl_accounts(db, company.id)
    
    db.close()

if __name__ == "__main__":
    print("Initializing database...")
    init_db()
    print("Database initialization finished.")
