try:
    import stripe
    STRIPE_AVAILABLE = True
except ImportError:
    STRIPE_AVAILABLE = False
    stripe = None

from typing import Dict, Optional, List
from datetime import datetime, date
from sqlalchemy.orm import Session
from app import models
from app.models.billing import BillingConfiguration, ResourceUsage, BillingTransaction
import logging

logger = logging.getLogger(__name__)

class BillingService:
    
    def __init__(self, db: Session, stripe_api_key: str = None):
        self.db = db
        if stripe_api_key and STRIPE_AVAILABLE:
            stripe.api_key = stripe_api_key
        elif stripe_api_key and not STRIPE_AVAILABLE:
            logger.warning("Stripe API key provided but stripe module not available")
    
    def create_billing_configuration(self, company_id: int, config_data: Dict) -> BillingConfiguration:
        """Create billing configuration for a company"""
        existing_config = self.db.query(BillingConfiguration).filter(
            BillingConfiguration.company_id == company_id
        ).first()
        
        if existing_config:
            # Update existing configuration
            for key, value in config_data.items():
                if hasattr(existing_config, key):
                    setattr(existing_config, key, value)
            existing_config.updated_at = datetime.utcnow()
            self.db.commit()
            return existing_config
        
        # Create new configuration
        billing_config = BillingConfiguration(
            company_id=company_id,
            **config_data
        )
        self.db.add(billing_config)
        self.db.commit()
        
        return billing_config
    
    def get_billing_configuration(self, company_id: int) -> Optional[BillingConfiguration]:
        """Get billing configuration for a company"""
        return self.db.query(BillingConfiguration).filter(
            BillingConfiguration.company_id == company_id
        ).first()
    
    def create_stripe_customer(self, company: models.Company, email: str = None) -> str:
        """Create a Stripe customer for a company"""
        if not STRIPE_AVAILABLE:
            raise ValueError("Stripe module not available")
        
        try:
            customer = stripe.Customer.create(
                email=email or company.billing_email or company.primary_contact_email,
                name=company.name,
                metadata={
                    "company_id": str(company.id),
                    "company_code": company.code
                }
            )
            
            # Update billing configuration
            billing_config = self.get_billing_configuration(company.id)
            if billing_config:
                billing_config.stripe_customer_id = customer.id
                billing_config.updated_at = datetime.utcnow()
                self.db.commit()
            
            return customer.id
            
        except Exception as e:
            if STRIPE_AVAILABLE:
                logger.error(f"Error creating Stripe customer for company {company.id}: {str(e)}")
            else:
                logger.error(f"Stripe not available for company {company.id}")
            raise
    
    def create_subscription(self, company_id: int, price_id: str) -> Dict:
        """Create a subscription for a company"""
        if not STRIPE_AVAILABLE:
            raise ValueError("Stripe module not available")
        
        billing_config = self.get_billing_configuration(company_id)
        if not billing_config or not billing_config.stripe_customer_id:
            raise ValueError("No Stripe customer found for company")
        
        try:
            subscription = stripe.Subscription.create(
                customer=billing_config.stripe_customer_id,
                items=[{"price": price_id}],
                metadata={
                    "company_id": str(company_id)
                }
            )
            
            # Update billing configuration
            billing_config.stripe_subscription_id = subscription.id
            billing_config.updated_at = datetime.utcnow()
            self.db.commit()
            
            # Update company subscription status
            company = self.db.query(models.Company).filter(models.Company.id == company_id).first()
            if company:
                company.subscription_status = "active"
                self.db.commit()
            
            return {
                "subscription_id": subscription.id,
                "status": subscription.status,
                "current_period_start": subscription.current_period_start,
                "current_period_end": subscription.current_period_end
            }
            
        except Exception as e:
            if STRIPE_AVAILABLE:
                logger.error(f"Error creating subscription for company {company_id}: {str(e)}")
            else:
                logger.error(f"Stripe not available for subscription creation")
            raise
    
    def calculate_usage_charges(self, company_id: int, billing_period: str = None) -> Dict:
        """Calculate usage-based charges for a company"""
        if billing_period is None:
            billing_period = date.today().strftime("%Y-%m")
        
        billing_config = self.get_billing_configuration(company_id)
        if not billing_config:
            return {"error": "No billing configuration found"}
        
        # Get usage data
        usage_data = self.db.query(ResourceUsage).filter(
            ResourceUsage.company_id == company_id,
            ResourceUsage.billing_period == billing_period
        ).all()
        
        charges = {
            "base_fee": float(billing_config.base_monthly_fee),
            "user_charges": 0,
            "storage_charges": 0,
            "transaction_charges": 0,
            "total": 0
        }
        
        max_users = 0
        max_storage = 0
        total_transactions = 0
        
        for usage in usage_data:
            if usage.resource_type == "users":
                max_users = max(max_users, int(usage.usage_amount))
            elif usage.resource_type == "storage":
                max_storage = max(max_storage, float(usage.usage_amount))
            elif usage.resource_type == "transactions":
                total_transactions += int(usage.usage_amount)
        
        charges["user_charges"] = float(billing_config.per_user_fee) * max_users
        charges["storage_charges"] = float(billing_config.per_gb_storage_fee) * max_storage
        charges["transaction_charges"] = float(billing_config.per_transaction_fee) * total_transactions
        
        charges["total"] = sum([
            charges["base_fee"],
            charges["user_charges"],
            charges["storage_charges"],
            charges["transaction_charges"]
        ])
        
        return charges
    
    def create_invoice(self, company_id: int, billing_period: str = None) -> Dict:
        """Create an invoice for a company"""
        if not STRIPE_AVAILABLE:
            raise ValueError("Stripe module not available")
        
        if billing_period is None:
            billing_period = date.today().strftime("%Y-%m")
        
        billing_config = self.get_billing_configuration(company_id)
        if not billing_config or not billing_config.stripe_customer_id:
            raise ValueError("No Stripe customer found for company")
        
        charges = self.calculate_usage_charges(company_id, billing_period)
        
        try:
            # Create invoice items
            stripe.InvoiceItem.create(
                customer=billing_config.stripe_customer_id,
                amount=int(charges["total"] * 100),  # Convert to cents
                currency="usd",
                description=f"Usage charges for {billing_period}",
                metadata={
                    "company_id": str(company_id),
                    "billing_period": billing_period
                }
            )
            
            # Create invoice
            invoice = stripe.Invoice.create(
                customer=billing_config.stripe_customer_id,
                metadata={
                    "company_id": str(company_id),
                    "billing_period": billing_period
                }
            )
            
            # Finalize invoice
            stripe.Invoice.finalize_invoice(invoice.id)
            
            # Record transaction
            billing_transaction = BillingTransaction(
                company_id=company_id,
                transaction_type="charge",
                amount=charges["total"],
                currency="USD",
                description=f"Usage charges for {billing_period}",
                billing_period=billing_period,
                stripe_invoice_id=invoice.id,
                status="pending"
            )
            self.db.add(billing_transaction)
            self.db.commit()
            
            return {
                "invoice_id": invoice.id,
                "invoice_url": invoice.hosted_invoice_url,
                "amount": charges["total"],
                "status": invoice.status
            }
            
        except Exception as e:
            if STRIPE_AVAILABLE:
                logger.error(f"Error creating invoice for company {company_id}: {str(e)}")
            else:
                logger.error(f"Stripe not available for invoice creation")
            raise
    
    def handle_payment_webhook(self, event: Dict):
        """Handle Stripe webhook events"""
        try:
            if event["type"] == "payment_intent.succeeded":
                payment_intent = event["data"]["object"]
                invoice_id = payment_intent.get("invoice")
                
                if invoice_id:
                    # Update billing transaction
                    transaction = self.db.query(BillingTransaction).filter(
                        BillingTransaction.stripe_invoice_id == invoice_id
                    ).first()
                    
                    if transaction:
                        transaction.status = "paid"
                        transaction.stripe_charge_id = payment_intent["id"]
                        transaction.updated_at = datetime.utcnow()
                        self.db.commit()
                        
                        logger.info(f"Payment successful for invoice {invoice_id}")
            
            elif event["type"] == "payment_intent.payment_failed":
                payment_intent = event["data"]["object"]
                invoice_id = payment_intent.get("invoice")
                
                if invoice_id:
                    # Update billing transaction
                    transaction = self.db.query(BillingTransaction).filter(
                        BillingTransaction.stripe_invoice_id == invoice_id
                    ).first()
                    
                    if transaction:
                        transaction.status = "failed"
                        transaction.updated_at = datetime.utcnow()
                        self.db.commit()
                        
                        logger.warning(f"Payment failed for invoice {invoice_id}")
            
        except Exception as e:
            logger.error(f"Error handling webhook event: {str(e)}")
    
    def get_billing_history(self, company_id: int, limit: int = 10) -> List[Dict]:
        """Get billing history for a company"""
        transactions = self.db.query(BillingTransaction).filter(
            BillingTransaction.company_id == company_id
        ).order_by(BillingTransaction.created_at.desc()).limit(limit).all()
        
        return [
            {
                "id": t.id,
                "type": t.transaction_type,
                "amount": float(t.amount),
                "currency": t.currency,
                "description": t.description,
                "billing_period": t.billing_period,
                "status": t.status,
                "created_at": t.created_at.isoformat(),
                "stripe_invoice_id": t.stripe_invoice_id
            }
            for t in transactions
        ]
    
    def suspend_company_for_non_payment(self, company_id: int):
        """Suspend a company for non-payment"""
        company = self.db.query(models.Company).filter(models.Company.id == company_id).first()
        if company:
            company.subscription_status = "suspended"
            company.is_active = False
            self.db.commit()
            
            logger.info(f"Company {company_id} suspended for non-payment")
    
    def reactivate_company_after_payment(self, company_id: int):
        """Reactivate a company after payment"""
        company = self.db.query(models.Company).filter(models.Company.id == company_id).first()
        if company:
            company.subscription_status = "active"
            company.is_active = True
            self.db.commit()
            
            logger.info(f"Company {company_id} reactivated after payment")
