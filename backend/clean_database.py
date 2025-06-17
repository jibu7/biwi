#!/usr/bin/env python3
"""
Database cleanup script for BIWI ERP system.
This script removes all business data while preserving user credentials.

CAUTION: This will permanently delete all business data!
Only user authentication information will be preserved.
"""

import os
import sys
import asyncio
from sqlalchemy import text, create_engine, MetaData
from sqlalchemy.orm import sessionmaker
from app.config import settings

def get_database_url():
    """Get the database URL from settings or environment."""
    # Try to get from docker-compose environment first
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        # Use the default from settings
        db_url = settings.DATABASE_URL
    
    # Convert to use the docker container settings if running in docker context
    if 'localhost' in db_url:
        db_url = "postgresql://Biwi_user:Biwi_password@localhost:5432/Biwi_db"
    
    return db_url

def clean_database():
    """Clean the database, keeping only user credentials."""
    
    db_url = get_database_url()
    print(f"Connecting to database: {db_url.replace('password', '****')}")
    
    # Create engine and session
    engine = create_engine(db_url)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    # Get metadata to understand table structure
    metadata = MetaData()
    metadata.reflect(bind=engine)
    
    print("Available tables:", list(metadata.tables.keys()))
    
    with SessionLocal() as session:
        try:
            print("\n=== STARTING DATABASE CLEANUP ===\n")
            
            # Disable foreign key constraints temporarily
            session.execute(text("SET session_replication_role = replica;"))
            
            # Define tables to clean (all business data)
            # Keep: users, companies (minimal), roles (minimal), user_roles, accounting_periods (minimal)
            
            # 1. Clean Reporting Module
            reporting_tables = [
                'bank_reconciliation_items',
                'bank_reconciliations', 
                'report_schedules',
                'report_templates'
            ]
            
            # 2. Clean Order Entry Module  
            oe_tables = [
                'so_line_items',
                'sales_orders',
                'po_line_items', 
                'purchase_orders',
                'quotes',
                'quote_line_items'
            ]
            
            # 3. Clean Inventory Module
            inventory_tables = [
                'inventory_count_items',
                'inventory_count_sessions',
                'inventory_adjustments',
                'inventory_adjustment_lines', 
                'inventory_transactions',
                'inventory_item_suppliers',
                'inventory_items',
                'inventory_defaults',
                'warehouses'
                # Note: unit_of_measures removed - essential units should be preserved
            ]
            
            # 4. Clean AP Module
            ap_tables = [
                'ap_invoice_line_items',
                'ap_invoices',
                'ap_payment_line_items', 
                'ap_payments',
                'suppliers'
            ]
            
            # 5. Clean AR Module  
            ar_tables = [
                'ar_invoice_line_items',
                'ar_invoices',
                'ar_payment_line_items',
                'ar_payments', 
                'customers'
            ]
            
            # 6. Clean GL Module
            gl_tables = [
                'gl_journal_entry_lines',
                'gl_journal_entries',
                'gl_defaults',
                'gl_transaction_types',
                'gl_accounts'
            ]
            
            # 7. Clean Common/Support tables
            common_tables = [
                'tax_types',
                'currencies', 
                'branches'
            ]
            
            # Combine all tables to clean
            all_tables_to_clean = (
                reporting_tables + oe_tables + inventory_tables + 
                ap_tables + ar_tables + gl_tables + common_tables
            )
            
            # Clean each table
            tables_cleaned = 0
            for table in all_tables_to_clean:
                if table in metadata.tables:
                    try:
                        result = session.execute(text(f"DELETE FROM {table}"))
                        count = result.rowcount
                        print(f"✓ Cleaned {table}: {count} rows deleted")
                        tables_cleaned += 1
                    except Exception as e:
                        print(f"⚠ Warning cleaning {table}: {e}")
                else:
                    print(f"⚠ Table {table} not found in database")
            
            # Clean business data from core tables but keep essential structure
            print("\n=== Cleaning core tables (keeping minimal structure) ===")
            
            # Keep only the first company and remove others
            result = session.execute(text("""
                DELETE FROM companies WHERE id NOT IN (
                    SELECT id FROM companies ORDER BY id LIMIT 1
                )
            """))
            if result.rowcount > 0:
                print(f"✓ Cleaned companies: {result.rowcount} extra companies removed")
            
            # Remove user_roles but keep the structure 
            result = session.execute(text("DELETE FROM user_roles"))
            print(f"✓ Cleaned user_roles: {result.rowcount} rows deleted")
            
            # Remove extra roles, keep only admin role
            result = session.execute(text("""
                DELETE FROM roles WHERE id NOT IN (
                    SELECT id FROM roles ORDER BY id LIMIT 1  
                )
            """))
            if result.rowcount > 0:
                print(f"✓ Cleaned roles: {result.rowcount} extra roles removed")
            
            # Remove accounting periods except current/active ones
            result = session.execute(text("""
                DELETE FROM accounting_periods WHERE status != 'active'
            """))
            print(f"✓ Cleaned accounting_periods: {result.rowcount} non-active periods removed")
            
            # Re-enable foreign key constraints
            session.execute(text("SET session_replication_role = DEFAULT;"))
            
            # Commit all changes
            session.commit()
            
            print(f"\n=== CLEANUP COMPLETED ===")
            print(f"✓ {tables_cleaned} business data tables cleaned")
            print("✓ User credentials preserved")
            print("✓ Minimal company/role structure preserved")
            print("\nYour webapp is now ready for fresh testing!")
            
        except Exception as e:
            session.rollback()
            print(f"\n❌ ERROR during cleanup: {e}")
            print("Database rollback completed.")
            sys.exit(1)
            
    print("\nDatabase connection closed.")

def confirm_cleanup():
    """Ask for user confirmation before proceeding."""
    print("🚨 WARNING: This will permanently delete ALL business data!")
    print("Only user authentication information will be preserved.")
    print("Tables that will be cleaned:")
    print("  • All AR/AP transactions and master data") 
    print("  • All GL accounts and journal entries")
    print("  • All inventory items and transactions")
    print("  • All purchase/sales orders")
    print("  • All reporting data")
    print("  • All master data (customers, suppliers, etc.)")
    print("\nTables that will be preserved:")
    print("  • users (email, password, basic info)")
    print("  • companies (minimal structure)")
    print("  • roles (minimal structure)")
    print()
    
    response = input("Are you sure you want to proceed? (type 'YES' to confirm): ")
    return response.strip().upper() == 'YES'

if __name__ == "__main__":
    print("=== BIWI Database Cleanup Tool ===\n")
    
    if not confirm_cleanup():
        print("❌ Cleanup cancelled.")
        sys.exit(0)
    
    print("\n🔄 Starting cleanup process...")
    clean_database()
