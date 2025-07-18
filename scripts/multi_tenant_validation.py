#!/usr/bin/env python3
"""
Multi-Tenant Data Validation Script
Validates data integrity and tenant isolation across all modules
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.config import settings
from app import models
from datetime import datetime
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MultiTenantValidator:
    def __init__(self):
        self.engine = create_engine(settings.DATABASE_URL)
        self.SessionLocal = sessionmaker(bind=self.engine)
        self.validation_results = []
        
    def log_result(self, test_name: str, passed: bool, message: str = ""):
        """Log validation result"""
        status = "✅ PASS" if passed else "❌ FAIL"
        logger.info(f"{status} - {test_name}: {message}")
        self.validation_results.append({
            'test': test_name,
            'passed': passed,
            'message': message,
            'timestamp': datetime.now()
        })
    
    def validate_core_models(self):
        """Validate core system tenant isolation"""
        logger.info("🧪 Validating Core Models...")
        
        with self.SessionLocal() as db:
            # Test 1: All companies have unique names
            duplicate_companies = db.execute(text("""
                SELECT name, COUNT(*) as count 
                FROM companies 
                GROUP BY name 
                HAVING COUNT(*) > 1
            """)).fetchall()
            
            self.log_result(
                "Core: Unique Company Names",
                len(duplicate_companies) == 0,
                f"Found {len(duplicate_companies)} duplicate company names" if duplicate_companies else "All company names are unique"
            )
            
            # Test 2: All users belong to existing companies
            orphaned_users = db.execute(text("""
                SELECT u.id, u.email 
                FROM users u 
                LEFT JOIN companies c ON u.company_id = c.id 
                WHERE c.id IS NULL
            """)).fetchall()
            
            self.log_result(
                "Core: User-Company Integrity",
                len(orphaned_users) == 0,
                f"Found {len(orphaned_users)} orphaned users" if orphaned_users else "All users belong to valid companies"
            )
            
            # Test 3: Roles are scoped to companies
            cross_company_roles = db.execute(text("""
                SELECT ur.user_id, ur.role_id, u.company_id as user_company, r.company_id as role_company
                FROM user_roles ur
                JOIN users u ON ur.user_id = u.id
                JOIN roles r ON ur.role_id = r.id
                WHERE u.company_id != r.company_id
            """)).fetchall()
            
            self.log_result(
                "Core: Role-Company Isolation",
                len(cross_company_roles) == 0,
                f"Found {len(cross_company_roles)} cross-company role assignments" if cross_company_roles else "All role assignments respect company boundaries"
            )
    
    def validate_gl_models(self):
        """Validate General Ledger tenant isolation"""
        logger.info("🧪 Validating GL Models...")
        
        with self.SessionLocal() as db:
            # Test 1: GL Account codes are unique per company
            duplicate_gl_accounts = db.execute(text("""
                SELECT account_code, company_id, COUNT(*) as count
                FROM gl_accounts
                GROUP BY account_code, company_id
                HAVING COUNT(*) > 1
            """)).fetchall()
            
            self.log_result(
                "GL: Unique Account Codes per Company",
                len(duplicate_gl_accounts) == 0,
                f"Found {len(duplicate_gl_accounts)} duplicate GL account codes" if duplicate_gl_accounts else "All GL account codes are unique per company"
            )
            
            # Test 2: Journal Entry Lines reference accounts from same company
            cross_company_je_lines = db.execute(text("""
                SELECT jel.id, je.company_id as je_company, ga.company_id as account_company
                FROM gl_journal_entry_lines jel
                JOIN gl_journal_entries je ON jel.journal_entry_id = je.id
                JOIN gl_accounts ga ON jel.gl_account_id = ga.id
                WHERE je.company_id != ga.company_id
            """)).fetchall()
            
            self.log_result(
                "GL: Journal Entry Cross-Company Validation",
                len(cross_company_je_lines) == 0,
                f"Found {len(cross_company_je_lines)} cross-company JE lines" if cross_company_je_lines else "All JE lines reference accounts from same company"
            )
            
            # Test 3: GL Account balances are isolated per company
            companies = db.execute(text("SELECT id FROM companies")).fetchall()
            for company in companies:
                company_id = company[0]
                trial_balance = db.execute(text("""
                    SELECT SUM(current_balance) as total_balance
                    FROM gl_accounts
                    WHERE company_id = :company_id
                """), {'company_id': company_id}).fetchone()
                
                # Trial balance should be calculable (not necessarily zero due to rounding)
                balance_exists = trial_balance[0] is not None
                self.log_result(
                    f"GL: Company {company_id} Trial Balance Calculation",
                    balance_exists,
                    f"Trial balance: {trial_balance[0] or 0}" if balance_exists else "Could not calculate trial balance"
                )
    
    def validate_ar_models(self):
        """Validate Accounts Receivable tenant isolation"""
        logger.info("🧪 Validating AR Models...")
        
        with self.SessionLocal() as db:
            # Test 1: Customer codes are unique per company
            duplicate_customers = db.execute(text("""
                SELECT customer_code, company_id, COUNT(*) as count
                FROM customers
                GROUP BY customer_code, company_id
                HAVING COUNT(*) > 1
            """)).fetchall()
            
            self.log_result(
                "AR: Unique Customer Codes per Company",
                len(duplicate_customers) == 0,
                f"Found {len(duplicate_customers)} duplicate customer codes" if duplicate_customers else "All customer codes are unique per company"
            )
            
            # Test 2: AR Transactions reference customers from same company
            cross_company_ar_trans = db.execute(text("""
                SELECT art.id, art.company_id as trans_company, c.company_id as customer_company
                FROM ar_transactions art
                JOIN customers c ON art.customer_id = c.id
                WHERE art.company_id != c.company_id
            """)).fetchall()
            
            self.log_result(
                "AR: Transaction-Customer Company Validation",
                len(cross_company_ar_trans) == 0,
                f"Found {len(cross_company_ar_trans)} cross-company AR transactions" if cross_company_ar_trans else "All AR transactions reference customers from same company"
            )
            
            # Test 3: AR Allocations are within same company
            cross_company_ar_alloc = db.execute(text("""
                SELECT aa.id, aa.company_id, c.company_id as customer_company
                FROM ar_allocations aa
                JOIN customers c ON aa.customer_id = c.id
                WHERE aa.company_id != c.company_id
            """)).fetchall()
            
            self.log_result(
                "AR: Allocation Company Isolation",
                len(cross_company_ar_alloc) == 0,
                f"Found {len(cross_company_ar_alloc)} cross-company AR allocations" if cross_company_ar_alloc else "All AR allocations are company-isolated"
            )
    
    def validate_ap_models(self):
        """Validate Accounts Payable tenant isolation"""
        logger.info("🧪 Validating AP Models...")
        
        with self.SessionLocal() as db:
            # Test 1: Supplier codes are unique per company
            duplicate_suppliers = db.execute(text("""
                SELECT supplier_code, company_id, COUNT(*) as count
                FROM suppliers
                GROUP BY supplier_code, company_id
                HAVING COUNT(*) > 1
            """)).fetchall()
            
            self.log_result(
                "AP: Unique Supplier Codes per Company",
                len(duplicate_suppliers) == 0,
                f"Found {len(duplicate_suppliers)} duplicate supplier codes" if duplicate_suppliers else "All supplier codes are unique per company"
            )
            
            # Test 2: AP Transactions reference suppliers from same company
            cross_company_ap_trans = db.execute(text("""
                SELECT apt.id, apt.company_id as trans_company, s.company_id as supplier_company
                FROM ap_transactions apt
                JOIN suppliers s ON apt.supplier_id = s.id
                WHERE apt.company_id != s.company_id
            """)).fetchall()
            
            self.log_result(
                "AP: Transaction-Supplier Company Validation",
                len(cross_company_ap_trans) == 0,
                f"Found {len(cross_company_ap_trans)} cross-company AP transactions" if cross_company_ap_trans else "All AP transactions reference suppliers from same company"
            )
    
    def validate_inventory_models(self):
        """Validate Inventory Management tenant isolation"""
        logger.info("🧪 Validating Inventory Models...")
        
        with self.SessionLocal() as db:
            # Test 1: Item codes are unique per company
            duplicate_items = db.execute(text("""
                SELECT item_code, company_id, COUNT(*) as count
                FROM inventory_items
                GROUP BY item_code, company_id
                HAVING COUNT(*) > 1
            """)).fetchall()
            
            self.log_result(
                "Inventory: Unique Item Codes per Company",
                len(duplicate_items) == 0,
                f"Found {len(duplicate_items)} duplicate item codes" if duplicate_items else "All item codes are unique per company"
            )
            
            # Test 2: Item locations reference items and warehouses from same company
            cross_company_item_locations = db.execute(text("""
                SELECT il.id, il.company_id, i.company_id as item_company, w.company_id as warehouse_company
                FROM inventory_item_locations il
                JOIN inventory_items i ON il.item_id = i.id
                JOIN warehouses w ON il.warehouse_id = w.id
                WHERE il.company_id != i.company_id OR il.company_id != w.company_id
            """)).fetchall()
            
            self.log_result(
                "Inventory: Item Location Company Consistency",
                len(cross_company_item_locations) == 0,
                f"Found {len(cross_company_item_locations)} cross-company item locations" if cross_company_item_locations else "All item locations are company-consistent"
            )
            
            # Test 3: Inventory transactions are company-isolated
            cross_company_inv_trans = db.execute(text("""
                SELECT it.id, it.company_id, i.company_id as item_company, w.company_id as warehouse_company
                FROM inventory_transactions it
                JOIN inventory_items i ON it.item_id = i.id
                JOIN warehouses w ON it.warehouse_id = w.id
                WHERE it.company_id != i.company_id OR it.company_id != w.company_id
            """)).fetchall()
            
            self.log_result(
                "Inventory: Transaction Company Isolation",
                len(cross_company_inv_trans) == 0,
                f"Found {len(cross_company_inv_trans)} cross-company inventory transactions" if cross_company_inv_trans else "All inventory transactions are company-isolated"
            )
    
    def validate_oe_models(self):
        """Validate Order Entry tenant isolation"""
        logger.info("🧪 Validating Order Entry Models...")
        
        with self.SessionLocal() as db:
            # Test 1: Sales Order document numbers are unique per company
            duplicate_so_numbers = db.execute(text("""
                SELECT document_number, company_id, COUNT(*) as count
                FROM sales_orders
                GROUP BY document_number, company_id
                HAVING COUNT(*) > 1
            """)).fetchall()
            
            self.log_result(
                "OE: Unique SO Document Numbers per Company",
                len(duplicate_so_numbers) == 0,
                f"Found {len(duplicate_so_numbers)} duplicate SO document numbers" if duplicate_so_numbers else "All SO document numbers are unique per company"
            )
            
            # Test 2: Sales Orders reference customers from same company
            cross_company_so = db.execute(text("""
                SELECT so.id, so.company_id as so_company, c.company_id as customer_company
                FROM sales_orders so
                JOIN customers c ON so.customer_id = c.id
                WHERE so.company_id != c.company_id
            """)).fetchall()
            
            self.log_result(
                "OE: Sales Order-Customer Company Validation",
                len(cross_company_so) == 0,
                f"Found {len(cross_company_so)} cross-company sales orders" if cross_company_so else "All sales orders reference customers from same company"
            )
            
            # Test 3: Purchase Orders reference suppliers from same company
            cross_company_po = db.execute(text("""
                SELECT po.id, po.company_id as po_company, s.company_id as supplier_company
                FROM purchase_orders po
                JOIN suppliers s ON po.supplier_id = s.id
                WHERE po.company_id != s.company_id
            """)).fetchall()
            
            self.log_result(
                "OE: Purchase Order-Supplier Company Validation",
                len(cross_company_po) == 0,
                f"Found {len(cross_company_po)} cross-company purchase orders" if cross_company_po else "All purchase orders reference suppliers from same company"
            )
            
            # Test 4: GRVs reference suppliers and POs from same company
            cross_company_grv = db.execute(text("""
                SELECT grv.id, grv.company_id as grv_company, s.company_id as supplier_company, po.company_id as po_company
                FROM goods_received_vouchers grv
                JOIN suppliers s ON grv.supplier_id = s.id
                LEFT JOIN purchase_orders po ON grv.purchase_order_id = po.id
                WHERE grv.company_id != s.company_id 
                   OR (po.id IS NOT NULL AND grv.company_id != po.company_id)
            """)).fetchall()
            
            self.log_result(
                "OE: GRV Company Consistency",
                len(cross_company_grv) == 0,
                f"Found {len(cross_company_grv)} cross-company GRVs" if cross_company_grv else "All GRVs are company-consistent"
            )
    
    def validate_cross_module_integrity(self):
        """Validate cross-module references maintain tenant isolation"""
        logger.info("🧪 Validating Cross-Module Integrity...")
        
        with self.SessionLocal() as db:
            # Test 1: AR Transactions linked to GL Journal Entries are same company
            ar_gl_cross_company = db.execute(text("""
                SELECT art.id, art.company_id as ar_company, je.company_id as gl_company
                FROM ar_transactions art
                JOIN gl_journal_entries je ON art.linked_gl_journal_entry_id = je.id
                WHERE art.company_id != je.company_id
            """)).fetchall()
            
            self.log_result(
                "Cross-Module: AR-GL Company Consistency",
                len(ar_gl_cross_company) == 0,
                f"Found {len(ar_gl_cross_company)} AR-GL cross-company links" if ar_gl_cross_company else "All AR-GL links are company-consistent"
            )
            
            # Test 2: AP Transactions linked to GL Journal Entries are same company
            ap_gl_cross_company = db.execute(text("""
                SELECT apt.id, apt.company_id as ap_company, je.company_id as gl_company
                FROM ap_transactions apt
                JOIN gl_journal_entries je ON apt.linked_gl_journal_entry_id = je.id
                WHERE apt.company_id != je.company_id
            """)).fetchall()
            
            self.log_result(
                "Cross-Module: AP-GL Company Consistency",
                len(ap_gl_cross_company) == 0,
                f"Found {len(ap_gl_cross_company)} AP-GL cross-company links" if ap_gl_cross_company else "All AP-GL links are company-consistent"
            )
            
            # Test 3: Inventory Transactions linked to GL Journal Entries are same company
            inv_gl_cross_company = db.execute(text("""
                SELECT it.id, it.company_id as inv_company, je.company_id as gl_company
                FROM inventory_transactions it
                JOIN gl_journal_entries je ON it.linked_gl_journal_entry_id = je.id
                WHERE it.company_id != je.company_id
            """)).fetchall()
            
            self.log_result(
                "Cross-Module: Inventory-GL Company Consistency",
                len(inv_gl_cross_company) == 0,
                f"Found {len(inv_gl_cross_company)} Inventory-GL cross-company links" if inv_gl_cross_company else "All Inventory-GL links are company-consistent"
            )
            
            # Test 4: Sales Orders linked to AR Invoices are same company
            so_ar_cross_company = db.execute(text("""
                SELECT so.id, so.company_id as so_company, art.company_id as ar_company
                FROM sales_orders so
                JOIN ar_transactions art ON so.ar_invoice_id = art.id
                WHERE so.company_id != art.company_id
            """)).fetchall()
            
            self.log_result(
                "Cross-Module: SO-AR Company Consistency",
                len(so_ar_cross_company) == 0,
                f"Found {len(so_ar_cross_company)} SO-AR cross-company links" if so_ar_cross_company else "All SO-AR links are company-consistent"
            )
    
    def run_all_validations(self):
        """Run all validation tests"""
        logger.info("🚀 Starting Multi-Tenant Validation...")
        
        self.validate_core_models()
        self.validate_gl_models()
        self.validate_ar_models()
        self.validate_ap_models()
        self.validate_inventory_models()
        self.validate_oe_models()
        self.validate_cross_module_integrity()
        
        # Summary
        total_tests = len(self.validation_results)
        passed_tests = len([r for r in self.validation_results if r['passed']])
        failed_tests = total_tests - passed_tests
        
        logger.info("\n" + "="*80)
        logger.info("🏁 VALIDATION SUMMARY")
        logger.info("="*80)
        logger.info(f"Total Tests: {total_tests}")
        logger.info(f"✅ Passed: {passed_tests}")
        logger.info(f"❌ Failed: {failed_tests}")
        logger.info(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            logger.error("\n❌ FAILED TESTS:")
            for result in self.validation_results:
                if not result['passed']:
                    logger.error(f"  - {result['test']}: {result['message']}")
            return False
        else:
            logger.info("\n🎉 ALL TESTS PASSED! Multi-tenant isolation is properly implemented.")
            return True

if __name__ == "__main__":
    validator = MultiTenantValidator()
    success = validator.run_all_validations()
    sys.exit(0 if success else 1)
