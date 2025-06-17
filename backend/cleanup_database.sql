-- BIWI Database Cleanup Script
-- This SQL script removes all business data while preserving user credentials
-- 
-- CAUTION: This will permanently delete all business data!
-- Only user authentication information will be preserved.

-- Disable foreign key constraints temporarily
SET session_replication_role = replica;

-- Clean Reporting Module
DELETE FROM bank_reconciliation_items;
DELETE FROM bank_reconciliations;
DELETE FROM report_schedules;
DELETE FROM report_templates;

-- Clean Order Entry Module
DELETE FROM so_line_items;
DELETE FROM sales_orders;
DELETE FROM po_line_items;
DELETE FROM purchase_orders;
DELETE FROM quote_line_items;
DELETE FROM quotes;

-- Clean Inventory Module
DELETE FROM inventory_count_items;
DELETE FROM inventory_count_sessions;
DELETE FROM inventory_adjustment_lines;
DELETE FROM inventory_adjustments;
DELETE FROM inventory_transactions;
DELETE FROM inventory_item_suppliers;
DELETE FROM inventory_items;
DELETE FROM inventory_defaults;
DELETE FROM warehouses;
-- Note: unit_of_measures preserved - essential units should remain

-- Clean AP Module
DELETE FROM ap_invoice_line_items;
DELETE FROM ap_invoices;
DELETE FROM ap_payment_line_items;
DELETE FROM ap_payments;
DELETE FROM suppliers;

-- Clean AR Module
DELETE FROM ar_invoice_line_items;
DELETE FROM ar_invoices;
DELETE FROM ar_payment_line_items;
DELETE FROM ar_payments;
DELETE FROM customers;

-- Clean GL Module
DELETE FROM gl_journal_entry_lines;
DELETE FROM gl_journal_entries;
DELETE FROM gl_defaults;
DELETE FROM gl_transaction_types;
DELETE FROM gl_accounts;

-- Clean Common/Support tables
DELETE FROM tax_types;
DELETE FROM currencies;
DELETE FROM branches;

-- Clean business data from core tables but keep essential structure
-- Keep only the first company and remove others
DELETE FROM companies WHERE id NOT IN (
    SELECT id FROM companies ORDER BY id LIMIT 1
);

-- Remove user_roles but keep the structure 
DELETE FROM user_roles;

-- Remove extra roles, keep only admin role
DELETE FROM roles WHERE id NOT IN (
    SELECT id FROM roles ORDER BY id LIMIT 1  
);

-- Remove accounting periods except active ones
DELETE FROM accounting_periods WHERE status != 'active';

-- Re-enable foreign key constraints
SET session_replication_role = DEFAULT;

-- Display remaining data summary
SELECT 'CLEANUP COMPLETED - REMAINING DATA SUMMARY:' as status;
SELECT 'Users:' as table_name, count(*) as record_count FROM users
UNION ALL
SELECT 'Companies:', count(*) FROM companies  
UNION ALL
SELECT 'Roles:', count(*) FROM roles
UNION ALL
SELECT 'User Roles:', count(*) FROM user_roles
UNION ALL
SELECT 'Accounting Periods:', count(*) FROM accounting_periods;

SELECT 'Database is now clean and ready for fresh testing!' as message;
