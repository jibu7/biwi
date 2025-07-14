from typing import Dict, Optional, List
from datetime import datetime, date, timedelta
from sqlalchemy.orm import Session
from app import models, schemas
from app.models.billing import BillingConfiguration, UsageAlert
from app.services.usage_tracking import UsageTrackingService
from app.services.billing_service import BillingService
import logging

logger = logging.getLogger(__name__)

class TenantProvisioningService:
    
    def __init__(self, db: Session):
        self.db = db
        self.usage_service = UsageTrackingService(db)
        self.billing_service = BillingService(db)
    
    def provision_new_tenant(self, company_data: Dict, admin_user_data: Dict) -> Dict:
        """Provision a new tenant with complete setup"""
        try:
            # Create company
            company = self._create_company(company_data)
            
            # Create admin user
            admin_user = self._create_admin_user(admin_user_data, company.id)
            
            # Setup billing configuration
            billing_config = self._setup_billing_configuration(company.id)
            
            # Create default accounting setup
            accounting_period = self._create_default_accounting_period(company.id)
            
            # Setup usage alerts
            self._setup_usage_alerts(company.id)
            
            # Initialize usage tracking
            self._initialize_usage_tracking(company.id)
            
            # Create default roles
            roles = self._create_default_roles(company.id)
            
            # Assign admin role to admin user
            self._assign_admin_role(admin_user.id, roles["admin"].id)
            
            logger.info(f"Successfully provisioned new tenant: {company.name} (ID: {company.id})")
            
            return {
                "company": company,
                "admin_user": admin_user,
                "billing_config": billing_config,
                "accounting_period": accounting_period,
                "roles": roles,
                "status": "provisioned"
            }
            
        except Exception as e:
            logger.error(f"Error provisioning tenant: {str(e)}")
            # Rollback any partial changes
            self.db.rollback()
            raise
    
    def _create_company(self, company_data: Dict) -> models.Company:
        """Create a new company"""
        # Generate unique company code if not provided
        if "code" not in company_data:
            company_data["code"] = self._generate_company_code(company_data["name"])
        
        company = models.Company(**company_data)
        self.db.add(company)
        self.db.commit()
        self.db.refresh(company)
        
        return company
    
    def _create_admin_user(self, user_data: Dict, company_id: int) -> models.User:
        """Create admin user for the company"""
        from app.core.security import get_password_hash
        
        user = models.User(
            email=user_data["email"],
            hashed_password=get_password_hash(user_data["password"]),
            full_name=user_data.get("full_name", ""),
            user_type="company_admin",
            company_id=company_id,
            is_active=True
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        
        return user
    
    def _setup_billing_configuration(self, company_id: int) -> BillingConfiguration:
        """Setup default billing configuration"""
        billing_config = BillingConfiguration(
            company_id=company_id,
            base_monthly_fee=0.00,  # Free tier
            per_user_fee=10.00,
            per_gb_storage_fee=1.00,
            per_transaction_fee=0.01,
            billing_cycle="monthly"
        )
        self.db.add(billing_config)
        self.db.commit()
        
        return billing_config
    
    def _create_default_accounting_period(self, company_id: int) -> models.AccountingPeriod:
        """Create default accounting period"""
        current_year = datetime.now().year
        
        period = models.AccountingPeriod(
            company_id=company_id,
            name=f"FY {current_year}",
            start_date=date(current_year, 1, 1),
            end_date=date(current_year, 12, 31),
            status="Open"
        )
        self.db.add(period)
        self.db.commit()
        
        return period
    
    def _setup_usage_alerts(self, company_id: int):
        """Setup default usage alerts"""
        alerts = [
            {
                "alert_type": "storage_limit",
                "threshold_percentage": 80.0,
                "alert_recipients": []
            },
            {
                "alert_type": "user_limit",
                "threshold_percentage": 90.0,
                "alert_recipients": []
            }
        ]
        
        for alert_data in alerts:
            alert = UsageAlert(
                company_id=company_id,
                **alert_data
            )
            self.db.add(alert)
        
        self.db.commit()
    
    def _initialize_usage_tracking(self, company_id: int):
        """Initialize usage tracking for the company"""
        # Track initial usage
        self.usage_service.track_storage_usage(company_id, 0.1)  # Minimum storage
        self.usage_service.track_user_usage(company_id, 1)  # Admin user
        self.usage_service.track_transaction_usage(company_id, 0)  # No transactions yet
    
    def _create_default_roles(self, company_id: int) -> Dict[str, models.Role]:
        """Create default roles for the company"""
        default_roles = {
            "admin": {
                "name": "Administrator",
                "description": "Full access to all company features",
                "permissions": [
                    "user.create", "user.read", "user.update", "user.delete",
                    "role.create", "role.read", "role.update", "role.delete",
                    "company.read", "company.update",
                    "accounting.create", "accounting.read", "accounting.update", "accounting.delete",
                    "reports.create", "reports.read", "reports.update", "reports.delete"
                ]
            },
            "accountant": {
                "name": "Accountant",
                "description": "Access to accounting and financial features",
                "permissions": [
                    "accounting.create", "accounting.read", "accounting.update",
                    "reports.create", "reports.read"
                ]
            },
            "user": {
                "name": "User",
                "description": "Basic user access",
                "permissions": [
                    "accounting.read", "reports.read"
                ]
            }
        }
        
        created_roles = {}
        for role_key, role_data in default_roles.items():
            role = models.Role(
                company_id=company_id,
                name=role_data["name"],
                description=role_data["description"],
                permissions=role_data["permissions"]
            )
            self.db.add(role)
            self.db.commit()
            self.db.refresh(role)
            created_roles[role_key] = role
        
        return created_roles
    
    def _assign_admin_role(self, user_id: int, role_id: int):
        """Assign admin role to user"""
        user_role = models.UserRole(
            user_id=user_id,
            role_id=role_id
        )
        self.db.add(user_role)
        self.db.commit()
    
    def _generate_company_code(self, company_name: str) -> str:
        """Generate a unique company code"""
        base_code = "".join([c.upper() for c in company_name if c.isalpha()])[:6]
        
        # Check if code exists
        counter = 1
        code = base_code
        while self.db.query(models.Company).filter(models.Company.code == code).first():
            code = f"{base_code}{counter}"
            counter += 1
        
        return code
    
    def deprovision_tenant(self, company_id: int, reason: str = "Manual deprovisioning") -> Dict:
        """Safely deprovision a tenant"""
        try:
            company = self.db.query(models.Company).filter(models.Company.id == company_id).first()
            if not company:
                raise ValueError("Company not found")
            
            # Soft delete - mark as deleted but keep data for audit
            company.is_deleted = True
            company.is_active = False
            company.subscription_status = "cancelled"
            
            # Deactivate all users
            users = self.db.query(models.User).filter(models.User.company_id == company_id).all()
            for user in users:
                user.is_active = False
            
            self.db.commit()
            
            logger.info(f"Tenant deprovisioned: {company.name} (ID: {company_id}). Reason: {reason}")
            
            return {
                "company_id": company_id,
                "status": "deprovisioned",
                "reason": reason,
                "deprovisioned_at": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error deprovisioning tenant {company_id}: {str(e)}")
            self.db.rollback()
            raise
    
    def migrate_tenant_data(self, source_company_id: int, target_company_id: int) -> Dict:
        """Migrate data from one tenant to another (for mergers/acquisitions)"""
        try:
            source_company = self.db.query(models.Company).filter(models.Company.id == source_company_id).first()
            target_company = self.db.query(models.Company).filter(models.Company.id == target_company_id).first()
            
            if not source_company or not target_company:
                raise ValueError("Source or target company not found")
            
            # Migrate users (excluding admin users to avoid conflicts)
            users = self.db.query(models.User).filter(
                models.User.company_id == source_company_id,
                models.User.user_type != "company_admin"
            ).all()
            
            migrated_users = []
            for user in users:
                user.company_id = target_company_id
                migrated_users.append(user.id)
            
            # Migrate roles
            roles = self.db.query(models.Role).filter(models.Role.company_id == source_company_id).all()
            migrated_roles = []
            for role in roles:
                role.company_id = target_company_id
                migrated_roles.append(role.id)
            
            # Mark source company as migrated
            source_company.is_deleted = True
            source_company.is_active = False
            source_company.subscription_status = "migrated"
            
            self.db.commit()
            
            logger.info(f"Tenant migration completed: {source_company.name} -> {target_company.name}")
            
            return {
                "source_company_id": source_company_id,
                "target_company_id": target_company_id,
                "migrated_users": migrated_users,
                "migrated_roles": migrated_roles,
                "status": "migrated",
                "migrated_at": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error migrating tenant data: {str(e)}")
            self.db.rollback()
            raise
    
    def get_tenant_health_status(self, company_id: int) -> Dict:
        """Get comprehensive health status of a tenant"""
        company = self.db.query(models.Company).filter(models.Company.id == company_id).first()
        if not company:
            raise ValueError("Company not found")
        
        # Get usage data
        usage_summary = self.usage_service.get_usage_summary(company_id)
        
        # Get user statistics
        total_users = self.db.query(models.User).filter(
            models.User.company_id == company_id,
            models.User.user_type != "platform_admin"
        ).count()
        
        active_users = self.db.query(models.User).filter(
            models.User.company_id == company_id,
            models.User.is_active == True,
            models.User.user_type != "platform_admin"
        ).count()
        
        # Calculate health scores
        storage_health = "healthy" if usage_summary["storage_gb"] < (company.storage_limit_gb * 0.8) else "warning"
        user_health = "healthy" if total_users < (company.user_limit * 0.9) else "warning"
        
        overall_health = "healthy"
        if storage_health == "warning" or user_health == "warning":
            overall_health = "warning"
        
        return {
            "company_id": company_id,
            "company_name": company.name,
            "overall_health": overall_health,
            "subscription_status": company.subscription_status,
            "usage": usage_summary,
            "users": {
                "total": total_users,
                "active": active_users,
                "limit": company.user_limit,
                "health": user_health
            },
            "storage": {
                "used_gb": usage_summary["storage_gb"],
                "limit_gb": company.storage_limit_gb,
                "percentage": (usage_summary["storage_gb"] / company.storage_limit_gb) * 100,
                "health": storage_health
            },
            "last_checked": datetime.utcnow().isoformat()
        }
    
    def bulk_provision_tenants(self, tenant_configs: List[Dict]) -> List[Dict]:
        """Provision multiple tenants in bulk"""
        results = []
        
        for config in tenant_configs:
            try:
                result = self.provision_new_tenant(
                    config["company_data"],
                    config["admin_user_data"]
                )
                results.append({
                    "company_name": config["company_data"]["name"],
                    "status": "success",
                    "company_id": result["company"].id,
                    "admin_user_id": result["admin_user"].id
                })
            except Exception as e:
                results.append({
                    "company_name": config["company_data"]["name"],
                    "status": "failed",
                    "error": str(e)
                })
                logger.error(f"Failed to provision tenant {config['company_data']['name']}: {str(e)}")
        
        return results
