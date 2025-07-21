--
-- PostgreSQL database dump
--

-- Dumped from database version 15.12 (Debian 15.12-1.pgdg120+1)
-- Dumped by pg_dump version 15.12 (Debian 15.12-1.pgdg120+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.warehouses DROP CONSTRAINT IF EXISTS warehouses_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.user_roles DROP CONSTRAINT IF EXISTS user_roles_role_id_fkey;
ALTER TABLE IF EXISTS ONLY public.usage_metrics DROP CONSTRAINT IF EXISTS usage_metrics_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.usage_alerts DROP CONSTRAINT IF EXISTS usage_alerts_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.unit_of_measures DROP CONSTRAINT IF EXISTS unit_of_measures_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.tills DROP CONSTRAINT IF EXISTS tills_default_warehouse_id_fkey;
ALTER TABLE IF EXISTS ONLY public.tills DROP CONSTRAINT IF EXISTS tills_default_cashier_id_fkey;
ALTER TABLE IF EXISTS ONLY public.tills DROP CONSTRAINT IF EXISTS tills_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.tills DROP CONSTRAINT IF EXISTS tills_cash_gl_account_id_fkey;
ALTER TABLE IF EXISTS ONLY public.tax_types DROP CONSTRAINT IF EXISTS tax_types_tax_authority_gl_account_id_fkey;
ALTER TABLE IF EXISTS ONLY public.tax_types DROP CONSTRAINT IF EXISTS tax_types_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.system_configurations DROP CONSTRAINT IF EXISTS system_configurations_updated_by_admin_id_fkey;
ALTER TABLE IF EXISTS ONLY public.suppliers DROP CONSTRAINT IF EXISTS suppliers_default_currency_id_fkey;
ALTER TABLE IF EXISTS ONLY public.suppliers DROP CONSTRAINT IF EXISTS suppliers_default_ap_gl_account_id_fkey;
ALTER TABLE IF EXISTS ONLY public.suppliers DROP CONSTRAINT IF EXISTS suppliers_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.sales_representatives DROP CONSTRAINT IF EXISTS sales_representatives_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.sales_orders DROP CONSTRAINT IF EXISTS sales_orders_sales_representative_id_fkey;
ALTER TABLE IF EXISTS ONLY public.sales_orders DROP CONSTRAINT IF EXISTS sales_orders_customer_id_fkey;
ALTER TABLE IF EXISTS ONLY public.sales_orders DROP CONSTRAINT IF EXISTS sales_orders_currency_id_fkey;
ALTER TABLE IF EXISTS ONLY public.sales_orders DROP CONSTRAINT IF EXISTS sales_orders_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.sales_orders DROP CONSTRAINT IF EXISTS sales_orders_ar_invoice_id_fkey;
ALTER TABLE IF EXISTS ONLY public.sales_order_lines DROP CONSTRAINT IF EXISTS sales_order_lines_tax_type_id_fkey;
ALTER TABLE IF EXISTS ONLY public.sales_order_lines DROP CONSTRAINT IF EXISTS sales_order_lines_sales_order_id_fkey;
ALTER TABLE IF EXISTS ONLY public.sales_order_lines DROP CONSTRAINT IF EXISTS sales_order_lines_item_id_fkey;
ALTER TABLE IF EXISTS ONLY public.roles DROP CONSTRAINT IF EXISTS roles_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.resource_usage DROP CONSTRAINT IF EXISTS resource_usage_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.report_templates DROP CONSTRAINT IF EXISTS report_templates_created_by_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.report_templates DROP CONSTRAINT IF EXISTS report_templates_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.report_schedules DROP CONSTRAINT IF EXISTS report_schedules_report_template_id_fkey;
ALTER TABLE IF EXISTS ONLY public.report_schedules DROP CONSTRAINT IF EXISTS report_schedules_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.purchase_orders DROP CONSTRAINT IF EXISTS purchase_orders_supplier_id_fkey;
ALTER TABLE IF EXISTS ONLY public.purchase_orders DROP CONSTRAINT IF EXISTS purchase_orders_delivery_address_warehouse_id_fkey;
ALTER TABLE IF EXISTS ONLY public.purchase_orders DROP CONSTRAINT IF EXISTS purchase_orders_currency_id_fkey;
ALTER TABLE IF EXISTS ONLY public.purchase_orders DROP CONSTRAINT IF EXISTS purchase_orders_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.purchase_order_lines DROP CONSTRAINT IF EXISTS purchase_order_lines_tax_type_id_fkey;
ALTER TABLE IF EXISTS ONLY public.purchase_order_lines DROP CONSTRAINT IF EXISTS purchase_order_lines_purchase_order_id_fkey;
ALTER TABLE IF EXISTS ONLY public.purchase_order_lines DROP CONSTRAINT IF EXISTS purchase_order_lines_item_id_fkey;
ALTER TABLE IF EXISTS ONLY public.pos_transactions DROP CONSTRAINT IF EXISTS pos_transactions_transaction_type_id_fkey;
ALTER TABLE IF EXISTS ONLY public.pos_transactions DROP CONSTRAINT IF EXISTS pos_transactions_session_id_fkey;
ALTER TABLE IF EXISTS ONLY public.pos_transactions DROP CONSTRAINT IF EXISTS pos_transactions_reference_transaction_id_fkey;
ALTER TABLE IF EXISTS ONLY public.pos_transactions DROP CONSTRAINT IF EXISTS pos_transactions_linked_gl_journal_entry_id_fkey;
ALTER TABLE IF EXISTS ONLY public.pos_transactions DROP CONSTRAINT IF EXISTS pos_transactions_linked_ar_transaction_id_fkey;
ALTER TABLE IF EXISTS ONLY public.pos_transactions DROP CONSTRAINT IF EXISTS pos_transactions_customer_id_fkey;
ALTER TABLE IF EXISTS ONLY public.pos_transactions DROP CONSTRAINT IF EXISTS pos_transactions_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.pos_transaction_types DROP CONSTRAINT IF EXISTS pos_transaction_types_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.pos_transaction_lines DROP CONSTRAINT IF EXISTS pos_transaction_lines_transaction_id_fkey;
ALTER TABLE IF EXISTS ONLY public.pos_transaction_lines DROP CONSTRAINT IF EXISTS pos_transaction_lines_tax_type_id_fkey;
ALTER TABLE IF EXISTS ONLY public.pos_transaction_lines DROP CONSTRAINT IF EXISTS pos_transaction_lines_item_id_fkey;
ALTER TABLE IF EXISTS ONLY public.pos_sessions DROP CONSTRAINT IF EXISTS pos_sessions_till_id_fkey;
ALTER TABLE IF EXISTS ONLY public.pos_sessions DROP CONSTRAINT IF EXISTS pos_sessions_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.pos_sessions DROP CONSTRAINT IF EXISTS pos_sessions_cashier_id_fkey;
ALTER TABLE IF EXISTS ONLY public.pos_defaults DROP CONSTRAINT IF EXISTS pos_defaults_default_tax_type_id_fkey;
ALTER TABLE IF EXISTS ONLY public.pos_defaults DROP CONSTRAINT IF EXISTS pos_defaults_default_sale_transaction_type_id_fkey;
ALTER TABLE IF EXISTS ONLY public.pos_defaults DROP CONSTRAINT IF EXISTS pos_defaults_default_return_transaction_type_id_fkey;
ALTER TABLE IF EXISTS ONLY public.pos_defaults DROP CONSTRAINT IF EXISTS pos_defaults_default_customer_id_fkey;
ALTER TABLE IF EXISTS ONLY public.pos_defaults DROP CONSTRAINT IF EXISTS pos_defaults_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.pos_cash_movements DROP CONSTRAINT IF EXISTS pos_cash_movements_session_id_fkey;
ALTER TABLE IF EXISTS ONLY public.pos_cash_movements DROP CONSTRAINT IF EXISTS pos_cash_movements_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.pos_cash_movements DROP CONSTRAINT IF EXISTS pos_cash_movements_authorized_by_id_fkey;
ALTER TABLE IF EXISTS ONLY public.platform_invoices DROP CONSTRAINT IF EXISTS platform_invoices_subscription_id_fkey;
ALTER TABLE IF EXISTS ONLY public.platform_invoices DROP CONSTRAINT IF EXISTS platform_invoices_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.platform_audit_logs DROP CONSTRAINT IF EXISTS platform_audit_logs_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.platform_audit_logs DROP CONSTRAINT IF EXISTS platform_audit_logs_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.order_defaults DROP CONSTRAINT IF EXISTS order_defaults_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.manufacturing_orders DROP CONSTRAINT IF EXISTS manufacturing_orders_warehouse_id_fkey;
ALTER TABLE IF EXISTS ONLY public.manufacturing_orders DROP CONSTRAINT IF EXISTS manufacturing_orders_linked_gl_journal_entry_id_fkey;
ALTER TABLE IF EXISTS ONLY public.manufacturing_orders DROP CONSTRAINT IF EXISTS manufacturing_orders_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.manufacturing_orders DROP CONSTRAINT IF EXISTS manufacturing_orders_bom_header_id_fkey;
ALTER TABLE IF EXISTS ONLY public.manufacturing_order_components DROP CONSTRAINT IF EXISTS manufacturing_order_components_manufacturing_order_id_fkey;
ALTER TABLE IF EXISTS ONLY public.manufacturing_order_components DROP CONSTRAINT IF EXISTS manufacturing_order_components_component_item_id_fkey;
ALTER TABLE IF EXISTS ONLY public.item_barcodes DROP CONSTRAINT IF EXISTS item_barcodes_unit_of_measure_id_fkey;
ALTER TABLE IF EXISTS ONLY public.item_barcodes DROP CONSTRAINT IF EXISTS item_barcodes_item_id_fkey;
ALTER TABLE IF EXISTS ONLY public.item_barcodes DROP CONSTRAINT IF EXISTS item_barcodes_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.inventory_transactions DROP CONSTRAINT IF EXISTS inventory_transactions_warehouse_id_fkey;
ALTER TABLE IF EXISTS ONLY public.inventory_transactions DROP CONSTRAINT IF EXISTS inventory_transactions_linked_gl_journal_entry_id_fkey;
ALTER TABLE IF EXISTS ONLY public.inventory_transactions DROP CONSTRAINT IF EXISTS inventory_transactions_item_id_fkey;
ALTER TABLE IF EXISTS ONLY public.inventory_transactions DROP CONSTRAINT IF EXISTS inventory_transactions_inventory_transaction_type_id_fkey;
ALTER TABLE IF EXISTS ONLY public.inventory_transactions DROP CONSTRAINT IF EXISTS inventory_transactions_currency_id_fkey;
ALTER TABLE IF EXISTS ONLY public.inventory_transactions DROP CONSTRAINT IF EXISTS inventory_transactions_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.inventory_transaction_types DROP CONSTRAINT IF EXISTS inventory_transaction_types_default_offsetting_gl_account__fkey;
ALTER TABLE IF EXISTS ONLY public.inventory_transaction_types DROP CONSTRAINT IF EXISTS inventory_transaction_types_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.inventory_items DROP CONSTRAINT IF EXISTS inventory_items_unit_of_measure_id_fkey;
ALTER TABLE IF EXISTS ONLY public.inventory_items DROP CONSTRAINT IF EXISTS inventory_items_default_sales_tax_type_id_fkey;
ALTER TABLE IF EXISTS ONLY public.inventory_items DROP CONSTRAINT IF EXISTS inventory_items_default_sales_gl_account_id_fkey;
ALTER TABLE IF EXISTS ONLY public.inventory_items DROP CONSTRAINT IF EXISTS inventory_items_default_purchase_tax_type_id_fkey;
ALTER TABLE IF EXISTS ONLY public.inventory_items DROP CONSTRAINT IF EXISTS inventory_items_default_inventory_gl_account_id_fkey;
ALTER TABLE IF EXISTS ONLY public.inventory_items DROP CONSTRAINT IF EXISTS inventory_items_default_cogs_gl_account_id_fkey;
ALTER TABLE IF EXISTS ONLY public.inventory_items DROP CONSTRAINT IF EXISTS inventory_items_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.inventory_item_locations DROP CONSTRAINT IF EXISTS inventory_item_locations_warehouse_id_fkey;
ALTER TABLE IF EXISTS ONLY public.inventory_item_locations DROP CONSTRAINT IF EXISTS inventory_item_locations_item_id_fkey;
ALTER TABLE IF EXISTS ONLY public.inventory_item_locations DROP CONSTRAINT IF EXISTS inventory_item_locations_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.inventory_defaults DROP CONSTRAINT IF EXISTS inventory_defaults_default_warehouse_id_fkey;
ALTER TABLE IF EXISTS ONLY public.inventory_defaults DROP CONSTRAINT IF EXISTS inventory_defaults_default_sales_revenue_gl_account_id_fkey;
ALTER TABLE IF EXISTS ONLY public.inventory_defaults DROP CONSTRAINT IF EXISTS inventory_defaults_default_inventory_gl_account_id_fkey;
ALTER TABLE IF EXISTS ONLY public.inventory_defaults DROP CONSTRAINT IF EXISTS inventory_defaults_default_inventory_adjustment_gl_account_fkey;
ALTER TABLE IF EXISTS ONLY public.inventory_defaults DROP CONSTRAINT IF EXISTS inventory_defaults_default_cogs_gl_account_id_fkey;
ALTER TABLE IF EXISTS ONLY public.inventory_defaults DROP CONSTRAINT IF EXISTS inventory_defaults_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.inventory_count_sessions DROP CONSTRAINT IF EXISTS inventory_count_sessions_warehouse_id_fkey;
ALTER TABLE IF EXISTS ONLY public.inventory_count_sessions DROP CONSTRAINT IF EXISTS inventory_count_sessions_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.inventory_count_lines DROP CONSTRAINT IF EXISTS inventory_count_lines_item_id_fkey;
ALTER TABLE IF EXISTS ONLY public.inventory_count_lines DROP CONSTRAINT IF EXISTS inventory_count_lines_inventory_count_session_id_fkey;
ALTER TABLE IF EXISTS ONLY public.goods_received_vouchers DROP CONSTRAINT IF EXISTS goods_received_vouchers_supplier_id_fkey;
ALTER TABLE IF EXISTS ONLY public.goods_received_vouchers DROP CONSTRAINT IF EXISTS goods_received_vouchers_purchase_order_id_fkey;
ALTER TABLE IF EXISTS ONLY public.goods_received_vouchers DROP CONSTRAINT IF EXISTS goods_received_vouchers_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.goods_received_vouchers DROP CONSTRAINT IF EXISTS goods_received_vouchers_ap_invoice_id_fkey;
ALTER TABLE IF EXISTS ONLY public.goods_received_voucher_lines DROP CONSTRAINT IF EXISTS goods_received_voucher_lines_purchase_order_line_id_fkey;
ALTER TABLE IF EXISTS ONLY public.goods_received_voucher_lines DROP CONSTRAINT IF EXISTS goods_received_voucher_lines_item_id_fkey;
ALTER TABLE IF EXISTS ONLY public.goods_received_voucher_lines DROP CONSTRAINT IF EXISTS goods_received_voucher_lines_grv_id_fkey;
ALTER TABLE IF EXISTS ONLY public.gl_transaction_types DROP CONSTRAINT IF EXISTS gl_transaction_types_default_debit_account_id_fkey;
ALTER TABLE IF EXISTS ONLY public.gl_transaction_types DROP CONSTRAINT IF EXISTS gl_transaction_types_default_credit_account_id_fkey;
ALTER TABLE IF EXISTS ONLY public.gl_transaction_types DROP CONSTRAINT IF EXISTS gl_transaction_types_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.gl_journal_entry_lines DROP CONSTRAINT IF EXISTS gl_journal_entry_lines_journal_entry_id_fkey;
ALTER TABLE IF EXISTS ONLY public.gl_journal_entry_lines DROP CONSTRAINT IF EXISTS gl_journal_entry_lines_gl_account_id_fkey;
ALTER TABLE IF EXISTS ONLY public.gl_journal_entry_lines DROP CONSTRAINT IF EXISTS gl_journal_entry_lines_currency_id_fkey;
ALTER TABLE IF EXISTS ONLY public.gl_journal_entries DROP CONSTRAINT IF EXISTS gl_journal_entries_posted_by_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.gl_journal_entries DROP CONSTRAINT IF EXISTS gl_journal_entries_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.gl_defaults DROP CONSTRAINT IF EXISTS gl_defaults_retained_earnings_account_id_fkey;
ALTER TABLE IF EXISTS ONLY public.gl_defaults DROP CONSTRAINT IF EXISTS gl_defaults_forex_loss_account_id_fkey;
ALTER TABLE IF EXISTS ONLY public.gl_defaults DROP CONSTRAINT IF EXISTS gl_defaults_forex_gain_account_id_fkey;
ALTER TABLE IF EXISTS ONLY public.gl_defaults DROP CONSTRAINT IF EXISTS gl_defaults_default_cash_account_id_fkey;
ALTER TABLE IF EXISTS ONLY public.gl_defaults DROP CONSTRAINT IF EXISTS gl_defaults_default_ar_control_account_id_fkey;
ALTER TABLE IF EXISTS ONLY public.gl_defaults DROP CONSTRAINT IF EXISTS gl_defaults_default_ap_control_account_id_fkey;
ALTER TABLE IF EXISTS ONLY public.gl_defaults DROP CONSTRAINT IF EXISTS gl_defaults_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.gl_accounts DROP CONSTRAINT IF EXISTS gl_accounts_parent_account_id_fkey;
ALTER TABLE IF EXISTS ONLY public.gl_accounts DROP CONSTRAINT IF EXISTS gl_accounts_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.forex_gain_loss DROP CONSTRAINT IF EXISTS forex_gain_loss_gl_journal_entry_id_fkey;
ALTER TABLE IF EXISTS ONLY public.forex_gain_loss DROP CONSTRAINT IF EXISTS forex_gain_loss_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS fk_users_default_company;
ALTER TABLE IF EXISTS ONLY public.companies DROP CONSTRAINT IF EXISTS fk_companies_created_by_user;
ALTER TABLE IF EXISTS ONLY public.feature_flags DROP CONSTRAINT IF EXISTS feature_flags_created_by_admin_id_fkey;
ALTER TABLE IF EXISTS ONLY public.exchange_rate_history DROP CONSTRAINT IF EXISTS exchange_rate_history_currency_id_fkey;
ALTER TABLE IF EXISTS ONLY public.exchange_rate_history DROP CONSTRAINT IF EXISTS exchange_rate_history_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.customers DROP CONSTRAINT IF EXISTS customers_sales_representative_id_fkey;
ALTER TABLE IF EXISTS ONLY public.customers DROP CONSTRAINT IF EXISTS customers_default_currency_id_fkey;
ALTER TABLE IF EXISTS ONLY public.customers DROP CONSTRAINT IF EXISTS customers_default_ar_gl_account_id_fkey;
ALTER TABLE IF EXISTS ONLY public.customers DROP CONSTRAINT IF EXISTS customers_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.currencies DROP CONSTRAINT IF EXISTS currencies_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.company_subscriptions DROP CONSTRAINT IF EXISTS company_subscriptions_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.company_subscriptions DROP CONSTRAINT IF EXISTS company_subscriptions_billing_plan_id_fkey;
ALTER TABLE IF EXISTS ONLY public.companies DROP CONSTRAINT IF EXISTS companies_billing_plan_id_fkey;
ALTER TABLE IF EXISTS ONLY public.branches DROP CONSTRAINT IF EXISTS branches_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.bom_headers DROP CONSTRAINT IF EXISTS bom_headers_unit_of_measure_id_fkey;
ALTER TABLE IF EXISTS ONLY public.bom_headers DROP CONSTRAINT IF EXISTS bom_headers_parent_item_id_fkey;
ALTER TABLE IF EXISTS ONLY public.bom_headers DROP CONSTRAINT IF EXISTS bom_headers_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.bom_defaults DROP CONSTRAINT IF EXISTS bom_defaults_default_wip_gl_account_id_fkey;
ALTER TABLE IF EXISTS ONLY public.bom_defaults DROP CONSTRAINT IF EXISTS bom_defaults_default_scrap_gl_account_id_fkey;
ALTER TABLE IF EXISTS ONLY public.bom_defaults DROP CONSTRAINT IF EXISTS bom_defaults_default_material_usage_gl_account_id_fkey;
ALTER TABLE IF EXISTS ONLY public.bom_defaults DROP CONSTRAINT IF EXISTS bom_defaults_default_manufacturing_overhead_gl_account_id_fkey;
ALTER TABLE IF EXISTS ONLY public.bom_defaults DROP CONSTRAINT IF EXISTS bom_defaults_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.bom_components DROP CONSTRAINT IF EXISTS bom_components_unit_of_measure_id_fkey;
ALTER TABLE IF EXISTS ONLY public.bom_components DROP CONSTRAINT IF EXISTS bom_components_component_item_id_fkey;
ALTER TABLE IF EXISTS ONLY public.bom_components DROP CONSTRAINT IF EXISTS bom_components_bom_header_id_fkey;
ALTER TABLE IF EXISTS ONLY public.billing_transactions DROP CONSTRAINT IF EXISTS billing_transactions_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.billing_configurations DROP CONSTRAINT IF EXISTS billing_configurations_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.bank_reconciliations DROP CONSTRAINT IF EXISTS bank_reconciliations_created_by_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.bank_reconciliations DROP CONSTRAINT IF EXISTS bank_reconciliations_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.bank_reconciliations DROP CONSTRAINT IF EXISTS bank_reconciliations_bank_gl_account_id_fkey;
ALTER TABLE IF EXISTS ONLY public.bank_reconciliation_items DROP CONSTRAINT IF EXISTS bank_reconciliation_items_gl_journal_entry_line_id_fkey;
ALTER TABLE IF EXISTS ONLY public.bank_reconciliation_items DROP CONSTRAINT IF EXISTS bank_reconciliation_items_bank_reconciliation_id_fkey;
ALTER TABLE IF EXISTS ONLY public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_admin_id_fkey;
ALTER TABLE IF EXISTS ONLY public.ar_writeoffs DROP CONSTRAINT IF EXISTS ar_writeoffs_requested_by_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.ar_writeoffs DROP CONSTRAINT IF EXISTS ar_writeoffs_original_invoice_id_fkey;
ALTER TABLE IF EXISTS ONLY public.ar_writeoffs DROP CONSTRAINT IF EXISTS ar_writeoffs_linked_gl_journal_entry_id_fkey;
ALTER TABLE IF EXISTS ONLY public.ar_writeoffs DROP CONSTRAINT IF EXISTS ar_writeoffs_customer_id_fkey;
ALTER TABLE IF EXISTS ONLY public.ar_writeoffs DROP CONSTRAINT IF EXISTS ar_writeoffs_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.ar_writeoffs DROP CONSTRAINT IF EXISTS ar_writeoffs_ar_transaction_type_id_fkey;
ALTER TABLE IF EXISTS ONLY public.ar_writeoffs DROP CONSTRAINT IF EXISTS ar_writeoffs_approved_by_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.ar_transactions DROP CONSTRAINT IF EXISTS ar_transactions_linked_gl_journal_entry_id_fkey;
ALTER TABLE IF EXISTS ONLY public.ar_transactions DROP CONSTRAINT IF EXISTS ar_transactions_customer_id_fkey;
ALTER TABLE IF EXISTS ONLY public.ar_transactions DROP CONSTRAINT IF EXISTS ar_transactions_currency_id_fkey;
ALTER TABLE IF EXISTS ONLY public.ar_transactions DROP CONSTRAINT IF EXISTS ar_transactions_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.ar_transactions DROP CONSTRAINT IF EXISTS ar_transactions_ar_transaction_type_id_fkey;
ALTER TABLE IF EXISTS ONLY public.ar_transaction_types DROP CONSTRAINT IF EXISTS ar_transaction_types_default_gl_account_id_fkey;
ALTER TABLE IF EXISTS ONLY public.ar_transaction_types DROP CONSTRAINT IF EXISTS ar_transaction_types_default_ar_control_gl_account_id_fkey;
ALTER TABLE IF EXISTS ONLY public.ar_transaction_types DROP CONSTRAINT IF EXISTS ar_transaction_types_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.ar_transaction_tax_lines DROP CONSTRAINT IF EXISTS ar_transaction_tax_lines_tax_type_id_fkey;
ALTER TABLE IF EXISTS ONLY public.ar_transaction_tax_lines DROP CONSTRAINT IF EXISTS ar_transaction_tax_lines_ar_transaction_id_fkey;
ALTER TABLE IF EXISTS ONLY public.ar_defaults DROP CONSTRAINT IF EXISTS ar_defaults_default_sales_gl_account_id_fkey;
ALTER TABLE IF EXISTS ONLY public.ar_defaults DROP CONSTRAINT IF EXISTS ar_defaults_default_sales_discount_gl_account_id_fkey;
ALTER TABLE IF EXISTS ONLY public.ar_defaults DROP CONSTRAINT IF EXISTS ar_defaults_default_receipt_gl_account_id_fkey;
ALTER TABLE IF EXISTS ONLY public.ar_defaults DROP CONSTRAINT IF EXISTS ar_defaults_default_bad_debt_gl_account_id_fkey;
ALTER TABLE IF EXISTS ONLY public.ar_defaults DROP CONSTRAINT IF EXISTS ar_defaults_default_ar_control_gl_account_id_fkey;
ALTER TABLE IF EXISTS ONLY public.ar_defaults DROP CONSTRAINT IF EXISTS ar_defaults_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.ar_allocations DROP CONSTRAINT IF EXISTS ar_allocations_customer_id_fkey;
ALTER TABLE IF EXISTS ONLY public.ar_allocations DROP CONSTRAINT IF EXISTS ar_allocations_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.ar_allocation_lines DROP CONSTRAINT IF EXISTS ar_allocation_lines_debit_transaction_id_fkey;
ALTER TABLE IF EXISTS ONLY public.ar_allocation_lines DROP CONSTRAINT IF EXISTS ar_allocation_lines_credit_transaction_id_fkey;
ALTER TABLE IF EXISTS ONLY public.ar_allocation_lines DROP CONSTRAINT IF EXISTS ar_allocation_lines_ar_allocation_id_fkey;
ALTER TABLE IF EXISTS ONLY public.ap_transactions DROP CONSTRAINT IF EXISTS ap_transactions_supplier_id_fkey;
ALTER TABLE IF EXISTS ONLY public.ap_transactions DROP CONSTRAINT IF EXISTS ap_transactions_linked_gl_journal_entry_id_fkey;
ALTER TABLE IF EXISTS ONLY public.ap_transactions DROP CONSTRAINT IF EXISTS ap_transactions_currency_id_fkey;
ALTER TABLE IF EXISTS ONLY public.ap_transactions DROP CONSTRAINT IF EXISTS ap_transactions_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.ap_transactions DROP CONSTRAINT IF EXISTS ap_transactions_ap_transaction_type_id_fkey;
ALTER TABLE IF EXISTS ONLY public.ap_transaction_types DROP CONSTRAINT IF EXISTS ap_transaction_types_default_gl_account_id_fkey;
ALTER TABLE IF EXISTS ONLY public.ap_transaction_types DROP CONSTRAINT IF EXISTS ap_transaction_types_default_ap_control_gl_account_id_fkey;
ALTER TABLE IF EXISTS ONLY public.ap_transaction_types DROP CONSTRAINT IF EXISTS ap_transaction_types_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.ap_transaction_tax_lines DROP CONSTRAINT IF EXISTS ap_transaction_tax_lines_tax_type_id_fkey;
ALTER TABLE IF EXISTS ONLY public.ap_transaction_tax_lines DROP CONSTRAINT IF EXISTS ap_transaction_tax_lines_ap_transaction_id_fkey;
ALTER TABLE IF EXISTS ONLY public.ap_defaults DROP CONSTRAINT IF EXISTS ap_defaults_default_purchase_discount_gl_account_id_fkey;
ALTER TABLE IF EXISTS ONLY public.ap_defaults DROP CONSTRAINT IF EXISTS ap_defaults_default_payment_gl_account_id_fkey;
ALTER TABLE IF EXISTS ONLY public.ap_defaults DROP CONSTRAINT IF EXISTS ap_defaults_default_expense_gl_account_id_fkey;
ALTER TABLE IF EXISTS ONLY public.ap_defaults DROP CONSTRAINT IF EXISTS ap_defaults_default_ap_control_gl_account_id_fkey;
ALTER TABLE IF EXISTS ONLY public.ap_defaults DROP CONSTRAINT IF EXISTS ap_defaults_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.ap_allocations DROP CONSTRAINT IF EXISTS ap_allocations_supplier_id_fkey;
ALTER TABLE IF EXISTS ONLY public.ap_allocations DROP CONSTRAINT IF EXISTS ap_allocations_company_id_fkey;
ALTER TABLE IF EXISTS ONLY public.ap_allocation_lines DROP CONSTRAINT IF EXISTS ap_allocation_lines_debit_transaction_id_fkey;
ALTER TABLE IF EXISTS ONLY public.ap_allocation_lines DROP CONSTRAINT IF EXISTS ap_allocation_lines_credit_transaction_id_fkey;
ALTER TABLE IF EXISTS ONLY public.ap_allocation_lines DROP CONSTRAINT IF EXISTS ap_allocation_lines_ap_allocation_id_fkey;
ALTER TABLE IF EXISTS ONLY public.accounting_periods DROP CONSTRAINT IF EXISTS accounting_periods_company_id_fkey;
DROP INDEX IF EXISTS public.ix_warehouses_id;
DROP INDEX IF EXISTS public.ix_users_id;
DROP INDEX IF EXISTS public.ix_users_email;
DROP INDEX IF EXISTS public.ix_usage_metrics_recorded_at;
DROP INDEX IF EXISTS public.ix_usage_metrics_metric_type;
DROP INDEX IF EXISTS public.ix_usage_metrics_id;
DROP INDEX IF EXISTS public.ix_usage_metrics_company_id;
DROP INDEX IF EXISTS public.ix_usage_metrics_billing_period;
DROP INDEX IF EXISTS public.ix_unit_of_measures_id;
DROP INDEX IF EXISTS public.ix_tills_id;
DROP INDEX IF EXISTS public.ix_tax_types_id;
DROP INDEX IF EXISTS public.ix_system_health_recorded_at;
DROP INDEX IF EXISTS public.ix_system_health_metric_name;
DROP INDEX IF EXISTS public.ix_system_health_id;
DROP INDEX IF EXISTS public.ix_system_configurations_id;
DROP INDEX IF EXISTS public.ix_suppliers_id;
DROP INDEX IF EXISTS public.ix_sales_representatives_id;
DROP INDEX IF EXISTS public.ix_sales_orders_id;
DROP INDEX IF EXISTS public.ix_sales_order_lines_id;
DROP INDEX IF EXISTS public.ix_roles_name;
DROP INDEX IF EXISTS public.ix_roles_id;
DROP INDEX IF EXISTS public.ix_report_templates_id;
DROP INDEX IF EXISTS public.ix_report_schedules_id;
DROP INDEX IF EXISTS public.ix_purchase_orders_id;
DROP INDEX IF EXISTS public.ix_purchase_order_lines_id;
DROP INDEX IF EXISTS public.ix_pos_transactions_id;
DROP INDEX IF EXISTS public.ix_pos_transaction_types_id;
DROP INDEX IF EXISTS public.ix_pos_transaction_lines_id;
DROP INDEX IF EXISTS public.ix_pos_sessions_id;
DROP INDEX IF EXISTS public.ix_pos_defaults_id;
DROP INDEX IF EXISTS public.ix_pos_cash_movements_id;
DROP INDEX IF EXISTS public.ix_platform_invoices_id;
DROP INDEX IF EXISTS public.ix_platform_invoices_company_id;
DROP INDEX IF EXISTS public.ix_platform_admins_id;
DROP INDEX IF EXISTS public.ix_platform_admins_email;
DROP INDEX IF EXISTS public.ix_order_defaults_id;
DROP INDEX IF EXISTS public.ix_manufacturing_orders_id;
DROP INDEX IF EXISTS public.ix_manufacturing_order_components_id;
DROP INDEX IF EXISTS public.ix_item_barcodes_id;
DROP INDEX IF EXISTS public.ix_inventory_transactions_id;
DROP INDEX IF EXISTS public.ix_inventory_transaction_types_id;
DROP INDEX IF EXISTS public.ix_inventory_items_id;
DROP INDEX IF EXISTS public.ix_inventory_item_locations_id;
DROP INDEX IF EXISTS public.ix_inventory_defaults_id;
DROP INDEX IF EXISTS public.ix_inventory_count_sessions_id;
DROP INDEX IF EXISTS public.ix_inventory_count_lines_id;
DROP INDEX IF EXISTS public.ix_goods_received_vouchers_id;
DROP INDEX IF EXISTS public.ix_goods_received_voucher_lines_id;
DROP INDEX IF EXISTS public.ix_gl_transaction_types_id;
DROP INDEX IF EXISTS public.ix_gl_journal_entry_lines_id;
DROP INDEX IF EXISTS public.ix_gl_journal_entries_id;
DROP INDEX IF EXISTS public.ix_gl_defaults_id;
DROP INDEX IF EXISTS public.ix_gl_accounts_id;
DROP INDEX IF EXISTS public.ix_gl_accounts_account_code;
DROP INDEX IF EXISTS public.ix_feature_flags_id;
DROP INDEX IF EXISTS public.ix_customers_id;
DROP INDEX IF EXISTS public.ix_currencies_id;
DROP INDEX IF EXISTS public.ix_company_subscriptions_id;
DROP INDEX IF EXISTS public.ix_company_subscriptions_company_id;
DROP INDEX IF EXISTS public.ix_companies_name;
DROP INDEX IF EXISTS public.ix_companies_id;
DROP INDEX IF EXISTS public.ix_branches_id;
DROP INDEX IF EXISTS public.ix_bom_headers_id;
DROP INDEX IF EXISTS public.ix_bom_defaults_id;
DROP INDEX IF EXISTS public.ix_bom_components_id;
DROP INDEX IF EXISTS public.ix_billing_plans_id;
DROP INDEX IF EXISTS public.ix_bank_reconciliations_id;
DROP INDEX IF EXISTS public.ix_bank_reconciliation_items_id;
DROP INDEX IF EXISTS public.ix_audit_logs_id;
DROP INDEX IF EXISTS public.ix_audit_logs_entity_type;
DROP INDEX IF EXISTS public.ix_audit_logs_created_at;
DROP INDEX IF EXISTS public.ix_audit_logs_company_id;
DROP INDEX IF EXISTS public.ix_audit_logs_action_type;
DROP INDEX IF EXISTS public.ix_ar_writeoffs_id;
DROP INDEX IF EXISTS public.ix_ar_transactions_id;
DROP INDEX IF EXISTS public.ix_ar_transaction_types_id;
DROP INDEX IF EXISTS public.ix_ar_defaults_id;
DROP INDEX IF EXISTS public.ix_ar_allocations_id;
DROP INDEX IF EXISTS public.ix_ar_allocation_lines_id;
DROP INDEX IF EXISTS public.ix_ap_transactions_id;
DROP INDEX IF EXISTS public.ix_ap_transaction_types_id;
DROP INDEX IF EXISTS public.ix_ap_defaults_id;
DROP INDEX IF EXISTS public.ix_ap_allocations_id;
DROP INDEX IF EXISTS public.ix_ap_allocation_lines_id;
DROP INDEX IF EXISTS public.ix_accounting_periods_id;
DROP INDEX IF EXISTS public.idx_resource_usage_company_date;
DROP INDEX IF EXISTS public.idx_resource_usage_billing_period;
DROP INDEX IF EXISTS public.idx_platform_audit_user_timestamp;
DROP INDEX IF EXISTS public.idx_platform_audit_logs_user_id;
DROP INDEX IF EXISTS public.idx_platform_audit_logs_timestamp;
DROP INDEX IF EXISTS public.idx_platform_audit_logs_company_id;
DROP INDEX IF EXISTS public.idx_platform_audit_logs_action;
DROP INDEX IF EXISTS public.idx_platform_audit_company_timestamp;
DROP INDEX IF EXISTS public.idx_billing_transaction_company_period;
ALTER TABLE IF EXISTS ONLY public.warehouses DROP CONSTRAINT IF EXISTS warehouses_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.user_roles DROP CONSTRAINT IF EXISTS user_roles_pkey;
ALTER TABLE IF EXISTS ONLY public.usage_metrics DROP CONSTRAINT IF EXISTS usage_metrics_pkey;
ALTER TABLE IF EXISTS ONLY public.usage_alerts DROP CONSTRAINT IF EXISTS usage_alerts_pkey;
ALTER TABLE IF EXISTS ONLY public.ar_writeoffs DROP CONSTRAINT IF EXISTS uq_writeoff_document_company;
ALTER TABLE IF EXISTS ONLY public.warehouses DROP CONSTRAINT IF EXISTS uq_warehouse_name_company;
ALTER TABLE IF EXISTS ONLY public.resource_usage DROP CONSTRAINT IF EXISTS uq_usage_company_resource_date;
ALTER TABLE IF EXISTS ONLY public.unit_of_measures DROP CONSTRAINT IF EXISTS uq_uom_name_company;
ALTER TABLE IF EXISTS ONLY public.tills DROP CONSTRAINT IF EXISTS uq_till_code_company;
ALTER TABLE IF EXISTS ONLY public.tax_types DROP CONSTRAINT IF EXISTS uq_taxtype_name_company;
ALTER TABLE IF EXISTS ONLY public.suppliers DROP CONSTRAINT IF EXISTS uq_supplier_code_company;
ALTER TABLE IF EXISTS ONLY public.roles DROP CONSTRAINT IF EXISTS uq_role_name_company;
ALTER TABLE IF EXISTS ONLY public.pos_transaction_types DROP CONSTRAINT IF EXISTS uq_postranstype_name_company;
ALTER TABLE IF EXISTS ONLY public.pos_transactions DROP CONSTRAINT IF EXISTS uq_postrans_number_company;
ALTER TABLE IF EXISTS ONLY public.item_barcodes DROP CONSTRAINT IF EXISTS uq_itembarcode_company;
ALTER TABLE IF EXISTS ONLY public.inventory_item_locations DROP CONSTRAINT IF EXISTS uq_item_warehouse_company;
ALTER TABLE IF EXISTS ONLY public.inventory_transaction_types DROP CONSTRAINT IF EXISTS uq_invtranstype_name_company;
ALTER TABLE IF EXISTS ONLY public.inventory_items DROP CONSTRAINT IF EXISTS uq_inventoryitem_code_company;
ALTER TABLE IF EXISTS ONLY public.gl_transaction_types DROP CONSTRAINT IF EXISTS uq_gltransactiontype_name_company;
ALTER TABLE IF EXISTS ONLY public.gl_accounts DROP CONSTRAINT IF EXISTS uq_glaccount_code_company;
ALTER TABLE IF EXISTS ONLY public.exchange_rate_history DROP CONSTRAINT IF EXISTS uq_exchange_rate_date;
ALTER TABLE IF EXISTS ONLY public.customers DROP CONSTRAINT IF EXISTS uq_customer_code_company;
ALTER TABLE IF EXISTS ONLY public.currencies DROP CONSTRAINT IF EXISTS uq_currency_code_company;
ALTER TABLE IF EXISTS ONLY public.companies DROP CONSTRAINT IF EXISTS uq_company_code;
ALTER TABLE IF EXISTS ONLY public.branches DROP CONSTRAINT IF EXISTS uq_branch_name_company;
ALTER TABLE IF EXISTS ONLY public.bom_headers DROP CONSTRAINT IF EXISTS uq_bom_item_revision_company;
ALTER TABLE IF EXISTS ONLY public.bom_headers DROP CONSTRAINT IF EXISTS uq_bom_code_company;
ALTER TABLE IF EXISTS ONLY public.ar_transaction_types DROP CONSTRAINT IF EXISTS uq_artransactiontype_name_company;
ALTER TABLE IF EXISTS ONLY public.ar_transactions DROP CONSTRAINT IF EXISTS uq_ar_doc_number_company_type;
ALTER TABLE IF EXISTS ONLY public.ar_defaults DROP CONSTRAINT IF EXISTS uq_ar_defaults_company_id;
ALTER TABLE IF EXISTS ONLY public.ap_transaction_types DROP CONSTRAINT IF EXISTS uq_aptransactiontype_name_company;
ALTER TABLE IF EXISTS ONLY public.ap_transactions DROP CONSTRAINT IF EXISTS uq_ap_doc_number_company_type;
ALTER TABLE IF EXISTS ONLY public.accounting_periods DROP CONSTRAINT IF EXISTS uq_accountingperiod_name_company;
ALTER TABLE IF EXISTS ONLY public.unit_of_measures DROP CONSTRAINT IF EXISTS unit_of_measures_pkey;
ALTER TABLE IF EXISTS ONLY public.tills DROP CONSTRAINT IF EXISTS tills_pkey;
ALTER TABLE IF EXISTS ONLY public.tax_types DROP CONSTRAINT IF EXISTS tax_types_pkey;
ALTER TABLE IF EXISTS ONLY public.system_health DROP CONSTRAINT IF EXISTS system_health_pkey;
ALTER TABLE IF EXISTS ONLY public.system_configurations DROP CONSTRAINT IF EXISTS system_configurations_pkey;
ALTER TABLE IF EXISTS ONLY public.system_configurations DROP CONSTRAINT IF EXISTS system_configurations_key_key;
ALTER TABLE IF EXISTS ONLY public.suppliers DROP CONSTRAINT IF EXISTS suppliers_pkey;
ALTER TABLE IF EXISTS ONLY public.sales_representatives DROP CONSTRAINT IF EXISTS sales_representatives_pkey;
ALTER TABLE IF EXISTS ONLY public.sales_orders DROP CONSTRAINT IF EXISTS sales_orders_pkey;
ALTER TABLE IF EXISTS ONLY public.sales_order_lines DROP CONSTRAINT IF EXISTS sales_order_lines_pkey;
ALTER TABLE IF EXISTS ONLY public.roles DROP CONSTRAINT IF EXISTS roles_pkey;
ALTER TABLE IF EXISTS ONLY public.resource_usage DROP CONSTRAINT IF EXISTS resource_usage_pkey;
ALTER TABLE IF EXISTS ONLY public.report_templates DROP CONSTRAINT IF EXISTS report_templates_pkey;
ALTER TABLE IF EXISTS ONLY public.report_schedules DROP CONSTRAINT IF EXISTS report_schedules_pkey;
ALTER TABLE IF EXISTS ONLY public.purchase_orders DROP CONSTRAINT IF EXISTS purchase_orders_pkey;
ALTER TABLE IF EXISTS ONLY public.purchase_order_lines DROP CONSTRAINT IF EXISTS purchase_order_lines_pkey;
ALTER TABLE IF EXISTS ONLY public.pos_transactions DROP CONSTRAINT IF EXISTS pos_transactions_pkey;
ALTER TABLE IF EXISTS ONLY public.pos_transaction_types DROP CONSTRAINT IF EXISTS pos_transaction_types_pkey;
ALTER TABLE IF EXISTS ONLY public.pos_transaction_lines DROP CONSTRAINT IF EXISTS pos_transaction_lines_pkey;
ALTER TABLE IF EXISTS ONLY public.pos_sessions DROP CONSTRAINT IF EXISTS pos_sessions_pkey;
ALTER TABLE IF EXISTS ONLY public.pos_defaults DROP CONSTRAINT IF EXISTS pos_defaults_pkey;
ALTER TABLE IF EXISTS ONLY public.pos_defaults DROP CONSTRAINT IF EXISTS pos_defaults_company_id_key;
ALTER TABLE IF EXISTS ONLY public.pos_cash_movements DROP CONSTRAINT IF EXISTS pos_cash_movements_pkey;
ALTER TABLE IF EXISTS ONLY public.platform_invoices DROP CONSTRAINT IF EXISTS platform_invoices_pkey;
ALTER TABLE IF EXISTS ONLY public.platform_invoices DROP CONSTRAINT IF EXISTS platform_invoices_invoice_number_key;
ALTER TABLE IF EXISTS ONLY public.platform_audit_logs DROP CONSTRAINT IF EXISTS platform_audit_logs_pkey;
ALTER TABLE IF EXISTS ONLY public.platform_admins DROP CONSTRAINT IF EXISTS platform_admins_pkey;
ALTER TABLE IF EXISTS ONLY public.order_defaults DROP CONSTRAINT IF EXISTS order_defaults_pkey;
ALTER TABLE IF EXISTS ONLY public.order_defaults DROP CONSTRAINT IF EXISTS order_defaults_company_id_key;
ALTER TABLE IF EXISTS ONLY public.manufacturing_orders DROP CONSTRAINT IF EXISTS manufacturing_orders_pkey;
ALTER TABLE IF EXISTS ONLY public.manufacturing_orders DROP CONSTRAINT IF EXISTS manufacturing_orders_order_number_key;
ALTER TABLE IF EXISTS ONLY public.manufacturing_order_components DROP CONSTRAINT IF EXISTS manufacturing_order_components_pkey;
ALTER TABLE IF EXISTS ONLY public.item_barcodes DROP CONSTRAINT IF EXISTS item_barcodes_pkey;
ALTER TABLE IF EXISTS ONLY public.inventory_transactions DROP CONSTRAINT IF EXISTS inventory_transactions_pkey;
ALTER TABLE IF EXISTS ONLY public.inventory_transaction_types DROP CONSTRAINT IF EXISTS inventory_transaction_types_pkey;
ALTER TABLE IF EXISTS ONLY public.inventory_items DROP CONSTRAINT IF EXISTS inventory_items_pkey;
ALTER TABLE IF EXISTS ONLY public.inventory_item_locations DROP CONSTRAINT IF EXISTS inventory_item_locations_pkey;
ALTER TABLE IF EXISTS ONLY public.inventory_defaults DROP CONSTRAINT IF EXISTS inventory_defaults_pkey;
ALTER TABLE IF EXISTS ONLY public.inventory_defaults DROP CONSTRAINT IF EXISTS inventory_defaults_company_id_key;
ALTER TABLE IF EXISTS ONLY public.inventory_count_sessions DROP CONSTRAINT IF EXISTS inventory_count_sessions_pkey;
ALTER TABLE IF EXISTS ONLY public.inventory_count_lines DROP CONSTRAINT IF EXISTS inventory_count_lines_pkey;
ALTER TABLE IF EXISTS ONLY public.goods_received_vouchers DROP CONSTRAINT IF EXISTS goods_received_vouchers_pkey;
ALTER TABLE IF EXISTS ONLY public.goods_received_voucher_lines DROP CONSTRAINT IF EXISTS goods_received_voucher_lines_pkey;
ALTER TABLE IF EXISTS ONLY public.gl_transaction_types DROP CONSTRAINT IF EXISTS gl_transaction_types_pkey;
ALTER TABLE IF EXISTS ONLY public.gl_journal_entry_lines DROP CONSTRAINT IF EXISTS gl_journal_entry_lines_pkey;
ALTER TABLE IF EXISTS ONLY public.gl_journal_entries DROP CONSTRAINT IF EXISTS gl_journal_entries_pkey;
ALTER TABLE IF EXISTS ONLY public.gl_defaults DROP CONSTRAINT IF EXISTS gl_defaults_pkey;
ALTER TABLE IF EXISTS ONLY public.gl_defaults DROP CONSTRAINT IF EXISTS gl_defaults_company_id_key;
ALTER TABLE IF EXISTS ONLY public.gl_accounts DROP CONSTRAINT IF EXISTS gl_accounts_pkey;
ALTER TABLE IF EXISTS ONLY public.forex_gain_loss DROP CONSTRAINT IF EXISTS forex_gain_loss_pkey;
ALTER TABLE IF EXISTS ONLY public.feature_flags DROP CONSTRAINT IF EXISTS feature_flags_pkey;
ALTER TABLE IF EXISTS ONLY public.feature_flags DROP CONSTRAINT IF EXISTS feature_flags_name_key;
ALTER TABLE IF EXISTS ONLY public.exchange_rate_history DROP CONSTRAINT IF EXISTS exchange_rate_history_pkey;
ALTER TABLE IF EXISTS ONLY public.customers DROP CONSTRAINT IF EXISTS customers_pkey;
ALTER TABLE IF EXISTS ONLY public.currencies DROP CONSTRAINT IF EXISTS currencies_pkey;
ALTER TABLE IF EXISTS ONLY public.company_subscriptions DROP CONSTRAINT IF EXISTS company_subscriptions_pkey;
ALTER TABLE IF EXISTS ONLY public.companies DROP CONSTRAINT IF EXISTS companies_pkey;
ALTER TABLE IF EXISTS ONLY public.branches DROP CONSTRAINT IF EXISTS branches_pkey;
ALTER TABLE IF EXISTS ONLY public.bom_headers DROP CONSTRAINT IF EXISTS bom_headers_pkey;
ALTER TABLE IF EXISTS ONLY public.bom_defaults DROP CONSTRAINT IF EXISTS bom_defaults_pkey;
ALTER TABLE IF EXISTS ONLY public.bom_defaults DROP CONSTRAINT IF EXISTS bom_defaults_company_id_key;
ALTER TABLE IF EXISTS ONLY public.bom_components DROP CONSTRAINT IF EXISTS bom_components_pkey;
ALTER TABLE IF EXISTS ONLY public.billing_transactions DROP CONSTRAINT IF EXISTS billing_transactions_pkey;
ALTER TABLE IF EXISTS ONLY public.billing_plans DROP CONSTRAINT IF EXISTS billing_plans_pkey;
ALTER TABLE IF EXISTS ONLY public.billing_plans DROP CONSTRAINT IF EXISTS billing_plans_name_key;
ALTER TABLE IF EXISTS ONLY public.billing_configurations DROP CONSTRAINT IF EXISTS billing_configurations_pkey;
ALTER TABLE IF EXISTS ONLY public.bank_reconciliations DROP CONSTRAINT IF EXISTS bank_reconciliations_pkey;
ALTER TABLE IF EXISTS ONLY public.bank_reconciliation_items DROP CONSTRAINT IF EXISTS bank_reconciliation_items_pkey;
ALTER TABLE IF EXISTS ONLY public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_pkey;
ALTER TABLE IF EXISTS ONLY public.ar_writeoffs DROP CONSTRAINT IF EXISTS ar_writeoffs_pkey;
ALTER TABLE IF EXISTS ONLY public.ar_transactions DROP CONSTRAINT IF EXISTS ar_transactions_pkey;
ALTER TABLE IF EXISTS ONLY public.ar_transaction_types DROP CONSTRAINT IF EXISTS ar_transaction_types_pkey;
ALTER TABLE IF EXISTS ONLY public.ar_transaction_tax_lines DROP CONSTRAINT IF EXISTS ar_transaction_tax_lines_pkey;
ALTER TABLE IF EXISTS ONLY public.ar_defaults DROP CONSTRAINT IF EXISTS ar_defaults_pkey;
ALTER TABLE IF EXISTS ONLY public.ar_allocations DROP CONSTRAINT IF EXISTS ar_allocations_pkey;
ALTER TABLE IF EXISTS ONLY public.ar_allocation_lines DROP CONSTRAINT IF EXISTS ar_allocation_lines_pkey;
ALTER TABLE IF EXISTS ONLY public.ap_transactions DROP CONSTRAINT IF EXISTS ap_transactions_pkey;
ALTER TABLE IF EXISTS ONLY public.ap_transaction_types DROP CONSTRAINT IF EXISTS ap_transaction_types_pkey;
ALTER TABLE IF EXISTS ONLY public.ap_transaction_tax_lines DROP CONSTRAINT IF EXISTS ap_transaction_tax_lines_pkey;
ALTER TABLE IF EXISTS ONLY public.ap_defaults DROP CONSTRAINT IF EXISTS ap_defaults_pkey;
ALTER TABLE IF EXISTS ONLY public.ap_defaults DROP CONSTRAINT IF EXISTS ap_defaults_company_id_key;
ALTER TABLE IF EXISTS ONLY public.ap_allocations DROP CONSTRAINT IF EXISTS ap_allocations_pkey;
ALTER TABLE IF EXISTS ONLY public.ap_allocation_lines DROP CONSTRAINT IF EXISTS ap_allocation_lines_pkey;
ALTER TABLE IF EXISTS ONLY public.alembic_version DROP CONSTRAINT IF EXISTS alembic_version_pkc;
ALTER TABLE IF EXISTS ONLY public.accounting_periods DROP CONSTRAINT IF EXISTS accounting_periods_pkey;
ALTER TABLE IF EXISTS public.warehouses ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.users ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.usage_metrics ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.usage_alerts ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.unit_of_measures ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.tills ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.tax_types ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.system_health ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.system_configurations ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.suppliers ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.sales_representatives ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.sales_orders ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.sales_order_lines ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.roles ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.resource_usage ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.report_templates ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.report_schedules ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.purchase_orders ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.purchase_order_lines ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.pos_transactions ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.pos_transaction_types ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.pos_transaction_lines ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.pos_sessions ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.pos_defaults ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.pos_cash_movements ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.platform_invoices ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.platform_audit_logs ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.platform_admins ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.order_defaults ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.manufacturing_orders ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.manufacturing_order_components ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.item_barcodes ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.inventory_transactions ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.inventory_transaction_types ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.inventory_items ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.inventory_item_locations ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.inventory_defaults ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.inventory_count_sessions ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.inventory_count_lines ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.goods_received_vouchers ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.goods_received_voucher_lines ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.gl_transaction_types ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.gl_journal_entry_lines ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.gl_journal_entries ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.gl_defaults ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.gl_accounts ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.forex_gain_loss ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.feature_flags ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.exchange_rate_history ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.customers ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.currencies ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.company_subscriptions ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.companies ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.branches ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.bom_headers ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.bom_defaults ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.bom_components ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.billing_transactions ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.billing_plans ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.bank_reconciliations ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.bank_reconciliation_items ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.audit_logs ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.ar_writeoffs ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.ar_transactions ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.ar_transaction_types ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.ar_transaction_tax_lines ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.ar_defaults ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.ar_allocations ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.ar_allocation_lines ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.ap_transactions ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.ap_transaction_types ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.ap_transaction_tax_lines ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.ap_defaults ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.ap_allocations ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.ap_allocation_lines ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.accounting_periods ALTER COLUMN id DROP DEFAULT;
DROP SEQUENCE IF EXISTS public.warehouses_id_seq;
DROP TABLE IF EXISTS public.warehouses;
DROP SEQUENCE IF EXISTS public.users_id_seq;
DROP TABLE IF EXISTS public.users;
DROP TABLE IF EXISTS public.user_roles;
DROP SEQUENCE IF EXISTS public.usage_metrics_id_seq;
DROP TABLE IF EXISTS public.usage_metrics;
DROP SEQUENCE IF EXISTS public.usage_alerts_id_seq;
DROP TABLE IF EXISTS public.usage_alerts;
DROP SEQUENCE IF EXISTS public.unit_of_measures_id_seq;
DROP TABLE IF EXISTS public.unit_of_measures;
DROP SEQUENCE IF EXISTS public.tills_id_seq;
DROP TABLE IF EXISTS public.tills;
DROP SEQUENCE IF EXISTS public.tax_types_id_seq;
DROP TABLE IF EXISTS public.tax_types;
DROP SEQUENCE IF EXISTS public.system_health_id_seq;
DROP TABLE IF EXISTS public.system_health;
DROP SEQUENCE IF EXISTS public.system_configurations_id_seq;
DROP TABLE IF EXISTS public.system_configurations;
DROP SEQUENCE IF EXISTS public.suppliers_id_seq;
DROP TABLE IF EXISTS public.suppliers;
DROP SEQUENCE IF EXISTS public.sales_representatives_id_seq;
DROP TABLE IF EXISTS public.sales_representatives;
DROP SEQUENCE IF EXISTS public.sales_orders_id_seq;
DROP TABLE IF EXISTS public.sales_orders;
DROP SEQUENCE IF EXISTS public.sales_order_lines_id_seq;
DROP TABLE IF EXISTS public.sales_order_lines;
DROP SEQUENCE IF EXISTS public.roles_id_seq;
DROP TABLE IF EXISTS public.roles;
DROP SEQUENCE IF EXISTS public.resource_usage_id_seq;
DROP TABLE IF EXISTS public.resource_usage;
DROP SEQUENCE IF EXISTS public.report_templates_id_seq;
DROP TABLE IF EXISTS public.report_templates;
DROP SEQUENCE IF EXISTS public.report_schedules_id_seq;
DROP TABLE IF EXISTS public.report_schedules;
DROP SEQUENCE IF EXISTS public.purchase_orders_id_seq;
DROP TABLE IF EXISTS public.purchase_orders;
DROP SEQUENCE IF EXISTS public.purchase_order_lines_id_seq;
DROP TABLE IF EXISTS public.purchase_order_lines;
DROP SEQUENCE IF EXISTS public.pos_transactions_id_seq;
DROP TABLE IF EXISTS public.pos_transactions;
DROP SEQUENCE IF EXISTS public.pos_transaction_types_id_seq;
DROP TABLE IF EXISTS public.pos_transaction_types;
DROP SEQUENCE IF EXISTS public.pos_transaction_lines_id_seq;
DROP TABLE IF EXISTS public.pos_transaction_lines;
DROP SEQUENCE IF EXISTS public.pos_sessions_id_seq;
DROP TABLE IF EXISTS public.pos_sessions;
DROP SEQUENCE IF EXISTS public.pos_defaults_id_seq;
DROP TABLE IF EXISTS public.pos_defaults;
DROP SEQUENCE IF EXISTS public.pos_cash_movements_id_seq;
DROP TABLE IF EXISTS public.pos_cash_movements;
DROP SEQUENCE IF EXISTS public.platform_invoices_id_seq;
DROP TABLE IF EXISTS public.platform_invoices;
DROP SEQUENCE IF EXISTS public.platform_audit_logs_id_seq;
DROP TABLE IF EXISTS public.platform_audit_logs;
DROP SEQUENCE IF EXISTS public.platform_admins_id_seq;
DROP TABLE IF EXISTS public.platform_admins;
DROP SEQUENCE IF EXISTS public.order_defaults_id_seq;
DROP TABLE IF EXISTS public.order_defaults;
DROP SEQUENCE IF EXISTS public.manufacturing_orders_id_seq;
DROP TABLE IF EXISTS public.manufacturing_orders;
DROP SEQUENCE IF EXISTS public.manufacturing_order_components_id_seq;
DROP TABLE IF EXISTS public.manufacturing_order_components;
DROP SEQUENCE IF EXISTS public.item_barcodes_id_seq;
DROP TABLE IF EXISTS public.item_barcodes;
DROP SEQUENCE IF EXISTS public.inventory_transactions_id_seq;
DROP TABLE IF EXISTS public.inventory_transactions;
DROP SEQUENCE IF EXISTS public.inventory_transaction_types_id_seq;
DROP TABLE IF EXISTS public.inventory_transaction_types;
DROP SEQUENCE IF EXISTS public.inventory_items_id_seq;
DROP TABLE IF EXISTS public.inventory_items;
DROP SEQUENCE IF EXISTS public.inventory_item_locations_id_seq;
DROP TABLE IF EXISTS public.inventory_item_locations;
DROP SEQUENCE IF EXISTS public.inventory_defaults_id_seq;
DROP TABLE IF EXISTS public.inventory_defaults;
DROP SEQUENCE IF EXISTS public.inventory_count_sessions_id_seq;
DROP TABLE IF EXISTS public.inventory_count_sessions;
DROP SEQUENCE IF EXISTS public.inventory_count_lines_id_seq;
DROP TABLE IF EXISTS public.inventory_count_lines;
DROP SEQUENCE IF EXISTS public.goods_received_vouchers_id_seq;
DROP TABLE IF EXISTS public.goods_received_vouchers;
DROP SEQUENCE IF EXISTS public.goods_received_voucher_lines_id_seq;
DROP TABLE IF EXISTS public.goods_received_voucher_lines;
DROP SEQUENCE IF EXISTS public.gl_transaction_types_id_seq;
DROP TABLE IF EXISTS public.gl_transaction_types;
DROP SEQUENCE IF EXISTS public.gl_journal_entry_lines_id_seq;
DROP TABLE IF EXISTS public.gl_journal_entry_lines;
DROP SEQUENCE IF EXISTS public.gl_journal_entries_id_seq;
DROP TABLE IF EXISTS public.gl_journal_entries;
DROP SEQUENCE IF EXISTS public.gl_defaults_id_seq;
DROP TABLE IF EXISTS public.gl_defaults;
DROP SEQUENCE IF EXISTS public.gl_accounts_id_seq;
DROP TABLE IF EXISTS public.gl_accounts;
DROP SEQUENCE IF EXISTS public.forex_gain_loss_id_seq;
DROP TABLE IF EXISTS public.forex_gain_loss;
DROP SEQUENCE IF EXISTS public.feature_flags_id_seq;
DROP TABLE IF EXISTS public.feature_flags;
DROP SEQUENCE IF EXISTS public.exchange_rate_history_id_seq;
DROP TABLE IF EXISTS public.exchange_rate_history;
DROP SEQUENCE IF EXISTS public.customers_id_seq;
DROP TABLE IF EXISTS public.customers;
DROP SEQUENCE IF EXISTS public.currencies_id_seq;
DROP TABLE IF EXISTS public.currencies;
DROP SEQUENCE IF EXISTS public.company_subscriptions_id_seq;
DROP TABLE IF EXISTS public.company_subscriptions;
DROP SEQUENCE IF EXISTS public.companies_id_seq;
DROP TABLE IF EXISTS public.companies;
DROP SEQUENCE IF EXISTS public.branches_id_seq;
DROP TABLE IF EXISTS public.branches;
DROP SEQUENCE IF EXISTS public.bom_headers_id_seq;
DROP TABLE IF EXISTS public.bom_headers;
DROP SEQUENCE IF EXISTS public.bom_defaults_id_seq;
DROP TABLE IF EXISTS public.bom_defaults;
DROP SEQUENCE IF EXISTS public.bom_components_id_seq;
DROP TABLE IF EXISTS public.bom_components;
DROP SEQUENCE IF EXISTS public.billing_transactions_id_seq;
DROP TABLE IF EXISTS public.billing_transactions;
DROP SEQUENCE IF EXISTS public.billing_plans_id_seq;
DROP TABLE IF EXISTS public.billing_plans;
DROP TABLE IF EXISTS public.billing_configurations;
DROP SEQUENCE IF EXISTS public.bank_reconciliations_id_seq;
DROP TABLE IF EXISTS public.bank_reconciliations;
DROP SEQUENCE IF EXISTS public.bank_reconciliation_items_id_seq;
DROP TABLE IF EXISTS public.bank_reconciliation_items;
DROP SEQUENCE IF EXISTS public.audit_logs_id_seq;
DROP TABLE IF EXISTS public.audit_logs;
DROP SEQUENCE IF EXISTS public.ar_writeoffs_id_seq;
DROP TABLE IF EXISTS public.ar_writeoffs;
DROP SEQUENCE IF EXISTS public.ar_transactions_id_seq;
DROP TABLE IF EXISTS public.ar_transactions;
DROP SEQUENCE IF EXISTS public.ar_transaction_types_id_seq;
DROP TABLE IF EXISTS public.ar_transaction_types;
DROP SEQUENCE IF EXISTS public.ar_transaction_tax_lines_id_seq;
DROP TABLE IF EXISTS public.ar_transaction_tax_lines;
DROP SEQUENCE IF EXISTS public.ar_defaults_id_seq;
DROP TABLE IF EXISTS public.ar_defaults;
DROP SEQUENCE IF EXISTS public.ar_allocations_id_seq;
DROP TABLE IF EXISTS public.ar_allocations;
DROP SEQUENCE IF EXISTS public.ar_allocation_lines_id_seq;
DROP TABLE IF EXISTS public.ar_allocation_lines;
DROP SEQUENCE IF EXISTS public.ap_transactions_id_seq;
DROP TABLE IF EXISTS public.ap_transactions;
DROP SEQUENCE IF EXISTS public.ap_transaction_types_id_seq;
DROP TABLE IF EXISTS public.ap_transaction_types;
DROP SEQUENCE IF EXISTS public.ap_transaction_tax_lines_id_seq;
DROP TABLE IF EXISTS public.ap_transaction_tax_lines;
DROP SEQUENCE IF EXISTS public.ap_defaults_id_seq;
DROP TABLE IF EXISTS public.ap_defaults;
DROP SEQUENCE IF EXISTS public.ap_allocations_id_seq;
DROP TABLE IF EXISTS public.ap_allocations;
DROP SEQUENCE IF EXISTS public.ap_allocation_lines_id_seq;
DROP TABLE IF EXISTS public.ap_allocation_lines;
DROP TABLE IF EXISTS public.alembic_version;
DROP SEQUENCE IF EXISTS public.accounting_periods_id_seq;
DROP TABLE IF EXISTS public.accounting_periods;
DROP TYPE IF EXISTS public.usagemetrictype;
DROP TYPE IF EXISTS public.subscriptionstatus;
DROP TYPE IF EXISTS public.billingplantype;
DROP TYPE IF EXISTS public.auditactiontype;
--
-- Name: auditactiontype; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.auditactiontype AS ENUM (
    'CREATE',
    'UPDATE',
    'DELETE',
    'LOGIN',
    'LOGOUT',
    'API_CALL',
    'PERMISSION_CHANGE',
    'SUBSCRIPTION_CHANGE',
    'OTHER'
);


--
-- Name: billingplantype; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.billingplantype AS ENUM (
    'TRIAL',
    'BASIC',
    'PROFESSIONAL',
    'ENTERPRISE',
    'CUSTOM'
);


--
-- Name: subscriptionstatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.subscriptionstatus AS ENUM (
    'TRIAL',
    'ACTIVE',
    'CANCELLED',
    'EXPIRED'
);


--
-- Name: usagemetrictype; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.usagemetrictype AS ENUM (
    'API_CALLS',
    'STORAGE',
    'USERS',
    'TRANSACTIONS',
    'CUSTOM'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: accounting_periods; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.accounting_periods (
    id integer NOT NULL,
    company_id integer NOT NULL,
    name character varying NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    status character varying NOT NULL
);


--
-- Name: accounting_periods_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.accounting_periods_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: accounting_periods_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.accounting_periods_id_seq OWNED BY public.accounting_periods.id;


--
-- Name: alembic_version; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.alembic_version (
    version_num character varying(32) NOT NULL
);


--
-- Name: ap_allocation_lines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ap_allocation_lines (
    id integer NOT NULL,
    ap_allocation_id integer NOT NULL,
    credit_transaction_id integer NOT NULL,
    debit_transaction_id integer NOT NULL,
    allocated_amount numeric(15,2) NOT NULL
);


--
-- Name: ap_allocation_lines_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ap_allocation_lines_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ap_allocation_lines_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ap_allocation_lines_id_seq OWNED BY public.ap_allocation_lines.id;


--
-- Name: ap_allocations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ap_allocations (
    id integer NOT NULL,
    company_id integer NOT NULL,
    allocation_date date NOT NULL,
    supplier_id integer NOT NULL
);


--
-- Name: ap_allocations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ap_allocations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ap_allocations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ap_allocations_id_seq OWNED BY public.ap_allocations.id;


--
-- Name: ap_defaults; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ap_defaults (
    id integer NOT NULL,
    company_id integer NOT NULL,
    default_ap_control_gl_account_id integer,
    default_expense_gl_account_id integer,
    default_payment_gl_account_id integer,
    default_purchase_discount_gl_account_id integer
);


--
-- Name: ap_defaults_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ap_defaults_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ap_defaults_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ap_defaults_id_seq OWNED BY public.ap_defaults.id;


--
-- Name: ap_transaction_tax_lines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ap_transaction_tax_lines (
    id integer NOT NULL,
    ap_transaction_id integer,
    tax_type_id integer,
    taxable_amount numeric(15,2),
    tax_amount numeric(15,2),
    base_currency_tax_amount numeric(15,2)
);


--
-- Name: ap_transaction_tax_lines_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ap_transaction_tax_lines_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ap_transaction_tax_lines_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ap_transaction_tax_lines_id_seq OWNED BY public.ap_transaction_tax_lines.id;


--
-- Name: ap_transaction_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ap_transaction_types (
    id integer NOT NULL,
    company_id integer NOT NULL,
    name character varying NOT NULL,
    description character varying,
    base_type character varying NOT NULL,
    default_gl_account_id integer,
    default_ap_control_gl_account_id integer,
    affects_balance_direction character varying NOT NULL,
    is_active boolean
);


--
-- Name: ap_transaction_types_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ap_transaction_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ap_transaction_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ap_transaction_types_id_seq OWNED BY public.ap_transaction_types.id;


--
-- Name: ap_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ap_transactions (
    id integer NOT NULL,
    company_id integer NOT NULL,
    supplier_id integer NOT NULL,
    ap_transaction_type_id integer NOT NULL,
    linked_gl_journal_entry_id integer,
    purchase_order_id integer,
    transaction_date date NOT NULL,
    due_date date,
    reference character varying,
    document_number character varying NOT NULL,
    total_amount numeric(15,2) NOT NULL,
    open_amount numeric(15,2) NOT NULL,
    is_posted_to_gl boolean,
    status character varying NOT NULL,
    currency_id integer,
    exchange_rate numeric(15,6),
    base_currency_amount numeric(15,2),
    foreign_currency_amount numeric(15,2)
);


--
-- Name: ap_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ap_transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ap_transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ap_transactions_id_seq OWNED BY public.ap_transactions.id;


--
-- Name: ar_allocation_lines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ar_allocation_lines (
    id integer NOT NULL,
    ar_allocation_id integer NOT NULL,
    debit_transaction_id integer NOT NULL,
    credit_transaction_id integer NOT NULL,
    allocated_amount numeric(15,2) NOT NULL
);


--
-- Name: ar_allocation_lines_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ar_allocation_lines_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ar_allocation_lines_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ar_allocation_lines_id_seq OWNED BY public.ar_allocation_lines.id;


--
-- Name: ar_allocations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ar_allocations (
    id integer NOT NULL,
    company_id integer NOT NULL,
    allocation_date date NOT NULL,
    customer_id integer NOT NULL
);


--
-- Name: ar_allocations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ar_allocations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ar_allocations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ar_allocations_id_seq OWNED BY public.ar_allocations.id;


--
-- Name: ar_defaults; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ar_defaults (
    id integer NOT NULL,
    company_id integer NOT NULL,
    default_ar_control_gl_account_id integer,
    default_sales_gl_account_id integer,
    default_receipt_gl_account_id integer,
    default_sales_discount_gl_account_id integer,
    default_bad_debt_gl_account_id integer
);


--
-- Name: ar_defaults_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ar_defaults_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ar_defaults_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ar_defaults_id_seq OWNED BY public.ar_defaults.id;


--
-- Name: ar_transaction_tax_lines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ar_transaction_tax_lines (
    id integer NOT NULL,
    ar_transaction_id integer,
    tax_type_id integer,
    taxable_amount numeric(15,2),
    tax_amount numeric(15,2),
    base_currency_tax_amount numeric(15,2)
);


--
-- Name: ar_transaction_tax_lines_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ar_transaction_tax_lines_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ar_transaction_tax_lines_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ar_transaction_tax_lines_id_seq OWNED BY public.ar_transaction_tax_lines.id;


--
-- Name: ar_transaction_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ar_transaction_types (
    id integer NOT NULL,
    company_id integer NOT NULL,
    name character varying NOT NULL,
    description character varying,
    base_type character varying NOT NULL,
    default_gl_account_id integer,
    default_ar_control_gl_account_id integer,
    affects_balance_direction character varying NOT NULL,
    is_active boolean
);


--
-- Name: ar_transaction_types_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ar_transaction_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ar_transaction_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ar_transaction_types_id_seq OWNED BY public.ar_transaction_types.id;


--
-- Name: ar_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ar_transactions (
    id integer NOT NULL,
    company_id integer NOT NULL,
    customer_id integer NOT NULL,
    ar_transaction_type_id integer NOT NULL,
    linked_gl_journal_entry_id integer,
    sales_order_id integer,
    transaction_date date NOT NULL,
    due_date date,
    reference character varying,
    document_number character varying NOT NULL,
    total_amount numeric(15,2) NOT NULL,
    open_amount numeric(15,2) NOT NULL,
    is_posted_to_gl boolean,
    status character varying NOT NULL,
    currency_id integer,
    exchange_rate numeric(15,6),
    base_currency_amount numeric(15,2),
    foreign_currency_amount numeric(15,2)
);


--
-- Name: ar_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ar_transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ar_transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ar_transactions_id_seq OWNED BY public.ar_transactions.id;


--
-- Name: ar_writeoffs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ar_writeoffs (
    id integer NOT NULL,
    company_id integer NOT NULL,
    customer_id integer NOT NULL,
    original_invoice_id integer NOT NULL,
    ar_transaction_type_id integer NOT NULL,
    linked_gl_journal_entry_id integer,
    document_number character varying NOT NULL,
    writeoff_date date NOT NULL,
    writeoff_amount numeric(15,2) NOT NULL,
    reason_code character varying NOT NULL,
    reason_description text,
    status character varying NOT NULL,
    requested_by_user_id integer NOT NULL,
    approved_by_user_id integer,
    approval_date timestamp without time zone,
    approval_notes text,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


--
-- Name: ar_writeoffs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ar_writeoffs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ar_writeoffs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ar_writeoffs_id_seq OWNED BY public.ar_writeoffs.id;


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id integer NOT NULL,
    action_type public.auditactiontype NOT NULL,
    entity_type character varying NOT NULL,
    entity_id integer,
    company_id integer,
    user_id integer,
    admin_id integer,
    ip_address character varying,
    user_agent character varying,
    description character varying NOT NULL,
    old_values jsonb,
    new_values jsonb,
    created_at timestamp without time zone NOT NULL
);


--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.audit_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;


--
-- Name: bank_reconciliation_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bank_reconciliation_items (
    id integer NOT NULL,
    bank_reconciliation_id integer NOT NULL,
    gl_journal_entry_line_id integer,
    item_type character varying NOT NULL,
    description character varying NOT NULL,
    amount numeric NOT NULL,
    is_reconciled boolean
);


--
-- Name: bank_reconciliation_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.bank_reconciliation_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: bank_reconciliation_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.bank_reconciliation_items_id_seq OWNED BY public.bank_reconciliation_items.id;


--
-- Name: bank_reconciliations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bank_reconciliations (
    id integer NOT NULL,
    company_id integer NOT NULL,
    bank_gl_account_id integer NOT NULL,
    reconciliation_date date NOT NULL,
    statement_balance numeric NOT NULL,
    book_balance numeric NOT NULL,
    status character varying,
    created_by_user_id integer NOT NULL,
    created_at timestamp without time zone
);


--
-- Name: bank_reconciliations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.bank_reconciliations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: bank_reconciliations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.bank_reconciliations_id_seq OWNED BY public.bank_reconciliations.id;


--
-- Name: billing_configurations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.billing_configurations (
    company_id integer NOT NULL,
    billing_provider character varying DEFAULT 'stripe'::character varying NOT NULL,
    customer_id character varying,
    subscription_id character varying,
    payment_method_id character varying,
    billing_cycle character varying DEFAULT 'monthly'::character varying NOT NULL,
    next_billing_date date,
    custom_pricing jsonb,
    discount_percentage numeric(5,2) DEFAULT 0 NOT NULL
);


--
-- Name: billing_plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.billing_plans (
    id integer NOT NULL,
    name character varying NOT NULL,
    plan_type public.billingplantype NOT NULL,
    price_monthly numeric(10,2) NOT NULL,
    price_yearly numeric(10,2) NOT NULL,
    features jsonb NOT NULL,
    limits jsonb NOT NULL,
    is_active boolean NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


--
-- Name: billing_plans_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.billing_plans_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: billing_plans_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.billing_plans_id_seq OWNED BY public.billing_plans.id;


--
-- Name: billing_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.billing_transactions (
    id integer NOT NULL,
    company_id integer NOT NULL,
    transaction_type character varying NOT NULL,
    amount numeric(10,2) NOT NULL,
    currency character varying(3),
    description character varying,
    billing_period character varying NOT NULL,
    stripe_invoice_id character varying,
    stripe_charge_id character varying,
    status character varying,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


--
-- Name: billing_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.billing_transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: billing_transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.billing_transactions_id_seq OWNED BY public.billing_transactions.id;


--
-- Name: bom_components; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bom_components (
    id integer NOT NULL,
    bom_header_id integer NOT NULL,
    component_item_id integer NOT NULL,
    quantity_required numeric NOT NULL,
    unit_of_measure_id integer,
    scrap_percentage numeric,
    sequence_number integer,
    is_phantom boolean,
    notes text
);


--
-- Name: bom_components_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.bom_components_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: bom_components_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.bom_components_id_seq OWNED BY public.bom_components.id;


--
-- Name: bom_defaults; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bom_defaults (
    id integer NOT NULL,
    company_id integer NOT NULL,
    default_wip_gl_account_id integer,
    default_material_usage_gl_account_id integer,
    default_manufacturing_overhead_gl_account_id integer,
    default_scrap_gl_account_id integer,
    next_mo_number integer
);


--
-- Name: bom_defaults_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.bom_defaults_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: bom_defaults_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.bom_defaults_id_seq OWNED BY public.bom_defaults.id;


--
-- Name: bom_headers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bom_headers (
    id integer NOT NULL,
    company_id integer NOT NULL,
    parent_item_id integer NOT NULL,
    bom_code character varying NOT NULL,
    description character varying,
    revision character varying,
    effective_date timestamp without time zone,
    expiry_date timestamp without time zone,
    quantity_per_batch numeric,
    unit_of_measure_id integer,
    is_active boolean,
    notes text
);


--
-- Name: bom_headers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.bom_headers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: bom_headers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.bom_headers_id_seq OWNED BY public.bom_headers.id;


--
-- Name: branches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.branches (
    id integer NOT NULL,
    company_id integer NOT NULL,
    name character varying NOT NULL,
    address jsonb,
    contact_info jsonb,
    default_gl_segment_code character varying,
    is_active boolean
);


--
-- Name: branches_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.branches_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: branches_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.branches_id_seq OWNED BY public.branches.id;


--
-- Name: companies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.companies (
    id integer NOT NULL,
    name character varying NOT NULL,
    address jsonb,
    contact_info jsonb,
    default_currency_code character varying(3),
    is_active boolean,
    code character varying(10) NOT NULL,
    subscription_status public.subscriptionstatus DEFAULT 'TRIAL'::public.subscriptionstatus,
    subscription_plan character varying,
    subscription_expires date,
    storage_limit_gb integer DEFAULT 10,
    user_limit integer DEFAULT 5,
    primary_contact_email character varying,
    billing_email character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by_user_id integer,
    is_deleted boolean DEFAULT false,
    deleted_at timestamp without time zone,
    billing_plan_id integer,
    subscription_start_date timestamp without time zone,
    subscription_end_date timestamp without time zone,
    trial_end_date timestamp without time zone,
    storage_used_mb integer DEFAULT 0 NOT NULL,
    api_calls_this_month integer DEFAULT 0 NOT NULL,
    updated_at timestamp without time zone
);


--
-- Name: companies_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.companies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: companies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.companies_id_seq OWNED BY public.companies.id;


--
-- Name: company_subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.company_subscriptions (
    id integer NOT NULL,
    company_id integer NOT NULL,
    billing_plan_id integer NOT NULL,
    start_date timestamp without time zone NOT NULL,
    end_date timestamp without time zone,
    status public.subscriptionstatus NOT NULL,
    payment_method jsonb,
    next_billing_date timestamp without time zone,
    cancellation_date timestamp without time zone,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


--
-- Name: company_subscriptions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.company_subscriptions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: company_subscriptions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.company_subscriptions_id_seq OWNED BY public.company_subscriptions.id;


--
-- Name: currencies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.currencies (
    id integer NOT NULL,
    company_id integer NOT NULL,
    code character varying(3) NOT NULL,
    name character varying NOT NULL,
    symbol character varying(5),
    exchange_rate_to_base numeric(15,6),
    is_base_currency boolean,
    is_active boolean
);


--
-- Name: currencies_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.currencies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: currencies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.currencies_id_seq OWNED BY public.currencies.id;


--
-- Name: customers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customers (
    id integer NOT NULL,
    company_id integer NOT NULL,
    customer_code character varying NOT NULL,
    name character varying NOT NULL,
    address jsonb,
    contact_info jsonb,
    payment_terms character varying,
    credit_limit numeric(15,2),
    current_balance numeric(15,2),
    sales_representative_id integer,
    default_ar_gl_account_id integer,
    is_active boolean,
    default_currency_id integer
);


--
-- Name: customers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.customers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: customers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.customers_id_seq OWNED BY public.customers.id;


--
-- Name: exchange_rate_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.exchange_rate_history (
    id integer NOT NULL,
    company_id integer,
    currency_id integer,
    rate_date date,
    exchange_rate numeric(15,6),
    created_at timestamp without time zone
);


--
-- Name: exchange_rate_history_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.exchange_rate_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: exchange_rate_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.exchange_rate_history_id_seq OWNED BY public.exchange_rate_history.id;


--
-- Name: feature_flags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.feature_flags (
    id integer NOT NULL,
    name character varying NOT NULL,
    description character varying,
    is_enabled boolean NOT NULL,
    enabled_for_companies integer[],
    enabled_for_plans character varying[],
    configuration jsonb,
    created_by_admin_id integer,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


--
-- Name: feature_flags_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.feature_flags_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: feature_flags_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.feature_flags_id_seq OWNED BY public.feature_flags.id;


--
-- Name: forex_gain_loss; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.forex_gain_loss (
    id integer NOT NULL,
    company_id integer,
    transaction_type character varying,
    transaction_id integer,
    gain_loss_amount numeric(15,2),
    gl_journal_entry_id integer
);


--
-- Name: forex_gain_loss_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.forex_gain_loss_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: forex_gain_loss_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.forex_gain_loss_id_seq OWNED BY public.forex_gain_loss.id;


--
-- Name: gl_accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.gl_accounts (
    id integer NOT NULL,
    company_id integer NOT NULL,
    account_code character varying NOT NULL,
    account_name character varying NOT NULL,
    account_type character varying NOT NULL,
    parent_account_id integer,
    current_balance numeric(15,2),
    is_active boolean,
    is_control_account boolean
);


--
-- Name: gl_accounts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.gl_accounts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: gl_accounts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.gl_accounts_id_seq OWNED BY public.gl_accounts.id;


--
-- Name: gl_defaults; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.gl_defaults (
    id integer NOT NULL,
    company_id integer NOT NULL,
    retained_earnings_account_id integer,
    default_cash_account_id integer,
    default_ar_control_account_id integer,
    default_ap_control_account_id integer,
    forex_gain_account_id integer,
    forex_loss_account_id integer
);


--
-- Name: gl_defaults_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.gl_defaults_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: gl_defaults_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.gl_defaults_id_seq OWNED BY public.gl_defaults.id;


--
-- Name: gl_journal_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.gl_journal_entries (
    id integer NOT NULL,
    company_id integer NOT NULL,
    entry_date date NOT NULL,
    reference character varying,
    description character varying,
    posted_by_user_id integer NOT NULL,
    status character varying NOT NULL,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


--
-- Name: gl_journal_entries_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.gl_journal_entries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: gl_journal_entries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.gl_journal_entries_id_seq OWNED BY public.gl_journal_entries.id;


--
-- Name: gl_journal_entry_lines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.gl_journal_entry_lines (
    id integer NOT NULL,
    journal_entry_id integer NOT NULL,
    gl_account_id integer NOT NULL,
    description character varying,
    debit_amount numeric(15,2),
    credit_amount numeric(15,2),
    currency_id integer,
    exchange_rate numeric(15,6),
    foreign_currency_debit_amount numeric(15,2),
    foreign_currency_credit_amount numeric(15,2)
);


--
-- Name: gl_journal_entry_lines_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.gl_journal_entry_lines_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: gl_journal_entry_lines_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.gl_journal_entry_lines_id_seq OWNED BY public.gl_journal_entry_lines.id;


--
-- Name: gl_transaction_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.gl_transaction_types (
    id integer NOT NULL,
    company_id integer NOT NULL,
    name character varying NOT NULL,
    description character varying,
    default_debit_account_id integer,
    default_credit_account_id integer,
    is_active boolean
);


--
-- Name: gl_transaction_types_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.gl_transaction_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: gl_transaction_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.gl_transaction_types_id_seq OWNED BY public.gl_transaction_types.id;


--
-- Name: goods_received_voucher_lines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.goods_received_voucher_lines (
    id integer NOT NULL,
    grv_id integer NOT NULL,
    purchase_order_line_id integer,
    item_id integer NOT NULL,
    description character varying NOT NULL,
    quantity_received numeric NOT NULL,
    unit_cost numeric NOT NULL,
    line_total numeric NOT NULL
);


--
-- Name: goods_received_voucher_lines_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.goods_received_voucher_lines_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: goods_received_voucher_lines_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.goods_received_voucher_lines_id_seq OWNED BY public.goods_received_voucher_lines.id;


--
-- Name: goods_received_vouchers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.goods_received_vouchers (
    id integer NOT NULL,
    company_id integer NOT NULL,
    purchase_order_id integer,
    supplier_id integer NOT NULL,
    grv_date date NOT NULL,
    reference character varying,
    document_number character varying NOT NULL,
    status character varying NOT NULL,
    notes text,
    ap_invoice_id integer
);


--
-- Name: goods_received_vouchers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.goods_received_vouchers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: goods_received_vouchers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.goods_received_vouchers_id_seq OWNED BY public.goods_received_vouchers.id;


--
-- Name: inventory_count_lines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inventory_count_lines (
    id integer NOT NULL,
    inventory_count_session_id integer NOT NULL,
    item_id integer NOT NULL,
    system_quantity numeric NOT NULL,
    counted_quantity numeric,
    variance_quantity numeric
);


--
-- Name: inventory_count_lines_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.inventory_count_lines_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: inventory_count_lines_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.inventory_count_lines_id_seq OWNED BY public.inventory_count_lines.id;


--
-- Name: inventory_count_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inventory_count_sessions (
    id integer NOT NULL,
    company_id integer NOT NULL,
    warehouse_id integer NOT NULL,
    count_date date NOT NULL,
    status character varying NOT NULL,
    notes text
);


--
-- Name: inventory_count_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.inventory_count_sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: inventory_count_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.inventory_count_sessions_id_seq OWNED BY public.inventory_count_sessions.id;


--
-- Name: inventory_defaults; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inventory_defaults (
    id integer NOT NULL,
    company_id integer NOT NULL,
    default_warehouse_id integer,
    default_inventory_gl_account_id integer,
    default_cogs_gl_account_id integer,
    default_sales_revenue_gl_account_id integer,
    default_inventory_adjustment_gl_account_id integer
);


--
-- Name: inventory_defaults_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.inventory_defaults_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: inventory_defaults_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.inventory_defaults_id_seq OWNED BY public.inventory_defaults.id;


--
-- Name: inventory_item_locations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inventory_item_locations (
    id integer NOT NULL,
    company_id integer NOT NULL,
    item_id integer NOT NULL,
    warehouse_id integer NOT NULL,
    quantity_on_hand numeric,
    quantity_committed numeric,
    quantity_on_order numeric
);


--
-- Name: inventory_item_locations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.inventory_item_locations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: inventory_item_locations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.inventory_item_locations_id_seq OWNED BY public.inventory_item_locations.id;


--
-- Name: inventory_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inventory_items (
    id integer NOT NULL,
    company_id integer NOT NULL,
    item_code character varying NOT NULL,
    description character varying NOT NULL,
    item_type character varying NOT NULL,
    unit_of_measure_id integer NOT NULL,
    costing_method character varying,
    standard_cost numeric,
    average_cost numeric,
    selling_price numeric,
    is_active boolean,
    notes text,
    reorder_level numeric,
    reorder_quantity numeric,
    default_inventory_gl_account_id integer,
    default_cogs_gl_account_id integer,
    default_sales_gl_account_id integer,
    default_sales_tax_type_id integer,
    default_purchase_tax_type_id integer
);


--
-- Name: inventory_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.inventory_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: inventory_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.inventory_items_id_seq OWNED BY public.inventory_items.id;


--
-- Name: inventory_transaction_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inventory_transaction_types (
    id integer NOT NULL,
    company_id integer NOT NULL,
    name character varying NOT NULL,
    description character varying,
    base_type character varying NOT NULL,
    affects_quantity_direction character varying NOT NULL,
    default_offsetting_gl_account_id integer
);


--
-- Name: inventory_transaction_types_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.inventory_transaction_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: inventory_transaction_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.inventory_transaction_types_id_seq OWNED BY public.inventory_transaction_types.id;


--
-- Name: inventory_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inventory_transactions (
    id integer NOT NULL,
    company_id integer NOT NULL,
    item_id integer NOT NULL,
    warehouse_id integer NOT NULL,
    inventory_transaction_type_id integer NOT NULL,
    linked_gl_journal_entry_id integer,
    transaction_date date NOT NULL,
    quantity numeric NOT NULL,
    unit_cost numeric NOT NULL,
    total_value numeric NOT NULL,
    reference_document_type character varying,
    reference_document_id integer,
    notes text,
    currency_id integer,
    exchange_rate numeric(15,6),
    base_currency_unit_cost numeric(15,2),
    base_currency_total_value numeric(15,2),
    foreign_currency_unit_cost numeric(15,2),
    foreign_currency_total_value numeric(15,2)
);


--
-- Name: inventory_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.inventory_transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: inventory_transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.inventory_transactions_id_seq OWNED BY public.inventory_transactions.id;


--
-- Name: item_barcodes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.item_barcodes (
    id integer NOT NULL,
    company_id integer NOT NULL,
    item_id integer NOT NULL,
    barcode character varying NOT NULL,
    unit_of_measure_id integer,
    quantity_in_uom numeric
);


--
-- Name: item_barcodes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.item_barcodes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: item_barcodes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.item_barcodes_id_seq OWNED BY public.item_barcodes.id;


--
-- Name: manufacturing_order_components; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.manufacturing_order_components (
    id integer NOT NULL,
    manufacturing_order_id integer NOT NULL,
    component_item_id integer NOT NULL,
    quantity_required numeric NOT NULL,
    quantity_issued numeric,
    unit_cost numeric NOT NULL
);


--
-- Name: manufacturing_order_components_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.manufacturing_order_components_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: manufacturing_order_components_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.manufacturing_order_components_id_seq OWNED BY public.manufacturing_order_components.id;


--
-- Name: manufacturing_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.manufacturing_orders (
    id integer NOT NULL,
    company_id integer NOT NULL,
    order_number character varying NOT NULL,
    bom_header_id integer NOT NULL,
    warehouse_id integer NOT NULL,
    quantity_to_manufacture numeric NOT NULL,
    quantity_completed numeric,
    order_date timestamp without time zone,
    due_date timestamp without time zone,
    start_date timestamp without time zone,
    completion_date timestamp without time zone,
    status character varying,
    linked_gl_journal_entry_id integer,
    notes text
);


--
-- Name: manufacturing_orders_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.manufacturing_orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: manufacturing_orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.manufacturing_orders_id_seq OWNED BY public.manufacturing_orders.id;


--
-- Name: order_defaults; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_defaults (
    id integer NOT NULL,
    company_id integer NOT NULL,
    default_so_status character varying,
    default_po_status character varying,
    default_grv_status character varying,
    next_so_number integer,
    next_po_number integer,
    next_grv_number integer
);


--
-- Name: order_defaults_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.order_defaults_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: order_defaults_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.order_defaults_id_seq OWNED BY public.order_defaults.id;


--
-- Name: platform_admins; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.platform_admins (
    id integer NOT NULL,
    email character varying NOT NULL,
    hashed_password character varying NOT NULL,
    full_name character varying,
    is_active boolean NOT NULL,
    is_superadmin boolean NOT NULL,
    permissions jsonb,
    created_at timestamp without time zone NOT NULL,
    last_login timestamp without time zone
);


--
-- Name: platform_admins_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.platform_admins_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: platform_admins_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.platform_admins_id_seq OWNED BY public.platform_admins.id;


--
-- Name: platform_audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.platform_audit_logs (
    id integer NOT NULL,
    user_id integer NOT NULL,
    company_id integer,
    action character varying NOT NULL,
    resource_type character varying,
    resource_id integer,
    details jsonb,
    ip_address character varying,
    user_agent character varying,
    "timestamp" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: platform_audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.platform_audit_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: platform_audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.platform_audit_logs_id_seq OWNED BY public.platform_audit_logs.id;


--
-- Name: platform_invoices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.platform_invoices (
    id integer NOT NULL,
    company_id integer NOT NULL,
    subscription_id integer NOT NULL,
    invoice_number character varying NOT NULL,
    billing_period_start timestamp without time zone NOT NULL,
    billing_period_end timestamp without time zone NOT NULL,
    amount numeric(10,2) NOT NULL,
    tax_amount numeric(10,2) NOT NULL,
    total_amount numeric(10,2) NOT NULL,
    currency character varying(3) NOT NULL,
    status character varying NOT NULL,
    payment_date timestamp without time zone,
    payment_method character varying,
    payment_reference character varying,
    line_items jsonb NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


--
-- Name: platform_invoices_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.platform_invoices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: platform_invoices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.platform_invoices_id_seq OWNED BY public.platform_invoices.id;


--
-- Name: pos_cash_movements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pos_cash_movements (
    id integer NOT NULL,
    company_id integer NOT NULL,
    session_id integer NOT NULL,
    movement_type character varying NOT NULL,
    amount numeric(15,2) NOT NULL,
    reason character varying NOT NULL,
    reference character varying,
    movement_datetime timestamp without time zone NOT NULL,
    authorized_by_id integer
);


--
-- Name: pos_cash_movements_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pos_cash_movements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pos_cash_movements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pos_cash_movements_id_seq OWNED BY public.pos_cash_movements.id;


--
-- Name: pos_defaults; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pos_defaults (
    id integer NOT NULL,
    company_id integer NOT NULL,
    default_customer_id integer,
    default_tax_type_id integer,
    receipt_header text,
    receipt_footer text,
    enable_negative_stock boolean,
    require_customer_for_credit boolean,
    auto_print_receipt boolean,
    default_sale_transaction_type_id integer,
    default_return_transaction_type_id integer,
    cash_rounding_method character varying,
    next_transaction_number integer
);


--
-- Name: pos_defaults_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pos_defaults_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pos_defaults_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pos_defaults_id_seq OWNED BY public.pos_defaults.id;


--
-- Name: pos_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pos_sessions (
    id integer NOT NULL,
    company_id integer NOT NULL,
    till_id integer NOT NULL,
    cashier_id integer NOT NULL,
    session_date date NOT NULL,
    opening_time timestamp without time zone NOT NULL,
    closing_time timestamp without time zone,
    opening_cash numeric(15,2),
    closing_cash numeric(15,2),
    expected_cash numeric(15,2),
    cash_variance numeric(15,2),
    status character varying
);


--
-- Name: pos_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pos_sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pos_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pos_sessions_id_seq OWNED BY public.pos_sessions.id;


--
-- Name: pos_transaction_lines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pos_transaction_lines (
    id integer NOT NULL,
    transaction_id integer NOT NULL,
    item_id integer NOT NULL,
    barcode_used character varying,
    description character varying NOT NULL,
    quantity numeric(15,3) NOT NULL,
    unit_price numeric(15,2) NOT NULL,
    discount_percentage numeric(5,2),
    discount_amount numeric(15,2),
    tax_type_id integer,
    tax_amount numeric(15,2),
    line_total numeric(15,2) NOT NULL
);


--
-- Name: pos_transaction_lines_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pos_transaction_lines_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pos_transaction_lines_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pos_transaction_lines_id_seq OWNED BY public.pos_transaction_lines.id;


--
-- Name: pos_transaction_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pos_transaction_types (
    id integer NOT NULL,
    company_id integer NOT NULL,
    name character varying NOT NULL,
    description character varying,
    base_type character varying NOT NULL,
    affects_inventory boolean,
    affects_ar boolean,
    default_payment_method character varying,
    is_active boolean
);


--
-- Name: pos_transaction_types_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pos_transaction_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pos_transaction_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pos_transaction_types_id_seq OWNED BY public.pos_transaction_types.id;


--
-- Name: pos_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pos_transactions (
    id integer NOT NULL,
    company_id integer NOT NULL,
    session_id integer NOT NULL,
    transaction_type_id integer NOT NULL,
    transaction_number character varying NOT NULL,
    transaction_datetime timestamp without time zone NOT NULL,
    customer_id integer,
    payment_method character varying NOT NULL,
    subtotal_amount numeric(15,2) NOT NULL,
    tax_amount numeric(15,2),
    discount_amount numeric(15,2),
    total_amount numeric(15,2) NOT NULL,
    cash_tendered numeric(15,2),
    change_amount numeric(15,2),
    linked_gl_journal_entry_id integer,
    linked_ar_transaction_id integer,
    reference_transaction_id integer,
    status character varying,
    notes text
);


--
-- Name: pos_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pos_transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pos_transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pos_transactions_id_seq OWNED BY public.pos_transactions.id;


--
-- Name: purchase_order_lines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.purchase_order_lines (
    id integer NOT NULL,
    purchase_order_id integer NOT NULL,
    item_id integer NOT NULL,
    description character varying NOT NULL,
    quantity_ordered numeric NOT NULL,
    quantity_received numeric,
    unit_price numeric NOT NULL,
    discount_percentage numeric,
    tax_type_id integer,
    tax_amount numeric,
    line_total numeric NOT NULL,
    base_currency_tax_amount numeric(15,2)
);


--
-- Name: purchase_order_lines_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.purchase_order_lines_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: purchase_order_lines_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.purchase_order_lines_id_seq OWNED BY public.purchase_order_lines.id;


--
-- Name: purchase_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.purchase_orders (
    id integer NOT NULL,
    company_id integer NOT NULL,
    supplier_id integer NOT NULL,
    order_date date NOT NULL,
    expected_delivery_date date,
    reference character varying,
    document_number character varying NOT NULL,
    status character varying NOT NULL,
    total_amount numeric NOT NULL,
    notes text,
    delivery_address_warehouse_id integer NOT NULL,
    currency_id integer,
    exchange_rate numeric(15,6),
    base_currency_amount numeric(15,2),
    foreign_currency_amount numeric(15,2)
);


--
-- Name: purchase_orders_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.purchase_orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: purchase_orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.purchase_orders_id_seq OWNED BY public.purchase_orders.id;


--
-- Name: report_schedules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.report_schedules (
    id integer NOT NULL,
    company_id integer NOT NULL,
    name character varying NOT NULL,
    report_template_id integer NOT NULL,
    schedule_frequency character varying NOT NULL,
    schedule_parameters jsonb,
    is_active boolean,
    last_run_date timestamp without time zone,
    next_run_date timestamp without time zone
);


--
-- Name: report_schedules_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.report_schedules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: report_schedules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.report_schedules_id_seq OWNED BY public.report_schedules.id;


--
-- Name: report_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.report_templates (
    id integer NOT NULL,
    company_id integer NOT NULL,
    name character varying NOT NULL,
    report_type character varying NOT NULL,
    template_data jsonb NOT NULL,
    is_default boolean,
    is_active boolean,
    created_by_user_id integer NOT NULL,
    created_at timestamp without time zone
);


--
-- Name: report_templates_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.report_templates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: report_templates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.report_templates_id_seq OWNED BY public.report_templates.id;


--
-- Name: resource_usage; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.resource_usage (
    id integer NOT NULL,
    company_id integer NOT NULL,
    resource_type character varying NOT NULL,
    usage_amount numeric(10,2) NOT NULL,
    usage_date date NOT NULL,
    billing_period character varying NOT NULL,
    metadata jsonb
);


--
-- Name: resource_usage_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.resource_usage_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: resource_usage_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.resource_usage_id_seq OWNED BY public.resource_usage.id;


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    name character varying NOT NULL,
    description character varying,
    permissions jsonb,
    company_id integer NOT NULL
);


--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- Name: sales_order_lines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sales_order_lines (
    id integer NOT NULL,
    sales_order_id integer NOT NULL,
    item_id integer NOT NULL,
    description character varying NOT NULL,
    quantity_ordered numeric NOT NULL,
    quantity_invoiced numeric,
    unit_price numeric NOT NULL,
    discount_percentage numeric,
    tax_type_id integer,
    tax_amount numeric,
    line_total numeric NOT NULL,
    base_currency_tax_amount numeric(15,2)
);


--
-- Name: sales_order_lines_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sales_order_lines_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sales_order_lines_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sales_order_lines_id_seq OWNED BY public.sales_order_lines.id;


--
-- Name: sales_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sales_orders (
    id integer NOT NULL,
    company_id integer NOT NULL,
    customer_id integer NOT NULL,
    order_date date NOT NULL,
    reference character varying,
    document_number character varying NOT NULL,
    status character varying NOT NULL,
    total_amount numeric NOT NULL,
    notes text,
    shipping_address jsonb,
    billing_address jsonb,
    sales_representative_id integer,
    ar_invoice_id integer,
    currency_id integer,
    exchange_rate numeric(15,6),
    base_currency_amount numeric(15,2),
    foreign_currency_amount numeric(15,2)
);


--
-- Name: sales_orders_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sales_orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sales_orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sales_orders_id_seq OWNED BY public.sales_orders.id;


--
-- Name: sales_representatives; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sales_representatives (
    id integer NOT NULL,
    company_id integer NOT NULL,
    name character varying NOT NULL,
    contact_info jsonb,
    is_active boolean
);


--
-- Name: sales_representatives_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sales_representatives_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sales_representatives_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sales_representatives_id_seq OWNED BY public.sales_representatives.id;


--
-- Name: suppliers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.suppliers (
    id integer NOT NULL,
    company_id integer NOT NULL,
    supplier_code character varying NOT NULL,
    name character varying NOT NULL,
    address jsonb,
    contact_info jsonb,
    payment_terms character varying,
    current_balance numeric(15,2),
    default_ap_gl_account_id integer,
    is_active boolean,
    default_currency_id integer
);


--
-- Name: suppliers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.suppliers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: suppliers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.suppliers_id_seq OWNED BY public.suppliers.id;


--
-- Name: system_configurations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.system_configurations (
    id integer NOT NULL,
    key character varying NOT NULL,
    value jsonb NOT NULL,
    description character varying,
    is_sensitive boolean NOT NULL,
    updated_by_admin_id integer,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


--
-- Name: system_configurations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.system_configurations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: system_configurations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.system_configurations_id_seq OWNED BY public.system_configurations.id;


--
-- Name: system_health; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.system_health (
    id integer NOT NULL,
    metric_name character varying NOT NULL,
    value double precision NOT NULL,
    status character varying NOT NULL,
    details jsonb,
    recorded_at timestamp without time zone NOT NULL
);


--
-- Name: system_health_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.system_health_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: system_health_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.system_health_id_seq OWNED BY public.system_health.id;


--
-- Name: tax_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tax_types (
    id integer NOT NULL,
    company_id integer NOT NULL,
    name character varying NOT NULL,
    rate_percentage numeric(5,2) NOT NULL,
    tax_authority_gl_account_id integer,
    tax_code character varying,
    tax_nature character varying NOT NULL,
    is_active boolean
);


--
-- Name: tax_types_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tax_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tax_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tax_types_id_seq OWNED BY public.tax_types.id;


--
-- Name: tills; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tills (
    id integer NOT NULL,
    company_id integer NOT NULL,
    till_code character varying NOT NULL,
    till_name character varying NOT NULL,
    location character varying,
    default_cashier_id integer,
    default_warehouse_id integer NOT NULL,
    cash_gl_account_id integer NOT NULL,
    is_active boolean
);


--
-- Name: tills_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tills_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tills_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tills_id_seq OWNED BY public.tills.id;


--
-- Name: unit_of_measures; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.unit_of_measures (
    id integer NOT NULL,
    company_id integer NOT NULL,
    name character varying NOT NULL,
    abbreviation character varying NOT NULL,
    conversion_factor_to_base numeric,
    is_active boolean
);


--
-- Name: unit_of_measures_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.unit_of_measures_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: unit_of_measures_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.unit_of_measures_id_seq OWNED BY public.unit_of_measures.id;


--
-- Name: usage_alerts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usage_alerts (
    id integer NOT NULL,
    company_id integer NOT NULL,
    alert_type character varying NOT NULL,
    threshold_percentage double precision NOT NULL,
    is_active boolean,
    last_triggered timestamp without time zone,
    alert_recipients jsonb
);


--
-- Name: usage_alerts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.usage_alerts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: usage_alerts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.usage_alerts_id_seq OWNED BY public.usage_alerts.id;


--
-- Name: usage_metrics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usage_metrics (
    id integer NOT NULL,
    company_id integer NOT NULL,
    metric_type public.usagemetrictype NOT NULL,
    metric_name character varying,
    value numeric NOT NULL,
    unit character varying,
    recorded_at timestamp without time zone NOT NULL,
    billing_period timestamp without time zone NOT NULL,
    details jsonb
);


--
-- Name: usage_metrics_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.usage_metrics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: usage_metrics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.usage_metrics_id_seq OWNED BY public.usage_metrics.id;


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    user_id integer NOT NULL,
    role_id integer NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email character varying NOT NULL,
    hashed_password character varying NOT NULL,
    full_name character varying,
    is_active boolean,
    is_superuser boolean,
    company_id integer,
    user_type character varying NOT NULL,
    default_company_id integer,
    last_login timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    mfa_secret character varying,
    CONSTRAINT ck_company_required_for_non_platform_users CHECK ((((user_type)::text = 'platform_admin'::text) OR (company_id IS NOT NULL)))
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: warehouses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.warehouses (
    id integer NOT NULL,
    company_id integer NOT NULL,
    name character varying NOT NULL,
    location character varying,
    is_default boolean,
    is_active boolean
);


--
-- Name: warehouses_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.warehouses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: warehouses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.warehouses_id_seq OWNED BY public.warehouses.id;


--
-- Name: accounting_periods id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounting_periods ALTER COLUMN id SET DEFAULT nextval('public.accounting_periods_id_seq'::regclass);


--
-- Name: ap_allocation_lines id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ap_allocation_lines ALTER COLUMN id SET DEFAULT nextval('public.ap_allocation_lines_id_seq'::regclass);


--
-- Name: ap_allocations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ap_allocations ALTER COLUMN id SET DEFAULT nextval('public.ap_allocations_id_seq'::regclass);


--
-- Name: ap_defaults id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ap_defaults ALTER COLUMN id SET DEFAULT nextval('public.ap_defaults_id_seq'::regclass);


--
-- Name: ap_transaction_tax_lines id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ap_transaction_tax_lines ALTER COLUMN id SET DEFAULT nextval('public.ap_transaction_tax_lines_id_seq'::regclass);


--
-- Name: ap_transaction_types id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ap_transaction_types ALTER COLUMN id SET DEFAULT nextval('public.ap_transaction_types_id_seq'::regclass);


--
-- Name: ap_transactions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ap_transactions ALTER COLUMN id SET DEFAULT nextval('public.ap_transactions_id_seq'::regclass);


--
-- Name: ar_allocation_lines id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ar_allocation_lines ALTER COLUMN id SET DEFAULT nextval('public.ar_allocation_lines_id_seq'::regclass);


--
-- Name: ar_allocations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ar_allocations ALTER COLUMN id SET DEFAULT nextval('public.ar_allocations_id_seq'::regclass);


--
-- Name: ar_defaults id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ar_defaults ALTER COLUMN id SET DEFAULT nextval('public.ar_defaults_id_seq'::regclass);


--
-- Name: ar_transaction_tax_lines id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ar_transaction_tax_lines ALTER COLUMN id SET DEFAULT nextval('public.ar_transaction_tax_lines_id_seq'::regclass);


--
-- Name: ar_transaction_types id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ar_transaction_types ALTER COLUMN id SET DEFAULT nextval('public.ar_transaction_types_id_seq'::regclass);


--
-- Name: ar_transactions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ar_transactions ALTER COLUMN id SET DEFAULT nextval('public.ar_transactions_id_seq'::regclass);


--
-- Name: ar_writeoffs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ar_writeoffs ALTER COLUMN id SET DEFAULT nextval('public.ar_writeoffs_id_seq'::regclass);


--
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- Name: bank_reconciliation_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bank_reconciliation_items ALTER COLUMN id SET DEFAULT nextval('public.bank_reconciliation_items_id_seq'::regclass);


--
-- Name: bank_reconciliations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bank_reconciliations ALTER COLUMN id SET DEFAULT nextval('public.bank_reconciliations_id_seq'::regclass);


--
-- Name: billing_plans id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_plans ALTER COLUMN id SET DEFAULT nextval('public.billing_plans_id_seq'::regclass);


--
-- Name: billing_transactions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_transactions ALTER COLUMN id SET DEFAULT nextval('public.billing_transactions_id_seq'::regclass);


--
-- Name: bom_components id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bom_components ALTER COLUMN id SET DEFAULT nextval('public.bom_components_id_seq'::regclass);


--
-- Name: bom_defaults id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bom_defaults ALTER COLUMN id SET DEFAULT nextval('public.bom_defaults_id_seq'::regclass);


--
-- Name: bom_headers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bom_headers ALTER COLUMN id SET DEFAULT nextval('public.bom_headers_id_seq'::regclass);


--
-- Name: branches id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branches ALTER COLUMN id SET DEFAULT nextval('public.branches_id_seq'::regclass);


--
-- Name: companies id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.companies ALTER COLUMN id SET DEFAULT nextval('public.companies_id_seq'::regclass);


--
-- Name: company_subscriptions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_subscriptions ALTER COLUMN id SET DEFAULT nextval('public.company_subscriptions_id_seq'::regclass);


--
-- Name: currencies id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.currencies ALTER COLUMN id SET DEFAULT nextval('public.currencies_id_seq'::regclass);


--
-- Name: customers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers ALTER COLUMN id SET DEFAULT nextval('public.customers_id_seq'::regclass);


--
-- Name: exchange_rate_history id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exchange_rate_history ALTER COLUMN id SET DEFAULT nextval('public.exchange_rate_history_id_seq'::regclass);


--
-- Name: feature_flags id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feature_flags ALTER COLUMN id SET DEFAULT nextval('public.feature_flags_id_seq'::regclass);


--
-- Name: forex_gain_loss id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.forex_gain_loss ALTER COLUMN id SET DEFAULT nextval('public.forex_gain_loss_id_seq'::regclass);


--
-- Name: gl_accounts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gl_accounts ALTER COLUMN id SET DEFAULT nextval('public.gl_accounts_id_seq'::regclass);


--
-- Name: gl_defaults id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gl_defaults ALTER COLUMN id SET DEFAULT nextval('public.gl_defaults_id_seq'::regclass);


--
-- Name: gl_journal_entries id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gl_journal_entries ALTER COLUMN id SET DEFAULT nextval('public.gl_journal_entries_id_seq'::regclass);


--
-- Name: gl_journal_entry_lines id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gl_journal_entry_lines ALTER COLUMN id SET DEFAULT nextval('public.gl_journal_entry_lines_id_seq'::regclass);


--
-- Name: gl_transaction_types id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gl_transaction_types ALTER COLUMN id SET DEFAULT nextval('public.gl_transaction_types_id_seq'::regclass);


--
-- Name: goods_received_voucher_lines id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goods_received_voucher_lines ALTER COLUMN id SET DEFAULT nextval('public.goods_received_voucher_lines_id_seq'::regclass);


--
-- Name: goods_received_vouchers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goods_received_vouchers ALTER COLUMN id SET DEFAULT nextval('public.goods_received_vouchers_id_seq'::regclass);


--
-- Name: inventory_count_lines id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_count_lines ALTER COLUMN id SET DEFAULT nextval('public.inventory_count_lines_id_seq'::regclass);


--
-- Name: inventory_count_sessions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_count_sessions ALTER COLUMN id SET DEFAULT nextval('public.inventory_count_sessions_id_seq'::regclass);


--
-- Name: inventory_defaults id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_defaults ALTER COLUMN id SET DEFAULT nextval('public.inventory_defaults_id_seq'::regclass);


--
-- Name: inventory_item_locations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_item_locations ALTER COLUMN id SET DEFAULT nextval('public.inventory_item_locations_id_seq'::regclass);


--
-- Name: inventory_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_items ALTER COLUMN id SET DEFAULT nextval('public.inventory_items_id_seq'::regclass);


--
-- Name: inventory_transaction_types id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_transaction_types ALTER COLUMN id SET DEFAULT nextval('public.inventory_transaction_types_id_seq'::regclass);


--
-- Name: inventory_transactions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_transactions ALTER COLUMN id SET DEFAULT nextval('public.inventory_transactions_id_seq'::regclass);


--
-- Name: item_barcodes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item_barcodes ALTER COLUMN id SET DEFAULT nextval('public.item_barcodes_id_seq'::regclass);


--
-- Name: manufacturing_order_components id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.manufacturing_order_components ALTER COLUMN id SET DEFAULT nextval('public.manufacturing_order_components_id_seq'::regclass);


--
-- Name: manufacturing_orders id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.manufacturing_orders ALTER COLUMN id SET DEFAULT nextval('public.manufacturing_orders_id_seq'::regclass);


--
-- Name: order_defaults id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_defaults ALTER COLUMN id SET DEFAULT nextval('public.order_defaults_id_seq'::regclass);


--
-- Name: platform_admins id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.platform_admins ALTER COLUMN id SET DEFAULT nextval('public.platform_admins_id_seq'::regclass);


--
-- Name: platform_audit_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.platform_audit_logs ALTER COLUMN id SET DEFAULT nextval('public.platform_audit_logs_id_seq'::regclass);


--
-- Name: platform_invoices id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.platform_invoices ALTER COLUMN id SET DEFAULT nextval('public.platform_invoices_id_seq'::regclass);


--
-- Name: pos_cash_movements id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pos_cash_movements ALTER COLUMN id SET DEFAULT nextval('public.pos_cash_movements_id_seq'::regclass);


--
-- Name: pos_defaults id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pos_defaults ALTER COLUMN id SET DEFAULT nextval('public.pos_defaults_id_seq'::regclass);


--
-- Name: pos_sessions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pos_sessions ALTER COLUMN id SET DEFAULT nextval('public.pos_sessions_id_seq'::regclass);


--
-- Name: pos_transaction_lines id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pos_transaction_lines ALTER COLUMN id SET DEFAULT nextval('public.pos_transaction_lines_id_seq'::regclass);


--
-- Name: pos_transaction_types id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pos_transaction_types ALTER COLUMN id SET DEFAULT nextval('public.pos_transaction_types_id_seq'::regclass);


--
-- Name: pos_transactions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pos_transactions ALTER COLUMN id SET DEFAULT nextval('public.pos_transactions_id_seq'::regclass);


--
-- Name: purchase_order_lines id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_order_lines ALTER COLUMN id SET DEFAULT nextval('public.purchase_order_lines_id_seq'::regclass);


--
-- Name: purchase_orders id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_orders ALTER COLUMN id SET DEFAULT nextval('public.purchase_orders_id_seq'::regclass);


--
-- Name: report_schedules id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.report_schedules ALTER COLUMN id SET DEFAULT nextval('public.report_schedules_id_seq'::regclass);


--
-- Name: report_templates id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.report_templates ALTER COLUMN id SET DEFAULT nextval('public.report_templates_id_seq'::regclass);


--
-- Name: resource_usage id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resource_usage ALTER COLUMN id SET DEFAULT nextval('public.resource_usage_id_seq'::regclass);


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Name: sales_order_lines id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_order_lines ALTER COLUMN id SET DEFAULT nextval('public.sales_order_lines_id_seq'::regclass);


--
-- Name: sales_orders id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_orders ALTER COLUMN id SET DEFAULT nextval('public.sales_orders_id_seq'::regclass);


--
-- Name: sales_representatives id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_representatives ALTER COLUMN id SET DEFAULT nextval('public.sales_representatives_id_seq'::regclass);


--
-- Name: suppliers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suppliers ALTER COLUMN id SET DEFAULT nextval('public.suppliers_id_seq'::regclass);


--
-- Name: system_configurations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_configurations ALTER COLUMN id SET DEFAULT nextval('public.system_configurations_id_seq'::regclass);


--
-- Name: system_health id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_health ALTER COLUMN id SET DEFAULT nextval('public.system_health_id_seq'::regclass);


--
-- Name: tax_types id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tax_types ALTER COLUMN id SET DEFAULT nextval('public.tax_types_id_seq'::regclass);


--
-- Name: tills id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tills ALTER COLUMN id SET DEFAULT nextval('public.tills_id_seq'::regclass);


--
-- Name: unit_of_measures id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unit_of_measures ALTER COLUMN id SET DEFAULT nextval('public.unit_of_measures_id_seq'::regclass);


--
-- Name: usage_alerts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usage_alerts ALTER COLUMN id SET DEFAULT nextval('public.usage_alerts_id_seq'::regclass);


--
-- Name: usage_metrics id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usage_metrics ALTER COLUMN id SET DEFAULT nextval('public.usage_metrics_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: warehouses id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.warehouses ALTER COLUMN id SET DEFAULT nextval('public.warehouses_id_seq'::regclass);


--
-- Name: accounting_periods accounting_periods_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounting_periods
    ADD CONSTRAINT accounting_periods_pkey PRIMARY KEY (id);


--
-- Name: alembic_version alembic_version_pkc; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alembic_version
    ADD CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num);


--
-- Name: ap_allocation_lines ap_allocation_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ap_allocation_lines
    ADD CONSTRAINT ap_allocation_lines_pkey PRIMARY KEY (id);


--
-- Name: ap_allocations ap_allocations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ap_allocations
    ADD CONSTRAINT ap_allocations_pkey PRIMARY KEY (id);


--
-- Name: ap_defaults ap_defaults_company_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ap_defaults
    ADD CONSTRAINT ap_defaults_company_id_key UNIQUE (company_id);


--
-- Name: ap_defaults ap_defaults_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ap_defaults
    ADD CONSTRAINT ap_defaults_pkey PRIMARY KEY (id);


--
-- Name: ap_transaction_tax_lines ap_transaction_tax_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ap_transaction_tax_lines
    ADD CONSTRAINT ap_transaction_tax_lines_pkey PRIMARY KEY (id);


--
-- Name: ap_transaction_types ap_transaction_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ap_transaction_types
    ADD CONSTRAINT ap_transaction_types_pkey PRIMARY KEY (id);


--
-- Name: ap_transactions ap_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ap_transactions
    ADD CONSTRAINT ap_transactions_pkey PRIMARY KEY (id);


--
-- Name: ar_allocation_lines ar_allocation_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ar_allocation_lines
    ADD CONSTRAINT ar_allocation_lines_pkey PRIMARY KEY (id);


--
-- Name: ar_allocations ar_allocations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ar_allocations
    ADD CONSTRAINT ar_allocations_pkey PRIMARY KEY (id);


--
-- Name: ar_defaults ar_defaults_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ar_defaults
    ADD CONSTRAINT ar_defaults_pkey PRIMARY KEY (id);


--
-- Name: ar_transaction_tax_lines ar_transaction_tax_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ar_transaction_tax_lines
    ADD CONSTRAINT ar_transaction_tax_lines_pkey PRIMARY KEY (id);


--
-- Name: ar_transaction_types ar_transaction_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ar_transaction_types
    ADD CONSTRAINT ar_transaction_types_pkey PRIMARY KEY (id);


--
-- Name: ar_transactions ar_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ar_transactions
    ADD CONSTRAINT ar_transactions_pkey PRIMARY KEY (id);


--
-- Name: ar_writeoffs ar_writeoffs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ar_writeoffs
    ADD CONSTRAINT ar_writeoffs_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: bank_reconciliation_items bank_reconciliation_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bank_reconciliation_items
    ADD CONSTRAINT bank_reconciliation_items_pkey PRIMARY KEY (id);


--
-- Name: bank_reconciliations bank_reconciliations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bank_reconciliations
    ADD CONSTRAINT bank_reconciliations_pkey PRIMARY KEY (id);


--
-- Name: billing_configurations billing_configurations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_configurations
    ADD CONSTRAINT billing_configurations_pkey PRIMARY KEY (company_id);


--
-- Name: billing_plans billing_plans_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_plans
    ADD CONSTRAINT billing_plans_name_key UNIQUE (name);


--
-- Name: billing_plans billing_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_plans
    ADD CONSTRAINT billing_plans_pkey PRIMARY KEY (id);


--
-- Name: billing_transactions billing_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_transactions
    ADD CONSTRAINT billing_transactions_pkey PRIMARY KEY (id);


--
-- Name: bom_components bom_components_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bom_components
    ADD CONSTRAINT bom_components_pkey PRIMARY KEY (id);


--
-- Name: bom_defaults bom_defaults_company_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bom_defaults
    ADD CONSTRAINT bom_defaults_company_id_key UNIQUE (company_id);


--
-- Name: bom_defaults bom_defaults_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bom_defaults
    ADD CONSTRAINT bom_defaults_pkey PRIMARY KEY (id);


--
-- Name: bom_headers bom_headers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bom_headers
    ADD CONSTRAINT bom_headers_pkey PRIMARY KEY (id);


--
-- Name: branches branches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_pkey PRIMARY KEY (id);


--
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id);


--
-- Name: company_subscriptions company_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_subscriptions
    ADD CONSTRAINT company_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: currencies currencies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.currencies
    ADD CONSTRAINT currencies_pkey PRIMARY KEY (id);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: exchange_rate_history exchange_rate_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exchange_rate_history
    ADD CONSTRAINT exchange_rate_history_pkey PRIMARY KEY (id);


--
-- Name: feature_flags feature_flags_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feature_flags
    ADD CONSTRAINT feature_flags_name_key UNIQUE (name);


--
-- Name: feature_flags feature_flags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feature_flags
    ADD CONSTRAINT feature_flags_pkey PRIMARY KEY (id);


--
-- Name: forex_gain_loss forex_gain_loss_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.forex_gain_loss
    ADD CONSTRAINT forex_gain_loss_pkey PRIMARY KEY (id);


--
-- Name: gl_accounts gl_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gl_accounts
    ADD CONSTRAINT gl_accounts_pkey PRIMARY KEY (id);


--
-- Name: gl_defaults gl_defaults_company_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gl_defaults
    ADD CONSTRAINT gl_defaults_company_id_key UNIQUE (company_id);


--
-- Name: gl_defaults gl_defaults_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gl_defaults
    ADD CONSTRAINT gl_defaults_pkey PRIMARY KEY (id);


--
-- Name: gl_journal_entries gl_journal_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gl_journal_entries
    ADD CONSTRAINT gl_journal_entries_pkey PRIMARY KEY (id);


--
-- Name: gl_journal_entry_lines gl_journal_entry_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gl_journal_entry_lines
    ADD CONSTRAINT gl_journal_entry_lines_pkey PRIMARY KEY (id);


--
-- Name: gl_transaction_types gl_transaction_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gl_transaction_types
    ADD CONSTRAINT gl_transaction_types_pkey PRIMARY KEY (id);


--
-- Name: goods_received_voucher_lines goods_received_voucher_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goods_received_voucher_lines
    ADD CONSTRAINT goods_received_voucher_lines_pkey PRIMARY KEY (id);


--
-- Name: goods_received_vouchers goods_received_vouchers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goods_received_vouchers
    ADD CONSTRAINT goods_received_vouchers_pkey PRIMARY KEY (id);


--
-- Name: inventory_count_lines inventory_count_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_count_lines
    ADD CONSTRAINT inventory_count_lines_pkey PRIMARY KEY (id);


--
-- Name: inventory_count_sessions inventory_count_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_count_sessions
    ADD CONSTRAINT inventory_count_sessions_pkey PRIMARY KEY (id);


--
-- Name: inventory_defaults inventory_defaults_company_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_defaults
    ADD CONSTRAINT inventory_defaults_company_id_key UNIQUE (company_id);


--
-- Name: inventory_defaults inventory_defaults_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_defaults
    ADD CONSTRAINT inventory_defaults_pkey PRIMARY KEY (id);


--
-- Name: inventory_item_locations inventory_item_locations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_item_locations
    ADD CONSTRAINT inventory_item_locations_pkey PRIMARY KEY (id);


--
-- Name: inventory_items inventory_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_items
    ADD CONSTRAINT inventory_items_pkey PRIMARY KEY (id);


--
-- Name: inventory_transaction_types inventory_transaction_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_transaction_types
    ADD CONSTRAINT inventory_transaction_types_pkey PRIMARY KEY (id);


--
-- Name: inventory_transactions inventory_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT inventory_transactions_pkey PRIMARY KEY (id);


--
-- Name: item_barcodes item_barcodes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item_barcodes
    ADD CONSTRAINT item_barcodes_pkey PRIMARY KEY (id);


--
-- Name: manufacturing_order_components manufacturing_order_components_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.manufacturing_order_components
    ADD CONSTRAINT manufacturing_order_components_pkey PRIMARY KEY (id);


--
-- Name: manufacturing_orders manufacturing_orders_order_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.manufacturing_orders
    ADD CONSTRAINT manufacturing_orders_order_number_key UNIQUE (order_number);


--
-- Name: manufacturing_orders manufacturing_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.manufacturing_orders
    ADD CONSTRAINT manufacturing_orders_pkey PRIMARY KEY (id);


--
-- Name: order_defaults order_defaults_company_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_defaults
    ADD CONSTRAINT order_defaults_company_id_key UNIQUE (company_id);


--
-- Name: order_defaults order_defaults_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_defaults
    ADD CONSTRAINT order_defaults_pkey PRIMARY KEY (id);


--
-- Name: platform_admins platform_admins_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.platform_admins
    ADD CONSTRAINT platform_admins_pkey PRIMARY KEY (id);


--
-- Name: platform_audit_logs platform_audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.platform_audit_logs
    ADD CONSTRAINT platform_audit_logs_pkey PRIMARY KEY (id);


--
-- Name: platform_invoices platform_invoices_invoice_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.platform_invoices
    ADD CONSTRAINT platform_invoices_invoice_number_key UNIQUE (invoice_number);


--
-- Name: platform_invoices platform_invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.platform_invoices
    ADD CONSTRAINT platform_invoices_pkey PRIMARY KEY (id);


--
-- Name: pos_cash_movements pos_cash_movements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pos_cash_movements
    ADD CONSTRAINT pos_cash_movements_pkey PRIMARY KEY (id);


--
-- Name: pos_defaults pos_defaults_company_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pos_defaults
    ADD CONSTRAINT pos_defaults_company_id_key UNIQUE (company_id);


--
-- Name: pos_defaults pos_defaults_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pos_defaults
    ADD CONSTRAINT pos_defaults_pkey PRIMARY KEY (id);


--
-- Name: pos_sessions pos_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pos_sessions
    ADD CONSTRAINT pos_sessions_pkey PRIMARY KEY (id);


--
-- Name: pos_transaction_lines pos_transaction_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pos_transaction_lines
    ADD CONSTRAINT pos_transaction_lines_pkey PRIMARY KEY (id);


--
-- Name: pos_transaction_types pos_transaction_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pos_transaction_types
    ADD CONSTRAINT pos_transaction_types_pkey PRIMARY KEY (id);


--
-- Name: pos_transactions pos_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pos_transactions
    ADD CONSTRAINT pos_transactions_pkey PRIMARY KEY (id);


--
-- Name: purchase_order_lines purchase_order_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_order_lines
    ADD CONSTRAINT purchase_order_lines_pkey PRIMARY KEY (id);


--
-- Name: purchase_orders purchase_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_pkey PRIMARY KEY (id);


--
-- Name: report_schedules report_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.report_schedules
    ADD CONSTRAINT report_schedules_pkey PRIMARY KEY (id);


--
-- Name: report_templates report_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.report_templates
    ADD CONSTRAINT report_templates_pkey PRIMARY KEY (id);


--
-- Name: resource_usage resource_usage_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resource_usage
    ADD CONSTRAINT resource_usage_pkey PRIMARY KEY (id);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: sales_order_lines sales_order_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_order_lines
    ADD CONSTRAINT sales_order_lines_pkey PRIMARY KEY (id);


--
-- Name: sales_orders sales_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_orders
    ADD CONSTRAINT sales_orders_pkey PRIMARY KEY (id);


--
-- Name: sales_representatives sales_representatives_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_representatives
    ADD CONSTRAINT sales_representatives_pkey PRIMARY KEY (id);


--
-- Name: suppliers suppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_pkey PRIMARY KEY (id);


--
-- Name: system_configurations system_configurations_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_configurations
    ADD CONSTRAINT system_configurations_key_key UNIQUE (key);


--
-- Name: system_configurations system_configurations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_configurations
    ADD CONSTRAINT system_configurations_pkey PRIMARY KEY (id);


--
-- Name: system_health system_health_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_health
    ADD CONSTRAINT system_health_pkey PRIMARY KEY (id);


--
-- Name: tax_types tax_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tax_types
    ADD CONSTRAINT tax_types_pkey PRIMARY KEY (id);


--
-- Name: tills tills_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tills
    ADD CONSTRAINT tills_pkey PRIMARY KEY (id);


--
-- Name: unit_of_measures unit_of_measures_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unit_of_measures
    ADD CONSTRAINT unit_of_measures_pkey PRIMARY KEY (id);


--
-- Name: accounting_periods uq_accountingperiod_name_company; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounting_periods
    ADD CONSTRAINT uq_accountingperiod_name_company UNIQUE (name, company_id);


--
-- Name: ap_transactions uq_ap_doc_number_company_type; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ap_transactions
    ADD CONSTRAINT uq_ap_doc_number_company_type UNIQUE (document_number, company_id, ap_transaction_type_id);


--
-- Name: ap_transaction_types uq_aptransactiontype_name_company; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ap_transaction_types
    ADD CONSTRAINT uq_aptransactiontype_name_company UNIQUE (name, company_id);


--
-- Name: ar_defaults uq_ar_defaults_company_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ar_defaults
    ADD CONSTRAINT uq_ar_defaults_company_id UNIQUE (company_id);


--
-- Name: ar_transactions uq_ar_doc_number_company_type; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ar_transactions
    ADD CONSTRAINT uq_ar_doc_number_company_type UNIQUE (document_number, company_id, ar_transaction_type_id);


--
-- Name: ar_transaction_types uq_artransactiontype_name_company; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ar_transaction_types
    ADD CONSTRAINT uq_artransactiontype_name_company UNIQUE (name, company_id);


--
-- Name: bom_headers uq_bom_code_company; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bom_headers
    ADD CONSTRAINT uq_bom_code_company UNIQUE (bom_code, company_id);


--
-- Name: bom_headers uq_bom_item_revision_company; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bom_headers
    ADD CONSTRAINT uq_bom_item_revision_company UNIQUE (parent_item_id, revision, company_id);


--
-- Name: branches uq_branch_name_company; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT uq_branch_name_company UNIQUE (name, company_id);


--
-- Name: companies uq_company_code; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT uq_company_code UNIQUE (code);


--
-- Name: currencies uq_currency_code_company; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.currencies
    ADD CONSTRAINT uq_currency_code_company UNIQUE (code, company_id);


--
-- Name: customers uq_customer_code_company; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT uq_customer_code_company UNIQUE (customer_code, company_id);


--
-- Name: exchange_rate_history uq_exchange_rate_date; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exchange_rate_history
    ADD CONSTRAINT uq_exchange_rate_date UNIQUE (currency_id, rate_date, company_id);


--
-- Name: gl_accounts uq_glaccount_code_company; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gl_accounts
    ADD CONSTRAINT uq_glaccount_code_company UNIQUE (account_code, company_id);


--
-- Name: gl_transaction_types uq_gltransactiontype_name_company; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gl_transaction_types
    ADD CONSTRAINT uq_gltransactiontype_name_company UNIQUE (name, company_id);


--
-- Name: inventory_items uq_inventoryitem_code_company; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_items
    ADD CONSTRAINT uq_inventoryitem_code_company UNIQUE (item_code, company_id);


--
-- Name: inventory_transaction_types uq_invtranstype_name_company; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_transaction_types
    ADD CONSTRAINT uq_invtranstype_name_company UNIQUE (name, company_id);


--
-- Name: inventory_item_locations uq_item_warehouse_company; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_item_locations
    ADD CONSTRAINT uq_item_warehouse_company UNIQUE (item_id, warehouse_id, company_id);


--
-- Name: item_barcodes uq_itembarcode_company; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item_barcodes
    ADD CONSTRAINT uq_itembarcode_company UNIQUE (barcode, company_id);


--
-- Name: pos_transactions uq_postrans_number_company; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pos_transactions
    ADD CONSTRAINT uq_postrans_number_company UNIQUE (transaction_number, company_id);


--
-- Name: pos_transaction_types uq_postranstype_name_company; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pos_transaction_types
    ADD CONSTRAINT uq_postranstype_name_company UNIQUE (name, company_id);


--
-- Name: roles uq_role_name_company; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT uq_role_name_company UNIQUE (name, company_id);


--
-- Name: suppliers uq_supplier_code_company; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT uq_supplier_code_company UNIQUE (supplier_code, company_id);


--
-- Name: tax_types uq_taxtype_name_company; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tax_types
    ADD CONSTRAINT uq_taxtype_name_company UNIQUE (name, company_id);


--
-- Name: tills uq_till_code_company; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tills
    ADD CONSTRAINT uq_till_code_company UNIQUE (till_code, company_id);


--
-- Name: unit_of_measures uq_uom_name_company; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unit_of_measures
    ADD CONSTRAINT uq_uom_name_company UNIQUE (name, company_id);


--
-- Name: resource_usage uq_usage_company_resource_date; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resource_usage
    ADD CONSTRAINT uq_usage_company_resource_date UNIQUE (company_id, resource_type, usage_date);


--
-- Name: warehouses uq_warehouse_name_company; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.warehouses
    ADD CONSTRAINT uq_warehouse_name_company UNIQUE (name, company_id);


--
-- Name: ar_writeoffs uq_writeoff_document_company; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ar_writeoffs
    ADD CONSTRAINT uq_writeoff_document_company UNIQUE (document_number, company_id);


--
-- Name: usage_alerts usage_alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usage_alerts
    ADD CONSTRAINT usage_alerts_pkey PRIMARY KEY (id);


--
-- Name: usage_metrics usage_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usage_metrics
    ADD CONSTRAINT usage_metrics_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (user_id, role_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: warehouses warehouses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.warehouses
    ADD CONSTRAINT warehouses_pkey PRIMARY KEY (id);


--
-- Name: idx_billing_transaction_company_period; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_billing_transaction_company_period ON public.billing_transactions USING btree (company_id, billing_period);


--
-- Name: idx_platform_audit_company_timestamp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_platform_audit_company_timestamp ON public.platform_audit_logs USING btree (company_id, "timestamp");


--
-- Name: idx_platform_audit_logs_action; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_platform_audit_logs_action ON public.platform_audit_logs USING btree (action);


--
-- Name: idx_platform_audit_logs_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_platform_audit_logs_company_id ON public.platform_audit_logs USING btree (company_id);


--
-- Name: idx_platform_audit_logs_timestamp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_platform_audit_logs_timestamp ON public.platform_audit_logs USING btree ("timestamp");


--
-- Name: idx_platform_audit_logs_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_platform_audit_logs_user_id ON public.platform_audit_logs USING btree (user_id);


--
-- Name: idx_platform_audit_user_timestamp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_platform_audit_user_timestamp ON public.platform_audit_logs USING btree (user_id, "timestamp");


--
-- Name: idx_resource_usage_billing_period; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_resource_usage_billing_period ON public.resource_usage USING btree (billing_period);


--
-- Name: idx_resource_usage_company_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_resource_usage_company_date ON public.resource_usage USING btree (company_id, usage_date);


--
-- Name: ix_accounting_periods_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_accounting_periods_id ON public.accounting_periods USING btree (id);


--
-- Name: ix_ap_allocation_lines_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_ap_allocation_lines_id ON public.ap_allocation_lines USING btree (id);


--
-- Name: ix_ap_allocations_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_ap_allocations_id ON public.ap_allocations USING btree (id);


--
-- Name: ix_ap_defaults_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_ap_defaults_id ON public.ap_defaults USING btree (id);


--
-- Name: ix_ap_transaction_types_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_ap_transaction_types_id ON public.ap_transaction_types USING btree (id);


--
-- Name: ix_ap_transactions_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_ap_transactions_id ON public.ap_transactions USING btree (id);


--
-- Name: ix_ar_allocation_lines_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_ar_allocation_lines_id ON public.ar_allocation_lines USING btree (id);


--
-- Name: ix_ar_allocations_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_ar_allocations_id ON public.ar_allocations USING btree (id);


--
-- Name: ix_ar_defaults_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_ar_defaults_id ON public.ar_defaults USING btree (id);


--
-- Name: ix_ar_transaction_types_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_ar_transaction_types_id ON public.ar_transaction_types USING btree (id);


--
-- Name: ix_ar_transactions_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_ar_transactions_id ON public.ar_transactions USING btree (id);


--
-- Name: ix_ar_writeoffs_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_ar_writeoffs_id ON public.ar_writeoffs USING btree (id);


--
-- Name: ix_audit_logs_action_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_audit_logs_action_type ON public.audit_logs USING btree (action_type);


--
-- Name: ix_audit_logs_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_audit_logs_company_id ON public.audit_logs USING btree (company_id);


--
-- Name: ix_audit_logs_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_audit_logs_created_at ON public.audit_logs USING btree (created_at);


--
-- Name: ix_audit_logs_entity_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_audit_logs_entity_type ON public.audit_logs USING btree (entity_type);


--
-- Name: ix_audit_logs_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_audit_logs_id ON public.audit_logs USING btree (id);


--
-- Name: ix_bank_reconciliation_items_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_bank_reconciliation_items_id ON public.bank_reconciliation_items USING btree (id);


--
-- Name: ix_bank_reconciliations_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_bank_reconciliations_id ON public.bank_reconciliations USING btree (id);


--
-- Name: ix_billing_plans_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_billing_plans_id ON public.billing_plans USING btree (id);


--
-- Name: ix_bom_components_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_bom_components_id ON public.bom_components USING btree (id);


--
-- Name: ix_bom_defaults_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_bom_defaults_id ON public.bom_defaults USING btree (id);


--
-- Name: ix_bom_headers_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_bom_headers_id ON public.bom_headers USING btree (id);


--
-- Name: ix_branches_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_branches_id ON public.branches USING btree (id);


--
-- Name: ix_companies_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_companies_id ON public.companies USING btree (id);


--
-- Name: ix_companies_name; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_companies_name ON public.companies USING btree (name);


--
-- Name: ix_company_subscriptions_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_company_subscriptions_company_id ON public.company_subscriptions USING btree (company_id);


--
-- Name: ix_company_subscriptions_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_company_subscriptions_id ON public.company_subscriptions USING btree (id);


--
-- Name: ix_currencies_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_currencies_id ON public.currencies USING btree (id);


--
-- Name: ix_customers_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_customers_id ON public.customers USING btree (id);


--
-- Name: ix_feature_flags_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_feature_flags_id ON public.feature_flags USING btree (id);


--
-- Name: ix_gl_accounts_account_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_gl_accounts_account_code ON public.gl_accounts USING btree (account_code);


--
-- Name: ix_gl_accounts_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_gl_accounts_id ON public.gl_accounts USING btree (id);


--
-- Name: ix_gl_defaults_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_gl_defaults_id ON public.gl_defaults USING btree (id);


--
-- Name: ix_gl_journal_entries_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_gl_journal_entries_id ON public.gl_journal_entries USING btree (id);


--
-- Name: ix_gl_journal_entry_lines_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_gl_journal_entry_lines_id ON public.gl_journal_entry_lines USING btree (id);


--
-- Name: ix_gl_transaction_types_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_gl_transaction_types_id ON public.gl_transaction_types USING btree (id);


--
-- Name: ix_goods_received_voucher_lines_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_goods_received_voucher_lines_id ON public.goods_received_voucher_lines USING btree (id);


--
-- Name: ix_goods_received_vouchers_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_goods_received_vouchers_id ON public.goods_received_vouchers USING btree (id);


--
-- Name: ix_inventory_count_lines_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_inventory_count_lines_id ON public.inventory_count_lines USING btree (id);


--
-- Name: ix_inventory_count_sessions_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_inventory_count_sessions_id ON public.inventory_count_sessions USING btree (id);


--
-- Name: ix_inventory_defaults_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_inventory_defaults_id ON public.inventory_defaults USING btree (id);


--
-- Name: ix_inventory_item_locations_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_inventory_item_locations_id ON public.inventory_item_locations USING btree (id);


--
-- Name: ix_inventory_items_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_inventory_items_id ON public.inventory_items USING btree (id);


--
-- Name: ix_inventory_transaction_types_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_inventory_transaction_types_id ON public.inventory_transaction_types USING btree (id);


--
-- Name: ix_inventory_transactions_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_inventory_transactions_id ON public.inventory_transactions USING btree (id);


--
-- Name: ix_item_barcodes_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_item_barcodes_id ON public.item_barcodes USING btree (id);


--
-- Name: ix_manufacturing_order_components_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_manufacturing_order_components_id ON public.manufacturing_order_components USING btree (id);


--
-- Name: ix_manufacturing_orders_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_manufacturing_orders_id ON public.manufacturing_orders USING btree (id);


--
-- Name: ix_order_defaults_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_order_defaults_id ON public.order_defaults USING btree (id);


--
-- Name: ix_platform_admins_email; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_platform_admins_email ON public.platform_admins USING btree (email);


--
-- Name: ix_platform_admins_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_platform_admins_id ON public.platform_admins USING btree (id);


--
-- Name: ix_platform_invoices_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_platform_invoices_company_id ON public.platform_invoices USING btree (company_id);


--
-- Name: ix_platform_invoices_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_platform_invoices_id ON public.platform_invoices USING btree (id);


--
-- Name: ix_pos_cash_movements_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_pos_cash_movements_id ON public.pos_cash_movements USING btree (id);


--
-- Name: ix_pos_defaults_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_pos_defaults_id ON public.pos_defaults USING btree (id);


--
-- Name: ix_pos_sessions_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_pos_sessions_id ON public.pos_sessions USING btree (id);


--
-- Name: ix_pos_transaction_lines_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_pos_transaction_lines_id ON public.pos_transaction_lines USING btree (id);


--
-- Name: ix_pos_transaction_types_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_pos_transaction_types_id ON public.pos_transaction_types USING btree (id);


--
-- Name: ix_pos_transactions_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_pos_transactions_id ON public.pos_transactions USING btree (id);


--
-- Name: ix_purchase_order_lines_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_purchase_order_lines_id ON public.purchase_order_lines USING btree (id);


--
-- Name: ix_purchase_orders_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_purchase_orders_id ON public.purchase_orders USING btree (id);


--
-- Name: ix_report_schedules_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_report_schedules_id ON public.report_schedules USING btree (id);


--
-- Name: ix_report_templates_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_report_templates_id ON public.report_templates USING btree (id);


--
-- Name: ix_roles_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_roles_id ON public.roles USING btree (id);


--
-- Name: ix_roles_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_roles_name ON public.roles USING btree (name);


--
-- Name: ix_sales_order_lines_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_sales_order_lines_id ON public.sales_order_lines USING btree (id);


--
-- Name: ix_sales_orders_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_sales_orders_id ON public.sales_orders USING btree (id);


--
-- Name: ix_sales_representatives_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_sales_representatives_id ON public.sales_representatives USING btree (id);


--
-- Name: ix_suppliers_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_suppliers_id ON public.suppliers USING btree (id);


--
-- Name: ix_system_configurations_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_system_configurations_id ON public.system_configurations USING btree (id);


--
-- Name: ix_system_health_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_system_health_id ON public.system_health USING btree (id);


--
-- Name: ix_system_health_metric_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_system_health_metric_name ON public.system_health USING btree (metric_name);


--
-- Name: ix_system_health_recorded_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_system_health_recorded_at ON public.system_health USING btree (recorded_at);


--
-- Name: ix_tax_types_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_tax_types_id ON public.tax_types USING btree (id);


--
-- Name: ix_tills_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_tills_id ON public.tills USING btree (id);


--
-- Name: ix_unit_of_measures_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_unit_of_measures_id ON public.unit_of_measures USING btree (id);


--
-- Name: ix_usage_metrics_billing_period; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_usage_metrics_billing_period ON public.usage_metrics USING btree (billing_period);


--
-- Name: ix_usage_metrics_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_usage_metrics_company_id ON public.usage_metrics USING btree (company_id);


--
-- Name: ix_usage_metrics_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_usage_metrics_id ON public.usage_metrics USING btree (id);


--
-- Name: ix_usage_metrics_metric_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_usage_metrics_metric_type ON public.usage_metrics USING btree (metric_type);


--
-- Name: ix_usage_metrics_recorded_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_usage_metrics_recorded_at ON public.usage_metrics USING btree (recorded_at);


--
-- Name: ix_users_email; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_users_email ON public.users USING btree (email);


--
-- Name: ix_users_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_users_id ON public.users USING btree (id);


--
-- Name: ix_warehouses_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_warehouses_id ON public.warehouses USING btree (id);


--
-- Name: accounting_periods accounting_periods_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounting_periods
    ADD CONSTRAINT accounting_periods_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: ap_allocation_lines ap_allocation_lines_ap_allocation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ap_allocation_lines
    ADD CONSTRAINT ap_allocation_lines_ap_allocation_id_fkey FOREIGN KEY (ap_allocation_id) REFERENCES public.ap_allocations(id);


--
-- Name: ap_allocation_lines ap_allocation_lines_credit_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ap_allocation_lines
    ADD CONSTRAINT ap_allocation_lines_credit_transaction_id_fkey FOREIGN KEY (credit_transaction_id) REFERENCES public.ap_transactions(id);


--
-- Name: ap_allocation_lines ap_allocation_lines_debit_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ap_allocation_lines
    ADD CONSTRAINT ap_allocation_lines_debit_transaction_id_fkey FOREIGN KEY (debit_transaction_id) REFERENCES public.ap_transactions(id);


--
-- Name: ap_allocations ap_allocations_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ap_allocations
    ADD CONSTRAINT ap_allocations_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: ap_allocations ap_allocations_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ap_allocations
    ADD CONSTRAINT ap_allocations_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);


--
-- Name: ap_defaults ap_defaults_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ap_defaults
    ADD CONSTRAINT ap_defaults_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: ap_defaults ap_defaults_default_ap_control_gl_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ap_defaults
    ADD CONSTRAINT ap_defaults_default_ap_control_gl_account_id_fkey FOREIGN KEY (default_ap_control_gl_account_id) REFERENCES public.gl_accounts(id);


--
-- Name: ap_defaults ap_defaults_default_expense_gl_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ap_defaults
    ADD CONSTRAINT ap_defaults_default_expense_gl_account_id_fkey FOREIGN KEY (default_expense_gl_account_id) REFERENCES public.gl_accounts(id);


--
-- Name: ap_defaults ap_defaults_default_payment_gl_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ap_defaults
    ADD CONSTRAINT ap_defaults_default_payment_gl_account_id_fkey FOREIGN KEY (default_payment_gl_account_id) REFERENCES public.gl_accounts(id);


--
-- Name: ap_defaults ap_defaults_default_purchase_discount_gl_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ap_defaults
    ADD CONSTRAINT ap_defaults_default_purchase_discount_gl_account_id_fkey FOREIGN KEY (default_purchase_discount_gl_account_id) REFERENCES public.gl_accounts(id);


--
-- Name: ap_transaction_tax_lines ap_transaction_tax_lines_ap_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ap_transaction_tax_lines
    ADD CONSTRAINT ap_transaction_tax_lines_ap_transaction_id_fkey FOREIGN KEY (ap_transaction_id) REFERENCES public.ap_transactions(id);


--
-- Name: ap_transaction_tax_lines ap_transaction_tax_lines_tax_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ap_transaction_tax_lines
    ADD CONSTRAINT ap_transaction_tax_lines_tax_type_id_fkey FOREIGN KEY (tax_type_id) REFERENCES public.tax_types(id);


--
-- Name: ap_transaction_types ap_transaction_types_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ap_transaction_types
    ADD CONSTRAINT ap_transaction_types_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: ap_transaction_types ap_transaction_types_default_ap_control_gl_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ap_transaction_types
    ADD CONSTRAINT ap_transaction_types_default_ap_control_gl_account_id_fkey FOREIGN KEY (default_ap_control_gl_account_id) REFERENCES public.gl_accounts(id);


--
-- Name: ap_transaction_types ap_transaction_types_default_gl_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ap_transaction_types
    ADD CONSTRAINT ap_transaction_types_default_gl_account_id_fkey FOREIGN KEY (default_gl_account_id) REFERENCES public.gl_accounts(id);


--
-- Name: ap_transactions ap_transactions_ap_transaction_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ap_transactions
    ADD CONSTRAINT ap_transactions_ap_transaction_type_id_fkey FOREIGN KEY (ap_transaction_type_id) REFERENCES public.ap_transaction_types(id);


--
-- Name: ap_transactions ap_transactions_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ap_transactions
    ADD CONSTRAINT ap_transactions_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: ap_transactions ap_transactions_currency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ap_transactions
    ADD CONSTRAINT ap_transactions_currency_id_fkey FOREIGN KEY (currency_id) REFERENCES public.currencies(id);


--
-- Name: ap_transactions ap_transactions_linked_gl_journal_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ap_transactions
    ADD CONSTRAINT ap_transactions_linked_gl_journal_entry_id_fkey FOREIGN KEY (linked_gl_journal_entry_id) REFERENCES public.gl_journal_entries(id);


--
-- Name: ap_transactions ap_transactions_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ap_transactions
    ADD CONSTRAINT ap_transactions_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);


--
-- Name: ar_allocation_lines ar_allocation_lines_ar_allocation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ar_allocation_lines
    ADD CONSTRAINT ar_allocation_lines_ar_allocation_id_fkey FOREIGN KEY (ar_allocation_id) REFERENCES public.ar_allocations(id);


--
-- Name: ar_allocation_lines ar_allocation_lines_credit_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ar_allocation_lines
    ADD CONSTRAINT ar_allocation_lines_credit_transaction_id_fkey FOREIGN KEY (credit_transaction_id) REFERENCES public.ar_transactions(id);


--
-- Name: ar_allocation_lines ar_allocation_lines_debit_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ar_allocation_lines
    ADD CONSTRAINT ar_allocation_lines_debit_transaction_id_fkey FOREIGN KEY (debit_transaction_id) REFERENCES public.ar_transactions(id);


--
-- Name: ar_allocations ar_allocations_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ar_allocations
    ADD CONSTRAINT ar_allocations_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: ar_allocations ar_allocations_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ar_allocations
    ADD CONSTRAINT ar_allocations_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: ar_defaults ar_defaults_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ar_defaults
    ADD CONSTRAINT ar_defaults_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: ar_defaults ar_defaults_default_ar_control_gl_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ar_defaults
    ADD CONSTRAINT ar_defaults_default_ar_control_gl_account_id_fkey FOREIGN KEY (default_ar_control_gl_account_id) REFERENCES public.gl_accounts(id);


--
-- Name: ar_defaults ar_defaults_default_bad_debt_gl_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ar_defaults
    ADD CONSTRAINT ar_defaults_default_bad_debt_gl_account_id_fkey FOREIGN KEY (default_bad_debt_gl_account_id) REFERENCES public.gl_accounts(id);


--
-- Name: ar_defaults ar_defaults_default_receipt_gl_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ar_defaults
    ADD CONSTRAINT ar_defaults_default_receipt_gl_account_id_fkey FOREIGN KEY (default_receipt_gl_account_id) REFERENCES public.gl_accounts(id);


--
-- Name: ar_defaults ar_defaults_default_sales_discount_gl_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ar_defaults
    ADD CONSTRAINT ar_defaults_default_sales_discount_gl_account_id_fkey FOREIGN KEY (default_sales_discount_gl_account_id) REFERENCES public.gl_accounts(id);


--
-- Name: ar_defaults ar_defaults_default_sales_gl_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ar_defaults
    ADD CONSTRAINT ar_defaults_default_sales_gl_account_id_fkey FOREIGN KEY (default_sales_gl_account_id) REFERENCES public.gl_accounts(id);


--
-- Name: ar_transaction_tax_lines ar_transaction_tax_lines_ar_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ar_transaction_tax_lines
    ADD CONSTRAINT ar_transaction_tax_lines_ar_transaction_id_fkey FOREIGN KEY (ar_transaction_id) REFERENCES public.ar_transactions(id);


--
-- Name: ar_transaction_tax_lines ar_transaction_tax_lines_tax_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ar_transaction_tax_lines
    ADD CONSTRAINT ar_transaction_tax_lines_tax_type_id_fkey FOREIGN KEY (tax_type_id) REFERENCES public.tax_types(id);


--
-- Name: ar_transaction_types ar_transaction_types_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ar_transaction_types
    ADD CONSTRAINT ar_transaction_types_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: ar_transaction_types ar_transaction_types_default_ar_control_gl_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ar_transaction_types
    ADD CONSTRAINT ar_transaction_types_default_ar_control_gl_account_id_fkey FOREIGN KEY (default_ar_control_gl_account_id) REFERENCES public.gl_accounts(id);


--
-- Name: ar_transaction_types ar_transaction_types_default_gl_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ar_transaction_types
    ADD CONSTRAINT ar_transaction_types_default_gl_account_id_fkey FOREIGN KEY (default_gl_account_id) REFERENCES public.gl_accounts(id);


--
-- Name: ar_transactions ar_transactions_ar_transaction_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ar_transactions
    ADD CONSTRAINT ar_transactions_ar_transaction_type_id_fkey FOREIGN KEY (ar_transaction_type_id) REFERENCES public.ar_transaction_types(id);


--
-- Name: ar_transactions ar_transactions_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ar_transactions
    ADD CONSTRAINT ar_transactions_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: ar_transactions ar_transactions_currency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ar_transactions
    ADD CONSTRAINT ar_transactions_currency_id_fkey FOREIGN KEY (currency_id) REFERENCES public.currencies(id);


--
-- Name: ar_transactions ar_transactions_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ar_transactions
    ADD CONSTRAINT ar_transactions_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: ar_transactions ar_transactions_linked_gl_journal_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ar_transactions
    ADD CONSTRAINT ar_transactions_linked_gl_journal_entry_id_fkey FOREIGN KEY (linked_gl_journal_entry_id) REFERENCES public.gl_journal_entries(id);


--
-- Name: ar_writeoffs ar_writeoffs_approved_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ar_writeoffs
    ADD CONSTRAINT ar_writeoffs_approved_by_user_id_fkey FOREIGN KEY (approved_by_user_id) REFERENCES public.users(id);


--
-- Name: ar_writeoffs ar_writeoffs_ar_transaction_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ar_writeoffs
    ADD CONSTRAINT ar_writeoffs_ar_transaction_type_id_fkey FOREIGN KEY (ar_transaction_type_id) REFERENCES public.ar_transaction_types(id);


--
-- Name: ar_writeoffs ar_writeoffs_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ar_writeoffs
    ADD CONSTRAINT ar_writeoffs_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: ar_writeoffs ar_writeoffs_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ar_writeoffs
    ADD CONSTRAINT ar_writeoffs_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: ar_writeoffs ar_writeoffs_linked_gl_journal_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ar_writeoffs
    ADD CONSTRAINT ar_writeoffs_linked_gl_journal_entry_id_fkey FOREIGN KEY (linked_gl_journal_entry_id) REFERENCES public.gl_journal_entries(id);


--
-- Name: ar_writeoffs ar_writeoffs_original_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ar_writeoffs
    ADD CONSTRAINT ar_writeoffs_original_invoice_id_fkey FOREIGN KEY (original_invoice_id) REFERENCES public.ar_transactions(id);


--
-- Name: ar_writeoffs ar_writeoffs_requested_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ar_writeoffs
    ADD CONSTRAINT ar_writeoffs_requested_by_user_id_fkey FOREIGN KEY (requested_by_user_id) REFERENCES public.users(id);


--
-- Name: audit_logs audit_logs_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.platform_admins(id);


--
-- Name: audit_logs audit_logs_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: bank_reconciliation_items bank_reconciliation_items_bank_reconciliation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bank_reconciliation_items
    ADD CONSTRAINT bank_reconciliation_items_bank_reconciliation_id_fkey FOREIGN KEY (bank_reconciliation_id) REFERENCES public.bank_reconciliations(id);


--
-- Name: bank_reconciliation_items bank_reconciliation_items_gl_journal_entry_line_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bank_reconciliation_items
    ADD CONSTRAINT bank_reconciliation_items_gl_journal_entry_line_id_fkey FOREIGN KEY (gl_journal_entry_line_id) REFERENCES public.gl_journal_entry_lines(id);


--
-- Name: bank_reconciliations bank_reconciliations_bank_gl_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bank_reconciliations
    ADD CONSTRAINT bank_reconciliations_bank_gl_account_id_fkey FOREIGN KEY (bank_gl_account_id) REFERENCES public.gl_accounts(id);


--
-- Name: bank_reconciliations bank_reconciliations_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bank_reconciliations
    ADD CONSTRAINT bank_reconciliations_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: bank_reconciliations bank_reconciliations_created_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bank_reconciliations
    ADD CONSTRAINT bank_reconciliations_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.users(id);


--
-- Name: billing_configurations billing_configurations_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_configurations
    ADD CONSTRAINT billing_configurations_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: billing_transactions billing_transactions_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_transactions
    ADD CONSTRAINT billing_transactions_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: bom_components bom_components_bom_header_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bom_components
    ADD CONSTRAINT bom_components_bom_header_id_fkey FOREIGN KEY (bom_header_id) REFERENCES public.bom_headers(id);


--
-- Name: bom_components bom_components_component_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bom_components
    ADD CONSTRAINT bom_components_component_item_id_fkey FOREIGN KEY (component_item_id) REFERENCES public.inventory_items(id);


--
-- Name: bom_components bom_components_unit_of_measure_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bom_components
    ADD CONSTRAINT bom_components_unit_of_measure_id_fkey FOREIGN KEY (unit_of_measure_id) REFERENCES public.unit_of_measures(id);


--
-- Name: bom_defaults bom_defaults_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bom_defaults
    ADD CONSTRAINT bom_defaults_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: bom_defaults bom_defaults_default_manufacturing_overhead_gl_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bom_defaults
    ADD CONSTRAINT bom_defaults_default_manufacturing_overhead_gl_account_id_fkey FOREIGN KEY (default_manufacturing_overhead_gl_account_id) REFERENCES public.gl_accounts(id);


--
-- Name: bom_defaults bom_defaults_default_material_usage_gl_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bom_defaults
    ADD CONSTRAINT bom_defaults_default_material_usage_gl_account_id_fkey FOREIGN KEY (default_material_usage_gl_account_id) REFERENCES public.gl_accounts(id);


--
-- Name: bom_defaults bom_defaults_default_scrap_gl_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bom_defaults
    ADD CONSTRAINT bom_defaults_default_scrap_gl_account_id_fkey FOREIGN KEY (default_scrap_gl_account_id) REFERENCES public.gl_accounts(id);


--
-- Name: bom_defaults bom_defaults_default_wip_gl_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bom_defaults
    ADD CONSTRAINT bom_defaults_default_wip_gl_account_id_fkey FOREIGN KEY (default_wip_gl_account_id) REFERENCES public.gl_accounts(id);


--
-- Name: bom_headers bom_headers_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bom_headers
    ADD CONSTRAINT bom_headers_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: bom_headers bom_headers_parent_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bom_headers
    ADD CONSTRAINT bom_headers_parent_item_id_fkey FOREIGN KEY (parent_item_id) REFERENCES public.inventory_items(id);


--
-- Name: bom_headers bom_headers_unit_of_measure_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bom_headers
    ADD CONSTRAINT bom_headers_unit_of_measure_id_fkey FOREIGN KEY (unit_of_measure_id) REFERENCES public.unit_of_measures(id);


--
-- Name: branches branches_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: companies companies_billing_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_billing_plan_id_fkey FOREIGN KEY (billing_plan_id) REFERENCES public.billing_plans(id);


--
-- Name: company_subscriptions company_subscriptions_billing_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_subscriptions
    ADD CONSTRAINT company_subscriptions_billing_plan_id_fkey FOREIGN KEY (billing_plan_id) REFERENCES public.billing_plans(id);


--
-- Name: company_subscriptions company_subscriptions_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_subscriptions
    ADD CONSTRAINT company_subscriptions_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: currencies currencies_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.currencies
    ADD CONSTRAINT currencies_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: customers customers_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: customers customers_default_ar_gl_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_default_ar_gl_account_id_fkey FOREIGN KEY (default_ar_gl_account_id) REFERENCES public.gl_accounts(id);


--
-- Name: customers customers_default_currency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_default_currency_id_fkey FOREIGN KEY (default_currency_id) REFERENCES public.currencies(id);


--
-- Name: customers customers_sales_representative_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_sales_representative_id_fkey FOREIGN KEY (sales_representative_id) REFERENCES public.sales_representatives(id);


--
-- Name: exchange_rate_history exchange_rate_history_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exchange_rate_history
    ADD CONSTRAINT exchange_rate_history_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: exchange_rate_history exchange_rate_history_currency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exchange_rate_history
    ADD CONSTRAINT exchange_rate_history_currency_id_fkey FOREIGN KEY (currency_id) REFERENCES public.currencies(id);


--
-- Name: feature_flags feature_flags_created_by_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feature_flags
    ADD CONSTRAINT feature_flags_created_by_admin_id_fkey FOREIGN KEY (created_by_admin_id) REFERENCES public.platform_admins(id);


--
-- Name: companies fk_companies_created_by_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT fk_companies_created_by_user FOREIGN KEY (created_by_user_id) REFERENCES public.users(id);


--
-- Name: users fk_users_default_company; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk_users_default_company FOREIGN KEY (default_company_id) REFERENCES public.companies(id);


--
-- Name: forex_gain_loss forex_gain_loss_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.forex_gain_loss
    ADD CONSTRAINT forex_gain_loss_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: forex_gain_loss forex_gain_loss_gl_journal_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.forex_gain_loss
    ADD CONSTRAINT forex_gain_loss_gl_journal_entry_id_fkey FOREIGN KEY (gl_journal_entry_id) REFERENCES public.gl_journal_entries(id);


--
-- Name: gl_accounts gl_accounts_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gl_accounts
    ADD CONSTRAINT gl_accounts_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: gl_accounts gl_accounts_parent_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gl_accounts
    ADD CONSTRAINT gl_accounts_parent_account_id_fkey FOREIGN KEY (parent_account_id) REFERENCES public.gl_accounts(id);


--
-- Name: gl_defaults gl_defaults_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gl_defaults
    ADD CONSTRAINT gl_defaults_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: gl_defaults gl_defaults_default_ap_control_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gl_defaults
    ADD CONSTRAINT gl_defaults_default_ap_control_account_id_fkey FOREIGN KEY (default_ap_control_account_id) REFERENCES public.gl_accounts(id);


--
-- Name: gl_defaults gl_defaults_default_ar_control_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gl_defaults
    ADD CONSTRAINT gl_defaults_default_ar_control_account_id_fkey FOREIGN KEY (default_ar_control_account_id) REFERENCES public.gl_accounts(id);


--
-- Name: gl_defaults gl_defaults_default_cash_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gl_defaults
    ADD CONSTRAINT gl_defaults_default_cash_account_id_fkey FOREIGN KEY (default_cash_account_id) REFERENCES public.gl_accounts(id);


--
-- Name: gl_defaults gl_defaults_forex_gain_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gl_defaults
    ADD CONSTRAINT gl_defaults_forex_gain_account_id_fkey FOREIGN KEY (forex_gain_account_id) REFERENCES public.gl_accounts(id);


--
-- Name: gl_defaults gl_defaults_forex_loss_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gl_defaults
    ADD CONSTRAINT gl_defaults_forex_loss_account_id_fkey FOREIGN KEY (forex_loss_account_id) REFERENCES public.gl_accounts(id);


--
-- Name: gl_defaults gl_defaults_retained_earnings_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gl_defaults
    ADD CONSTRAINT gl_defaults_retained_earnings_account_id_fkey FOREIGN KEY (retained_earnings_account_id) REFERENCES public.gl_accounts(id);


--
-- Name: gl_journal_entries gl_journal_entries_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gl_journal_entries
    ADD CONSTRAINT gl_journal_entries_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: gl_journal_entries gl_journal_entries_posted_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gl_journal_entries
    ADD CONSTRAINT gl_journal_entries_posted_by_user_id_fkey FOREIGN KEY (posted_by_user_id) REFERENCES public.users(id);


--
-- Name: gl_journal_entry_lines gl_journal_entry_lines_currency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gl_journal_entry_lines
    ADD CONSTRAINT gl_journal_entry_lines_currency_id_fkey FOREIGN KEY (currency_id) REFERENCES public.currencies(id);


--
-- Name: gl_journal_entry_lines gl_journal_entry_lines_gl_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gl_journal_entry_lines
    ADD CONSTRAINT gl_journal_entry_lines_gl_account_id_fkey FOREIGN KEY (gl_account_id) REFERENCES public.gl_accounts(id);


--
-- Name: gl_journal_entry_lines gl_journal_entry_lines_journal_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gl_journal_entry_lines
    ADD CONSTRAINT gl_journal_entry_lines_journal_entry_id_fkey FOREIGN KEY (journal_entry_id) REFERENCES public.gl_journal_entries(id);


--
-- Name: gl_transaction_types gl_transaction_types_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gl_transaction_types
    ADD CONSTRAINT gl_transaction_types_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: gl_transaction_types gl_transaction_types_default_credit_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gl_transaction_types
    ADD CONSTRAINT gl_transaction_types_default_credit_account_id_fkey FOREIGN KEY (default_credit_account_id) REFERENCES public.gl_accounts(id);


--
-- Name: gl_transaction_types gl_transaction_types_default_debit_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gl_transaction_types
    ADD CONSTRAINT gl_transaction_types_default_debit_account_id_fkey FOREIGN KEY (default_debit_account_id) REFERENCES public.gl_accounts(id);


--
-- Name: goods_received_voucher_lines goods_received_voucher_lines_grv_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goods_received_voucher_lines
    ADD CONSTRAINT goods_received_voucher_lines_grv_id_fkey FOREIGN KEY (grv_id) REFERENCES public.goods_received_vouchers(id);


--
-- Name: goods_received_voucher_lines goods_received_voucher_lines_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goods_received_voucher_lines
    ADD CONSTRAINT goods_received_voucher_lines_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.inventory_items(id);


--
-- Name: goods_received_voucher_lines goods_received_voucher_lines_purchase_order_line_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goods_received_voucher_lines
    ADD CONSTRAINT goods_received_voucher_lines_purchase_order_line_id_fkey FOREIGN KEY (purchase_order_line_id) REFERENCES public.purchase_order_lines(id);


--
-- Name: goods_received_vouchers goods_received_vouchers_ap_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goods_received_vouchers
    ADD CONSTRAINT goods_received_vouchers_ap_invoice_id_fkey FOREIGN KEY (ap_invoice_id) REFERENCES public.ap_transactions(id);


--
-- Name: goods_received_vouchers goods_received_vouchers_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goods_received_vouchers
    ADD CONSTRAINT goods_received_vouchers_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: goods_received_vouchers goods_received_vouchers_purchase_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goods_received_vouchers
    ADD CONSTRAINT goods_received_vouchers_purchase_order_id_fkey FOREIGN KEY (purchase_order_id) REFERENCES public.purchase_orders(id);


--
-- Name: goods_received_vouchers goods_received_vouchers_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goods_received_vouchers
    ADD CONSTRAINT goods_received_vouchers_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);


--
-- Name: inventory_count_lines inventory_count_lines_inventory_count_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_count_lines
    ADD CONSTRAINT inventory_count_lines_inventory_count_session_id_fkey FOREIGN KEY (inventory_count_session_id) REFERENCES public.inventory_count_sessions(id);


--
-- Name: inventory_count_lines inventory_count_lines_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_count_lines
    ADD CONSTRAINT inventory_count_lines_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.inventory_items(id);


--
-- Name: inventory_count_sessions inventory_count_sessions_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_count_sessions
    ADD CONSTRAINT inventory_count_sessions_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: inventory_count_sessions inventory_count_sessions_warehouse_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_count_sessions
    ADD CONSTRAINT inventory_count_sessions_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES public.warehouses(id);


--
-- Name: inventory_defaults inventory_defaults_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_defaults
    ADD CONSTRAINT inventory_defaults_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: inventory_defaults inventory_defaults_default_cogs_gl_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_defaults
    ADD CONSTRAINT inventory_defaults_default_cogs_gl_account_id_fkey FOREIGN KEY (default_cogs_gl_account_id) REFERENCES public.gl_accounts(id);


--
-- Name: inventory_defaults inventory_defaults_default_inventory_adjustment_gl_account_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_defaults
    ADD CONSTRAINT inventory_defaults_default_inventory_adjustment_gl_account_fkey FOREIGN KEY (default_inventory_adjustment_gl_account_id) REFERENCES public.gl_accounts(id);


--
-- Name: inventory_defaults inventory_defaults_default_inventory_gl_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_defaults
    ADD CONSTRAINT inventory_defaults_default_inventory_gl_account_id_fkey FOREIGN KEY (default_inventory_gl_account_id) REFERENCES public.gl_accounts(id);


--
-- Name: inventory_defaults inventory_defaults_default_sales_revenue_gl_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_defaults
    ADD CONSTRAINT inventory_defaults_default_sales_revenue_gl_account_id_fkey FOREIGN KEY (default_sales_revenue_gl_account_id) REFERENCES public.gl_accounts(id);


--
-- Name: inventory_defaults inventory_defaults_default_warehouse_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_defaults
    ADD CONSTRAINT inventory_defaults_default_warehouse_id_fkey FOREIGN KEY (default_warehouse_id) REFERENCES public.warehouses(id);


--
-- Name: inventory_item_locations inventory_item_locations_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_item_locations
    ADD CONSTRAINT inventory_item_locations_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: inventory_item_locations inventory_item_locations_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_item_locations
    ADD CONSTRAINT inventory_item_locations_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.inventory_items(id);


--
-- Name: inventory_item_locations inventory_item_locations_warehouse_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_item_locations
    ADD CONSTRAINT inventory_item_locations_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES public.warehouses(id);


--
-- Name: inventory_items inventory_items_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_items
    ADD CONSTRAINT inventory_items_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: inventory_items inventory_items_default_cogs_gl_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_items
    ADD CONSTRAINT inventory_items_default_cogs_gl_account_id_fkey FOREIGN KEY (default_cogs_gl_account_id) REFERENCES public.gl_accounts(id);


--
-- Name: inventory_items inventory_items_default_inventory_gl_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_items
    ADD CONSTRAINT inventory_items_default_inventory_gl_account_id_fkey FOREIGN KEY (default_inventory_gl_account_id) REFERENCES public.gl_accounts(id);


--
-- Name: inventory_items inventory_items_default_purchase_tax_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_items
    ADD CONSTRAINT inventory_items_default_purchase_tax_type_id_fkey FOREIGN KEY (default_purchase_tax_type_id) REFERENCES public.tax_types(id);


--
-- Name: inventory_items inventory_items_default_sales_gl_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_items
    ADD CONSTRAINT inventory_items_default_sales_gl_account_id_fkey FOREIGN KEY (default_sales_gl_account_id) REFERENCES public.gl_accounts(id);


--
-- Name: inventory_items inventory_items_default_sales_tax_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_items
    ADD CONSTRAINT inventory_items_default_sales_tax_type_id_fkey FOREIGN KEY (default_sales_tax_type_id) REFERENCES public.tax_types(id);


--
-- Name: inventory_items inventory_items_unit_of_measure_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_items
    ADD CONSTRAINT inventory_items_unit_of_measure_id_fkey FOREIGN KEY (unit_of_measure_id) REFERENCES public.unit_of_measures(id);


--
-- Name: inventory_transaction_types inventory_transaction_types_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_transaction_types
    ADD CONSTRAINT inventory_transaction_types_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: inventory_transaction_types inventory_transaction_types_default_offsetting_gl_account__fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_transaction_types
    ADD CONSTRAINT inventory_transaction_types_default_offsetting_gl_account__fkey FOREIGN KEY (default_offsetting_gl_account_id) REFERENCES public.gl_accounts(id);


--
-- Name: inventory_transactions inventory_transactions_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT inventory_transactions_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: inventory_transactions inventory_transactions_currency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT inventory_transactions_currency_id_fkey FOREIGN KEY (currency_id) REFERENCES public.currencies(id);


--
-- Name: inventory_transactions inventory_transactions_inventory_transaction_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT inventory_transactions_inventory_transaction_type_id_fkey FOREIGN KEY (inventory_transaction_type_id) REFERENCES public.inventory_transaction_types(id);


--
-- Name: inventory_transactions inventory_transactions_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT inventory_transactions_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.inventory_items(id);


--
-- Name: inventory_transactions inventory_transactions_linked_gl_journal_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT inventory_transactions_linked_gl_journal_entry_id_fkey FOREIGN KEY (linked_gl_journal_entry_id) REFERENCES public.gl_journal_entries(id);


--
-- Name: inventory_transactions inventory_transactions_warehouse_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT inventory_transactions_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES public.warehouses(id);


--
-- Name: item_barcodes item_barcodes_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item_barcodes
    ADD CONSTRAINT item_barcodes_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: item_barcodes item_barcodes_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item_barcodes
    ADD CONSTRAINT item_barcodes_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.inventory_items(id);


--
-- Name: item_barcodes item_barcodes_unit_of_measure_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item_barcodes
    ADD CONSTRAINT item_barcodes_unit_of_measure_id_fkey FOREIGN KEY (unit_of_measure_id) REFERENCES public.unit_of_measures(id);


--
-- Name: manufacturing_order_components manufacturing_order_components_component_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.manufacturing_order_components
    ADD CONSTRAINT manufacturing_order_components_component_item_id_fkey FOREIGN KEY (component_item_id) REFERENCES public.inventory_items(id);


--
-- Name: manufacturing_order_components manufacturing_order_components_manufacturing_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.manufacturing_order_components
    ADD CONSTRAINT manufacturing_order_components_manufacturing_order_id_fkey FOREIGN KEY (manufacturing_order_id) REFERENCES public.manufacturing_orders(id);


--
-- Name: manufacturing_orders manufacturing_orders_bom_header_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.manufacturing_orders
    ADD CONSTRAINT manufacturing_orders_bom_header_id_fkey FOREIGN KEY (bom_header_id) REFERENCES public.bom_headers(id);


--
-- Name: manufacturing_orders manufacturing_orders_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.manufacturing_orders
    ADD CONSTRAINT manufacturing_orders_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: manufacturing_orders manufacturing_orders_linked_gl_journal_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.manufacturing_orders
    ADD CONSTRAINT manufacturing_orders_linked_gl_journal_entry_id_fkey FOREIGN KEY (linked_gl_journal_entry_id) REFERENCES public.gl_journal_entries(id);


--
-- Name: manufacturing_orders manufacturing_orders_warehouse_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.manufacturing_orders
    ADD CONSTRAINT manufacturing_orders_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES public.warehouses(id);


--
-- Name: order_defaults order_defaults_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_defaults
    ADD CONSTRAINT order_defaults_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: platform_audit_logs platform_audit_logs_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.platform_audit_logs
    ADD CONSTRAINT platform_audit_logs_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: platform_audit_logs platform_audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.platform_audit_logs
    ADD CONSTRAINT platform_audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: platform_invoices platform_invoices_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.platform_invoices
    ADD CONSTRAINT platform_invoices_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: platform_invoices platform_invoices_subscription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.platform_invoices
    ADD CONSTRAINT platform_invoices_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES public.company_subscriptions(id);


--
-- Name: pos_cash_movements pos_cash_movements_authorized_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pos_cash_movements
    ADD CONSTRAINT pos_cash_movements_authorized_by_id_fkey FOREIGN KEY (authorized_by_id) REFERENCES public.users(id);


--
-- Name: pos_cash_movements pos_cash_movements_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pos_cash_movements
    ADD CONSTRAINT pos_cash_movements_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: pos_cash_movements pos_cash_movements_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pos_cash_movements
    ADD CONSTRAINT pos_cash_movements_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.pos_sessions(id);


--
-- Name: pos_defaults pos_defaults_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pos_defaults
    ADD CONSTRAINT pos_defaults_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: pos_defaults pos_defaults_default_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pos_defaults
    ADD CONSTRAINT pos_defaults_default_customer_id_fkey FOREIGN KEY (default_customer_id) REFERENCES public.customers(id);


--
-- Name: pos_defaults pos_defaults_default_return_transaction_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pos_defaults
    ADD CONSTRAINT pos_defaults_default_return_transaction_type_id_fkey FOREIGN KEY (default_return_transaction_type_id) REFERENCES public.pos_transaction_types(id);


--
-- Name: pos_defaults pos_defaults_default_sale_transaction_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pos_defaults
    ADD CONSTRAINT pos_defaults_default_sale_transaction_type_id_fkey FOREIGN KEY (default_sale_transaction_type_id) REFERENCES public.pos_transaction_types(id);


--
-- Name: pos_defaults pos_defaults_default_tax_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pos_defaults
    ADD CONSTRAINT pos_defaults_default_tax_type_id_fkey FOREIGN KEY (default_tax_type_id) REFERENCES public.tax_types(id);


--
-- Name: pos_sessions pos_sessions_cashier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pos_sessions
    ADD CONSTRAINT pos_sessions_cashier_id_fkey FOREIGN KEY (cashier_id) REFERENCES public.users(id);


--
-- Name: pos_sessions pos_sessions_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pos_sessions
    ADD CONSTRAINT pos_sessions_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: pos_sessions pos_sessions_till_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pos_sessions
    ADD CONSTRAINT pos_sessions_till_id_fkey FOREIGN KEY (till_id) REFERENCES public.tills(id);


--
-- Name: pos_transaction_lines pos_transaction_lines_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pos_transaction_lines
    ADD CONSTRAINT pos_transaction_lines_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.inventory_items(id);


--
-- Name: pos_transaction_lines pos_transaction_lines_tax_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pos_transaction_lines
    ADD CONSTRAINT pos_transaction_lines_tax_type_id_fkey FOREIGN KEY (tax_type_id) REFERENCES public.tax_types(id);


--
-- Name: pos_transaction_lines pos_transaction_lines_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pos_transaction_lines
    ADD CONSTRAINT pos_transaction_lines_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.pos_transactions(id);


--
-- Name: pos_transaction_types pos_transaction_types_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pos_transaction_types
    ADD CONSTRAINT pos_transaction_types_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: pos_transactions pos_transactions_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pos_transactions
    ADD CONSTRAINT pos_transactions_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: pos_transactions pos_transactions_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pos_transactions
    ADD CONSTRAINT pos_transactions_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: pos_transactions pos_transactions_linked_ar_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pos_transactions
    ADD CONSTRAINT pos_transactions_linked_ar_transaction_id_fkey FOREIGN KEY (linked_ar_transaction_id) REFERENCES public.ar_transactions(id);


--
-- Name: pos_transactions pos_transactions_linked_gl_journal_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pos_transactions
    ADD CONSTRAINT pos_transactions_linked_gl_journal_entry_id_fkey FOREIGN KEY (linked_gl_journal_entry_id) REFERENCES public.gl_journal_entries(id);


--
-- Name: pos_transactions pos_transactions_reference_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pos_transactions
    ADD CONSTRAINT pos_transactions_reference_transaction_id_fkey FOREIGN KEY (reference_transaction_id) REFERENCES public.pos_transactions(id);


--
-- Name: pos_transactions pos_transactions_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pos_transactions
    ADD CONSTRAINT pos_transactions_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.pos_sessions(id);


--
-- Name: pos_transactions pos_transactions_transaction_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pos_transactions
    ADD CONSTRAINT pos_transactions_transaction_type_id_fkey FOREIGN KEY (transaction_type_id) REFERENCES public.pos_transaction_types(id);


--
-- Name: purchase_order_lines purchase_order_lines_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_order_lines
    ADD CONSTRAINT purchase_order_lines_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.inventory_items(id);


--
-- Name: purchase_order_lines purchase_order_lines_purchase_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_order_lines
    ADD CONSTRAINT purchase_order_lines_purchase_order_id_fkey FOREIGN KEY (purchase_order_id) REFERENCES public.purchase_orders(id);


--
-- Name: purchase_order_lines purchase_order_lines_tax_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_order_lines
    ADD CONSTRAINT purchase_order_lines_tax_type_id_fkey FOREIGN KEY (tax_type_id) REFERENCES public.tax_types(id);


--
-- Name: purchase_orders purchase_orders_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: purchase_orders purchase_orders_currency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_currency_id_fkey FOREIGN KEY (currency_id) REFERENCES public.currencies(id);


--
-- Name: purchase_orders purchase_orders_delivery_address_warehouse_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_delivery_address_warehouse_id_fkey FOREIGN KEY (delivery_address_warehouse_id) REFERENCES public.warehouses(id);


--
-- Name: purchase_orders purchase_orders_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);


--
-- Name: report_schedules report_schedules_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.report_schedules
    ADD CONSTRAINT report_schedules_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: report_schedules report_schedules_report_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.report_schedules
    ADD CONSTRAINT report_schedules_report_template_id_fkey FOREIGN KEY (report_template_id) REFERENCES public.report_templates(id);


--
-- Name: report_templates report_templates_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.report_templates
    ADD CONSTRAINT report_templates_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: report_templates report_templates_created_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.report_templates
    ADD CONSTRAINT report_templates_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.users(id);


--
-- Name: resource_usage resource_usage_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resource_usage
    ADD CONSTRAINT resource_usage_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: roles roles_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: sales_order_lines sales_order_lines_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_order_lines
    ADD CONSTRAINT sales_order_lines_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.inventory_items(id);


--
-- Name: sales_order_lines sales_order_lines_sales_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_order_lines
    ADD CONSTRAINT sales_order_lines_sales_order_id_fkey FOREIGN KEY (sales_order_id) REFERENCES public.sales_orders(id);


--
-- Name: sales_order_lines sales_order_lines_tax_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_order_lines
    ADD CONSTRAINT sales_order_lines_tax_type_id_fkey FOREIGN KEY (tax_type_id) REFERENCES public.tax_types(id);


--
-- Name: sales_orders sales_orders_ar_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_orders
    ADD CONSTRAINT sales_orders_ar_invoice_id_fkey FOREIGN KEY (ar_invoice_id) REFERENCES public.ar_transactions(id);


--
-- Name: sales_orders sales_orders_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_orders
    ADD CONSTRAINT sales_orders_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: sales_orders sales_orders_currency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_orders
    ADD CONSTRAINT sales_orders_currency_id_fkey FOREIGN KEY (currency_id) REFERENCES public.currencies(id);


--
-- Name: sales_orders sales_orders_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_orders
    ADD CONSTRAINT sales_orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: sales_orders sales_orders_sales_representative_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_orders
    ADD CONSTRAINT sales_orders_sales_representative_id_fkey FOREIGN KEY (sales_representative_id) REFERENCES public.sales_representatives(id);


--
-- Name: sales_representatives sales_representatives_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_representatives
    ADD CONSTRAINT sales_representatives_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: suppliers suppliers_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: suppliers suppliers_default_ap_gl_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_default_ap_gl_account_id_fkey FOREIGN KEY (default_ap_gl_account_id) REFERENCES public.gl_accounts(id);


--
-- Name: suppliers suppliers_default_currency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_default_currency_id_fkey FOREIGN KEY (default_currency_id) REFERENCES public.currencies(id);


--
-- Name: system_configurations system_configurations_updated_by_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_configurations
    ADD CONSTRAINT system_configurations_updated_by_admin_id_fkey FOREIGN KEY (updated_by_admin_id) REFERENCES public.platform_admins(id);


--
-- Name: tax_types tax_types_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tax_types
    ADD CONSTRAINT tax_types_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: tax_types tax_types_tax_authority_gl_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tax_types
    ADD CONSTRAINT tax_types_tax_authority_gl_account_id_fkey FOREIGN KEY (tax_authority_gl_account_id) REFERENCES public.gl_accounts(id);


--
-- Name: tills tills_cash_gl_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tills
    ADD CONSTRAINT tills_cash_gl_account_id_fkey FOREIGN KEY (cash_gl_account_id) REFERENCES public.gl_accounts(id);


--
-- Name: tills tills_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tills
    ADD CONSTRAINT tills_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: tills tills_default_cashier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tills
    ADD CONSTRAINT tills_default_cashier_id_fkey FOREIGN KEY (default_cashier_id) REFERENCES public.users(id);


--
-- Name: tills tills_default_warehouse_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tills
    ADD CONSTRAINT tills_default_warehouse_id_fkey FOREIGN KEY (default_warehouse_id) REFERENCES public.warehouses(id);


--
-- Name: unit_of_measures unit_of_measures_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unit_of_measures
    ADD CONSTRAINT unit_of_measures_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: usage_alerts usage_alerts_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usage_alerts
    ADD CONSTRAINT usage_alerts_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: usage_metrics usage_metrics_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usage_metrics
    ADD CONSTRAINT usage_metrics_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: user_roles user_roles_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: users users_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: warehouses warehouses_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.warehouses
    ADD CONSTRAINT warehouses_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- PostgreSQL database dump complete
--

