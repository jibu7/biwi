from typing import Dict, List, Optional
from datetime import date, datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func
from app import models
from app.models.billing import ResourceUsage, UsageAlert, BillingConfiguration
import asyncio
import logging

logger = logging.getLogger(__name__)

class UsageTrackingService:
    
    def __init__(self, db: Session):
        self.db = db
    
    def track_storage_usage(self, company_id: int, storage_gb: float, usage_date: date = None) -> ResourceUsage:
        """Track storage usage for a company"""
        if usage_date is None:
            usage_date = date.today()
        
        billing_period = usage_date.strftime("%Y-%m")
        
        # Check if usage already exists for this date
        existing_usage = self.db.query(ResourceUsage).filter(
            ResourceUsage.company_id == company_id,
            ResourceUsage.resource_type == "storage",
            ResourceUsage.usage_date == usage_date
        ).first()
        
        if existing_usage:
            existing_usage.usage_amount = storage_gb
            existing_usage.usage_metadata = {"last_updated": datetime.utcnow().isoformat()}
            self.db.commit()
            return existing_usage
        
        usage = ResourceUsage(
            company_id=company_id,
            resource_type="storage",
            usage_amount=storage_gb,
            usage_date=usage_date,
            billing_period=billing_period,
            usage_metadata={"created": datetime.utcnow().isoformat()}
        )
        self.db.add(usage)
        self.db.commit()
        
        # Check for alerts
        self._check_usage_alerts(company_id, "storage", storage_gb)
        
        return usage
    
    def track_user_usage(self, company_id: int, user_count: int, usage_date: date = None) -> ResourceUsage:
        """Track user count for a company"""
        if usage_date is None:
            usage_date = date.today()
        
        billing_period = usage_date.strftime("%Y-%m")
        
        # Check if usage already exists for this date
        existing_usage = self.db.query(ResourceUsage).filter(
            ResourceUsage.company_id == company_id,
            ResourceUsage.resource_type == "users",
            ResourceUsage.usage_date == usage_date
        ).first()
        
        if existing_usage:
            existing_usage.usage_amount = user_count
            existing_usage.usage_metadata = {"last_updated": datetime.utcnow().isoformat()}
            self.db.commit()
            return existing_usage
        
        usage = ResourceUsage(
            company_id=company_id,
            resource_type="users",
            usage_amount=user_count,
            usage_date=usage_date,
            billing_period=billing_period,
            usage_metadata={"created": datetime.utcnow().isoformat()}
        )
        self.db.add(usage)
        self.db.commit()
        
        # Check for alerts
        self._check_usage_alerts(company_id, "users", user_count)
        
        return usage
    
    def track_transaction_usage(self, company_id: int, transaction_count: int, usage_date: date = None) -> ResourceUsage:
        """Track transaction count for a company"""
        if usage_date is None:
            usage_date = date.today()
        
        billing_period = usage_date.strftime("%Y-%m")
        
        # Check if usage already exists for this date
        existing_usage = self.db.query(ResourceUsage).filter(
            ResourceUsage.company_id == company_id,
            ResourceUsage.resource_type == "transactions",
            ResourceUsage.usage_date == usage_date
        ).first()
        
        if existing_usage:
            existing_usage.usage_amount = existing_usage.usage_amount + transaction_count
            existing_usage.usage_metadata = {"last_updated": datetime.utcnow().isoformat()}
            self.db.commit()
            return existing_usage
        
        usage = ResourceUsage(
            company_id=company_id,
            resource_type="transactions",
            usage_amount=transaction_count,
            usage_date=usage_date,
            billing_period=billing_period,
            usage_metadata={"created": datetime.utcnow().isoformat()}
        )
        self.db.add(usage)
        self.db.commit()
        
        return usage
    
    def get_usage_summary(self, company_id: int, billing_period: str = None) -> Dict:
        """Get usage summary for a company"""
        if billing_period is None:
            billing_period = date.today().strftime("%Y-%m")
        
        usage_data = self.db.query(ResourceUsage).filter(
            ResourceUsage.company_id == company_id,
            ResourceUsage.billing_period == billing_period
        ).all()
        
        summary = {
            "company_id": company_id,
            "billing_period": billing_period,
            "storage_gb": 0,
            "users": 0,
            "transactions": 0,
            "api_calls": 0
        }
        
        for usage in usage_data:
            if usage.resource_type == "storage":
                summary["storage_gb"] = max(summary["storage_gb"], float(usage.usage_amount))
            elif usage.resource_type == "users":
                summary["users"] = max(summary["users"], int(usage.usage_amount))
            elif usage.resource_type == "transactions":
                summary["transactions"] += int(usage.usage_amount)
            elif usage.resource_type == "api_calls":
                summary["api_calls"] += int(usage.usage_amount)
        
        return summary
    
    def get_usage_trends(self, company_id: int, months: int = 12) -> List[Dict]:
        """Get usage trends for a company over time"""
        end_date = date.today()
        start_date = end_date - timedelta(days=months * 30)
        
        usage_data = self.db.query(ResourceUsage).filter(
            ResourceUsage.company_id == company_id,
            ResourceUsage.usage_date >= start_date,
            ResourceUsage.usage_date <= end_date
        ).order_by(ResourceUsage.usage_date).all()
        
        trends = {}
        for usage in usage_data:
            period = usage.billing_period
            if period not in trends:
                trends[period] = {
                    "billing_period": period,
                    "storage_gb": 0,
                    "users": 0,
                    "transactions": 0,
                    "api_calls": 0
                }
            
            if usage.resource_type == "storage":
                trends[period]["storage_gb"] = max(trends[period]["storage_gb"], float(usage.usage_amount))
            elif usage.resource_type == "users":
                trends[period]["users"] = max(trends[period]["users"], int(usage.usage_amount))
            elif usage.resource_type == "transactions":
                trends[period]["transactions"] += int(usage.usage_amount)
            elif usage.resource_type == "api_calls":
                trends[period]["api_calls"] += int(usage.usage_amount)
        
        return list(trends.values())
    
    def _check_usage_alerts(self, company_id: int, resource_type: str, current_usage: float):
        """Check if usage triggers any alerts"""
        company = self.db.query(models.Company).filter(models.Company.id == company_id).first()
        if not company:
            return
        
        # Get relevant limit
        limit = None
        if resource_type == "storage":
            limit = company.storage_limit_gb
        elif resource_type == "users":
            limit = company.user_limit
        
        if limit is None:
            return
        
        # Check alerts
        alerts = self.db.query(UsageAlert).filter(
            UsageAlert.company_id == company_id,
            UsageAlert.alert_type == f"{resource_type}_limit",
            UsageAlert.is_active == True
        ).all()
        
        for alert in alerts:
            threshold = (alert.threshold_percentage / 100) * limit
            if current_usage >= threshold:
                # Trigger alert (implement notification logic here)
                alert.last_triggered = datetime.utcnow()
                self.db.commit()
                
                logger.warning(f"Usage alert triggered for company {company_id}: {resource_type} usage {current_usage} exceeds threshold {threshold}")
    
    def calculate_monthly_costs(self, company_id: int, billing_period: str = None) -> Dict:
        """Calculate monthly costs for a company"""
        if billing_period is None:
            billing_period = date.today().strftime("%Y-%m")
        
        usage_summary = self.get_usage_summary(company_id, billing_period)
        billing_config = self.db.query(BillingConfiguration).filter(
            BillingConfiguration.company_id == company_id
        ).first()
        
        if not billing_config:
            return {"error": "No billing configuration found"}
        
        costs = {
            "base_fee": float(billing_config.base_monthly_fee),
            "user_fees": float(billing_config.per_user_fee) * usage_summary["users"],
            "storage_fees": float(billing_config.per_gb_storage_fee) * usage_summary["storage_gb"],
            "transaction_fees": float(billing_config.per_transaction_fee) * usage_summary["transactions"],
            "total": 0
        }
        
        costs["total"] = costs["base_fee"] + costs["user_fees"] + costs["storage_fees"] + costs["transaction_fees"]
        
        return costs
    
    async def collect_all_usage_data(self):
        """Collect usage data for all companies (run as background task)"""
        companies = self.db.query(models.Company).filter(
            models.Company.is_active == True,
            models.Company.is_deleted == False
        ).all()
        
        for company in companies:
            try:
                # Calculate current storage usage
                storage_usage = self._calculate_storage_usage(company.id)
                self.track_storage_usage(company.id, storage_usage)
                
                # Calculate current user count
                user_count = self.db.query(models.User).filter(
                    models.User.company_id == company.id,
                    models.User.is_active == True
                ).count()
                self.track_user_usage(company.id, user_count)
                
                logger.info(f"Updated usage data for company {company.id}")
                
            except Exception as e:
                logger.error(f"Error collecting usage data for company {company.id}: {str(e)}")
    
    def _calculate_storage_usage(self, company_id: int) -> float:
        """Calculate actual storage usage for a company"""
        # This is a placeholder implementation
        # In a real system, you would calculate based on:
        # - Database table sizes
        # - File uploads
        # - Document storage
        # - Audit logs
        # - Backup sizes
        
        # For now, return a mock value based on data volume
        total_size = 0.0
        
        try:
            # Count records across major tables
            user_count = self.db.query(models.User).filter(models.User.company_id == company_id).count()
            role_count = self.db.query(models.Role).filter(models.Role.company_id == company_id).count()
            
            # Estimate storage based on record counts
            # This is a very rough estimate - in production you'd want actual size calculations
            total_size = (user_count * 0.001) + (role_count * 0.0001)  # KB to GB conversion
            
        except Exception as e:
            logger.error(f"Error calculating storage for company {company_id}: {str(e)}")
            total_size = 0.1  # Default small size
        
        return max(total_size, 0.1)  # Minimum 0.1 GB
