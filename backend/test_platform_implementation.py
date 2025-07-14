import pytest
import asyncio
from datetime import datetime, date, timedelta
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.main import app
from app.database.database import get_db
from app import models
from app.core.security import get_password_hash, create_access_token
from app.services.usage_tracking import UsageTrackingService
from app.services.billing_service import BillingService
from app.services.tenant_provisioning import TenantProvisioningService

client = TestClient(app)

# Test fixtures
@pytest.fixture
def db_session():
    """Get database session for testing"""
    db = next(get_db())
    yield db
    db.close()

@pytest.fixture
def platform_admin_user(db_session):
    """Create a platform admin user for testing"""
    user = models.User(
        email="admin@platform.com",
        hashed_password=get_password_hash("adminpass123"),
        full_name="Platform Administrator",
        user_type="platform_admin",
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture
def test_company(db_session):
    """Create a test company"""
    company = models.Company(
        name="Test Company Ltd",
        code="TEST01",
        subscription_status="active",
        subscription_plan="professional",
        storage_limit_gb=100,
        user_limit=50,
        primary_contact_email="contact@testcompany.com"
    )
    db_session.add(company)
    db_session.commit()
    db_session.refresh(company)
    return company

@pytest.fixture
def company_admin_user(db_session, test_company):
    """Create a company admin user"""
    user = models.User(
        email="admin@testcompany.com",
        hashed_password=get_password_hash("companypass123"),
        full_name="Company Administrator",
        user_type="company_admin",
        company_id=test_company.id,
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture
def platform_admin_token(platform_admin_user):
    """Create access token for platform admin"""
    return create_access_token(data={"user_id": platform_admin_user.id})

@pytest.fixture
def company_admin_token(company_admin_user):
    """Create access token for company admin"""
    return create_access_token(data={"user_id": company_admin_user.id})

class TestPlatformAdministration:
    """Test platform administration features"""
    
    def test_platform_admin_authentication(self, platform_admin_token):
        """Test that platform admin can access platform endpoints"""
        headers = {"Authorization": f"Bearer {platform_admin_token}"}
        
        response = client.get("/api/v1/platform/metrics/summary", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "total_companies" in data
        assert "active_companies" in data
        assert "total_users" in data
    
    def test_non_platform_admin_access_denied(self, company_admin_token):
        """Test that non-platform admin users cannot access platform endpoints"""
        headers = {"Authorization": f"Bearer {company_admin_token}"}
        
        response = client.get("/api/v1/platform/metrics/summary", headers=headers)
        assert response.status_code == 403
    
    def test_list_companies(self, platform_admin_token, test_company):
        """Test listing all companies"""
        headers = {"Authorization": f"Bearer {platform_admin_token}"}
        
        response = client.get("/api/v1/platform/companies", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) > 0
        assert any(company["company"]["id"] == test_company.id for company in data)
    
    def test_company_impersonation(self, platform_admin_token, test_company):
        """Test company impersonation functionality"""
        headers = {"Authorization": f"Bearer {platform_admin_token}"}
        
        response = client.post(
            f"/api/v1/platform/companies/{test_company.id}/impersonate",
            headers=headers,
            json={"reason": "Testing impersonation"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "access_token" in data
        assert "company" in data
        assert data["company"]["id"] == test_company.id
    
    def test_company_suspend_activate(self, platform_admin_token, test_company):
        """Test company suspension and activation"""
        headers = {"Authorization": f"Bearer {platform_admin_token}"}
        
        # Suspend company
        response = client.post(
            f"/api/v1/platform/companies/{test_company.id}/suspend",
            headers=headers,
            json={"reason": "Testing suspension"}
        )
        assert response.status_code == 200
        
        # Activate company
        response = client.post(
            f"/api/v1/platform/companies/{test_company.id}/activate",
            headers=headers,
            json={"reason": "Testing activation"}
        )
        assert response.status_code == 200
    
    def test_company_health_check(self, platform_admin_token, test_company):
        """Test company health check"""
        headers = {"Authorization": f"Bearer {platform_admin_token}"}
        
        response = client.get(
            f"/api/v1/platform/companies/{test_company.id}/health",
            headers=headers
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["company_id"] == test_company.id
        assert "health_status" in data
        assert "storage_percentage" in data
    
    def test_audit_logs(self, platform_admin_token, platform_admin_user):
        """Test audit log retrieval"""
        headers = {"Authorization": f"Bearer {platform_admin_token}"}
        
        # First, perform an action to create audit log
        client.get("/api/v1/platform/metrics/summary", headers=headers)
        
        # Then retrieve audit logs
        response = client.get("/api/v1/platform/audit-logs", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
    
    def test_create_company(self, platform_admin_token):
        """Test creating a new company"""
        headers = {"Authorization": f"Bearer {platform_admin_token}"}
        
        company_data = {
            "name": "New Test Company",
            "code": "NEWTEST",
            "subscription_status": "trial",
            "storage_limit_gb": 10,
            "user_limit": 5,
            "primary_contact_email": "contact@newtest.com"
        }
        
        response = client.post(
            "/api/v1/platform/companies",
            headers=headers,
            json=company_data
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["name"] == company_data["name"]
        assert data["code"] == company_data["code"]

class TestUsageTracking:
    """Test usage tracking service"""
    
    def test_track_storage_usage(self, db_session, test_company):
        """Test storage usage tracking"""
        service = UsageTrackingService(db_session)
        
        usage = service.track_storage_usage(test_company.id, 25.5)
        assert usage.resource_type == "storage"
        assert float(usage.usage_amount) == 25.5
        assert usage.company_id == test_company.id
    
    def test_track_user_usage(self, db_session, test_company):
        """Test user usage tracking"""
        service = UsageTrackingService(db_session)
        
        usage = service.track_user_usage(test_company.id, 10)
        assert usage.resource_type == "users"
        assert int(usage.usage_amount) == 10
        assert usage.company_id == test_company.id
    
    def test_usage_summary(self, db_session, test_company):
        """Test usage summary generation"""
        service = UsageTrackingService(db_session)
        
        # Track some usage
        service.track_storage_usage(test_company.id, 15.0)
        service.track_user_usage(test_company.id, 5)
        service.track_transaction_usage(test_company.id, 100)
        
        # Get summary
        summary = service.get_usage_summary(test_company.id)
        assert summary["company_id"] == test_company.id
        assert summary["storage_gb"] == 15.0
        assert summary["users"] == 5
        assert summary["transactions"] == 100
    
    def test_usage_trends(self, db_session, test_company):
        """Test usage trends"""
        service = UsageTrackingService(db_session)
        
        # Track usage for different periods
        service.track_storage_usage(test_company.id, 10.0, date.today() - timedelta(days=30))
        service.track_storage_usage(test_company.id, 20.0, date.today())
        
        trends = service.get_usage_trends(test_company.id, 2)
        assert len(trends) >= 1

class TestBillingService:
    """Test billing service"""
    
    def test_create_billing_configuration(self, db_session, test_company):
        """Test creating billing configuration"""
        service = BillingService(db_session)
        
        config_data = {
            "base_monthly_fee": 99.99,
            "per_user_fee": 15.00,
            "per_gb_storage_fee": 2.00,
            "per_transaction_fee": 0.05,
            "billing_cycle": "monthly"
        }
        
        config = service.create_billing_configuration(test_company.id, config_data)
        assert config.company_id == test_company.id
        assert float(config.base_monthly_fee) == 99.99
        assert float(config.per_user_fee) == 15.00
    
    def test_calculate_usage_charges(self, db_session, test_company):
        """Test calculating usage charges"""
        service = BillingService(db_session)
        usage_service = UsageTrackingService(db_session)
        
        # Create billing configuration
        config_data = {
            "base_monthly_fee": 50.00,
            "per_user_fee": 10.00,
            "per_gb_storage_fee": 1.00,
            "per_transaction_fee": 0.01
        }
        service.create_billing_configuration(test_company.id, config_data)
        
        # Track usage
        usage_service.track_storage_usage(test_company.id, 25.0)
        usage_service.track_user_usage(test_company.id, 10)
        usage_service.track_transaction_usage(test_company.id, 500)
        
        # Calculate charges
        charges = service.calculate_usage_charges(test_company.id)
        assert charges["base_fee"] == 50.00
        assert charges["user_charges"] == 100.00  # 10 users * $10
        assert charges["storage_charges"] == 25.00  # 25 GB * $1
        assert charges["transaction_charges"] == 5.00  # 500 transactions * $0.01
        assert charges["total"] == 180.00

class TestTenantProvisioning:
    """Test tenant provisioning service"""
    
    def test_provision_new_tenant(self, db_session):
        """Test provisioning a new tenant"""
        service = TenantProvisioningService(db_session)
        
        company_data = {
            "name": "Provisioned Company",
            "code": "PROV01",
            "subscription_status": "trial",
            "storage_limit_gb": 10,
            "user_limit": 5
        }
        
        admin_user_data = {
            "email": "admin@provisioned.com",
            "password": "adminpass123",
            "full_name": "Provisioned Admin"
        }
        
        result = service.provision_new_tenant(company_data, admin_user_data)
        
        assert result["status"] == "provisioned"
        assert result["company"].name == "Provisioned Company"
        assert result["admin_user"].email == "admin@provisioned.com"
        assert result["billing_config"] is not None
        assert len(result["roles"]) > 0
    
    def test_tenant_health_status(self, db_session, test_company):
        """Test getting tenant health status"""
        service = TenantProvisioningService(db_session)
        
        health_status = service.get_tenant_health_status(test_company.id)
        
        assert health_status["company_id"] == test_company.id
        assert health_status["company_name"] == test_company.name
        assert "overall_health" in health_status
        assert "usage" in health_status
        assert "users" in health_status
        assert "storage" in health_status
    
    def test_deprovision_tenant(self, db_session, test_company):
        """Test deprovisioning a tenant"""
        service = TenantProvisioningService(db_session)
        
        result = service.deprovision_tenant(test_company.id, "Testing deprovisioning")
        
        assert result["status"] == "deprovisioned"
        assert result["company_id"] == test_company.id
        assert result["reason"] == "Testing deprovisioning"
        
        # Verify company is marked as deleted
        updated_company = db_session.query(models.Company).filter(
            models.Company.id == test_company.id
        ).first()
        assert updated_company.is_deleted == True
        assert updated_company.is_active == False

class TestPlatformReports:
    """Test platform reports functionality"""
    
    def test_audit_summary(self, platform_admin_token, platform_admin_user, db_session):
        """Test audit summary report"""
        headers = {"Authorization": f"Bearer {platform_admin_token}"}
        
        # Create some audit logs
        audit_log = models.PlatformAuditLog(
            user_id=platform_admin_user.id,
            action="test_action",
            resource_type="test_resource",
            details={"test": "data"}
        )
        db_session.add(audit_log)
        db_session.commit()
        
        response = client.get("/api/v1/platform/reports/audit-summary", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "total_actions" in data
        assert "actions_summary" in data
        assert "unique_users_active" in data
    
    def test_compliance_report(self, platform_admin_token, test_company):
        """Test compliance report generation"""
        headers = {"Authorization": f"Bearer {platform_admin_token}"}
        
        response = client.get(
            f"/api/v1/platform/reports/compliance-report?company_id={test_company.id}",
            headers=headers
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["company"]["id"] == test_company.id
        assert "audit_summary" in data
        assert "current_usage" in data
        assert "billing_info" in data
    
    def test_tenant_health_dashboard(self, platform_admin_token):
        """Test tenant health dashboard"""
        headers = {"Authorization": f"Bearer {platform_admin_token}"}
        
        response = client.get("/api/v1/platform/reports/tenant-health-dashboard", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "overview" in data
        assert "tenant_details" in data
        assert "alerts" in data
        assert "recommendations" in data

class TestBulkOperations:
    """Test bulk operations"""
    
    def test_bulk_suspend_companies(self, platform_admin_token, test_company):
        """Test bulk company suspension"""
        headers = {"Authorization": f"Bearer {platform_admin_token}"}
        
        request_data = {
            "company_ids": [test_company.id],
            "reason": "Testing bulk suspension"
        }
        
        response = client.post(
            "/api/v1/platform/reports/bulk-actions/suspend",
            headers=headers,
            json=request_data
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["action"] == "bulk_suspend"
        assert data["total_companies"] == 1
        assert len(data["results"]) == 1
    
    def test_bulk_activate_companies(self, platform_admin_token, test_company):
        """Test bulk company activation"""
        headers = {"Authorization": f"Bearer {platform_admin_token}"}
        
        request_data = {
            "company_ids": [test_company.id],
            "reason": "Testing bulk activation"
        }
        
        response = client.post(
            "/api/v1/platform/reports/bulk-actions/activate",
            headers=headers,
            json=request_data
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["action"] == "bulk_activate"
        assert data["total_companies"] == 1
        assert len(data["results"]) == 1

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
