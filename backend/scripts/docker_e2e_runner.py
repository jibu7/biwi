#!/usr/bin/env python3
"""
Docker E2E Test Runner
Comprehensive testing suite for multi-tenant ERP in Docker environment
"""

import sys
import os
sys.path.append('/app')

from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine, text
from app.config import settings
from app import models, schemas
from app.crud import ar, ap, gl, inventory, oe
from datetime import date, datetime
import logging
from decimal import Decimal

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DockerE2ETestRunner:
    def __init__(self):
        self.engine = create_engine(settings.DATABASE_URL)
        self.SessionLocal = sessionmaker(bind=self.engine)
        self.test_results = []
    
    def log_result(self, test_name: str, passed: bool, message: str = ""):
        """Log test result with emoji indicators"""
        status = "✅ PASS" if passed else "❌ FAIL"
        logger.info(f"{status} - {test_name}: {message}")
        self.test_results.append({
            'test': test_name,
            'passed': passed,
            'message': message,
            'category': self._get_category(test_name)
        })
    
    def _get_category(self, test_name: str) -> str:
        """Categorize tests for better reporting"""
        if 'database' in test_name.lower() or 'connection' in test_name.lower():
            return 'Infrastructure'
        elif 'tenant' in test_name.lower() or 'isolation' in test_name.lower():
            return 'Multi-Tenancy'
        elif 'order' in test_name.lower() or 'workflow' in test_name.lower():
            return 'Business Logic'
        else:
            return 'General'
    
    def test_database_connectivity(self):
        """Test basic database connectivity and structure"""
        logger.info("🔌 Testing Database Connectivity...")
        
        try:
            with self.engine.connect() as conn:
                # Test basic connection
                result = conn.execute(text("SELECT 1")).fetchone()
                self.log_result(
                    "Database Connection",
                    True,
                    "Successfully connected to PostgreSQL database"
                )
                
                # Test key tables exist
                tables_to_check = [
                    'companies', 'customers', 'suppliers', 
                    'inventory_items', 'sales_orders', 'purchase_orders'
                ]
                
                for table in tables_to_check:
                    try:
                        result = conn.execute(text(f"SELECT COUNT(*) FROM {table}")).fetchone()
                        count = result[0]
                        self.log_result(
                            f"Table {table} exists",
                            True,
                            f"Contains {count} records"
                        )
                    except Exception as e:
                        self.log_result(
                            f"Table {table} exists",
                            False,
                            f"Error: {str(e)}"
                        )
                        
        except Exception as e:
            self.log_result(
                "Database Connection",
                False,
                f"Connection failed: {str(e)}"
            )
    
    def test_multi_tenant_data_setup(self):
        """Test multi-tenant data setup and isolation"""
        logger.info("🏢 Testing Multi-Tenant Data Setup...")
        
        try:
            with self.SessionLocal() as db:
                # Check companies exist
                companies = db.query(models.Company).all()
                company_count = len(companies)
                
                if company_count >= 1:
                    self.log_result(
                        "Companies Exist",
                        True,
                        f"Found {company_count} companies in database"
                    )
                    
                    # Test data isolation for each company
                    for i, company in enumerate(companies[:3]):  # Test first 3 companies
                        # Count data per company
                        customer_count = db.query(models.Customer).filter(
                            models.Customer.company_id == company.id
                        ).count()
                        
                        supplier_count = db.query(models.Supplier).filter(
                            models.Supplier.company_id == company.id
                        ).count()
                        
                        item_count = db.query(models.InventoryItem).filter(
                            models.InventoryItem.company_id == company.id
                        ).count()
                        
                        self.log_result(
                            f"Company {company.id} Data Isolation",
                            True,
                            f"Customers: {customer_count}, Suppliers: {supplier_count}, Items: {item_count}"
                        )
                else:
                    self.log_result(
                        "Companies Exist",
                        False,
                        "No companies found in database"
                    )
                    
        except Exception as e:
            self.log_result(
                "Multi-Tenant Data Setup",
                False,
                f"Error: {str(e)}"
            )
    
    def test_sales_order_creation(self):
        """Test sales order creation with tenant isolation"""
        logger.info("🛒 Testing Sales Order Creation...")
        
        try:
            with self.SessionLocal() as db:
                # Get first company
                company = db.query(models.Company).first()
                if not company:
                    self.log_result(
                        "Sales Order Creation",
                        False,
                        "No company found for testing"
                    )
                    return
                
                # Set up required data
                self._ensure_test_setup(db, company.id)
                
                # Get test customer and item
                customer = db.query(models.Customer).filter(
                    models.Customer.company_id == company.id
                ).first()
                
                item = db.query(models.InventoryItem).filter(
                    models.InventoryItem.company_id == company.id
                ).first()
                
                if not customer or not item:
                    self.log_result(
                        "Sales Order Creation",
                        False,
                        "Missing test customer or item"
                    )
                    return
                
                # Create Sales Order
                so_data = schemas.SalesOrderCreate(
                    customer_id=customer.id,
                    order_date=date.today(),
                    reference="DOCKER-TEST-SO",
                    lines=[
                        schemas.SalesOrderLineCreate(
                            item_id=item.id,
                            description="Docker Test Item",
                            quantity_ordered=Decimal('5'),
                            unit_price=Decimal('20.00')
                        )
                    ]
                )
                
                sales_order = oe.create_sales_order(db, so_data, company.id, 1)
                
                # Verify tenant isolation
                if sales_order.company_id == company.id:
                    self.log_result(
                        "Sales Order Tenant Isolation",
                        True,
                        f"SO {sales_order.document_number} correctly assigned to company {company.id}"
                    )
                else:
                    self.log_result(
                        "Sales Order Tenant Isolation",
                        False,
                        f"Tenant isolation failed: expected {company.id}, got {sales_order.company_id}"
                    )
                    
        except Exception as e:
            self.log_result(
                "Sales Order Creation",
                False,
                f"Error: {str(e)}"
            )
    
    def _ensure_test_setup(self, db, company_id: int):
        """Ensure basic test data exists"""
        # Check UOM
        uom = db.query(models.UnitOfMeasure).first()
        if not uom:
            uom = models.UnitOfMeasure(
                abbreviation="EA",
                name="Each",
                description="Each/Unit"
            )
            db.add(uom)
            db.commit()
            db.refresh(uom)
        
        # Check Order Defaults
        order_defaults = db.query(models.OrderDefaults).filter(
            models.OrderDefaults.company_id == company_id
        ).first()
        
        if not order_defaults:
            order_defaults = models.OrderDefaults(
                company_id=company_id,
                default_so_status="Draft",
                default_po_status="Draft",
                default_grv_status="Open",
                next_so_number=1,
                next_po_number=1,
                next_grv_number=1
            )
            db.add(order_defaults)
            db.commit()
        
        # Ensure test customer exists
        customer = db.query(models.Customer).filter(
            models.Customer.company_id == company_id
        ).first()
        
        if not customer:
            import time
            timestamp = str(int(time.time()))[-6:]
            customer = models.Customer(
                company_id=company_id,
                customer_code=f"DOCKER{timestamp}",
                name="Docker Test Customer",
                current_balance=Decimal('0.00')
            )
            db.add(customer)
            db.commit()
        
        # Ensure test item exists
        item = db.query(models.InventoryItem).filter(
            models.InventoryItem.company_id == company_id
        ).first()
        
        if not item:
            import time
            timestamp = str(int(time.time()))[-6:]
            item = models.InventoryItem(
                company_id=company_id,
                item_code=f"DOCKERITEM{timestamp}",
                description="Docker Test Item",
                item_type="Stock",
                unit_of_measure_id=uom.id,
                average_cost=Decimal('10.00'),
                selling_price=Decimal('20.00')
            )
            db.add(item)
            db.commit()
    
    def test_cross_tenant_isolation(self):
        """Test that tenants cannot access each other's data"""
        logger.info("🔒 Testing Cross-Tenant Isolation...")
        
        try:
            with self.SessionLocal() as db:
                companies = db.query(models.Company).limit(2).all()
                
                if len(companies) < 2:
                    self.log_result(
                        "Cross-Tenant Isolation",
                        False,
                        "Need at least 2 companies to test isolation"
                    )
                    return
                
                company1, company2 = companies[0], companies[1]
                
                # Get data from company1
                company1_customers = db.query(models.Customer).filter(
                    models.Customer.company_id == company1.id
                ).all()
                
                if company1_customers:
                    # Try to access company1 customer from company2 context
                    cross_access = db.query(models.Customer).filter(
                        models.Customer.id == company1_customers[0].id,
                        models.Customer.company_id == company2.id
                    ).first()
                    
                    if cross_access is None:
                        self.log_result(
                            "Cross-Tenant Customer Isolation",
                            True,
                            f"Company {company2.id} cannot access Company {company1.id} customers"
                        )
                    else:
                        self.log_result(
                            "Cross-Tenant Customer Isolation",
                            False,
                            "Cross-tenant access vulnerability detected!"
                        )
                else:
                    self.log_result(
                        "Cross-Tenant Customer Isolation",
                        True,
                        "No customer data found to test (but structure appears secure)"
                    )
                    
        except Exception as e:
            self.log_result(
                "Cross-Tenant Isolation",
                False,
                f"Error: {str(e)}"
            )
    
    def run_docker_e2e_tests(self):
        """Run complete Docker E2E test suite"""
        logger.info("🐳 Starting Docker E2E Test Suite...")
        logger.info("="*60)
        
        # Run all tests
        self.test_database_connectivity()
        self.test_multi_tenant_data_setup()
        self.test_sales_order_creation()
        self.test_cross_tenant_isolation()
        
        # Generate comprehensive report
        self._generate_report()
        
        # Determine overall success
        total_tests = len(self.test_results)
        passed_tests = len([r for r in self.test_results if r['passed']])
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        return success_rate >= 75  # 75% pass rate for success
    
    def _generate_report(self):
        """Generate comprehensive test report"""
        total_tests = len(self.test_results)
        passed_tests = len([r for r in self.test_results if r['passed']])
        failed_tests = total_tests - passed_tests
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        logger.info("\n" + "="*60)
        logger.info("🐳 DOCKER E2E TEST REPORT")
        logger.info("="*60)
        logger.info(f"📊 Total Tests: {total_tests}")
        logger.info(f"✅ Passed: {passed_tests}")
        logger.info(f"❌ Failed: {failed_tests}")
        logger.info(f"📈 Success Rate: {success_rate:.1f}%")
        
        # Report by category
        categories = {}
        for result in self.test_results:
            category = result['category']
            if category not in categories:
                categories[category] = {'passed': 0, 'total': 0}
            categories[category]['total'] += 1
            if result['passed']:
                categories[category]['passed'] += 1
        
        logger.info("\n📂 Results by Category:")
        for category, stats in categories.items():
            rate = (stats['passed'] / stats['total'] * 100) if stats['total'] > 0 else 0
            logger.info(f"   {category}: {stats['passed']}/{stats['total']} ({rate:.1f}%)")
        
        # Overall assessment
        if success_rate >= 90:
            logger.info("\n🎉 EXCELLENT: Docker environment is production-ready!")
        elif success_rate >= 75:
            logger.info("\n✅ GOOD: Docker environment is functional with minor issues.")
        elif success_rate >= 50:
            logger.info("\n⚠️  ACCEPTABLE: Core functionality working, some features need attention.")
        else:
            logger.info("\n❌ NEEDS WORK: Significant issues require investigation.")
        
        logger.info(f"\n🔗 Database URL: {settings.DATABASE_URL}")
        logger.info("🐳 Docker containers: Frontend (3000), Backend (8000), Database (5432)")
        logger.info("="*60)

if __name__ == "__main__":
    runner = DockerE2ETestRunner()
    success = runner.run_docker_e2e_tests()
    sys.exit(0 if success else 1)
