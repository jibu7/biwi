--
-- PostgreSQL database dump
--

-- Dumped from database version 15.12 (Debian 15.12-1.pgdg120+1)
-- Dumped by pg_dump version 16.9 (Ubuntu 16.9-0ubuntu0.24.04.1)

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

--
-- Name: usertype; Type: TYPE; Schema: public; Owner: Biwi_user
--

CREATE TYPE public.usertype AS ENUM (
    'platform_admin',
    'company_admin',
    'company_user'
);


ALTER TYPE public.usertype OWNER TO "Biwi_user";

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: accounting_periods; Type: TABLE; Schema: public; Owner: Biwi_user
--

CREATE TABLE public.accounting_periods (
    id integer NOT NULL,
    company_id integer NOT NULL,
    name character varying NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    status character varying NOT NULL
);


ALTER TABLE public.accounting_periods OWNER TO "Biwi_user";

--
-- Name: accounting_periods_id_seq; Type: SEQUENCE; Schema: public; Owner: Biwi_user
--

CREATE SEQUENCE public.accounting_periods_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.accounting_periods_id_seq OWNER TO "Biwi_user";

--
-- Name: accounting_periods_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: Biwi_user
--

ALTER SEQUENCE public.accounting_periods_id_seq OWNED BY public.accounting_periods.id;


--
-- Name: alembic_version; Type: TABLE; Schema: public; Owner: Biwi_user
--

CREATE TABLE public.alembic_version (
    version_num character varying(32) NOT NULL
);


ALTER TABLE public.alembic_version OWNER TO "Biwi_user";

--
-- Name: ap_allocation_lines; Type: TABLE; Schema: public; Owner: Biwi_user
--

CREATE TABLE public.ap_allocation_lines (
    id integer NOT NULL,
    ap_allocation_id integer NOT NULL,
    credit_transaction_id integer NOT NULL,
    debit_transaction_id integer NOT NULL,
    allocated_amount numeric(15,2) NOT NULL
);


ALTER TABLE public.ap_allocation_lines OWNER TO "Biwi_user";

--
-- Name: ap_allocation_lines_id_seq; Type: SEQUENCE; Schema: public; Owner: Biwi_user
--

CREATE SEQUENCE public.ap_allocation_lines_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ap_allocation_lines_id_seq OWNER TO "Biwi_user";

--
-- Name: ap_allocation_lines_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: Biwi_user
--

ALTER SEQUENCE public.ap_allocation_lines_id_seq OWNED BY public.ap_allocation_lines.id;


--
-- Name: ap_allocations; Type: TABLE; Schema: public; Owner: Biwi_user
--

CREATE TABLE public.ap_allocations (
    id integer NOT NULL,
    company_id integer NOT NULL,
    allocation_date date NOT NULL,
    supplier_id integer NOT NULL
);


ALTER TABLE public.ap_allocations OWNER TO "Biwi_user";

--
-- Name: ap_allocations_id_seq; Type: SEQUENCE; Schema: public; Owner: Biwi_user
--

CREATE SEQUENCE public.ap_allocations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ap_allocations_id_seq OWNER TO "Biwi_user";

--
-- Name: ap_allocations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: Biwi_user
--

ALTER SEQUENCE public.ap_allocations_id_seq OWNED BY public.ap_allocations.id;


--
-- Name: ap_defaults; Type: TABLE; Schema: public; Owner: Biwi_user
--

CREATE TABLE public.ap_defaults (
    id integer NOT NULL,
    company_id integer NOT NULL,
    default_ap_control_gl_account_id integer,
    default_expense_gl_account_id integer,
    default_payment_gl_account_id integer,
    default_purchase_discount_gl_account_id integer
);


ALTER TABLE public.ap_defaults OWNER TO "Biwi_user";

--
-- Name: ap_defaults_id_seq; Type: SEQUENCE; Schema: public; Owner: Biwi_user
--

CREATE SEQUENCE public.ap_defaults_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ap_defaults_id_seq OWNER TO "Biwi_user";

--
-- Name: ap_defaults_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: Biwi_user
--

ALTER SEQUENCE public.ap_defaults_id_seq OWNED BY public.ap_defaults.id;


--
-- Name: ap_transaction_tax_lines; Type: TABLE; Schema: public; Owner: Biwi_user
--

CREATE TABLE public.ap_transaction_tax_lines (
    id integer NOT NULL,
    ap_transaction_id integer,
    tax_type_id integer,
    taxable_amount numeric(15,2),
    tax_amount numeric(15,2),
    base_currency_tax_amount numeric(15,2)
);


ALTER TABLE public.ap_transaction_tax_lines OWNER TO "Biwi_user";

--
-- Name: ap_transaction_tax_lines_id_seq; Type: SEQUENCE; Schema: public; Owner: Biwi_user
--

CREATE SEQUENCE public.ap_transaction_tax_lines_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ap_transaction_tax_lines_id_seq OWNER TO "Biwi_user";

--
-- Name: ap_transaction_tax_lines_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: Biwi_user
--

ALTER SEQUENCE public.ap_transaction_tax_lines_id_seq OWNED BY public.ap_transaction_tax_lines.id;


--
-- Name: ap_transaction_types; Type: TABLE; Schema: public; Owner: Biwi_user
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


ALTER TABLE public.ap_transaction_types OWNER TO "Biwi_user";

--
-- Name: ap_transaction_types_id_seq; Type: SEQUENCE; Schema: public; Owner: Biwi_user
--

CREATE SEQUENCE public.ap_transaction_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ap_transaction_types_id_seq OWNER TO "Biwi_user";

--
-- Name: ap_transaction_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: Biwi_user
--

ALTER SEQUENCE public.ap_transaction_types_id_seq OWNED BY public.ap_transaction_types.id;


--
-- Name: ap_transactions; Type: TABLE; Schema: public; Owner: Biwi_user
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


ALTER TABLE public.ap_transactions OWNER TO "Biwi_user";

--
-- Name: ap_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: Biwi_user
--

CREATE SEQUENCE public.ap_transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ap_transactions_id_seq OWNER TO "Biwi_user";

--
-- Name: ap_transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: Biwi_user
--

ALTER SEQUENCE public.ap_transactions_id_seq OWNED BY public.ap_transactions.id;


--
-- Name: ar_allocation_lines; Type: TABLE; Schema: public; Owner: Biwi_user
--

CREATE TABLE public.ar_allocation_lines (
    id integer NOT NULL,
    ar_allocation_id integer NOT NULL,
    debit_transaction_id integer NOT NULL,
    credit_transaction_id integer NOT NULL,
    allocated_amount numeric(15,2) NOT NULL
);


ALTER TABLE public.ar_allocation_lines OWNER TO "Biwi_user";

--
-- Name: ar_allocation_lines_id_seq; Type: SEQUENCE; Schema: public; Owner: Biwi_user
--

CREATE SEQUENCE public.ar_allocation_lines_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ar_allocation_lines_id_seq OWNER TO "Biwi_user";

--
-- Name: ar_allocation_lines_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: Biwi_user
--

ALTER SEQUENCE public.ar_allocation_lines_id_seq OWNED BY public.ar_allocation_lines.id;


--
-- Name: ar_allocations; Type: TABLE; Schema: public; Owner: Biwi_user
--

CREATE TABLE public.ar_allocations (
    id integer NOT NULL,
    company_id integer NOT NULL,
    allocation_date date NOT NULL,
    customer_id integer NOT NULL
);


ALTER TABLE public.ar_allocations OWNER TO "Biwi_user";

--
-- Name: ar_allocations_id_seq; Type: SEQUENCE; Schema: public; Owner: Biwi_user
--

CREATE SEQUENCE public.ar_allocations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ar_allocations_id_seq OWNER TO "Biwi_user";

--
-- Name: ar_allocations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: Biwi_user
--

ALTER SEQUENCE public.ar_allocations_id_seq OWNED BY public.ar_allocations.id;


--
-- Name: ar_defaults; Type: TABLE; Schema: public; Owner: Biwi_user
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


ALTER TABLE public.ar_defaults OWNER TO "Biwi_user";

--
-- Name: ar_defaults_id_seq; Type: SEQUENCE; Schema: public; Owner: Biwi_user
--

CREATE SEQUENCE public.ar_defaults_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ar_defaults_id_seq OWNER TO "Biwi_user";

--
-- Name: ar_defaults_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: Biwi_user
--

ALTER SEQUENCE public.ar_defaults_id_seq OWNED BY public.ar_defaults.id;


--
-- Name: ar_transaction_tax_lines; Type: TABLE; Schema: public; Owner: Biwi_user
--

CREATE TABLE public.ar_transaction_tax_lines (
    id integer NOT NULL,
    ar_transaction_id integer,
    tax_type_id integer,
    taxable_amount numeric(15,2),
    tax_amount numeric(15,2),
    base_currency_tax_amount numeric(15,2)
);


ALTER TABLE public.ar_transaction_tax_lines OWNER TO "Biwi_user";

--
-- Name: ar_transaction_tax_lines_id_seq; Type: SEQUENCE; Schema: public; Owner: Biwi_user
--

CREATE SEQUENCE public.ar_transaction_tax_lines_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ar_transaction_tax_lines_id_seq OWNER TO "Biwi_user";

--
-- Name: ar_transaction_tax_lines_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: Biwi_user
--

ALTER SEQUENCE public.ar_transaction_tax_lines_id_seq OWNED BY public.ar_transaction_tax_lines.id;


--
-- Name: ar_transaction_types; Type: TABLE; Schema: public; Owner: Biwi_user
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


ALTER TABLE public.ar_transaction_types OWNER TO "Biwi_user";

--
-- Name: ar_transaction_types_id_seq; Type: SEQUENCE; Schema: public; Owner: Biwi_user
--

CREATE SEQUENCE public.ar_transaction_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ar_transaction_types_id_seq OWNER TO "Biwi_user";

--
-- Name: ar_transaction_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: Biwi_user
--

ALTER SEQUENCE public.ar_transaction_types_id_seq OWNED BY public.ar_transaction_types.id;


--
-- Name: ar_transactions; Type: TABLE; Schema: public; Owner: Biwi_user
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


ALTER TABLE public.ar_transactions OWNER TO "Biwi_user";

--
-- Name: ar_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: Biwi_user
--

CREATE SEQUENCE public.ar_transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ar_transactions_id_seq OWNER TO "Biwi_user";

--
-- Name: ar_transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: Biwi_user
--

ALTER SEQUENCE public.ar_transactions_id_seq OWNED BY public.ar_transactions.id;


--
-- Name: ar_writeoffs; Type: TABLE; Schema: public; Owner: Biwi_user
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


ALTER TABLE public.ar_writeoffs OWNER TO "Biwi_user";

--
-- Name: ar_writeoffs_id_seq; Type: SEQUENCE; Schema: public; Owner: Biwi_user
--

CREATE SEQUENCE public.ar_writeoffs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ar_writeoffs_id_seq OWNER TO "Biwi_user";

--
-- Name: ar_writeoffs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: Biwi_user
--

ALTER SEQUENCE public.ar_writeoffs_id_seq OWNED BY public.ar_writeoffs.id;


--
-- Name: bank_reconciliation_items; Type: TABLE; Schema: public; Owner: Biwi_user
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


ALTER TABLE public.bank_reconciliation_items OWNER TO "Biwi_user";

--
-- Name: bank_reconciliation_items_id_seq; Type: SEQUENCE; Schema: public; Owner: Biwi_user
--

CREATE SEQUENCE public.bank_reconciliation_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bank_reconciliation_items_id_seq OWNER TO "Biwi_user";

--
-- Name: bank_reconciliation_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: Biwi_user
--

ALTER SEQUENCE public.bank_reconciliation_items_id_seq OWNED BY public.bank_reconciliation_items.id;


--
-- Name: bank_reconciliations; Type: TABLE; Schema: public; Owner: Biwi_user
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


ALTER TABLE public.bank_reconciliations OWNER TO "Biwi_user";

--
-- Name: bank_reconciliations_id_seq; Type: SEQUENCE; Schema: public; Owner: Biwi_user
--

CREATE SEQUENCE public.bank_reconciliations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bank_reconciliations_id_seq OWNER TO "Biwi_user";

--
-- Name: bank_reconciliations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: Biwi_user
--

ALTER SEQUENCE public.bank_reconciliations_id_seq OWNED BY public.bank_reconciliations.id;


--
-- Name: billing_configurations; Type: TABLE; Schema: public; Owner: Biwi_user
--

CREATE TABLE public.billing_configurations (
    id integer NOT NULL,
    company_id integer NOT NULL,
    base_monthly_fee numeric(10,2),
    per_user_fee numeric(10,2),
    per_gb_storage_fee numeric(10,2),
    per_transaction_fee numeric(10,2),
    billing_cycle character varying,
    billing_email character varying,
    payment_method character varying,
    stripe_customer_id character varying,
    stripe_subscription_id character varying,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


ALTER TABLE public.billing_configurations OWNER TO "Biwi_user";

--
-- Name: billing_configurations_id_seq; Type: SEQUENCE; Schema: public; Owner: Biwi_user
--

CREATE SEQUENCE public.billing_configurations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.billing_configurations_id_seq OWNER TO "Biwi_user";

--
-- Name: billing_configurations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: Biwi_user
--

ALTER SEQUENCE public.billing_configurations_id_seq OWNED BY public.billing_configurations.id;


--
-- Name: billing_transactions; Type: TABLE; Schema: public; Owner: Biwi_user
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


ALTER TABLE public.billing_transactions OWNER TO "Biwi_user";

--
-- Name: billing_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: Biwi_user
--

CREATE SEQUENCE public.billing_transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.billing_transactions_id_seq OWNER TO "Biwi_user";

--
-- Name: billing_transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: Biwi_user
--

ALTER SEQUENCE public.billing_transactions_id_seq OWNED BY public.billing_transactions.id;


--
-- Name: bom_components; Type: TABLE; Schema: public; Owner: Biwi_user
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


ALTER TABLE public.bom_components OWNER TO "Biwi_user";

--
-- Name: bom_components_id_seq; Type: SEQUENCE; Schema: public; Owner: Biwi_user
--

CREATE SEQUENCE public.bom_components_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bom_components_id_seq OWNER TO "Biwi_user";

--
-- Name: bom_components_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: Biwi_user
--

ALTER SEQUENCE public.bom_components_id_seq OWNED BY public.bom_components.id;


--
-- Name: bom_defaults; Type: TABLE; Schema: public; Owner: Biwi_user
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


ALTER TABLE public.bom_defaults OWNER TO "Biwi_user";

--
-- Name: bom_defaults_id_seq; Type: SEQUENCE; Schema: public; Owner: Biwi_user
--

CREATE SEQUENCE public.bom_defaults_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bom_defaults_id_seq OWNER TO "Biwi_user";

--
-- Name: bom_defaults_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: Biwi_user
--

ALTER SEQUENCE public.bom_defaults_id_seq OWNED BY public.bom_defaults.id;


--
-- Name: bom_headers; Type: TABLE; Schema: public; Owner: Biwi_user
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


ALTER TABLE public.bom_headers OWNER TO "Biwi_user";

--
-- Name: bom_headers_id_seq; Type: SEQUENCE; Schema: public; Owner: Biwi_user
--

CREATE SEQUENCE public.bom_headers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bom_headers_id_seq OWNER TO "Biwi_user";

--
-- Name: bom_headers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: Biwi_user
--

ALTER SEQUENCE public.bom_headers_id_seq OWNED BY public.bom_headers.id;


--
-- Name: branches; Type: TABLE; Schema: public; Owner: Biwi_user
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


ALTER TABLE public.branches OWNER TO "Biwi_user";

--
-- Name: branches_id_seq; Type: SEQUENCE; Schema: public; Owner: Biwi_user
--

CREATE SEQUENCE public.branches_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.branches_id_seq OWNER TO "Biwi_user";

--
-- Name: branches_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: Biwi_user
--

ALTER SEQUENCE public.branches_id_seq OWNED BY public.branches.id;


--
-- Name: companies; Type: TABLE; Schema: public; Owner: Biwi_user
--

CREATE TABLE public.companies (
    id integer NOT NULL,
    name character varying NOT NULL,
    address jsonb,
    contact_info jsonb,
    default_currency_code character varying(3),
    is_active boolean,
    code character varying(10) NOT NULL,
    subscription_status character varying DEFAULT 'trial'::character varying,
    subscription_plan character varying,
    subscription_expires date,
    storage_limit_gb integer DEFAULT 10,
    user_limit integer DEFAULT 5,
    primary_contact_email character varying,
    billing_email character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by_user_id integer,
    is_deleted boolean DEFAULT false
);


ALTER TABLE public.companies OWNER TO "Biwi_user";

--
-- Name: companies_id_seq; Type: SEQUENCE; Schema: public; Owner: Biwi_user
--

CREATE SEQUENCE public.companies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.companies_id_seq OWNER TO "Biwi_user";

--
-- Name: companies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: Biwi_user
--

ALTER SEQUENCE public.companies_id_seq OWNED BY public.companies.id;


--
-- Name: currencies; Type: TABLE; Schema: public; Owner: Biwi_user
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


ALTER TABLE public.currencies OWNER TO "Biwi_user";

--
-- Name: currencies_id_seq; Type: SEQUENCE; Schema: public; Owner: Biwi_user
--

CREATE SEQUENCE public.currencies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.currencies_id_seq OWNER TO "Biwi_user";

--
-- Name: currencies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: Biwi_user
--

ALTER SEQUENCE public.currencies_id_seq OWNED BY public.currencies.id;


--
-- Name: customers; Type: TABLE; Schema: public; Owner: Biwi_user
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


ALTER TABLE public.customers OWNER TO "Biwi_user";

--
-- Name: customers_id_seq; Type: SEQUENCE; Schema: public; Owner: Biwi_user
--

CREATE SEQUENCE public.customers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.customers_id_seq OWNER TO "Biwi_user";

--
-- Name: customers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: Biwi_user
--

ALTER SEQUENCE public.customers_id_seq OWNED BY public.customers.id;


--
-- Name: exchange_rate_history; Type: TABLE; Schema: public; Owner: Biwi_user
--

CREATE TABLE public.exchange_rate_history (
    id integer NOT NULL,
    company_id integer,
    currency_id integer,
    rate_date date,
    exchange_rate numeric(15,6),
    created_at timestamp without time zone
);


ALTER TABLE public.exchange_rate_history OWNER TO "Biwi_user";

--
-- Name: exchange_rate_history_id_seq; Type: SEQUENCE; Schema: public; Owner: Biwi_user
--

CREATE SEQUENCE public.exchange_rate_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.exchange_rate_history_id_seq OWNER TO "Biwi_user";

--
-- Name: exchange_rate_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: Biwi_user
--

ALTER SEQUENCE public.exchange_rate_history_id_seq OWNED BY public.exchange_rate_history.id;


--
-- Name: forex_gain_loss; Type: TABLE; Schema: public; Owner: Biwi_user
--

CREATE TABLE public.forex_gain_loss (
    id integer NOT NULL,
    company_id integer,
    transaction_type character varying,
    transaction_id integer,
    gain_loss_amount numeric(15,2),
    gl_journal_entry_id integer
);


ALTER TABLE public.forex_gain_loss OWNER TO "Biwi_user";

--
-- Name: forex_gain_loss_id_seq; Type: SEQUENCE; Schema: public; Owner: Biwi_user
--

CREATE SEQUENCE public.forex_gain_loss_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.forex_gain_loss_id_seq OWNER TO "Biwi_user";

--
-- Name: forex_gain_loss_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: Biwi_user
--

ALTER SEQUENCE public.forex_gain_loss_id_seq OWNED BY public.forex_gain_loss.id;


--
-- Name: gl_accounts; Type: TABLE; Schema: public; Owner: Biwi_user
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


ALTER TABLE public.gl_accounts OWNER TO "Biwi_user";

--
-- Name: gl_accounts_id_seq; Type: SEQUENCE; Schema: public; Owner: Biwi_user
--

CREATE SEQUENCE public.gl_accounts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.gl_accounts_id_seq OWNER TO "Biwi_user";

--
-- Name: gl_accounts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: Biwi_user
--

ALTER SEQUENCE public.gl_accounts_id_seq OWNED BY public.gl_accounts.id;


--
-- Name: gl_defaults; Type: TABLE; Schema: public; Owner: Biwi_user
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


ALTER TABLE public.gl_defaults OWNER TO "Biwi_user";

--
-- Name: gl_defaults_id_seq; Type: SEQUENCE; Schema: public; Owner: Biwi_user
--

CREATE SEQUENCE public.gl_defaults_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.gl_defaults_id_seq OWNER TO "Biwi_user";

--
-- Name: gl_defaults_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: Biwi_user
--

ALTER SEQUENCE public.gl_defaults_id_seq OWNED BY public.gl_defaults.id;


--
-- Name: gl_journal_entries; Type: TABLE; Schema: public; Owner: Biwi_user
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


ALTER TABLE public.gl_journal_entries OWNER TO "Biwi_user";

--
-- Name: gl_journal_entries_id_seq; Type: SEQUENCE; Schema: public; Owner: Biwi_user
--

CREATE SEQUENCE public.gl_journal_entries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.gl_journal_entries_id_seq OWNER TO "Biwi_user";

--
-- Name: gl_journal_entries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: Biwi_user
--

ALTER SEQUENCE public.gl_journal_entries_id_seq OWNED BY public.gl_journal_entries.id;


--
-- Name: gl_journal_entry_lines; Type: TABLE; Schema: public; Owner: Biwi_user
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


ALTER TABLE public.gl_journal_entry_lines OWNER TO "Biwi_user";

--
-- Name: gl_journal_entry_lines_id_seq; Type: SEQUENCE; Schema: public; Owner: Biwi_user
--

CREATE SEQUENCE public.gl_journal_entry_lines_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.gl_journal_entry_lines_id_seq OWNER TO "Biwi_user";

--
-- Name: gl_journal_entry_lines_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: Biwi_user
--

ALTER SEQUENCE public.gl_journal_entry_lines_id_seq OWNED BY public.gl_journal_entry_lines.id;


--
-- Name: gl_transaction_types; Type: TABLE; Schema: public; Owner: Biwi_user
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


ALTER TABLE public.gl_transaction_types OWNER TO "Biwi_user";

--
-- Name: gl_transaction_types_id_seq; Type: SEQUENCE; Schema: public; Owner: Biwi_user
--

CREATE SEQUENCE public.gl_transaction_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.gl_transaction_types_id_seq OWNER TO "Biwi_user";

--
-- Name: gl_transaction_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: Biwi_user
--

ALTER SEQUENCE public.gl_transaction_types_id_seq OWNED BY public.gl_transaction_types.id;


--
-- Name: goods_received_voucher_lines; Type: TABLE; Schema: public; Owner: Biwi_user
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


ALTER TABLE public.goods_received_voucher_lines OWNER TO "Biwi_user";

--
-- Name: goods_received_voucher_lines_id_seq; Type: SEQUENCE; Schema: public; Owner: Biwi_user
--

CREATE SEQUENCE public.goods_received_voucher_lines_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.goods_received_voucher_lines_id_seq OWNER TO "Biwi_user";

--
-- Name: goods_received_voucher_lines_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: Biwi_user
--

ALTER SEQUENCE public.goods_received_voucher_lines_id_seq OWNED BY public.goods_received_voucher_lines.id;


--
-- Name: goods_received_vouchers; Type: TABLE; Schema: public; Owner: Biwi_user
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


ALTER TABLE public.goods_received_vouchers OWNER TO "Biwi_user";

--
-- Name: goods_received_vouchers_id_seq; Type: SEQUENCE; Schema: public; Owner: Biwi_user
--

CREATE SEQUENCE public.goods_received_vouchers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.goods_received_vouchers_id_seq OWNER TO "Biwi_user";

--
-- Name: goods_received_vouchers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: Biwi_user
--

ALTER SEQUENCE public.goods_received_vouchers_id_seq OWNED BY public.goods_received_vouchers.id;


--
-- Name: inventory_count_lines; Type: TABLE; Schema: public; Owner: Biwi_user
--

CREATE TABLE public.inventory_count_lines (
    id integer NOT NULL,
    inventory_count_session_id integer NOT NULL,
    item_id integer NOT NULL,
    system_quantity numeric NOT NULL,
    counted_quantity numeric,
    variance_quantity numeric
);


ALTER TABLE public.inventory_count_lines OWNER TO "Biwi_user";

--
-- Name: inventory_count_lines_id_seq; Type: SEQUENCE; Schema: public; Owner: Biwi_user
--

CREATE SEQUENCE public.inventory_count_lines_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.inventory_count_lines_id_seq OWNER TO "Biwi_user";

--
-- Name: inventory_count_lines_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: Biwi_user
--

ALTER SEQUENCE public.inventory_count_lines_id_seq OWNED BY public.inventory_count_lines.id;


--
-- Name: inventory_count_sessions; Type: TABLE; Schema: public; Owner: Biwi_user
--

CREATE TABLE public.inventory_count_sessions (
    id integer NOT NULL,
    company_id integer NOT NULL,
    warehouse_id integer NOT NULL,
    count_date date NOT NULL,
    status character varying NOT NULL,
    notes text
);


ALTER TABLE public.inventory_count_sessions OWNER TO "Biwi_user";

--
-- Name: inventory_count_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: Biwi_user
--

CREATE SEQUENCE public.inventory_count_sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.inventory_count_sessions_id_seq OWNER TO "Biwi_user";

--
-- Name: inventory_count_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: Biwi_user
--

ALTER SEQUENCE public.inventory_count_sessions_id_seq OWNED BY public.inventory_count_sessions.id;


--
-- Name: inventory_defaults; Type: TABLE; Schema: public; Owner: Biwi_user
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


ALTER TABLE public.inventory_defaults OWNER TO "Biwi_user";

--
-- Name: inventory_defaults_id_seq; Type: SEQUENCE; Schema: public; Owner: Biwi_user
--

CREATE SEQUENCE public.inventory_defaults_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.inventory_defaults_id_seq OWNER TO "Biwi_user";

--
-- Name: inventory_defaults_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: Biwi_user
--

ALTER SEQUENCE public.inventory_defaults_id_seq OWNED BY public.inventory_defaults.id;


--
-- Name: inventory_item_locations; Type: TABLE; Schema: public; Owner: Biwi_user
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


ALTER TABLE public.inventory_item_locations OWNER TO "Biwi_user";

--
-- Name: inventory_item_locations_id_seq; Type: SEQUENCE; Schema: public; Owner: Biwi_user
--

CREATE SEQUENCE public.inventory_item_locations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.inventory_item_locations_id_seq OWNER TO "Biwi_user";

--
-- Name: inventory_item_locations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: Biwi_user
--

ALTER SEQUENCE public.inventory_item_locations_id_seq OWNED BY public.inventory_item_locations.id;


--
-- Name: inventory_items; Type: TABLE; Schema: public; Owner: Biwi_user
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


ALTER TABLE public.inventory_items OWNER TO "Biwi_user";

--
-- Name: inventory_items_id_seq; Type: SEQUENCE; Schema: public; Owner: Biwi_user
--

CREATE SEQUENCE public.inventory_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.inventory_items_id_seq OWNER TO "Biwi_user";

--
-- Name: inventory_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: Biwi_user
--

ALTER SEQUENCE public.inventory_items_id_seq OWNED BY public.inventory_items.id;


--
-- Name: inventory_transaction_types; Type: TABLE; Schema: public; Owner: Biwi_user
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


ALTER TABLE public.inventory_transaction_types OWNER TO "Biwi_user";

--
-- Name: inventory_transaction_types_id_seq; Type: SEQUENCE; Schema: public; Owner: Biwi_user
--

CREATE SEQUENCE public.inventory_transaction_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.inventory_transaction_types_id_seq OWNER TO "Biwi_user";

--
-- Name: inventory_transaction_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: Biwi_user
--

ALTER SEQUENCE public.inventory_transaction_types_id_seq OWNED BY public.inventory_transaction_types.id;


--
-- Name: inventory_transactions; Type: TABLE; Schema: public; Owner: Biwi_user
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


ALTER TABLE public.inventory_transactions OWNER TO "Biwi_user";

--
-- Name: inventory_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: Biwi_user
--

CREATE SEQUENCE public.inventory_transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.inventory_transactions_id_seq OWNER TO "Biwi_user";

--
-- Name: inventory_transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: Biwi_user
--

ALTER SEQUENCE public.inventory_transactions_id_seq OWNED BY public.inventory_transactions.id;


--
-- Name: item_barcodes; Type: TABLE; Schema: public; Owner: Biwi_user
--

CREATE TABLE public.item_barcodes (
    id integer NOT NULL,
    company_id integer NOT NULL,
    item_id integer NOT NULL,
    barcode character varying NOT NULL,
    unit_of_measure_id integer,
    quantity_in_uom numeric
);


ALTER TABLE public.item_barcodes OWNER TO "Biwi_user";

--
-- Name: item_barcodes_id_seq; Type: SEQUENCE; Schema: public; Owner: Biwi_user
--

CREATE SEQUENCE public.item_barcodes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.item_barcodes_id_seq OWNER TO "Biwi_user";

--
-- Name: item_barcodes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: Biwi_user
--

ALTER SEQUENCE public.item_barcodes_id_seq OWNED BY public.item_barcodes.id;


--
-- Name: manufacturing_order_components; Type: TABLE; Schema: public; Owner: Biwi_user
--

CREATE TABLE public.manufacturing_order_components (
    id integer NOT NULL,
    manufacturing_order_id integer NOT NULL,
    component_item_id integer NOT NULL,
    quantity_required numeric NOT NULL,
    quantity_issued numeric,
    unit_cost numeric NOT NULL
);


ALTER TABLE public.manufacturing_order_components OWNER TO "Biwi_user";

--
-- Name: manufacturing_order_components_id_seq; Type: SEQUENCE; Schema: public; Owner: Biwi_user
--

CREATE SEQUENCE public.manufacturing_order_components_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.manufacturing_order_components_id_seq OWNER TO "Biwi_user";

--
-- Name: manufacturing_order_components_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: Biwi_user
--

ALTER SEQUENCE public.manufacturing_order_components_id_seq OWNED BY public.manufacturing_order_components.id;


--
-- Name: manufacturing_orders; Type: TABLE; Schema: public; Owner: Biwi_user
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


ALTER TABLE public.manufacturing_orders OWNER TO "Biwi_user";

--
-- Name: manufacturing_orders_id_seq; Type: SEQUENCE; Schema: public; Owner: Biwi_user
--

CREATE SEQUENCE public.manufacturing_orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.manufacturing_orders_id_seq OWNER TO "Biwi_user";

--
-- Name: manufacturing_orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: Biwi_user
--

ALTER SEQUENCE public.manufacturing_orders_id_seq OWNED BY public.manufacturing_orders.id;


--
-- Name: order_defaults; Type: TABLE; Schema: public; Owner: Biwi_user
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


ALTER TABLE public.order_defaults OWNER TO "Biwi_user";

--
-- Name: order_defaults_id_seq; Type: SEQUENCE; Schema: public; Owner: Biwi_user
--

CREATE SEQUENCE public.order_defaults_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.order_defaults_id_seq OWNER TO "Biwi_user";

--
-- Name: order_defaults_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: Biwi_user
--

ALTER SEQUENCE public.order_defaults_id_seq OWNED BY public.order_defaults.id;


--
-- Name: platform_audit_logs; Type: TABLE; Schema: public; Owner: Biwi_user
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


ALTER TABLE public.platform_audit_logs OWNER TO "Biwi_user";

--
-- Name: platform_audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: Biwi_user
--

CREATE SEQUENCE public.platform_audit_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.platform_audit_logs_id_seq OWNER TO "Biwi_user";

--
-- Name: platform_audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: Biwi_user
--

ALTER SEQUENCE public.platform_audit_logs_id_seq OWNED BY public.platform_audit_logs.id;


--
-- Name: pos_cash_movements; Type: TABLE; Schema: public; Owner: Biwi_user
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


ALTER TABLE public.pos_cash_movements OWNER TO "Biwi_user";

--
-- Name: pos_cash_movements_id_seq; Type: SEQUENCE; Schema: public; Owner: Biwi_user
--

CREATE SEQUENCE public.pos_cash_movements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pos_cash_movements_id_seq OWNER TO "Biwi_user";

--
-- Name: pos_cash_movements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: Biwi_user
--

ALTER SEQUENCE public.pos_cash_movements_id_seq OWNED BY public.pos_cash_movements.id;


--
-- Name: pos_defaults; Type: TABLE; Schema: public; Owner: Biwi_user
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


ALTER TABLE public.pos_defaults OWNER TO "Biwi_user";

--
-- Name: pos_defaults_id_seq; Type: SEQUENCE; Schema: public; Owner: Biwi_user
--

CREATE SEQUENCE public.pos_defaults_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pos_defaults_id_seq OWNER TO "Biwi_user";

--
-- Name: pos_defaults_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: Biwi_user
--

ALTER SEQUENCE public.pos_defaults_id_seq OWNED BY public.pos_defaults.id;


--
-- Name: pos_sessions; Type: TABLE; Schema: public; Owner: Biwi_user
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


ALTER TABLE public.pos_sessions OWNER TO "Biwi_user";

--
-- Name: pos_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: Biwi_user
--

CREATE SEQUENCE public.pos_sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pos_sessions_id_seq OWNER TO "Biwi_user";

--
-- Name: pos_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: Biwi_user
--

ALTER SEQUENCE public.pos_sessions_id_seq OWNED BY public.pos_sessions.id;


--
-- Name: pos_transaction_lines; Type: TABLE; Schema: public; Owner: Biwi_user
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


ALTER TABLE public.pos_transaction_lines OWNER TO "Biwi_user";

--
-- Name: pos_transaction_lines_id_seq; Type: SEQUENCE; Schema: public; Owner: Biwi_user
--

CREATE SEQUENCE public.pos_transaction_lines_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pos_transaction_lines_id_seq OWNER TO "Biwi_user";

--
-- Name: pos_transaction_lines_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: Biwi_user
--

ALTER SEQUENCE public.pos_transaction_lines_id_seq OWNED BY public.pos_transaction_lines.id;


--
-- Name: pos_transaction_types; Type: TABLE; Schema: public; Owner: Biwi_user
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


ALTER TABLE public.pos_transaction_types OWNER TO "Biwi_user";

--
-- Name: pos_transaction_types_id_seq; Type: SEQUENCE; Schema: public; Owner: Biwi_user
--

CREATE SEQUENCE public.pos_transaction_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pos_transaction_types_id_seq OWNER TO "Biwi_user";

--
-- Name: pos_transaction_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: Biwi_user
--

ALTER SEQUENCE public.pos_transaction_types_id_seq OWNED BY public.pos_transaction_types.id;


--
-- Name: pos_transactions; Type: TABLE; Schema: public; Owner: Biwi_user
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


ALTER TABLE public.pos_transactions OWNER TO "Biwi_user";

--
-- Name: pos_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: Biwi_user
--

CREATE SEQUENCE public.pos_transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pos_transactions_id_seq OWNER TO "Biwi_user";

--
-- Name: pos_transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: Biwi_user
--

ALTER SEQUENCE public.pos_transactions_id_seq OWNED BY public.pos_transactions.id;


--
-- Name: purchase_order_lines; Type: TABLE; Schema: public; Owner: Biwi_user
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


ALTER TABLE public.purchase_order_lines OWNER TO "Biwi_user";

--
-- Name: purchase_order_lines_id_seq; Type: SEQUENCE; Schema: public; Owner: Biwi_user
--

CREATE SEQUENCE public.purchase_order_lines_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.purchase_order_lines_id_seq OWNER TO "Biwi_user";

--
-- Name: purchase_order_lines_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: Biwi_user
--

ALTER SEQUENCE public.purchase_order_lines_id_seq OWNED BY public.purchase_order_lines.id;


--
-- Name: purchase_orders; Type: TABLE; Schema: public; Owner: Biwi_user
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


ALTER TABLE public.purchase_orders OWNER TO "Biwi_user";

--
-- Name: purchase_orders_id_seq; Type: SEQUENCE; Schema: public; Owner: Biwi_user
--

CREATE SEQUENCE public.purchase_orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.purchase_orders_id_seq OWNER TO "Biwi_user";

--
-- Name: purchase_orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: Biwi_user
--

ALTER SEQUENCE public.purchase_orders_id_seq OWNED BY public.purchase_orders.id;


--
-- Name: report_schedules; Type: TABLE; Schema: public; Owner: Biwi_user
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


ALTER TABLE public.report_schedules OWNER TO "Biwi_user";

--
-- Name: report_schedules_id_seq; Type: SEQUENCE; Schema: public; Owner: Biwi_user
--

CREATE SEQUENCE public.report_schedules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.report_schedules_id_seq OWNER TO "Biwi_user";

--
-- Name: report_schedules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: Biwi_user
--

ALTER SEQUENCE public.report_schedules_id_seq OWNED BY public.report_schedules.id;


--
-- Name: report_templates; Type: TABLE; Schema: public; Owner: Biwi_user
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


ALTER TABLE public.report_templates OWNER TO "Biwi_user";

--
-- Name: report_templates_id_seq; Type: SEQUENCE; Schema: public; Owner: Biwi_user
--

CREATE SEQUENCE public.report_templates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.report_templates_id_seq OWNER TO "Biwi_user";

--
-- Name: report_templates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: Biwi_user
--

ALTER SEQUENCE public.report_templates_id_seq OWNED BY public.report_templates.id;


--
-- Name: resource_usage; Type: TABLE; Schema: public; Owner: Biwi_user
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


ALTER TABLE public.resource_usage OWNER TO "Biwi_user";

--
-- Name: resource_usage_id_seq; Type: SEQUENCE; Schema: public; Owner: Biwi_user
--

CREATE SEQUENCE public.resource_usage_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.resource_usage_id_seq OWNER TO "Biwi_user";

--
-- Name: resource_usage_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: Biwi_user
--

ALTER SEQUENCE public.resource_usage_id_seq OWNED BY public.resource_usage.id;


--
-- Name: roles; Type: TABLE; Schema: public; Owner: Biwi_user
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    name character varying NOT NULL,
    description character varying,
    permissions jsonb,
    company_id integer NOT NULL
);


ALTER TABLE public.roles OWNER TO "Biwi_user";

--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: Biwi_user
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_id_seq OWNER TO "Biwi_user";

--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: Biwi_user
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- Name: sales_order_lines; Type: TABLE; Schema: public; Owner: Biwi_user
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


ALTER TABLE public.sales_order_lines OWNER TO "Biwi_user";

--
-- Name: sales_order_lines_id_seq; Type: SEQUENCE; Schema: public; Owner: Biwi_user
--

CREATE SEQUENCE public.sales_order_lines_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sales_order_lines_id_seq OWNER TO "Biwi_user";

--
-- Name: sales_order_lines_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: Biwi_user
--

ALTER SEQUENCE public.sales_order_lines_id_seq OWNED BY public.sales_order_lines.id;


--
-- Name: sales_orders; Type: TABLE; Schema: public; Owner: Biwi_user
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


ALTER TABLE public.sales_orders OWNER TO "Biwi_user";

--
-- Name: sales_orders_id_seq; Type: SEQUENCE; Schema: public; Owner: Biwi_user
--

CREATE SEQUENCE public.sales_orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sales_orders_id_seq OWNER TO "Biwi_user";

--
-- Name: sales_orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: Biwi_user
--

ALTER SEQUENCE public.sales_orders_id_seq OWNED BY public.sales_orders.id;


--
-- Name: sales_representatives; Type: TABLE; Schema: public; Owner: Biwi_user
--

CREATE TABLE public.sales_representatives (
    id integer NOT NULL,
    company_id integer NOT NULL,
    name character varying NOT NULL,
    contact_info jsonb,
    is_active boolean
);


ALTER TABLE public.sales_representatives OWNER TO "Biwi_user";

--
-- Name: sales_representatives_id_seq; Type: SEQUENCE; Schema: public; Owner: Biwi_user
--

CREATE SEQUENCE public.sales_representatives_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sales_representatives_id_seq OWNER TO "Biwi_user";

--
-- Name: sales_representatives_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: Biwi_user
--

ALTER SEQUENCE public.sales_representatives_id_seq OWNED BY public.sales_representatives.id;


--
-- Name: suppliers; Type: TABLE; Schema: public; Owner: Biwi_user
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


ALTER TABLE public.suppliers OWNER TO "Biwi_user";

--
-- Name: suppliers_id_seq; Type: SEQUENCE; Schema: public; Owner: Biwi_user
--

CREATE SEQUENCE public.suppliers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.suppliers_id_seq OWNER TO "Biwi_user";

--
-- Name: suppliers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: Biwi_user
--

ALTER SEQUENCE public.suppliers_id_seq OWNED BY public.suppliers.id;


--
-- Name: tax_types; Type: TABLE; Schema: public; Owner: Biwi_user
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


ALTER TABLE public.tax_types OWNER TO "Biwi_user";

--
-- Name: tax_types_id_seq; Type: SEQUENCE; Schema: public; Owner: Biwi_user
--

CREATE SEQUENCE public.tax_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tax_types_id_seq OWNER TO "Biwi_user";

--
-- Name: tax_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: Biwi_user
--

ALTER SEQUENCE public.tax_types_id_seq OWNED BY public.tax_types.id;


--
-- Name: tills; Type: TABLE; Schema: public; Owner: Biwi_user
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


ALTER TABLE public.tills OWNER TO "Biwi_user";

--
-- Name: tills_id_seq; Type: SEQUENCE; Schema: public; Owner: Biwi_user
--

CREATE SEQUENCE public.tills_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tills_id_seq OWNER TO "Biwi_user";

--
-- Name: tills_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: Biwi_user
--

ALTER SEQUENCE public.tills_id_seq OWNED BY public.tills.id;


--
-- Name: unit_of_measures; Type: TABLE; Schema: public; Owner: Biwi_user
--

CREATE TABLE public.unit_of_measures (
    id integer NOT NULL,
    company_id integer NOT NULL,
    name character varying NOT NULL,
    abbreviation character varying NOT NULL,
    conversion_factor_to_base numeric,
    is_active boolean
);


ALTER TABLE public.unit_of_measures OWNER TO "Biwi_user";

--
-- Name: unit_of_measures_id_seq; Type: SEQUENCE; Schema: public; Owner: Biwi_user
--

CREATE SEQUENCE public.unit_of_measures_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.unit_of_measures_id_seq OWNER TO "Biwi_user";

--
-- Name: unit_of_measures_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: Biwi_user
--

ALTER SEQUENCE public.unit_of_measures_id_seq OWNED BY public.unit_of_measures.id;


--
-- Name: usage_alerts; Type: TABLE; Schema: public; Owner: Biwi_user
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


ALTER TABLE public.usage_alerts OWNER TO "Biwi_user";

--
-- Name: usage_alerts_id_seq; Type: SEQUENCE; Schema: public; Owner: Biwi_user
--

CREATE SEQUENCE public.usage_alerts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.usage_alerts_id_seq OWNER TO "Biwi_user";

--
-- Name: usage_alerts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: Biwi_user
--

ALTER SEQUENCE public.usage_alerts_id_seq OWNED BY public.usage_alerts.id;


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: Biwi_user
--

CREATE TABLE public.user_roles (
    user_id integer NOT NULL,
    role_id integer NOT NULL
);


ALTER TABLE public.user_roles OWNER TO "Biwi_user";

--
-- Name: users; Type: TABLE; Schema: public; Owner: Biwi_user
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email character varying NOT NULL,
    hashed_password character varying NOT NULL,
    full_name character varying,
    is_active boolean,
    is_superuser boolean,
    company_id integer,
    user_type public.usertype DEFAULT 'company_user'::public.usertype NOT NULL,
    default_company_id integer,
    last_login timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_company_required_for_non_platform_users CHECK (((user_type = 'platform_admin'::public.usertype) OR (company_id IS NOT NULL)))
);


ALTER TABLE public.users OWNER TO "Biwi_user";

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: Biwi_user
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO "Biwi_user";

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: Biwi_user
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: warehouses; Type: TABLE; Schema: public; Owner: Biwi_user
--

CREATE TABLE public.warehouses (
    id integer NOT NULL,
    company_id integer NOT NULL,
    name character varying NOT NULL,
    location character varying,
    is_default boolean,
    is_active boolean
);


ALTER TABLE public.warehouses OWNER TO "Biwi_user";

--
-- Name: warehouses_id_seq; Type: SEQUENCE; Schema: public; Owner: Biwi_user
--

CREATE SEQUENCE public.warehouses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.warehouses_id_seq OWNER TO "Biwi_user";

--
-- Name: warehouses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: Biwi_user
--

ALTER SEQUENCE public.warehouses_id_seq OWNED BY public.warehouses.id;


--
-- Name: accounting_periods id; Type: DEFAULT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.accounting_periods ALTER COLUMN id SET DEFAULT nextval('public.accounting_periods_id_seq'::regclass);


--
-- Name: ap_allocation_lines id; Type: DEFAULT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.ap_allocation_lines ALTER COLUMN id SET DEFAULT nextval('public.ap_allocation_lines_id_seq'::regclass);


--
-- Name: ap_allocations id; Type: DEFAULT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.ap_allocations ALTER COLUMN id SET DEFAULT nextval('public.ap_allocations_id_seq'::regclass);


--
-- Name: ap_defaults id; Type: DEFAULT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.ap_defaults ALTER COLUMN id SET DEFAULT nextval('public.ap_defaults_id_seq'::regclass);


--
-- Name: ap_transaction_tax_lines id; Type: DEFAULT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.ap_transaction_tax_lines ALTER COLUMN id SET DEFAULT nextval('public.ap_transaction_tax_lines_id_seq'::regclass);


--
-- Name: ap_transaction_types id; Type: DEFAULT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.ap_transaction_types ALTER COLUMN id SET DEFAULT nextval('public.ap_transaction_types_id_seq'::regclass);


--
-- Name: ap_transactions id; Type: DEFAULT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.ap_transactions ALTER COLUMN id SET DEFAULT nextval('public.ap_transactions_id_seq'::regclass);


--
-- Name: ar_allocation_lines id; Type: DEFAULT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.ar_allocation_lines ALTER COLUMN id SET DEFAULT nextval('public.ar_allocation_lines_id_seq'::regclass);


--
-- Name: ar_allocations id; Type: DEFAULT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.ar_allocations ALTER COLUMN id SET DEFAULT nextval('public.ar_allocations_id_seq'::regclass);


--
-- Name: ar_defaults id; Type: DEFAULT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.ar_defaults ALTER COLUMN id SET DEFAULT nextval('public.ar_defaults_id_seq'::regclass);


--
-- Name: ar_transaction_tax_lines id; Type: DEFAULT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.ar_transaction_tax_lines ALTER COLUMN id SET DEFAULT nextval('public.ar_transaction_tax_lines_id_seq'::regclass);


--
-- Name: ar_transaction_types id; Type: DEFAULT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.ar_transaction_types ALTER COLUMN id SET DEFAULT nextval('public.ar_transaction_types_id_seq'::regclass);


--
-- Name: ar_transactions id; Type: DEFAULT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.ar_transactions ALTER COLUMN id SET DEFAULT nextval('public.ar_transactions_id_seq'::regclass);


--
-- Name: ar_writeoffs id; Type: DEFAULT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.ar_writeoffs ALTER COLUMN id SET DEFAULT nextval('public.ar_writeoffs_id_seq'::regclass);


--
-- Name: bank_reconciliation_items id; Type: DEFAULT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.bank_reconciliation_items ALTER COLUMN id SET DEFAULT nextval('public.bank_reconciliation_items_id_seq'::regclass);


--
-- Name: bank_reconciliations id; Type: DEFAULT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.bank_reconciliations ALTER COLUMN id SET DEFAULT nextval('public.bank_reconciliations_id_seq'::regclass);


--
-- Name: billing_configurations id; Type: DEFAULT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.billing_configurations ALTER COLUMN id SET DEFAULT nextval('public.billing_configurations_id_seq'::regclass);


--
-- Name: billing_transactions id; Type: DEFAULT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.billing_transactions ALTER COLUMN id SET DEFAULT nextval('public.billing_transactions_id_seq'::regclass);


--
-- Name: bom_components id; Type: DEFAULT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.bom_components ALTER COLUMN id SET DEFAULT nextval('public.bom_components_id_seq'::regclass);


--
-- Name: bom_defaults id; Type: DEFAULT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.bom_defaults ALTER COLUMN id SET DEFAULT nextval('public.bom_defaults_id_seq'::regclass);


--
-- Name: bom_headers id; Type: DEFAULT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.bom_headers ALTER COLUMN id SET DEFAULT nextval('public.bom_headers_id_seq'::regclass);


--
-- Name: branches id; Type: DEFAULT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.branches ALTER COLUMN id SET DEFAULT nextval('public.branches_id_seq'::regclass);


--
-- Name: companies id; Type: DEFAULT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.companies ALTER COLUMN id SET DEFAULT nextval('public.companies_id_seq'::regclass);


--
-- Name: currencies id; Type: DEFAULT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.currencies ALTER COLUMN id SET DEFAULT nextval('public.currencies_id_seq'::regclass);


--
-- Name: customers id; Type: DEFAULT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.customers ALTER COLUMN id SET DEFAULT nextval('public.customers_id_seq'::regclass);


--
-- Name: exchange_rate_history id; Type: DEFAULT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.exchange_rate_history ALTER COLUMN id SET DEFAULT nextval('public.exchange_rate_history_id_seq'::regclass);


--
-- Name: forex_gain_loss id; Type: DEFAULT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.forex_gain_loss ALTER COLUMN id SET DEFAULT nextval('public.forex_gain_loss_id_seq'::regclass);


--
-- Name: gl_accounts id; Type: DEFAULT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.gl_accounts ALTER COLUMN id SET DEFAULT nextval('public.gl_accounts_id_seq'::regclass);


--
-- Name: gl_defaults id; Type: DEFAULT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.gl_defaults ALTER COLUMN id SET DEFAULT nextval('public.gl_defaults_id_seq'::regclass);


--
-- Name: gl_journal_entries id; Type: DEFAULT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.gl_journal_entries ALTER COLUMN id SET DEFAULT nextval('public.gl_journal_entries_id_seq'::regclass);


--
-- Name: gl_journal_entry_lines id; Type: DEFAULT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.gl_journal_entry_lines ALTER COLUMN id SET DEFAULT nextval('public.gl_journal_entry_lines_id_seq'::regclass);


--
-- Name: gl_transaction_types id; Type: DEFAULT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.gl_transaction_types ALTER COLUMN id SET DEFAULT nextval('public.gl_transaction_types_id_seq'::regclass);


--
-- Name: goods_received_voucher_lines id; Type: DEFAULT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.goods_received_voucher_lines ALTER COLUMN id SET DEFAULT nextval('public.goods_received_voucher_lines_id_seq'::regclass);


--
-- Name: goods_received_vouchers id; Type: DEFAULT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.goods_received_vouchers ALTER COLUMN id SET DEFAULT nextval('public.goods_received_vouchers_id_seq'::regclass);


--
-- Name: inventory_count_lines id; Type: DEFAULT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.inventory_count_lines ALTER COLUMN id SET DEFAULT nextval('public.inventory_count_lines_id_seq'::regclass);


--
-- Name: inventory_count_sessions id; Type: DEFAULT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.inventory_count_sessions ALTER COLUMN id SET DEFAULT nextval('public.inventory_count_sessions_id_seq'::regclass);


--
-- Name: inventory_defaults id; Type: DEFAULT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.inventory_defaults ALTER COLUMN id SET DEFAULT nextval('public.inventory_defaults_id_seq'::regclass);


--
-- Name: inventory_item_locations id; Type: DEFAULT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.inventory_item_locations ALTER COLUMN id SET DEFAULT nextval('public.inventory_item_locations_id_seq'::regclass);


--
-- Name: inventory_items id; Type: DEFAULT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.inventory_items ALTER COLUMN id SET DEFAULT nextval('public.inventory_items_id_seq'::regclass);


--
-- Name: inventory_transaction_types id; Type: DEFAULT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.inventory_transaction_types ALTER COLUMN id SET DEFAULT nextval('public.inventory_transaction_types_id_seq'::regclass);


--
-- Name: inventory_transactions id; Type: DEFAULT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.inventory_transactions ALTER COLUMN id SET DEFAULT nextval('public.inventory_transactions_id_seq'::regclass);


--
-- Name: item_barcodes id; Type: DEFAULT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.item_barcodes ALTER COLUMN id SET DEFAULT nextval('public.item_barcodes_id_seq'::regclass);


--
-- Name: manufacturing_order_components id; Type: DEFAULT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.manufacturing_order_components ALTER COLUMN id SET DEFAULT nextval('public.manufacturing_order_components_id_seq'::regclass);


--
-- Name: manufacturing_orders id; Type: DEFAULT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.manufacturing_orders ALTER COLUMN id SET DEFAULT nextval('public.manufacturing_orders_id_seq'::regclass);


--
-- Name: order_defaults id; Type: DEFAULT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.order_defaults ALTER COLUMN id SET DEFAULT nextval('public.order_defaults_id_seq'::regclass);


--
-- Name: platform_audit_logs id; Type: DEFAULT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.platform_audit_logs ALTER COLUMN id SET DEFAULT nextval('public.platform_audit_logs_id_seq'::regclass);


--
-- Name: pos_cash_movements id; Type: DEFAULT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.pos_cash_movements ALTER COLUMN id SET DEFAULT nextval('public.pos_cash_movements_id_seq'::regclass);


--
-- Name: pos_defaults id; Type: DEFAULT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.pos_defaults ALTER COLUMN id SET DEFAULT nextval('public.pos_defaults_id_seq'::regclass);


--
-- Name: pos_sessions id; Type: DEFAULT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.pos_sessions ALTER COLUMN id SET DEFAULT nextval('public.pos_sessions_id_seq'::regclass);


--
-- Name: pos_transaction_lines id; Type: DEFAULT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.pos_transaction_lines ALTER COLUMN id SET DEFAULT nextval('public.pos_transaction_lines_id_seq'::regclass);


--
-- Name: pos_transaction_types id; Type: DEFAULT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.pos_transaction_types ALTER COLUMN id SET DEFAULT nextval('public.pos_transaction_types_id_seq'::regclass);


--
-- Name: pos_transactions id; Type: DEFAULT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.pos_transactions ALTER COLUMN id SET DEFAULT nextval('public.pos_transactions_id_seq'::regclass);


--
-- Name: purchase_order_lines id; Type: DEFAULT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.purchase_order_lines ALTER COLUMN id SET DEFAULT nextval('public.purchase_order_lines_id_seq'::regclass);


--
-- Name: purchase_orders id; Type: DEFAULT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.purchase_orders ALTER COLUMN id SET DEFAULT nextval('public.purchase_orders_id_seq'::regclass);


--
-- Name: report_schedules id; Type: DEFAULT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.report_schedules ALTER COLUMN id SET DEFAULT nextval('public.report_schedules_id_seq'::regclass);


--
-- Name: report_templates id; Type: DEFAULT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.report_templates ALTER COLUMN id SET DEFAULT nextval('public.report_templates_id_seq'::regclass);


--
-- Name: resource_usage id; Type: DEFAULT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.resource_usage ALTER COLUMN id SET DEFAULT nextval('public.resource_usage_id_seq'::regclass);


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Name: sales_order_lines id; Type: DEFAULT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.sales_order_lines ALTER COLUMN id SET DEFAULT nextval('public.sales_order_lines_id_seq'::regclass);


--
-- Name: sales_orders id; Type: DEFAULT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.sales_orders ALTER COLUMN id SET DEFAULT nextval('public.sales_orders_id_seq'::regclass);


--
-- Name: sales_representatives id; Type: DEFAULT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.sales_representatives ALTER COLUMN id SET DEFAULT nextval('public.sales_representatives_id_seq'::regclass);


--
-- Name: suppliers id; Type: DEFAULT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.suppliers ALTER COLUMN id SET DEFAULT nextval('public.suppliers_id_seq'::regclass);


--
-- Name: tax_types id; Type: DEFAULT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.tax_types ALTER COLUMN id SET DEFAULT nextval('public.tax_types_id_seq'::regclass);


--
-- Name: tills id; Type: DEFAULT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.tills ALTER COLUMN id SET DEFAULT nextval('public.tills_id_seq'::regclass);


--
-- Name: unit_of_measures id; Type: DEFAULT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.unit_of_measures ALTER COLUMN id SET DEFAULT nextval('public.unit_of_measures_id_seq'::regclass);


--
-- Name: usage_alerts id; Type: DEFAULT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.usage_alerts ALTER COLUMN id SET DEFAULT nextval('public.usage_alerts_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: warehouses id; Type: DEFAULT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.warehouses ALTER COLUMN id SET DEFAULT nextval('public.warehouses_id_seq'::regclass);


--
-- Data for Name: accounting_periods; Type: TABLE DATA; Schema: public; Owner: Biwi_user
--

COPY public.accounting_periods (id, company_id, name, start_date, end_date, status) FROM stdin;
\.


--
-- Data for Name: alembic_version; Type: TABLE DATA; Schema: public; Owner: Biwi_user
--

COPY public.alembic_version (version_num) FROM stdin;
34de23dec61f
\.


--
-- Data for Name: ap_allocation_lines; Type: TABLE DATA; Schema: public; Owner: Biwi_user
--

COPY public.ap_allocation_lines (id, ap_allocation_id, credit_transaction_id, debit_transaction_id, allocated_amount) FROM stdin;
\.


--
-- Data for Name: ap_allocations; Type: TABLE DATA; Schema: public; Owner: Biwi_user
--

COPY public.ap_allocations (id, company_id, allocation_date, supplier_id) FROM stdin;
\.


--
-- Data for Name: ap_defaults; Type: TABLE DATA; Schema: public; Owner: Biwi_user
--

COPY public.ap_defaults (id, company_id, default_ap_control_gl_account_id, default_expense_gl_account_id, default_payment_gl_account_id, default_purchase_discount_gl_account_id) FROM stdin;
1	1	5	11	1	\N
2	9	111	93	109	\N
\.


--
-- Data for Name: ap_transaction_tax_lines; Type: TABLE DATA; Schema: public; Owner: Biwi_user
--

COPY public.ap_transaction_tax_lines (id, ap_transaction_id, tax_type_id, taxable_amount, tax_amount, base_currency_tax_amount) FROM stdin;
\.


--
-- Data for Name: ap_transaction_types; Type: TABLE DATA; Schema: public; Owner: Biwi_user
--

COPY public.ap_transaction_types (id, company_id, name, description, base_type, default_gl_account_id, default_ap_control_gl_account_id, affects_balance_direction, is_active) FROM stdin;
1	1	Supplier Invoice	\N	Supplier Invoice	11	5	Credit	t
2	1	Supplier Payment	\N	Payment	1	5	Debit	t
3	1	Debit Note	\N	Debit Note	11	5	Debit	t
6	9	Supplier Invoice	\N	Supplier Invoice	93	111	Credit	t
7	9	Supplier Payment	\N	Payment	109	111	Debit	t
8	9	Debit Note	\N	Debit Note	93	111	Debit	t
\.


--
-- Data for Name: ap_transactions; Type: TABLE DATA; Schema: public; Owner: Biwi_user
--

COPY public.ap_transactions (id, company_id, supplier_id, ap_transaction_type_id, linked_gl_journal_entry_id, purchase_order_id, transaction_date, due_date, reference, document_number, total_amount, open_amount, is_posted_to_gl, status, currency_id, exchange_rate, base_currency_amount, foreign_currency_amount) FROM stdin;
1	1	1	1	\N	\N	2025-06-26	2025-07-26	GRV-GRV000001	SI-000001	2200.00	2200.00	f	Draft	\N	\N	\N	\N
\.


--
-- Data for Name: ar_allocation_lines; Type: TABLE DATA; Schema: public; Owner: Biwi_user
--

COPY public.ar_allocation_lines (id, ar_allocation_id, debit_transaction_id, credit_transaction_id, allocated_amount) FROM stdin;
1	1	15	16	400.00
\.


--
-- Data for Name: ar_allocations; Type: TABLE DATA; Schema: public; Owner: Biwi_user
--

COPY public.ar_allocations (id, company_id, allocation_date, customer_id) FROM stdin;
1	1	2025-06-22	4
\.


--
-- Data for Name: ar_defaults; Type: TABLE DATA; Schema: public; Owner: Biwi_user
--

COPY public.ar_defaults (id, company_id, default_ar_control_gl_account_id, default_sales_gl_account_id, default_receipt_gl_account_id, default_sales_discount_gl_account_id, default_bad_debt_gl_account_id) FROM stdin;
1	1	39	38	42	11	43
\.


--
-- Data for Name: ar_transaction_tax_lines; Type: TABLE DATA; Schema: public; Owner: Biwi_user
--

COPY public.ar_transaction_tax_lines (id, ar_transaction_id, tax_type_id, taxable_amount, tax_amount, base_currency_tax_amount) FROM stdin;
\.


--
-- Data for Name: ar_transaction_types; Type: TABLE DATA; Schema: public; Owner: Biwi_user
--

COPY public.ar_transaction_types (id, company_id, name, description, base_type, default_gl_account_id, default_ar_control_gl_account_id, affects_balance_direction, is_active) FROM stdin;
1	1	Sales Invoice	Standard sales invoice for goods/services	Invoice	\N	\N	Debit	t
2	1	Service Invoice	Invoice for services rendered	Invoice	\N	\N	Debit	t
3	1	Customer Receipt	Payment received from customer	Receipt	\N	\N	Credit	t
4	1	Bank Receipt	Payment received via bank transfer	Receipt	\N	\N	Credit	t
5	1	Sales Return	Credit note for returned goods	Credit Note	\N	\N	Credit	t
6	1	Price Adjustment	Credit note for price adjustments	Credit Note	\N	\N	Credit	t
7	1	AR Journal Entry	Manual AR adjustment entry	Journal	\N	\N	Debit	t
8	1	Test Invoice Type	Test invoice transaction type	Invoice	\N	\N	Debit	t
10	3	Sales Invoice	Standard sales invoice for goods/services	Invoice	\N	\N	Debit	t
11	3	Service Invoice	Invoice for services rendered	Invoice	\N	\N	Debit	t
12	3	Customer Receipt	Payment received from customer	Receipt	\N	\N	Credit	t
13	3	Bank Receipt	Payment received via bank transfer	Receipt	\N	\N	Credit	t
14	3	Sales Return	Credit note for returned goods	Credit Note	\N	\N	Credit	t
15	3	Price Adjustment	Credit note for price adjustments	Credit Note	\N	\N	Credit	t
16	3	AR Journal Entry	Manual AR adjustment entry	Journal	\N	\N	Debit	t
17	1	Bad Debt Write-off	Write-off of uncollectible accounts receivable	Write-off	\N	39	Credit	t
\.


--
-- Data for Name: ar_transactions; Type: TABLE DATA; Schema: public; Owner: Biwi_user
--

COPY public.ar_transactions (id, company_id, customer_id, ar_transaction_type_id, linked_gl_journal_entry_id, sales_order_id, transaction_date, due_date, reference, document_number, total_amount, open_amount, is_posted_to_gl, status, currency_id, exchange_rate, base_currency_amount, foreign_currency_amount) FROM stdin;
7	1	3	1	11	\N	2025-06-16	2025-07-16	TEST-SO-001	INV-SO000014	800.00	800.00	t	Posted	\N	\N	\N	\N
8	1	3	1	13	\N	2025-06-16	2025-07-16	TEST-SO-001	INV-SO000015	800.00	800.00	t	Posted	\N	\N	\N	\N
9	1	3	1	15	\N	2025-06-16	2025-07-16	TEST-SO-001	INV-SO000016	800.00	800.00	t	Posted	\N	\N	\N	\N
11	1	4	1	\N	\N	2025-06-17	2025-07-17	CUST001	INV-SO000018	400.00	400.00	f	Draft	\N	\N	\N	\N
13	1	4	1	\N	\N	2025-06-17	2025-07-17	CUST001	INV-SO000017	400.00	400.00	f	Draft	\N	\N	\N	\N
15	1	4	1	22	\N	2025-06-17	2025-07-17	SO-020	INV-SO000019	400.00	0.00	t	Paid	\N	\N	\N	\N
16	1	4	4	25	\N	2025-06-22	\N	CHK-001	RCP-202506-663	400.00	0.00	t	Paid	\N	\N	\N	\N
1	1	4	1	3	\N	2025-06-16	2025-07-16	CUST001	INV-SO000008	400.00	0.00	f	Written Off	\N	\N	\N	\N
2	1	3	1	\N	\N	2025-06-16	2025-07-16	TEST-SO-001	INV-SO000009	800.00	700.00	f	Partially Written Off	\N	\N	\N	\N
3	1	3	1	\N	\N	2025-06-16	2025-07-16	TEST-SO-001	INV-SO000010	800.00	700.00	f	Partially Written Off	\N	\N	\N	\N
4	1	3	1	\N	\N	2025-06-16	2025-07-16	TEST-SO-001	INV-SO000011	800.00	700.00	f	Partially Written Off	\N	\N	\N	\N
5	1	3	1	7	\N	2025-06-16	2025-07-16	TEST-SO-001	INV-SO000012	800.00	700.00	t	Partially Written Off	\N	\N	\N	\N
6	1	3	1	9	\N	2025-06-16	2025-07-16	TEST-SO-001	INV-SO000013	800.00	700.00	t	Partially Written Off	\N	\N	\N	\N
10	1	4	3	\N	\N	2025-06-16	\N		RCP-202506-735	400.00	200.00	f	Partially Written Off	\N	\N	\N	\N
17	1	4	1	55	\N	2025-06-26	2025-07-26	PO000003	INV-SO000020	1200.00	1200.00	t	Posted	\N	\N	\N	\N
\.


--
-- Data for Name: ar_writeoffs; Type: TABLE DATA; Schema: public; Owner: Biwi_user
--

COPY public.ar_writeoffs (id, company_id, customer_id, original_invoice_id, ar_transaction_type_id, linked_gl_journal_entry_id, document_number, writeoff_date, writeoff_amount, reason_code, reason_description, status, requested_by_user_id, approved_by_user_id, approval_date, approval_notes, created_at, updated_at) FROM stdin;
1	1	4	1	17	\N	WO-000001	2025-06-24	100.00	UNCOLLECTIBLE	Test write-off for uncollectible debt	Draft	1	\N	\N	\N	2025-06-24 20:26:41.221878	2025-06-24 20:26:41.221883
2	1	4	1	17	\N	WO-000002	2025-06-24	100.00	UNCOLLECTIBLE	Test write-off for uncollectible debt	Draft	1	\N	\N	\N	2025-06-24 20:28:19.554039	2025-06-24 20:28:19.554043
3	1	4	1	17	\N	WO-000003	2025-06-24	100.00	UNCOLLECTIBLE	Test write-off for approval workflow	Draft	1	\N	\N	\N	2025-06-24 20:29:09.601991	2025-06-24 20:29:09.601994
4	1	4	1	17	26	WO-000004	2025-06-24	100.00	UNCOLLECTIBLE	Test write-off for approval workflow	Posted	1	1	2025-06-24 20:29:46.392713	Approved after review - legitimate bad debt	2025-06-24 20:29:46.376121	2025-06-24 20:29:46.439647
5	1	4	1	17	\N	WO-000005	2025-06-24	50.00	SMALL_BALANCE	Test write-off for rejection workflow	Rejected	1	1	2025-06-24 20:29:46.452762	Rejected - amount too small for write-off procedure	2025-06-24 20:29:46.447651	2025-06-24 20:29:46.45306
17	1	4	4	17	\N	WO-000017	2025-06-24	50.00	SMALL_BALANCE	Test rejection workflow	Rejected	1	1	2025-06-24 21:18:22.183251	Rejected for testing purposes	2025-06-24 21:18:22.177055	2025-06-24 21:18:22.183597
6	1	4	1	17	27	WO-000006	2025-06-24	150.00	UNCOLLECTIBLE	Customer has ceased operations and is unable to pay outstanding amount. Multiple collection attempts failed.	Posted	1	1	2025-06-24 20:40:38.924954	Approved after thorough review. Customer confirmed insolvent. Write-off justified for financial statement accuracy.	2025-06-24 20:40:38.899514	2025-06-24 20:40:38.96922
7	1	4	1	17	\N	WO-000007	2025-06-24	25.00	SMALL_BALANCE	Very small balance not worth collection effort.	Rejected	1	1	2025-06-24 20:40:38.983507	Rejected - amount below company write-off threshold. Please pursue collection.	2025-06-24 20:40:38.977397	2025-06-24 20:40:38.983868
8	1	4	1	17	\N	WO-000008	2025-06-24	100.00	UNCOLLECTIBLE	Test write-off for uncollectible debt	Draft	1	\N	\N	\N	2025-06-24 21:09:33.664698	2025-06-24 21:09:33.664702
9	1	4	1	17	28	WO-000009	2025-06-24	100.00	UNCOLLECTIBLE	Test write-off for approval workflow	Posted	1	1	2025-06-24 21:09:40.300935	Approved after review - legitimate bad debt	2025-06-24 21:09:40.287096	2025-06-24 21:09:40.341639
10	1	4	1	17	\N	WO-000010	2025-06-24	50.00	SMALL_BALANCE	Test write-off for rejection workflow	Rejected	1	1	2025-06-24 21:09:40.355629	Rejected - amount too small for write-off procedure	2025-06-24 21:09:40.348628	2025-06-24 21:09:40.355959
25	1	4	10	17	37	WO-000025	2025-06-24	75.00	UNCOLLECTIBLE	Integration test write-off	Posted	1	1	2025-06-24 21:32:47.404236	Integration test approval	2025-06-24 21:32:47.387469	2025-06-24 21:32:47.443033
11	1	4	1	17	29	WO-000011	2025-06-24	50.00	UNCOLLECTIBLE	Customer has ceased operations and is unable to pay outstanding amount. Multiple collection attempts failed.	Posted	1	1	2025-06-24 21:09:52.293765	Approved after thorough review. Customer confirmed insolvent. Write-off justified for financial statement accuracy.	2025-06-24 21:09:52.26824	2025-06-24 21:09:52.338424
18	1	4	10	17	33	WO-000018	2025-06-24	50.00	UNCOLLECTIBLE	Test write-off for comprehensive validation	Posted	1	1	2025-06-24 21:19:30.692139	Test approval for validation	2025-06-24 21:19:30.675875	2025-06-24 21:19:32.78332
12	1	4	2	17	30	WO-000012	2025-06-24	100.00	UNCOLLECTIBLE	Test write-off for comprehensive testing	Posted	1	1	2025-06-24 21:12:44.984586	Approved for comprehensive testing	2025-06-24 21:12:44.968566	2025-06-24 21:12:45.024112
13	1	4	2	17	\N	WO-000013	2025-06-24	50.00	SMALL_BALANCE	Test rejection workflow	Rejected	1	1	2025-06-24 21:12:45.037371	Rejected for testing purposes	2025-06-24 21:12:45.031163	2025-06-24 21:12:45.037734
14	1	4	3	17	31	WO-000014	2025-06-24	100.00	UNCOLLECTIBLE	Test write-off for comprehensive testing	Posted	1	1	2025-06-24 21:15:21.93409	Approved for comprehensive testing	2025-06-24 21:15:21.91799	2025-06-24 21:15:21.974051
15	1	4	3	17	\N	WO-000015	2025-06-24	50.00	SMALL_BALANCE	Test rejection workflow	Rejected	1	1	2025-06-24 21:15:21.986851	Rejected for testing purposes	2025-06-24 21:15:21.981607	2025-06-24 21:15:21.987175
19	1	4	10	17	\N	WO-000019	2025-06-24	25.00	SMALL_BALANCE	Test rejection workflow	Rejected	1	1	2025-06-24 21:19:32.797077	Test rejection	2025-06-24 21:19:32.791109	2025-06-24 21:19:32.797413
16	1	4	4	17	32	WO-000016	2025-06-24	100.00	UNCOLLECTIBLE	Test write-off for comprehensive testing	Posted	1	1	2025-06-24 21:18:22.125068	Approved for comprehensive testing	2025-06-24 21:18:22.110471	2025-06-24 21:18:22.168038
20	1	4	10	17	34	WO-000020	2025-06-24	75.00	UNCOLLECTIBLE	Integration test write-off	Posted	1	1	2025-06-24 21:30:34.753481	Integration test approval	2025-06-24 21:30:34.738178	2025-06-24 21:30:34.791869
21	1	4	5	17	35	WO-000021	2025-06-24	100.00	UNCOLLECTIBLE	Test write-off for comprehensive testing	Posted	1	1	2025-06-24 21:32:04.606946	Approved for comprehensive testing	2025-06-24 21:32:04.592543	2025-06-24 21:32:04.646871
22	1	4	5	17	\N	WO-000022	2025-06-24	50.00	SMALL_BALANCE	Test rejection workflow	Rejected	1	1	2025-06-24 21:32:04.659708	Rejected for testing purposes	2025-06-24 21:32:04.654026	2025-06-24 21:32:04.660014
23	1	4	6	17	36	WO-000023	2025-06-24	100.00	UNCOLLECTIBLE	Test write-off for comprehensive testing	Posted	1	1	2025-06-24 21:32:35.957451	Approved for comprehensive testing	2025-06-24 21:32:35.942859	2025-06-24 21:32:35.99898
24	1	4	6	17	\N	WO-000024	2025-06-24	50.00	SMALL_BALANCE	Test rejection workflow	Rejected	1	1	2025-06-24 21:32:36.011916	Rejected for testing purposes	2025-06-24 21:32:36.005643	2025-06-24 21:32:36.012249
\.


--
-- Data for Name: bank_reconciliation_items; Type: TABLE DATA; Schema: public; Owner: Biwi_user
--

COPY public.bank_reconciliation_items (id, bank_reconciliation_id, gl_journal_entry_line_id, item_type, description, amount, is_reconciled) FROM stdin;
\.


--
-- Data for Name: bank_reconciliations; Type: TABLE DATA; Schema: public; Owner: Biwi_user
--

COPY public.bank_reconciliations (id, company_id, bank_gl_account_id, reconciliation_date, statement_balance, book_balance, status, created_by_user_id, created_at) FROM stdin;
\.


--
-- Data for Name: billing_configurations; Type: TABLE DATA; Schema: public; Owner: Biwi_user
--

COPY public.billing_configurations (id, company_id, base_monthly_fee, per_user_fee, per_gb_storage_fee, per_transaction_fee, billing_cycle, billing_email, payment_method, stripe_customer_id, stripe_subscription_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: billing_transactions; Type: TABLE DATA; Schema: public; Owner: Biwi_user
--

COPY public.billing_transactions (id, company_id, transaction_type, amount, currency, description, billing_period, stripe_invoice_id, stripe_charge_id, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: bom_components; Type: TABLE DATA; Schema: public; Owner: Biwi_user
--

COPY public.bom_components (id, bom_header_id, component_item_id, quantity_required, unit_of_measure_id, scrap_percentage, sequence_number, is_phantom, notes) FROM stdin;
1	1	6	1	11	1	10	f	\N
\.


--
-- Data for Name: bom_defaults; Type: TABLE DATA; Schema: public; Owner: Biwi_user
--

COPY public.bom_defaults (id, company_id, default_wip_gl_account_id, default_material_usage_gl_account_id, default_manufacturing_overhead_gl_account_id, default_scrap_gl_account_id, next_mo_number) FROM stdin;
1	1	\N	\N	\N	\N	1001
\.


--
-- Data for Name: bom_headers; Type: TABLE DATA; Schema: public; Owner: Biwi_user
--

COPY public.bom_headers (id, company_id, parent_item_id, bom_code, description, revision, effective_date, expiry_date, quantity_per_batch, unit_of_measure_id, is_active, notes) FROM stdin;
1	1	5	DESKTOP-001	Desktop Computer Assembly	1.0	2025-06-25 00:00:00	\N	1	11	t	\N
\.


--
-- Data for Name: branches; Type: TABLE DATA; Schema: public; Owner: Biwi_user
--

COPY public.branches (id, company_id, name, address, contact_info, default_gl_segment_code, is_active) FROM stdin;
33	1	Head Office	{"zip": "10001", "city": "New York", "state": "NY", "street": "123 Main Street"}	{"email": "headoffice@company.com", "phone": "+1-555-0123", "manager": ""}	HEAD	t
\.


--
-- Data for Name: companies; Type: TABLE DATA; Schema: public; Owner: Biwi_user
--

COPY public.companies (id, name, address, contact_info, default_currency_code, is_active, code, subscription_status, subscription_plan, subscription_expires, storage_limit_gb, user_limit, primary_contact_email, billing_email, created_at, created_by_user_id, is_deleted) FROM stdin;
9	Test Company - Phase 6	\N	\N	\N	t	TES9	trial	\N	\N	10	5	\N	\N	2025-06-30 22:20:52.706268	\N	f
10	Integration Test Company	\N	\N	\N	t	INT10	trial	\N	\N	10	5	\N	\N	2025-06-30 22:20:52.706268	\N	f
12	Integration Test Company aef26cd1	\N	\N	\N	t	INT12	trial	\N	\N	10	5	\N	\N	2025-06-30 22:20:52.706268	\N	f
13	Integration Test Company 23c09e4b	\N	\N	\N	t	INT13	trial	\N	\N	10	5	\N	\N	2025-06-30 22:20:52.706268	\N	f
14	Integration Test Company 630fa5be	\N	\N	\N	t	INT14	trial	\N	\N	10	5	\N	\N	2025-06-30 22:20:52.706268	\N	f
1	Test Company	{"city": "TEST City", "street": "123 Test St", "country": "Test Country"}	{"email": "contact@testcompany.com", "phone": "+1234567890"}	RWF	t	TES1	trial	\N	\N	10	5	\N	\N	2025-06-30 22:20:52.706268	\N	f
15	biwi Company Ltd	null	null	\N	t	123456789	trial	\N	\N	10	10	admin2@biwi.com	\N	2025-07-05 13:09:31.814333	2	f
\.


--
-- Data for Name: currencies; Type: TABLE DATA; Schema: public; Owner: Biwi_user
--

COPY public.currencies (id, company_id, code, name, symbol, exchange_rate_to_base, is_base_currency, is_active) FROM stdin;
34	1	RWF	Rwandan Francs	RWF	1.000000	t	t
36	1	GBP	British Pound	£	0.000511	f	t
37	1	USD	US DOLLARS	$	0.000700	f	t
35	1	EUR	Euro	€	0.000598	f	t
\.


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: Biwi_user
--

COPY public.customers (id, company_id, customer_code, name, address, contact_info, payment_terms, credit_limit, current_balance, sales_representative_id, default_ar_gl_account_id, is_active, default_currency_id) FROM stdin;
4	1	CUST001	John Smith	{"city": "city", "state": "state", "street": "123 Main St, City, State", "country": "Rwanda"}	{"email": "john@email.com", "phone": " (555) 123-4567", "contact_person": "John Smith"}	Net 30	4999.99	100.00	3	\N	t	\N
\.


--
-- Data for Name: exchange_rate_history; Type: TABLE DATA; Schema: public; Owner: Biwi_user
--

COPY public.exchange_rate_history (id, company_id, currency_id, rate_date, exchange_rate, created_at) FROM stdin;
\.


--
-- Data for Name: forex_gain_loss; Type: TABLE DATA; Schema: public; Owner: Biwi_user
--

COPY public.forex_gain_loss (id, company_id, transaction_type, transaction_id, gain_loss_amount, gl_journal_entry_id) FROM stdin;
\.


--
-- Data for Name: gl_accounts; Type: TABLE DATA; Schema: public; Owner: Biwi_user
--

COPY public.gl_accounts (id, company_id, account_code, account_name, account_type, parent_account_id, current_balance, is_active, is_control_account) FROM stdin;
42	1	1000	Bank Account	Asset	\N	0.00	t	f
95	9	5100	Inventory Adjustment	Expense	\N	0.00	t	f
96	10	1200	Inventory	Asset	\N	0.00	t	f
97	10	5000	Cost of Goods Sold	Expense	\N	0.00	t	f
98	10	4000	Sales Revenue	Income	\N	0.00	t	f
99	10	5100	Inventory Adjustment	Expense	\N	0.00	t	f
100	13	1200	Inventory	Asset	\N	0.00	t	f
101	13	5000	Cost of Goods Sold	Expense	\N	0.00	t	f
43	1	5200	Bad Debt Expense	Expense	\N	1100.00	t	f
44	1	1400	Inventory - Raw Materials	Assets	\N	0.00	t	f
45	1	1410	Inventory - Work in Process	Assets	\N	0.00	t	f
46	1	1420	Inventory - Finished Goods	Assets	\N	0.00	t	f
47	1	5010	Material Usage	Expenses	\N	0.00	t	f
48	1	5020	Manufacturing Overhead	Expenses	\N	0.00	t	f
49	1	5030	Scrap and Waste	Expenses	\N	0.00	t	f
102	13	4000	Sales Revenue	Income	\N	0.00	t	f
103	13	5100	Inventory Adjustment	Expense	\N	0.00	t	f
104	14	1200	Inventory	Asset	\N	0.00	t	f
105	14	5000	Cost of Goods Sold	Expense	\N	0.00	t	f
106	14	4000	Sales Revenue	Income	\N	0.00	t	f
107	14	5100	Inventory Adjustment	Expense	\N	0.00	t	f
39	1	1100	Accounts Receivable	Asset	\N	500.00	t	f
38	1	4000	Sales Revenue	Income	\N	1600.00	t	f
37	1	5000	Cost of Goods Sold	Expense	\N	1014.00	t	f
36	1	1200	Inventory	Asset	\N	-1014.00	t	f
113	9	6000	Operating Expenses	Expense	\N	0.00	t	f
109	9	1000	Cash	Asset	\N	50000.00	t	f
110	9	1100	Accounts Receivable	Asset	\N	25000.00	t	f
92	9	1200	Inventory	Asset	\N	5000.00	t	f
111	9	2000	Accounts Payable	Liability	\N	-15000.00	t	f
108	9	3000	Retained Earnings	Equity	\N	-50000.00	t	f
94	9	4000	Sales Revenue	Income	\N	-25000.00	t	f
93	9	5000	Cost of Goods Sold	Expense	\N	10000.00	t	f
112	9	3900	Retained Earnings	Equity	\N	-35000.00	t	f
41	1	5100	Inventory Adjustments	Expense	\N	0.00	t	f
114	9	1500	Fixed Assets	Asset	\N	0.00	t	f
115	9	2100	Loans Payable	Liability	\N	0.00	t	f
116	9	3100	Retained Earnings	Equity	\N	0.00	t	f
117	9	4100	Service Revenue	Income	\N	0.00	t	f
118	9	5200	Rent Expense	Expense	\N	0.00	t	f
119	9	5300	Utilities Expense	Expense	\N	0.00	t	f
\.


--
-- Data for Name: gl_defaults; Type: TABLE DATA; Schema: public; Owner: Biwi_user
--

COPY public.gl_defaults (id, company_id, retained_earnings_account_id, default_cash_account_id, default_ar_control_account_id, default_ap_control_account_id, forex_gain_account_id, forex_loss_account_id) FROM stdin;
2	9	116	109	110	111	\N	\N
\.


--
-- Data for Name: gl_journal_entries; Type: TABLE DATA; Schema: public; Owner: Biwi_user
--

COPY public.gl_journal_entries (id, company_id, entry_date, reference, description, posted_by_user_id, status, created_at, updated_at) FROM stdin;
37	1	2025-06-24	WO-000025	Bad Debt Write-off - John Smith	1	Posted	2025-06-24 21:32:47.408022	2025-06-24 21:32:47.434618
38	9	2025-06-25	INV-ADJ-20250625210500	Inventory adjustment - Initial stock receipt for testing	7	Draft	2025-06-25 21:05:00.737175	2025-06-25 21:05:00.737178
39	10	2025-06-25	INV-ADJ-20250625210613	Inventory adjustment - Initial stock receipt from supplier	8	Draft	2025-06-25 21:06:13.912329	2025-06-25 21:06:13.912333
40	10	2025-06-25	INV-ADJ-20250625210613	Inventory adjustment - Second shipment received	8	Draft	2025-06-25 21:06:13.931018	2025-06-25 21:06:13.931021
41	13	2025-06-25	INV-ADJ-20250625210724	Inventory adjustment - Initial stock receipt from supplier	10	Draft	2025-06-25 21:07:24.667928	2025-06-25 21:07:24.667931
42	13	2025-06-25	INV-ADJ-20250625210724	Inventory adjustment - Second shipment received	10	Draft	2025-06-25 21:07:24.688677	2025-06-25 21:07:24.688679
43	14	2025-06-25	INV-ADJ-20250625210804	Inventory adjustment - Initial stock receipt from supplier	11	Draft	2025-06-25 21:08:04.447368	2025-06-25 21:08:04.447372
44	14	2025-06-25	INV-ADJ-20250625210804	Inventory adjustment - Second shipment received	11	Draft	2025-06-25 21:08:04.463818	2025-06-25 21:08:04.46382
16	1	2025-06-17	INV-ADJ-20250617085321	Inventory adjustment - Test adjustment - increase inventory	2	Draft	2025-06-17 08:53:21.26461	2025-06-17 08:53:21.264614
17	1	2025-06-17	INV-ADJ-20250617085428	Inventory adjustment - initial stock	2	Draft	2025-06-17 08:54:28.409879	2025-06-17 08:54:28.409883
18	1	2025-06-17	INV-ADJ-20250617085814	Inventory adjustment - remove unnecessary stock	2	Draft	2025-06-17 08:58:14.849435	2025-06-17 08:58:14.84944
21	1	2025-06-17	AR-INV-INV-SO000019	Sales Invoice INV-SO000019 - John Smith	2	Posted	2025-06-17 09:26:44.921718	2025-06-17 09:26:44.981938
22	1	2025-06-17	AR-INV-SO000019	Sales Invoice INV-SO000019	2	Draft	2025-06-17 09:26:45.001949	2025-06-17 09:26:45.001958
24	1	2025-06-17	CORR-001	Correction entry - reduce COGS and inventory adjustment	2	Posted	2025-06-17 09:51:04.592604	2025-06-17 09:51:29.360214
25	1	2025-06-22	AR Receipt RCP-202506-663	Receipt for John Smith	1	Draft	2025-06-22 21:50:13.50485	2025-06-22 21:50:13.504854
26	1	2025-06-24	WO-000004	Bad Debt Write-off - John Smith	1	Posted	2025-06-24 20:29:46.395992	2025-06-24 20:29:46.431575
27	1	2025-06-24	WO-000006	Bad Debt Write-off - John Smith	1	Posted	2025-06-24 20:40:38.928766	2025-06-24 20:40:38.961486
28	1	2025-06-24	WO-000009	Bad Debt Write-off - John Smith	1	Posted	2025-06-24 21:09:40.304157	2025-06-24 21:09:40.333343
29	1	2025-06-24	WO-000011	Bad Debt Write-off - John Smith	1	Posted	2025-06-24 21:09:52.297271	2025-06-24 21:09:52.330335
30	1	2025-06-24	WO-000012	Bad Debt Write-off - John Smith	1	Posted	2025-06-24 21:12:44.987931	2025-06-24 21:12:45.017036
31	1	2025-06-24	WO-000014	Bad Debt Write-off - John Smith	1	Posted	2025-06-24 21:15:21.93715	2025-06-24 21:15:21.965176
32	1	2025-06-24	WO-000016	Bad Debt Write-off - John Smith	1	Posted	2025-06-24 21:18:22.128548	2025-06-24 21:18:22.157907
33	1	2025-06-24	WO-000018	Bad Debt Write-off - John Smith	1	Posted	2025-06-24 21:19:30.695431	2025-06-24 21:19:32.776335
34	1	2025-06-24	WO-000020	Bad Debt Write-off - John Smith	1	Posted	2025-06-24 21:30:34.756256	2025-06-24 21:30:34.784744
35	1	2025-06-24	WO-000021	Bad Debt Write-off - John Smith	1	Posted	2025-06-24 21:32:04.610209	2025-06-24 21:32:04.638732
36	1	2025-06-24	WO-000023	Bad Debt Write-off - John Smith	1	Posted	2025-06-24 21:32:35.961501	2025-06-24 21:32:35.989807
45	14	2025-06-25	WHT-20250625210804	Warehouse transfer - WIDGET-001	11	Draft	2025-06-25 21:08:04.479069	2025-06-25 21:08:04.479072
46	14	2025-06-25	INV-ADJ-20250625210804	Inventory adjustment - Damaged goods - water damage in storage	11	Draft	2025-06-25 21:08:04.49056	2025-06-25 21:08:04.490563
47	1	2025-06-25	INV-ADJ-20250625222154	Inventory adjustment - Initial stock receipt from supplier - PO#12345	2	Draft	2025-06-25 22:21:54.638829	2025-06-25 22:21:54.638834
48	1	2025-06-25	INV-ADJ-20250625222415	Inventory adjustment - Second shipment - PO#12346	2	Draft	2025-06-25 22:24:15.72316	2025-06-25 22:24:15.723165
49	1	2025-06-26	WHT-20250626083537	Warehouse transfer - WIDGET-001	2	Draft	2025-06-26 08:35:37.754808	2025-06-26 08:35:37.754816
50	1	2025-06-26	WHT-20250626084636	Warehouse transfer - WIDGET-001	2	Draft	2025-06-26 08:46:36.917524	2025-06-26 08:46:36.91753
51	1	2025-06-26	INV-ADJ-20250626143730	Inventory adjustment - Inventory count adjustment - Session 1	2	Draft	2025-06-26 14:37:30.148531	2025-06-26 14:37:30.148535
52	1	2025-06-26	INV-ADJ-20250626180859	Inventory adjustment - initial stock	2	Draft	2025-06-26 18:08:59.341945	2025-06-26 18:08:59.341949
53	1	2025-06-26	INV-ADJ-20250626181011	Inventory adjustment - testing OE	2	Draft	2025-06-26 18:10:11.954142	2025-06-26 18:10:11.954144
54	1	2025-06-26	AR-INV-INV-SO000020	Sales Invoice INV-SO000020 - John Smith	2	Posted	2025-06-26 18:16:00.562011	2025-06-26 18:16:00.598252
55	1	2025-06-26	AR-INV-SO000020	Sales Invoice INV-SO000020	2	Draft	2025-06-26 18:16:00.612779	2025-06-26 18:16:00.612782
56	1	2025-06-26	INV-ADJ-20250626222513	Inventory adjustment - Receipt from Supplier - GRV	2	Draft	2025-06-26 22:25:13.936996	2025-06-26 22:25:13.937
57	1	2025-06-26	INV-ADJ-20250626222513	Inventory adjustment - Receipt from Supplier - GRV	2	Draft	2025-06-26 22:25:13.982525	2025-06-26 22:25:13.982528
58	1	2025-06-27	INV-ADJ-20250627001812	Inventory adjustment - Receipt from Supplier - GRV	2	Draft	2025-06-27 00:18:12.585799	2025-06-27 00:18:12.585802
60	9	2024-01-01	INVEST-001	Owner initial investment	1	Posted	2025-06-28 23:13:52.346623	2025-06-28 23:13:52.346628
61	9	2024-06-01	PURCH-001	Purchase inventory	1	Posted	2025-06-28 23:13:52.358105	2025-06-28 23:13:52.358109
62	9	2024-06-15	SALE-001	Sales on credit	1	Posted	2025-06-28 23:13:52.365872	2025-06-28 23:13:52.365877
63	9	2024-06-15	COGS-001	Cost of goods sold	1	Posted	2025-06-28 23:13:52.368881	2025-06-28 23:13:52.368885
\.


--
-- Data for Name: gl_journal_entry_lines; Type: TABLE DATA; Schema: public; Owner: Biwi_user
--

COPY public.gl_journal_entry_lines (id, journal_entry_id, gl_account_id, description, debit_amount, credit_amount, currency_id, exchange_rate, foreign_currency_debit_amount, foreign_currency_credit_amount) FROM stdin;
61	21	39	AR Invoice INV-SO000019 - John Smith	400.00	0.00	\N	\N	\N	\N
62	21	38	Sales - John Smith	0.00	400.00	\N	\N	\N	\N
63	21	37	COGS - Invoice INV-SO000019	598.00	0.00	\N	\N	\N	\N
64	21	36	Inventory reduction - Invoice INV-SO000019	0.00	598.00	\N	\N	\N	\N
65	22	39	AR Invoice INV-SO000019	400.00	0.00	\N	\N	\N	\N
66	22	38	Sales - Invoice INV-SO000019	0.00	400.00	\N	\N	\N	\N
69	24	36	Correct inventory overstatement	299.00	0.00	\N	\N	\N	\N
70	24	37	Correct COGS overstatement	0.00	299.00	\N	\N	\N	\N
71	25	42	Receipt RCP-202506-663	400.00	0.00	\N	\N	\N	\N
72	25	39	Receipt RCP-202506-663	0.00	400.00	\N	\N	\N	\N
73	26	43	Bad Debt Write-off WO-000004	100.00	0.00	\N	\N	\N	\N
74	26	39	AR Write-off WO-000004	0.00	100.00	\N	\N	\N	\N
75	27	43	Bad Debt Write-off WO-000006	150.00	0.00	\N	\N	\N	\N
76	27	39	AR Write-off WO-000006	0.00	150.00	\N	\N	\N	\N
77	28	43	Bad Debt Write-off WO-000009	100.00	0.00	\N	\N	\N	\N
78	28	39	AR Write-off WO-000009	0.00	100.00	\N	\N	\N	\N
79	29	43	Bad Debt Write-off WO-000011	50.00	0.00	\N	\N	\N	\N
80	29	39	AR Write-off WO-000011	0.00	50.00	\N	\N	\N	\N
81	30	43	Bad Debt Write-off WO-000012	100.00	0.00	\N	\N	\N	\N
82	30	39	AR Write-off WO-000012	0.00	100.00	\N	\N	\N	\N
83	31	43	Bad Debt Write-off WO-000014	100.00	0.00	\N	\N	\N	\N
84	31	39	AR Write-off WO-000014	0.00	100.00	\N	\N	\N	\N
85	32	43	Bad Debt Write-off WO-000016	100.00	0.00	\N	\N	\N	\N
86	32	39	AR Write-off WO-000016	0.00	100.00	\N	\N	\N	\N
87	33	43	Bad Debt Write-off WO-000018	50.00	0.00	\N	\N	\N	\N
88	33	39	AR Write-off WO-000018	0.00	50.00	\N	\N	\N	\N
89	34	43	Bad Debt Write-off WO-000020	75.00	0.00	\N	\N	\N	\N
90	34	39	AR Write-off WO-000020	0.00	75.00	\N	\N	\N	\N
91	35	43	Bad Debt Write-off WO-000021	100.00	0.00	\N	\N	\N	\N
92	35	39	AR Write-off WO-000021	0.00	100.00	\N	\N	\N	\N
93	36	43	Bad Debt Write-off WO-000023	100.00	0.00	\N	\N	\N	\N
94	36	39	AR Write-off WO-000023	0.00	100.00	\N	\N	\N	\N
95	37	43	Bad Debt Write-off WO-000025	75.00	0.00	\N	\N	\N	\N
96	37	39	AR Write-off WO-000025	0.00	75.00	\N	\N	\N	\N
97	38	92	Inventory adjustment - TEST-001	1000.00	0.00	\N	\N	\N	\N
98	38	95	Inventory adjustment - TEST-001	0.00	1000.00	\N	\N	\N	\N
99	39	96	Inventory adjustment - WIDGET-001	5000.00	0.00	\N	\N	\N	\N
100	39	99	Inventory adjustment - WIDGET-001	0.00	5000.00	\N	\N	\N	\N
101	40	96	Inventory adjustment - WIDGET-001	3600.00	0.00	\N	\N	\N	\N
102	40	99	Inventory adjustment - WIDGET-001	0.00	3600.00	\N	\N	\N	\N
103	41	100	Inventory adjustment - WIDGET-001	5000.00	0.00	\N	\N	\N	\N
104	41	103	Inventory adjustment - WIDGET-001	0.00	5000.00	\N	\N	\N	\N
105	42	100	Inventory adjustment - WIDGET-001	3600.00	0.00	\N	\N	\N	\N
106	42	103	Inventory adjustment - WIDGET-001	0.00	3600.00	\N	\N	\N	\N
47	16	36	Inventory adjustment - LAPTOP-I3-001	2990.00	0.00	\N	\N	\N	\N
48	16	36	Inventory adjustment - LAPTOP-I3-001	0.00	2990.00	\N	\N	\N	\N
49	17	36	Inventory adjustment - LAPTOP-I3-001	299.00	0.00	\N	\N	\N	\N
50	17	36	Inventory adjustment - LAPTOP-I3-001	0.00	299.00	\N	\N	\N	\N
51	18	36	Inventory adjustment - LAPTOP-I3-001	2990.00	0.00	\N	\N	\N	\N
52	18	36	Inventory adjustment - LAPTOP-I3-001	0.00	2990.00	\N	\N	\N	\N
107	43	104	Inventory adjustment - WIDGET-001	5000.00	0.00	\N	\N	\N	\N
108	43	107	Inventory adjustment - WIDGET-001	0.00	5000.00	\N	\N	\N	\N
109	44	104	Inventory adjustment - WIDGET-001	3600.00	0.00	\N	\N	\N	\N
110	44	107	Inventory adjustment - WIDGET-001	0.00	3600.00	\N	\N	\N	\N
111	45	104	Transfer WIDGET-001 to Branch Warehouse	2150.00	0.00	\N	\N	\N	\N
112	45	104	Transfer WIDGET-001 from Main Warehouse	0.00	2150.00	\N	\N	\N	\N
113	46	107	Inventory adjustment - WIDGET-001	268.75	0.00	\N	\N	\N	\N
114	46	104	Inventory adjustment - WIDGET-001	0.00	268.75	\N	\N	\N	\N
115	47	36	Inventory adjustment - WIDGET-001	5000.00	0.00	\N	\N	\N	\N
116	47	41	Inventory adjustment - WIDGET-001	0.00	5000.00	\N	\N	\N	\N
117	48	36	Inventory adjustment - WIDGET-001	3600.00	0.00	\N	\N	\N	\N
118	48	41	Inventory adjustment - WIDGET-001	0.00	3600.00	\N	\N	\N	\N
119	49	36	Transfer WIDGET-001 to Branch Warehouse	2150.00	0.00	\N	\N	\N	\N
120	49	36	Transfer WIDGET-001 from Main Warehouse	0.00	2150.00	\N	\N	\N	\N
121	50	36	Transfer WIDGET-001 to Branch Warehouse	2150.00	0.00	\N	\N	\N	\N
122	50	36	Transfer WIDGET-001 from Main Warehouse	0.00	2150.00	\N	\N	\N	\N
123	51	41	Inventory adjustment - WIDGET-001	53.75	0.00	\N	\N	\N	\N
124	51	36	Inventory adjustment - WIDGET-001	0.00	53.75	\N	\N	\N	\N
125	52	36	Inventory adjustment - CABLE-SET	2500.00	0.00	\N	\N	\N	\N
126	52	41	Inventory adjustment - CABLE-SET	0.00	2500.00	\N	\N	\N	\N
127	53	36	Inventory adjustment - LAPTOP-I3-001	14950.00	0.00	\N	\N	\N	\N
128	53	41	Inventory adjustment - LAPTOP-I3-001	0.00	14950.00	\N	\N	\N	\N
129	54	39	AR Invoice INV-SO000020 - John Smith	1200.00	0.00	\N	\N	\N	\N
130	54	38	Sales - John Smith	0.00	1200.00	\N	\N	\N	\N
131	54	37	COGS - Invoice INV-SO000020	715.00	0.00	\N	\N	\N	\N
132	54	36	Inventory reduction - Invoice INV-SO000020	0.00	715.00	\N	\N	\N	\N
133	55	39	AR Invoice INV-SO000020	1200.00	0.00	\N	\N	\N	\N
134	55	38	Sales - Invoice INV-SO000020	0.00	1200.00	\N	\N	\N	\N
135	56	36	Inventory adjustment - WIDGET-001	1600.00	0.00	\N	\N	\N	\N
136	56	41	Inventory adjustment - WIDGET-001	0.00	1600.00	\N	\N	\N	\N
137	57	36	Inventory adjustment - CABLE-SET	600.00	0.00	\N	\N	\N	\N
138	57	41	Inventory adjustment - CABLE-SET	0.00	600.00	\N	\N	\N	\N
139	58	36	Inventory adjustment - WIDGET-001	425.00	0.00	\N	\N	\N	\N
140	58	41	Inventory adjustment - WIDGET-001	0.00	425.00	\N	\N	\N	\N
141	60	109	Initial cash investment	50000.00	0.00	\N	\N	\N	\N
142	60	108	Owner investment	0.00	50000.00	\N	\N	\N	\N
143	61	92	Inventory purchase	15000.00	0.00	\N	\N	\N	\N
144	61	111	Accounts payable	0.00	15000.00	\N	\N	\N	\N
145	62	110	Sales on credit	25000.00	0.00	\N	\N	\N	\N
146	62	94	Sales revenue	0.00	25000.00	\N	\N	\N	\N
147	63	93	Cost of goods sold	10000.00	0.00	\N	\N	\N	\N
148	63	92	Inventory reduction	0.00	10000.00	\N	\N	\N	\N
\.


--
-- Data for Name: gl_transaction_types; Type: TABLE DATA; Schema: public; Owner: Biwi_user
--

COPY public.gl_transaction_types (id, company_id, name, description, default_debit_account_id, default_credit_account_id, is_active) FROM stdin;
1	1	Inventory Adjustment	Adjustments to inventory quantities and values	41	36	t
\.


--
-- Data for Name: goods_received_voucher_lines; Type: TABLE DATA; Schema: public; Owner: Biwi_user
--

COPY public.goods_received_voucher_lines (id, grv_id, purchase_order_line_id, item_id, description, quantity_received, unit_cost, line_total) FROM stdin;
1	1	3	21	Standard Widget - Blue	20	80	1600
2	1	4	12	Cable Set (SATA, Power)	15	40	600
3	6	\N	21	Standard Widget - Blue	5	85	425
\.


--
-- Data for Name: goods_received_vouchers; Type: TABLE DATA; Schema: public; Owner: Biwi_user
--

COPY public.goods_received_vouchers (id, company_id, purchase_order_id, supplier_id, grv_date, reference, document_number, status, notes, ap_invoice_id) FROM stdin;
1	1	3	1	2025-06-26		GRV000001	Invoiced		1
6	1	\N	1	2025-06-27	EMERGENCY-DELIVERY-001	GRV000002	Open		\N
\.


--
-- Data for Name: inventory_count_lines; Type: TABLE DATA; Schema: public; Owner: Biwi_user
--

COPY public.inventory_count_lines (id, inventory_count_session_id, item_id, system_quantity, counted_quantity, variance_quantity) FROM stdin;
1	1	4	0.00	\N	\N
2	1	5	0.00	\N	\N
3	1	6	0.00	\N	\N
4	1	7	0.00	\N	\N
5	1	8	0.00	\N	\N
6	1	9	0.00	\N	\N
7	1	10	0.00	\N	\N
8	1	11	0.00	\N	\N
9	1	12	0.00	\N	\N
10	1	21	400.00	395	-5.00
11	2	4	0.00	\N	\N
12	2	5	0.00	\N	\N
13	2	6	0.00	\N	\N
14	2	7	0.00	\N	\N
15	2	8	0.00	\N	\N
16	2	9	0.00	\N	\N
17	2	10	0.00	\N	\N
18	2	11	0.00	\N	\N
19	2	12	0.00	\N	\N
20	2	21	400.00	\N	\N
\.


--
-- Data for Name: inventory_count_sessions; Type: TABLE DATA; Schema: public; Owner: Biwi_user
--

COPY public.inventory_count_sessions (id, company_id, warehouse_id, count_date, status, notes) FROM stdin;
2	1	2	2025-06-26	Open	
1	1	2	2025-06-26	Completed	Monthly cycle count - June
\.


--
-- Data for Name: inventory_defaults; Type: TABLE DATA; Schema: public; Owner: Biwi_user
--

COPY public.inventory_defaults (id, company_id, default_warehouse_id, default_inventory_gl_account_id, default_cogs_gl_account_id, default_sales_revenue_gl_account_id, default_inventory_adjustment_gl_account_id) FROM stdin;
2	1	2	36	37	38	41
\.


--
-- Data for Name: inventory_item_locations; Type: TABLE DATA; Schema: public; Owner: Biwi_user
--

COPY public.inventory_item_locations (id, company_id, item_id, warehouse_id, quantity_on_hand, quantity_committed, quantity_on_order) FROM stdin;
1	1	1	1	0.00	0.00	0.00
2	1	2	1	0.00	-5	0.00
3	1	3	1	86	2.00	0.00
5	1	5	2	0.00	0.00	0.00
6	1	6	2	0.00	0.00	0.00
7	1	7	2	0.00	0.00	0.00
8	1	8	2	0.00	0.00	0.00
9	1	9	2	0.00	0.00	0.00
10	1	10	2	0.00	0.00	0.00
11	1	11	2	0.00	0.00	0.00
13	9	17	8	100.00	0.00	0.00
15	10	18	10	0.00	0.00	0.00
14	10	18	9	800.00	0.00	0.00
17	13	19	12	0.00	0.00	0.00
16	13	19	11	800.00	0.00	0.00
19	14	20	14	200.00	0.00	0.00
18	14	20	13	575.00	0.00	0.00
22	1	21	16	0.00	0.00	0.00
21	1	21	15	400.00	0.00	0.00
4	1	4	2	50.00	2.00	10.00
12	1	12	2	60.00	0.00	0.00
20	1	21	2	410.00	0.00	0.00
\.


--
-- Data for Name: inventory_items; Type: TABLE DATA; Schema: public; Owner: Biwi_user
--

COPY public.inventory_items (id, company_id, item_code, description, item_type, unit_of_measure_id, costing_method, standard_cost, average_cost, selling_price, is_active, notes, reorder_level, reorder_quantity, default_inventory_gl_account_id, default_cogs_gl_account_id, default_sales_gl_account_id, default_sales_tax_type_id, default_purchase_tax_type_id) FROM stdin;
4	1	LAPTOP-I3-001	Laptop Intel i3 8GB RAM 256GB SSD	Stock	11	WEIGHTED_AVERAGE	299	299.0	400	t		5	10	36	37	38	\N	\N
11	1	CASE-001	Mid Tower Case	Stock	11	WEIGHTED_AVERAGE	50	0.0	0	f		0	0	36	37	38	\N	\N
10	1	PSU-001	650W Power Supply	Stock	11	WEIGHTED_AVERAGE	75	0.0	0	f		0	0	36	37	38	\N	\N
9	1	SSD-001	500GB NVMe SSD	Stock	11	WEIGHTED_AVERAGE	60	0.0	0	f		0	0	36	37	38	\N	\N
8	1	RAM-001	16GB DDR4 RAM Kit	Stock	11	WEIGHTED_AVERAGE	80	0.0	0	f		0	0	36	37	38	\N	\N
7	1	CPU-001	Intel Core i5 Processor	Stock	11	WEIGHTED_AVERAGE	250	0.0	0	f		0	0	36	37	38	\N	\N
6	1	MOTHERBOARD-001	ATX Motherboard	Stock	11	WEIGHTED_AVERAGE	150	0.0	0	f		0	0	36	37	38	\N	\N
5	1	DESKTOP-001	Desktop Computer Assembly	Stock	11	WEIGHTED_AVERAGE	0	0.0	0	f		0	0	36	37	38	\N	\N
17	9	TEST-001	Test Widget	Stock	40	WeightedAverage	0.00	10.0	25.00	t	\N	10	100	92	93	94	\N	\N
18	10	WIDGET-001	Standard Widget	Stock	41	WeightedAverage	0.00	10.75	25.00	t	\N	50	200	96	97	98	\N	\N
19	13	WIDGET-001	Standard Widget	Stock	43	WeightedAverage	0.00	10.75	25.00	t	\N	50	200	100	101	102	\N	\N
20	14	WIDGET-001	Standard Widget	Stock	45	WeightedAverage	0.00	10.75	25.00	t	\N	50	200	104	105	106	\N	\N
12	1	CABLE-SET	Cable Set (SATA, Power)	Stock	11	WEIGHTED_AVERAGE	5	47.5	0	t		0	0	36	37	38	\N	\N
21	1	WIDGET-001	Standard Widget - Blue	Stock	11	WEIGHTED_AVERAGE	0	15.03353658536585365853658537	25	t	Standard blue widget for retail	50	200	36	37	38	\N	\N
\.


--
-- Data for Name: inventory_transaction_types; Type: TABLE DATA; Schema: public; Owner: Biwi_user
--

COPY public.inventory_transaction_types (id, company_id, name, description, base_type, affects_quantity_direction, default_offsetting_gl_account_id) FROM stdin;
1	1	Inventory Adjustment Increase	Increase inventory quantity due to count adjustment	AdjustmentIncrease	Increase	\N
2	1	Inventory Adjustment Decrease	Decrease inventory quantity due to count adjustment	AdjustmentDecrease	Decrease	\N
3	1	Goods Receipt	Receipt of inventory from supplier	ReceiptFromSupplier	Increase	\N
4	1	Return to Supplier	Return defective/excess inventory to supplier	ReturnToSupplier	Decrease	\N
5	1	Sale to Customer	Sale of inventory to customer	SaleToCustomer	Decrease	\N
6	1	Return from Customer	Return of inventory from customer	ReturnFromCustomer	Increase	\N
7	1	Warehouse Transfer Out	Transfer inventory out of warehouse	WarehouseTransferOut	Decrease	\N
8	1	Warehouse Transfer In	Transfer inventory into warehouse	WarehouseTransferIn	Increase	\N
12	9	Stock Receipt	Initial stock receipt	AdjustmentIncrease	Increase	95
13	10	Adjustment - Increase	Increase stock levels	AdjustmentIncrease	Increase	99
14	10	Adjustment - Decrease	Decrease stock levels	AdjustmentDecrease	Decrease	99
15	13	Adjustment - Increase	Increase stock levels	AdjustmentIncrease	Increase	103
16	13	Adjustment - Decrease	Decrease stock levels	AdjustmentDecrease	Decrease	103
17	13	Transfer Out	\N	WarehouseTransferOut	Decrease	\N
18	13	Transfer In	\N	WarehouseTransferIn	Increase	\N
19	14	Adjustment - Increase	Increase stock levels	AdjustmentIncrease	Increase	107
20	14	Adjustment - Decrease	Decrease stock levels	AdjustmentDecrease	Decrease	107
21	14	Transfer Out	\N	WarehouseTransferOut	Decrease	\N
22	14	Transfer In	\N	WarehouseTransferIn	Increase	\N
\.


--
-- Data for Name: inventory_transactions; Type: TABLE DATA; Schema: public; Owner: Biwi_user
--

COPY public.inventory_transactions (id, company_id, item_id, warehouse_id, inventory_transaction_type_id, linked_gl_journal_entry_id, transaction_date, quantity, unit_cost, total_value, reference_document_type, reference_document_id, notes, currency_id, exchange_rate, base_currency_unit_cost, base_currency_total_value, foreign_currency_unit_cost, foreign_currency_total_value) FROM stdin;
11	1	4	2	1	16	2025-06-17	10.0	299.0	2990.00	Adjustment	\N	Test adjustment - increase inventory	\N	\N	\N	\N	\N	\N
12	1	4	2	1	17	2025-06-17	1	299	299	Adjustment	\N	initial stock	\N	\N	\N	\N	\N	\N
13	1	4	2	2	18	2025-06-17	-10	299	2990	Adjustment	\N	remove unnecessary stock	\N	\N	\N	\N	\N	\N
16	1	4	2	5	\N	2025-06-17	-1	299.0	-299.0	SO_Invoice	14	Sale to Customer - SO Invoice SO000019	\N	\N	\N	\N	\N	\N
17	9	17	8	12	38	2025-06-25	100	10.00	1000.00	Adjustment	\N	Initial stock receipt for testing	\N	\N	\N	\N	\N	\N
18	10	18	9	13	39	2025-06-25	500	10.00	5000.00	Adjustment	\N	Initial stock receipt from supplier	\N	\N	\N	\N	\N	\N
19	10	18	9	13	40	2025-06-25	300	12.00	3600.00	Adjustment	\N	Second shipment received	\N	\N	\N	\N	\N	\N
20	13	19	11	15	41	2025-06-25	500	10.00	5000.00	Adjustment	\N	Initial stock receipt from supplier	\N	\N	\N	\N	\N	\N
21	13	19	11	15	42	2025-06-25	300	12.00	3600.00	Adjustment	\N	Second shipment received	\N	\N	\N	\N	\N	\N
22	14	20	13	19	43	2025-06-25	500	10.00	5000.00	Adjustment	\N	Initial stock receipt from supplier	\N	\N	\N	\N	\N	\N
23	14	20	13	19	44	2025-06-25	300	12.00	3600.00	Adjustment	\N	Second shipment received	\N	\N	\N	\N	\N	\N
24	14	20	13	21	45	2025-06-25	-200	10.75	2150.00	WarehouseTransfer	\N	Transfer to branch for local sales	\N	\N	\N	\N	\N	\N
25	14	20	14	22	45	2025-06-25	200	10.75	2150.00	WarehouseTransfer	\N	Transfer to branch for local sales	\N	\N	\N	\N	\N	\N
26	14	20	13	20	46	2025-06-25	-25	10.75	268.75	Adjustment	\N	Damaged goods - water damage in storage	\N	\N	\N	\N	\N	\N
27	1	21	2	1	47	2025-06-25	500	10	5000	Adjustment	\N	Initial stock receipt from supplier - PO#12345	\N	\N	\N	\N	\N	\N
28	1	21	2	1	48	2025-06-25	300	12	3600	Adjustment	\N	Second shipment - PO#12346	\N	\N	\N	\N	\N	\N
29	1	21	2	7	49	2025-06-26	-200	10.75	2150.00	WarehouseTransfer	\N	Transfer for branch opening stock	\N	\N	\N	\N	\N	\N
30	1	21	15	8	49	2025-06-26	200	10.75	2150.00	WarehouseTransfer	\N	Transfer for branch opening stock	\N	\N	\N	\N	\N	\N
31	1	21	2	7	50	2025-06-26	-200	10.75	2150.00	WarehouseTransfer	\N	Transfer for branch opening stock	\N	\N	\N	\N	\N	\N
32	1	21	15	8	50	2025-06-26	200	10.75	2150.00	WarehouseTransfer	\N	Transfer for branch opening stock	\N	\N	\N	\N	\N	\N
33	1	21	2	2	51	2025-06-26	-5.00	10.75	53.7500	Adjustment	\N	Inventory count adjustment - Session 1	\N	\N	\N	\N	\N	\N
34	1	12	2	1	52	2025-06-26	50	50	2500	Adjustment	\N	initial stock	\N	\N	\N	\N	\N	\N
35	1	4	2	1	53	2025-06-26	50	299	14950	Adjustment	\N	testing OE	\N	\N	\N	\N	\N	\N
36	1	21	2	5	\N	2025-06-26	-10	10.75	-107.50	SO_Invoice	15	Sale to Customer - SO Invoice SO000020	\N	\N	\N	\N	\N	\N
37	1	12	2	5	\N	2025-06-26	-5	50.0	-250.0	SO_Invoice	15	Sale to Customer - SO Invoice SO000020	\N	\N	\N	\N	\N	\N
38	1	21	2	3	56	2025-06-26	20	80	1600	Adjustment	\N	Receipt from Supplier - GRV	\N	\N	\N	\N	\N	\N
39	1	12	2	3	57	2025-06-26	15	40	600	Adjustment	\N	Receipt from Supplier - GRV	\N	\N	\N	\N	\N	\N
40	1	21	2	3	58	2025-06-27	5	85	425	Adjustment	\N	Receipt from Supplier - GRV	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: item_barcodes; Type: TABLE DATA; Schema: public; Owner: Biwi_user
--

COPY public.item_barcodes (id, company_id, item_id, barcode, unit_of_measure_id, quantity_in_uom) FROM stdin;
1	1	21	123456789012	11	1
2	1	21	987654321098	30	1
\.


--
-- Data for Name: manufacturing_order_components; Type: TABLE DATA; Schema: public; Owner: Biwi_user
--

COPY public.manufacturing_order_components (id, manufacturing_order_id, component_item_id, quantity_required, quantity_issued, unit_cost) FROM stdin;
1	1	6	1.01	0.0	0.0
\.


--
-- Data for Name: manufacturing_orders; Type: TABLE DATA; Schema: public; Owner: Biwi_user
--

COPY public.manufacturing_orders (id, company_id, order_number, bom_header_id, warehouse_id, quantity_to_manufacture, quantity_completed, order_date, due_date, start_date, completion_date, status, linked_gl_journal_entry_id, notes) FROM stdin;
1	1	MO001000	1	2	1	0.0	2025-06-25 19:56:35.482201	2025-06-25 00:00:00	\N	\N	Planned	\N	
\.


--
-- Data for Name: order_defaults; Type: TABLE DATA; Schema: public; Owner: Biwi_user
--

COPY public.order_defaults (id, company_id, default_so_status, default_po_status, default_grv_status, next_so_number, next_po_number, next_grv_number) FROM stdin;
1	1	Open	Open	Open	21	4	3
\.


--
-- Data for Name: platform_audit_logs; Type: TABLE DATA; Schema: public; Owner: Biwi_user
--

COPY public.platform_audit_logs (id, user_id, company_id, action, resource_type, resource_id, details, ip_address, user_agent, "timestamp") FROM stdin;
1	2	9	impersonated_company	company	9	{"reason": "Platform administration"}	\N	\N	2025-07-01 01:30:30.769628
2	2	10	impersonated_company	company	10	{"reason": "Platform administration"}	\N	\N	2025-07-01 01:30:38.194183
3	2	1	impersonated_company	company	1	{"reason": "Platform administration"}	\N	\N	2025-07-01 01:30:57.069969
4	2	1	impersonated_company	company	1	{"reason": "Platform administration"}	\N	\N	2025-07-04 15:52:41.800811
5	2	9	impersonated_company	company	9	{"reason": "Platform administration"}	\N	\N	2025-07-05 10:19:28.867135
10	2	15	created_company	company	15	{"company_code": "123456789", "company_name": "biwi Company Ltd"}	\N	\N	2025-07-05 13:09:31.83316
11	2	15	impersonated_company	company	15	{"reason": "Platform administration"}	\N	\N	2025-07-05 13:09:41.658934
12	2	1	deleted_user	user	14	{"deleted_user_email": "test@example.com"}	\N	\N	2025-07-05 13:35:02.505799
\.


--
-- Data for Name: pos_cash_movements; Type: TABLE DATA; Schema: public; Owner: Biwi_user
--

COPY public.pos_cash_movements (id, company_id, session_id, movement_type, amount, reason, reference, movement_datetime, authorized_by_id) FROM stdin;
\.


--
-- Data for Name: pos_defaults; Type: TABLE DATA; Schema: public; Owner: Biwi_user
--

COPY public.pos_defaults (id, company_id, default_customer_id, default_tax_type_id, receipt_header, receipt_footer, enable_negative_stock, require_customer_for_credit, auto_print_receipt, default_sale_transaction_type_id, default_return_transaction_type_id, cash_rounding_method, next_transaction_number) FROM stdin;
\.


--
-- Data for Name: pos_sessions; Type: TABLE DATA; Schema: public; Owner: Biwi_user
--

COPY public.pos_sessions (id, company_id, till_id, cashier_id, session_date, opening_time, closing_time, opening_cash, closing_cash, expected_cash, cash_variance, status) FROM stdin;
\.


--
-- Data for Name: pos_transaction_lines; Type: TABLE DATA; Schema: public; Owner: Biwi_user
--

COPY public.pos_transaction_lines (id, transaction_id, item_id, barcode_used, description, quantity, unit_price, discount_percentage, discount_amount, tax_type_id, tax_amount, line_total) FROM stdin;
\.


--
-- Data for Name: pos_transaction_types; Type: TABLE DATA; Schema: public; Owner: Biwi_user
--

COPY public.pos_transaction_types (id, company_id, name, description, base_type, affects_inventory, affects_ar, default_payment_method, is_active) FROM stdin;
1	1	Cash Sale	Standard cash sale	Sale	t	t	Cash	t
2	1	Product Return	Standard Product Return	Return	t	t	Cash	t
\.


--
-- Data for Name: pos_transactions; Type: TABLE DATA; Schema: public; Owner: Biwi_user
--

COPY public.pos_transactions (id, company_id, session_id, transaction_type_id, transaction_number, transaction_datetime, customer_id, payment_method, subtotal_amount, tax_amount, discount_amount, total_amount, cash_tendered, change_amount, linked_gl_journal_entry_id, linked_ar_transaction_id, reference_transaction_id, status, notes) FROM stdin;
\.


--
-- Data for Name: purchase_order_lines; Type: TABLE DATA; Schema: public; Owner: Biwi_user
--

COPY public.purchase_order_lines (id, purchase_order_id, item_id, description, quantity_ordered, quantity_received, unit_price, discount_percentage, tax_type_id, tax_amount, line_total, base_currency_tax_amount) FROM stdin;
1	1	4	Laptop Intel i3 8GB RAM 256GB SSD	5	0	299	0	\N	0	1495	\N
2	2	4	Laptop Intel i3 8GB RAM 256GB SSD	5	0	299	0	\N	0	1495	\N
3	3	21	Standard Widget - Blue	20	18	80	0	\N	0	1600	\N
4	3	12	Cable Set (SATA, Power)	15	18	40	0	\N	0	600	\N
\.


--
-- Data for Name: purchase_orders; Type: TABLE DATA; Schema: public; Owner: Biwi_user
--

COPY public.purchase_orders (id, company_id, supplier_id, order_date, expected_delivery_date, reference, document_number, status, total_amount, notes, delivery_address_warehouse_id, currency_id, exchange_rate, base_currency_amount, foreign_currency_amount) FROM stdin;
1	1	1	2025-06-22	2025-06-24	CUST001	PO000001	Draft	1495		2	\N	\N	\N	\N
2	1	1	2025-06-22	2025-06-25	123	PO000002	Draft	1495		2	\N	\N	\N	\N
3	1	1	2025-06-26	2025-06-27		PO000003	PartiallyReceived	2200		2	\N	\N	\N	\N
\.


--
-- Data for Name: report_schedules; Type: TABLE DATA; Schema: public; Owner: Biwi_user
--

COPY public.report_schedules (id, company_id, name, report_template_id, schedule_frequency, schedule_parameters, is_active, last_run_date, next_run_date) FROM stdin;
\.


--
-- Data for Name: report_templates; Type: TABLE DATA; Schema: public; Owner: Biwi_user
--

COPY public.report_templates (id, company_id, name, report_type, template_data, is_default, is_active, created_by_user_id, created_at) FROM stdin;
\.


--
-- Data for Name: resource_usage; Type: TABLE DATA; Schema: public; Owner: Biwi_user
--

COPY public.resource_usage (id, company_id, resource_type, usage_amount, usage_date, billing_period, metadata) FROM stdin;
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: Biwi_user
--

COPY public.roles (id, name, description, permissions, company_id) FROM stdin;
10	Inventory Manager	\N	["inv:setup_manage", "inv:transactions_adjust", "inv:reports_view"]	9
11	Inventory Manager	\N	["inv:setup_manage", "inv:transactions_adjust", "inv:reports_view"]	10
12	Inventory Manager	\N	["inv:setup_manage", "inv:transactions_adjust", "inv:reports_view"]	12
13	Inventory Manager	\N	["inv:setup_manage", "inv:transactions_adjust", "inv:reports_view"]	13
14	Inventory Manager	\N	["inv:setup_manage", "inv:transactions_adjust", "inv:reports_view"]	14
15	Limited Inventory Reporter	User can only view inventory reports	["inv:reports_view"]	1
16	Currency Manager		["common:setup_currencies"]	1
1	Admin	Administrator role with full permissions	["create", "read", "update", "delete", "inv:setup_manage", "inv:transactions_adjust", "inv:reports_view", "gl:setup_manage", "gl:transactions_post", "gl:reports_view", "ar:setup_manage", "ar:transactions_manage", "ar:reports_view", "ap:setup_manage", "ap:transactions_manage", "ap:reports_view", "oe:setup_manage", "oe:purchase_orders_manage", "oe:reports_view", "common:setup_currencies", "common:setup_branches", "common:setup_taxes", "oe:grv_process", "oe:sales_orders_manage", "ap:transactions_post", "ar:transactions_post", "gl:journal_post", "accounting_periods:manage", "company:read", "company:update", "roles:delete", "roles:read", "roles:create", "roles:update", "users:update", "users:create", "users:read", "users:delete"]	1
17	Administrator	Full system access	["users:create", "users:read", "users:update", "users:delete", "users:manage_roles", "roles:create", "roles:read", "roles:update", "roles:delete", "roles:manage_permissions", "company:read", "company:update", "accounting_periods:manage", "gl:setup_manage", "gl:journal_post", "gl:reports_view", "ar:setup_manage", "ar:transactions_post", "ar:reports_view", "ar:writeoff_approve", "ap:setup_manage", "ap:transactions_post", "ap:reports_view", "inv:setup_manage", "inv:transactions_adjust", "inv:reports_view", "oe:setup_manage", "oe:sales_orders_manage", "oe:purchase_orders_manage", "oe:grv_process", "oe:reports_view", "common:setup_currencies", "common:setup_taxes", "common:setup_branches", "reporting:financial_statements_view", "reporting:financial_statements_generate", "reporting:templates_manage", "reporting:schedules_manage", "reporting:bank_reconciliation_manage", "reporting:ar_aging_view", "reporting:ap_aging_view", "reporting:gl_advanced_view", "reporting:comparative_analysis", "reporting:cash_flow_view", "bom:setup_manage", "bom:manufacturing_process", "bom:reports_view", "pos:setup_manage", "pos:till_manage", "pos:session_open", "pos:session_close", "pos:sales_process", "pos:returns_process", "pos:cash_manage", "pos:reports_view"]	9
18	Accountant	Manages financial transactions and reports	["gl:setup_manage", "gl:journal_post", "gl:reports_view", "ar:transactions_post", "ar:reports_view", "ap:transactions_post", "ap:reports_view"]	9
19	Sales Manager	Manages sales and customer relationships	["ar:setup_manage", "ar:transactions_post", "ar:reports_view", "oe:sales_orders_manage", "oe:reports_view"]	9
20	Clerk	Basic data entry permissions	["company:read", "users:read", "gl:reports_view", "ar:reports_view", "ap:reports_view"]	9
\.


--
-- Data for Name: sales_order_lines; Type: TABLE DATA; Schema: public; Owner: Biwi_user
--

COPY public.sales_order_lines (id, sales_order_id, item_id, description, quantity_ordered, quantity_invoiced, unit_price, discount_percentage, tax_type_id, tax_amount, line_total, base_currency_tax_amount) FROM stdin;
1	3	3	laptop i3	1	1	400	0	\N	0	400	\N
2	4	3	laptop i3	2	0	400.00	0	\N	0	800.00	\N
3	5	3	laptop i3	2	2	400.00	0	\N	0	800.00	\N
4	6	3	laptop i3	2	2	400.00	0	\N	0	800.00	\N
5	7	3	laptop i3	2	2	400.00	0	\N	0	800.00	\N
6	8	3	laptop i3	2	2	400.00	0	\N	0	800.00	\N
7	9	3	laptop i3	2	2	400.00	0	\N	0	800.00	\N
8	10	3	laptop i3	2	2	400.00	0	\N	0	800.00	\N
9	11	3	laptop i3	2	2	400.00	0	\N	0	800.00	\N
10	12	4	Laptop Intel i3 8GB RAM 256GB SSD	1	0	400	0	\N	0	400	\N
11	13	4	Laptop Intel i3 8GB RAM 256GB SSD	1	0	400	0	\N	0	400	\N
12	14	4	Laptop Intel i3 8GB RAM 256GB SSD	1	1	400	0	\N	0	400	\N
13	15	21	Standard Widget - Blue	10	10	100	5	\N	0	950.00	\N
14	15	12	Cable Set (SATA, Power)	5	5	50	0	\N	0	250	\N
\.


--
-- Data for Name: sales_orders; Type: TABLE DATA; Schema: public; Owner: Biwi_user
--

COPY public.sales_orders (id, company_id, customer_id, order_date, reference, document_number, status, total_amount, notes, shipping_address, billing_address, sales_representative_id, ar_invoice_id, currency_id, exchange_rate, base_currency_amount, foreign_currency_amount) FROM stdin;
13	1	4	2025-06-17	CUST001	SO000018	Invoiced	400	\N	null	null	1	11	\N	\N	\N	\N
12	1	4	2025-06-17	CUST001	SO000017	Invoiced	400	\N	null	null	3	13	\N	\N	\N	\N
14	1	4	2025-06-17	SO-020	SO000019	Invoiced	400	\N	null	null	3	15	\N	\N	\N	\N
15	1	4	2025-06-26	PO000003	SO000020	Invoiced	1200.00	TEST-SO-001	null	null	5	17	\N	\N	\N	\N
\.


--
-- Data for Name: sales_representatives; Type: TABLE DATA; Schema: public; Owner: Biwi_user
--

COPY public.sales_representatives (id, company_id, name, contact_info, is_active) FROM stdin;
1	1	John Smith	{"email": "john.smith@company.com", "phone": "+1-555-0101", "extension": "101"}	t
2	1	Sarah Johnson	{"email": "sarah.johnson@company.com", "phone": "+1-555-0102", "extension": "102"}	t
3	1	Mike Davis	{"email": "mike.davis@company.com", "phone": "+1-555-0103", "extension": "103"}	t
4	1	Test Sales Rep	{"email": "testrep@example.com"}	t
5	1	Test Sales Rep	{"email": "testrep@example.com"}	t
6	3	John Smith	{"email": "john.smith@company.com", "phone": "+1-555-0101", "extension": "101"}	t
7	3	Sarah Johnson	{"email": "sarah.johnson@company.com", "phone": "+1-555-0102", "extension": "102"}	t
8	3	Mike Davis	{"email": "mike.davis@company.com", "phone": "+1-555-0103", "extension": "103"}	t
\.


--
-- Data for Name: suppliers; Type: TABLE DATA; Schema: public; Owner: Biwi_user
--

COPY public.suppliers (id, company_id, supplier_code, name, address, contact_info, payment_terms, current_balance, default_ap_gl_account_id, is_active, default_currency_id) FROM stdin;
1	1	CUST001	HIFI company	{"city": "kigali", "state": "state", "street": "street 123", "postal_code": "1000"}	{"email": "test@company.com", "phone": "1231231231", "contact_person": ""}	Net 30	0.00	\N	t	\N
\.


--
-- Data for Name: tax_types; Type: TABLE DATA; Schema: public; Owner: Biwi_user
--

COPY public.tax_types (id, company_id, name, rate_percentage, tax_authority_gl_account_id, tax_code, tax_nature, is_active) FROM stdin;
35	1	Input VAT	18.00	\N	INPUT18	Purchases	t
36	1	VAT Exempt	0.00	\N	EXEMPT	Exempt	t
34	1	VAT Standard Rate	18.00	\N	VAT18	Sales	t
\.


--
-- Data for Name: tills; Type: TABLE DATA; Schema: public; Owner: Biwi_user
--

COPY public.tills (id, company_id, till_code, till_name, location, default_cashier_id, default_warehouse_id, cash_gl_account_id, is_active) FROM stdin;
1	1	TILL001	Main Counter	Store Front	2	2	42	t
\.


--
-- Data for Name: unit_of_measures; Type: TABLE DATA; Schema: public; Owner: Biwi_user
--

COPY public.unit_of_measures (id, company_id, name, abbreviation, conversion_factor_to_base, is_active) FROM stdin;
11	1	Each	EA	1.00	t
12	1	Piece	PC	1.00	t
13	1	Item	ITEM	1.00	t
14	1	Unit	UNIT	1.00	t
15	1	Kilogram	KG	1.00	t
16	1	Gram	G	0.001	t
17	1	Ton	TON	1000.00	t
18	1	Pound	LB	0.453592	t
19	1	Ounce	OZ	0.0283495	t
20	1	Meter	M	1.00	t
21	1	Centimeter	CM	0.01	t
22	1	Millimeter	MM	0.001	t
23	1	Foot	FT	0.3048	t
24	1	Inch	IN	0.0254	t
25	1	Liter	L	1.00	t
26	1	Milliliter	ML	0.001	t
27	1	Gallon	GAL	3.78541	t
28	1	Hour	HR	1.00	t
29	1	Day	DAY	24.00	t
31	1	Case	CASE	1.00	t
32	1	Dozen	DOZ	12.00	t
33	1	Pair	PAIR	2.00	t
34	1	Service	SVC	1.00	t
40	9	Each	EA	1.00	t
41	10	Each	EA	1.00	t
42	10	Box	BX	12.00	t
43	13	Each	EA	1.00	t
44	13	Box	BX	12.00	t
45	14	Each	EA	1.00	t
46	14	Box	BX	12.00	t
30	1	Box	BOX	1	t
\.


--
-- Data for Name: usage_alerts; Type: TABLE DATA; Schema: public; Owner: Biwi_user
--

COPY public.usage_alerts (id, company_id, alert_type, threshold_percentage, is_active, last_triggered, alert_recipients) FROM stdin;
\.


--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: Biwi_user
--

COPY public.user_roles (user_id, role_id) FROM stdin;
2	1
7	10
8	11
10	13
11	14
12	15
13	16
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: Biwi_user
--

COPY public.users (id, email, hashed_password, full_name, is_active, is_superuser, company_id, user_type, default_company_id, last_login, created_at, updated_at) FROM stdin;
4	manager@samplecompany001.com	$2b$12$5gIZNFc5SZN93lZfuT9aceBR3LZLuhJcE.FbsLnn0i3KrNxkUBjzW	Sales Manager	t	f	3	company_user	\N	\N	2025-06-30 22:20:52.706268	2025-06-30 22:20:52.706268
5	user@samplecompany001.com	$2b$12$/wRdmpqyYi4CmJT7G3Wjo.TbZKYw.MpXQ0lSnVXKamq9qZNh4LE6C	Staff User	t	f	3	company_user	\N	\N	2025-06-30 22:20:52.706268	2025-06-30 22:20:52.706268
6	accountant@techflow.com	$2b$12$og7mS3rwZdOW6Z9C.ilP9ehed0ATIn36vWs0QaeuLuXspUuun.pQy	test accountant	t	f	1	company_user	\N	\N	2025-06-30 22:20:52.706268	2025-06-30 22:20:52.706268
7	inv_test@test.com	$2b$12$a52Hb5xsQu6qLgoUpIP7m.rrhgFbsTdpFG2cnG8WREqorURltdP/O	Inventory Test User	t	f	9	company_user	\N	\N	2025-06-30 22:20:52.706268	2025-06-30 22:20:52.706268
8	integration_test@test.com	$2b$12$a.9e..8IQGuIO/6FNwBMCe4aoyK6s0WAShoxuSWjMnRngwHbm5DrK	Integration Test User	t	f	10	company_user	\N	\N	2025-06-30 22:20:52.706268	2025-06-30 22:20:52.706268
10	integration_test_021fa94d@test.com	$2b$12$hMuwbpHVyCKTrVYBJNge9Oqs.VqhVJPoNzTg0H0lHeKUMffMApYw2	Integration Test User	t	f	13	company_user	\N	\N	2025-06-30 22:20:52.706268	2025-06-30 22:20:52.706268
11	integration_test_328e73d5@test.com	$2b$12$8OOdk74DRTjJSSvCYFC2quyFBmMj9KcCvYkcvFnCGKYFoR8DsoIMS	Integration Test User	t	f	14	company_user	\N	\N	2025-06-30 22:20:52.706268	2025-06-30 22:20:52.706268
12	limited_user@test.com	$2b$12$ZRGYgtKiLKG0Dbk3OxvoH.BiEmBESDvp803dthVgNFZlDoXbOLRJi	Limited Test User	t	f	1	company_user	\N	\N	2025-06-30 22:20:52.706268	2025-06-30 22:20:52.706268
13	testuser@company.com	$2b$12$//cXJeEJByBCMN11LlS5weIkltqMr9SgO2GfZRC1Ulh/Hi1JtSxWy	Test User	t	f	1	company_user	\N	\N	2025-06-30 22:20:52.706268	2025-06-30 22:20:52.706268
15	test@admin.com	$2b$12$x/3NeulyLm3zvTvquCBZoumFF0JEOfXghmMJ0JYaDsPDpRqMM466a	Test Administrator	t	t	9	platform_admin	\N	\N	2025-07-13 22:57:39.136387	2025-07-13 22:58:02.611297
17	adminplatform@biwi.com	$2b$12$YCt7VLKGPNk7WfrNxJB4JeVFmMBylhokP4ZQp2g4nQ3Rr8nSGrOxG	Platform Administrator	t	f	\N	platform_admin	\N	\N	2025-07-17 01:25:00.035766	2025-07-17 01:25:00.035771
16	newadmin@example.com	$2b$12$foM140xHs0hBtbgapHeCZe65ayGjBS2reXEztJRi5xeZRywyDKXaG	Platform Administrator	t	f	\N	platform_admin	\N	2025-07-17 01:30:38.358558	2025-07-17 01:22:02.466432	2025-07-17 01:30:38.359239
2	admin@biwi.com	$2b$12$by3EnI606MCaizkdr.UzYO7qAD.BmTILjbE8HWj/NfLMsbQgRg.wu	System Administrator	t	t	\N	platform_admin	\N	2025-07-17 01:56:13.356954	2025-06-30 22:20:52.706268	2025-07-17 01:56:13.357587
1	admin@testcompany.com	$2b$12$OcLbTTku30RmsSjtYPHFu.1Xce2vfKP31tM.kWd3VZDbd/NpZwKyW	Test Admin	f	t	1	platform_admin	\N	\N	2025-06-30 22:20:52.706268	2025-07-17 01:56:38.663832
\.


--
-- Data for Name: warehouses; Type: TABLE DATA; Schema: public; Owner: Biwi_user
--

COPY public.warehouses (id, company_id, name, location, is_default, is_active) FROM stdin;
2	1	Main Warehouse	Head Office	t	t
8	9	Test Warehouse	Test Location	t	t
9	10	Main Warehouse	123 Main Street	t	t
10	10	Branch Warehouse	456 Branch Road	f	t
11	13	Main Warehouse	123 Main Street	t	t
12	13	Branch Warehouse	456 Branch Road	f	t
13	14	Main Warehouse	123 Main Street	t	t
14	14	Branch Warehouse	456 Branch Road	f	t
15	1	Branch Warehouse	456 Branch Road	f	t
16	1	Returns Warehouse	789 Returns Ave	f	t
\.


--
-- Name: accounting_periods_id_seq; Type: SEQUENCE SET; Schema: public; Owner: Biwi_user
--

SELECT pg_catalog.setval('public.accounting_periods_id_seq', 1, true);


--
-- Name: ap_allocation_lines_id_seq; Type: SEQUENCE SET; Schema: public; Owner: Biwi_user
--

SELECT pg_catalog.setval('public.ap_allocation_lines_id_seq', 1, false);


--
-- Name: ap_allocations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: Biwi_user
--

SELECT pg_catalog.setval('public.ap_allocations_id_seq', 1, false);


--
-- Name: ap_defaults_id_seq; Type: SEQUENCE SET; Schema: public; Owner: Biwi_user
--

SELECT pg_catalog.setval('public.ap_defaults_id_seq', 2, true);


--
-- Name: ap_transaction_tax_lines_id_seq; Type: SEQUENCE SET; Schema: public; Owner: Biwi_user
--

SELECT pg_catalog.setval('public.ap_transaction_tax_lines_id_seq', 1, false);


--
-- Name: ap_transaction_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: Biwi_user
--

SELECT pg_catalog.setval('public.ap_transaction_types_id_seq', 8, true);


--
-- Name: ap_transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: Biwi_user
--

SELECT pg_catalog.setval('public.ap_transactions_id_seq', 1, true);


--
-- Name: ar_allocation_lines_id_seq; Type: SEQUENCE SET; Schema: public; Owner: Biwi_user
--

SELECT pg_catalog.setval('public.ar_allocation_lines_id_seq', 1, true);


--
-- Name: ar_allocations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: Biwi_user
--

SELECT pg_catalog.setval('public.ar_allocations_id_seq', 1, true);


--
-- Name: ar_defaults_id_seq; Type: SEQUENCE SET; Schema: public; Owner: Biwi_user
--

SELECT pg_catalog.setval('public.ar_defaults_id_seq', 1, true);


--
-- Name: ar_transaction_tax_lines_id_seq; Type: SEQUENCE SET; Schema: public; Owner: Biwi_user
--

SELECT pg_catalog.setval('public.ar_transaction_tax_lines_id_seq', 1, false);


--
-- Name: ar_transaction_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: Biwi_user
--

SELECT pg_catalog.setval('public.ar_transaction_types_id_seq', 17, true);


--
-- Name: ar_transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: Biwi_user
--

SELECT pg_catalog.setval('public.ar_transactions_id_seq', 17, true);


--
-- Name: ar_writeoffs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: Biwi_user
--

SELECT pg_catalog.setval('public.ar_writeoffs_id_seq', 25, true);


--
-- Name: bank_reconciliation_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: Biwi_user
--

SELECT pg_catalog.setval('public.bank_reconciliation_items_id_seq', 1, false);


--
-- Name: bank_reconciliations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: Biwi_user
--

SELECT pg_catalog.setval('public.bank_reconciliations_id_seq', 1, false);


--
-- Name: billing_configurations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: Biwi_user
--

SELECT pg_catalog.setval('public.billing_configurations_id_seq', 1, false);


--
-- Name: billing_transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: Biwi_user
--

SELECT pg_catalog.setval('public.billing_transactions_id_seq', 1, false);


--
-- Name: bom_components_id_seq; Type: SEQUENCE SET; Schema: public; Owner: Biwi_user
--

SELECT pg_catalog.setval('public.bom_components_id_seq', 1, true);


--
-- Name: bom_defaults_id_seq; Type: SEQUENCE SET; Schema: public; Owner: Biwi_user
--

SELECT pg_catalog.setval('public.bom_defaults_id_seq', 1, true);


--
-- Name: bom_headers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: Biwi_user
--

SELECT pg_catalog.setval('public.bom_headers_id_seq', 1, true);


--
-- Name: branches_id_seq; Type: SEQUENCE SET; Schema: public; Owner: Biwi_user
--

SELECT pg_catalog.setval('public.branches_id_seq', 34, true);


--
-- Name: companies_id_seq; Type: SEQUENCE SET; Schema: public; Owner: Biwi_user
--

SELECT pg_catalog.setval('public.companies_id_seq', 15, true);


--
-- Name: currencies_id_seq; Type: SEQUENCE SET; Schema: public; Owner: Biwi_user
--

SELECT pg_catalog.setval('public.currencies_id_seq', 40, true);


--
-- Name: customers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: Biwi_user
--

SELECT pg_catalog.setval('public.customers_id_seq', 4, true);


--
-- Name: exchange_rate_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: Biwi_user
--

SELECT pg_catalog.setval('public.exchange_rate_history_id_seq', 1, false);


--
-- Name: forex_gain_loss_id_seq; Type: SEQUENCE SET; Schema: public; Owner: Biwi_user
--

SELECT pg_catalog.setval('public.forex_gain_loss_id_seq', 1, false);


--
-- Name: gl_accounts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: Biwi_user
--

SELECT pg_catalog.setval('public.gl_accounts_id_seq', 119, true);


--
-- Name: gl_defaults_id_seq; Type: SEQUENCE SET; Schema: public; Owner: Biwi_user
--

SELECT pg_catalog.setval('public.gl_defaults_id_seq', 2, true);


--
-- Name: gl_journal_entries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: Biwi_user
--

SELECT pg_catalog.setval('public.gl_journal_entries_id_seq', 63, true);


--
-- Name: gl_journal_entry_lines_id_seq; Type: SEQUENCE SET; Schema: public; Owner: Biwi_user
--

SELECT pg_catalog.setval('public.gl_journal_entry_lines_id_seq', 148, true);


--
-- Name: gl_transaction_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: Biwi_user
--

SELECT pg_catalog.setval('public.gl_transaction_types_id_seq', 1, true);


--
-- Name: goods_received_voucher_lines_id_seq; Type: SEQUENCE SET; Schema: public; Owner: Biwi_user
--

SELECT pg_catalog.setval('public.goods_received_voucher_lines_id_seq', 3, true);


--
-- Name: goods_received_vouchers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: Biwi_user
--

SELECT pg_catalog.setval('public.goods_received_vouchers_id_seq', 6, true);


--
-- Name: inventory_count_lines_id_seq; Type: SEQUENCE SET; Schema: public; Owner: Biwi_user
--

SELECT pg_catalog.setval('public.inventory_count_lines_id_seq', 20, true);


--
-- Name: inventory_count_sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: Biwi_user
--

SELECT pg_catalog.setval('public.inventory_count_sessions_id_seq', 2, true);


--
-- Name: inventory_defaults_id_seq; Type: SEQUENCE SET; Schema: public; Owner: Biwi_user
--

SELECT pg_catalog.setval('public.inventory_defaults_id_seq', 2, true);


--
-- Name: inventory_item_locations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: Biwi_user
--

SELECT pg_catalog.setval('public.inventory_item_locations_id_seq', 23, true);


--
-- Name: inventory_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: Biwi_user
--

SELECT pg_catalog.setval('public.inventory_items_id_seq', 21, true);


--
-- Name: inventory_transaction_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: Biwi_user
--

SELECT pg_catalog.setval('public.inventory_transaction_types_id_seq', 22, true);


--
-- Name: inventory_transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: Biwi_user
--

SELECT pg_catalog.setval('public.inventory_transactions_id_seq', 40, true);


--
-- Name: item_barcodes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: Biwi_user
--

SELECT pg_catalog.setval('public.item_barcodes_id_seq', 2, true);


--
-- Name: manufacturing_order_components_id_seq; Type: SEQUENCE SET; Schema: public; Owner: Biwi_user
--

SELECT pg_catalog.setval('public.manufacturing_order_components_id_seq', 1, true);


--
-- Name: manufacturing_orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: Biwi_user
--

SELECT pg_catalog.setval('public.manufacturing_orders_id_seq', 1, true);


--
-- Name: order_defaults_id_seq; Type: SEQUENCE SET; Schema: public; Owner: Biwi_user
--

SELECT pg_catalog.setval('public.order_defaults_id_seq', 1, true);


--
-- Name: platform_audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: Biwi_user
--

SELECT pg_catalog.setval('public.platform_audit_logs_id_seq', 14, true);


--
-- Name: pos_cash_movements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: Biwi_user
--

SELECT pg_catalog.setval('public.pos_cash_movements_id_seq', 1, false);


--
-- Name: pos_defaults_id_seq; Type: SEQUENCE SET; Schema: public; Owner: Biwi_user
--

SELECT pg_catalog.setval('public.pos_defaults_id_seq', 1, false);


--
-- Name: pos_sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: Biwi_user
--

SELECT pg_catalog.setval('public.pos_sessions_id_seq', 1, false);


--
-- Name: pos_transaction_lines_id_seq; Type: SEQUENCE SET; Schema: public; Owner: Biwi_user
--

SELECT pg_catalog.setval('public.pos_transaction_lines_id_seq', 1, false);


--
-- Name: pos_transaction_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: Biwi_user
--

SELECT pg_catalog.setval('public.pos_transaction_types_id_seq', 2, true);


--
-- Name: pos_transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: Biwi_user
--

SELECT pg_catalog.setval('public.pos_transactions_id_seq', 1, false);


--
-- Name: purchase_order_lines_id_seq; Type: SEQUENCE SET; Schema: public; Owner: Biwi_user
--

SELECT pg_catalog.setval('public.purchase_order_lines_id_seq', 4, true);


--
-- Name: purchase_orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: Biwi_user
--

SELECT pg_catalog.setval('public.purchase_orders_id_seq', 5, true);


--
-- Name: report_schedules_id_seq; Type: SEQUENCE SET; Schema: public; Owner: Biwi_user
--

SELECT pg_catalog.setval('public.report_schedules_id_seq', 1, false);


--
-- Name: report_templates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: Biwi_user
--

SELECT pg_catalog.setval('public.report_templates_id_seq', 1, false);


--
-- Name: resource_usage_id_seq; Type: SEQUENCE SET; Schema: public; Owner: Biwi_user
--

SELECT pg_catalog.setval('public.resource_usage_id_seq', 1, false);


--
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: Biwi_user
--

SELECT pg_catalog.setval('public.roles_id_seq', 20, true);


--
-- Name: sales_order_lines_id_seq; Type: SEQUENCE SET; Schema: public; Owner: Biwi_user
--

SELECT pg_catalog.setval('public.sales_order_lines_id_seq', 14, true);


--
-- Name: sales_orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: Biwi_user
--

SELECT pg_catalog.setval('public.sales_orders_id_seq', 15, true);


--
-- Name: sales_representatives_id_seq; Type: SEQUENCE SET; Schema: public; Owner: Biwi_user
--

SELECT pg_catalog.setval('public.sales_representatives_id_seq', 8, true);


--
-- Name: suppliers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: Biwi_user
--

SELECT pg_catalog.setval('public.suppliers_id_seq', 1, true);


--
-- Name: tax_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: Biwi_user
--

SELECT pg_catalog.setval('public.tax_types_id_seq', 37, true);


--
-- Name: tills_id_seq; Type: SEQUENCE SET; Schema: public; Owner: Biwi_user
--

SELECT pg_catalog.setval('public.tills_id_seq', 1, true);


--
-- Name: unit_of_measures_id_seq; Type: SEQUENCE SET; Schema: public; Owner: Biwi_user
--

SELECT pg_catalog.setval('public.unit_of_measures_id_seq', 46, true);


--
-- Name: usage_alerts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: Biwi_user
--

SELECT pg_catalog.setval('public.usage_alerts_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: Biwi_user
--

SELECT pg_catalog.setval('public.users_id_seq', 17, true);


--
-- Name: warehouses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: Biwi_user
--

SELECT pg_catalog.setval('public.warehouses_id_seq', 16, true);


--
-- Name: accounting_periods accounting_periods_pkey; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.accounting_periods
    ADD CONSTRAINT accounting_periods_pkey PRIMARY KEY (id);


--
-- Name: alembic_version alembic_version_pkc; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.alembic_version
    ADD CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num);


--
-- Name: ap_allocation_lines ap_allocation_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.ap_allocation_lines
    ADD CONSTRAINT ap_allocation_lines_pkey PRIMARY KEY (id);


--
-- Name: ap_allocations ap_allocations_pkey; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.ap_allocations
    ADD CONSTRAINT ap_allocations_pkey PRIMARY KEY (id);


--
-- Name: ap_defaults ap_defaults_company_id_key; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.ap_defaults
    ADD CONSTRAINT ap_defaults_company_id_key UNIQUE (company_id);


--
-- Name: ap_defaults ap_defaults_pkey; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.ap_defaults
    ADD CONSTRAINT ap_defaults_pkey PRIMARY KEY (id);


--
-- Name: ap_transaction_tax_lines ap_transaction_tax_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.ap_transaction_tax_lines
    ADD CONSTRAINT ap_transaction_tax_lines_pkey PRIMARY KEY (id);


--
-- Name: ap_transaction_types ap_transaction_types_pkey; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.ap_transaction_types
    ADD CONSTRAINT ap_transaction_types_pkey PRIMARY KEY (id);


--
-- Name: ap_transactions ap_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.ap_transactions
    ADD CONSTRAINT ap_transactions_pkey PRIMARY KEY (id);


--
-- Name: ar_allocation_lines ar_allocation_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.ar_allocation_lines
    ADD CONSTRAINT ar_allocation_lines_pkey PRIMARY KEY (id);


--
-- Name: ar_allocations ar_allocations_pkey; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.ar_allocations
    ADD CONSTRAINT ar_allocations_pkey PRIMARY KEY (id);


--
-- Name: ar_defaults ar_defaults_pkey; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.ar_defaults
    ADD CONSTRAINT ar_defaults_pkey PRIMARY KEY (id);


--
-- Name: ar_transaction_tax_lines ar_transaction_tax_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.ar_transaction_tax_lines
    ADD CONSTRAINT ar_transaction_tax_lines_pkey PRIMARY KEY (id);


--
-- Name: ar_transaction_types ar_transaction_types_pkey; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.ar_transaction_types
    ADD CONSTRAINT ar_transaction_types_pkey PRIMARY KEY (id);


--
-- Name: ar_transactions ar_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.ar_transactions
    ADD CONSTRAINT ar_transactions_pkey PRIMARY KEY (id);


--
-- Name: ar_writeoffs ar_writeoffs_pkey; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.ar_writeoffs
    ADD CONSTRAINT ar_writeoffs_pkey PRIMARY KEY (id);


--
-- Name: bank_reconciliation_items bank_reconciliation_items_pkey; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.bank_reconciliation_items
    ADD CONSTRAINT bank_reconciliation_items_pkey PRIMARY KEY (id);


--
-- Name: bank_reconciliations bank_reconciliations_pkey; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.bank_reconciliations
    ADD CONSTRAINT bank_reconciliations_pkey PRIMARY KEY (id);


--
-- Name: billing_configurations billing_configurations_pkey; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.billing_configurations
    ADD CONSTRAINT billing_configurations_pkey PRIMARY KEY (id);


--
-- Name: billing_transactions billing_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.billing_transactions
    ADD CONSTRAINT billing_transactions_pkey PRIMARY KEY (id);


--
-- Name: bom_components bom_components_pkey; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.bom_components
    ADD CONSTRAINT bom_components_pkey PRIMARY KEY (id);


--
-- Name: bom_defaults bom_defaults_company_id_key; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.bom_defaults
    ADD CONSTRAINT bom_defaults_company_id_key UNIQUE (company_id);


--
-- Name: bom_defaults bom_defaults_pkey; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.bom_defaults
    ADD CONSTRAINT bom_defaults_pkey PRIMARY KEY (id);


--
-- Name: bom_headers bom_headers_pkey; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.bom_headers
    ADD CONSTRAINT bom_headers_pkey PRIMARY KEY (id);


--
-- Name: branches branches_pkey; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_pkey PRIMARY KEY (id);


--
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id);


--
-- Name: currencies currencies_pkey; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.currencies
    ADD CONSTRAINT currencies_pkey PRIMARY KEY (id);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: exchange_rate_history exchange_rate_history_pkey; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.exchange_rate_history
    ADD CONSTRAINT exchange_rate_history_pkey PRIMARY KEY (id);


--
-- Name: forex_gain_loss forex_gain_loss_pkey; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.forex_gain_loss
    ADD CONSTRAINT forex_gain_loss_pkey PRIMARY KEY (id);


--
-- Name: gl_accounts gl_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.gl_accounts
    ADD CONSTRAINT gl_accounts_pkey PRIMARY KEY (id);


--
-- Name: gl_defaults gl_defaults_company_id_key; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.gl_defaults
    ADD CONSTRAINT gl_defaults_company_id_key UNIQUE (company_id);


--
-- Name: gl_defaults gl_defaults_pkey; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.gl_defaults
    ADD CONSTRAINT gl_defaults_pkey PRIMARY KEY (id);


--
-- Name: gl_journal_entries gl_journal_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.gl_journal_entries
    ADD CONSTRAINT gl_journal_entries_pkey PRIMARY KEY (id);


--
-- Name: gl_journal_entry_lines gl_journal_entry_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.gl_journal_entry_lines
    ADD CONSTRAINT gl_journal_entry_lines_pkey PRIMARY KEY (id);


--
-- Name: gl_transaction_types gl_transaction_types_pkey; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.gl_transaction_types
    ADD CONSTRAINT gl_transaction_types_pkey PRIMARY KEY (id);


--
-- Name: goods_received_voucher_lines goods_received_voucher_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.goods_received_voucher_lines
    ADD CONSTRAINT goods_received_voucher_lines_pkey PRIMARY KEY (id);


--
-- Name: goods_received_vouchers goods_received_vouchers_pkey; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.goods_received_vouchers
    ADD CONSTRAINT goods_received_vouchers_pkey PRIMARY KEY (id);


--
-- Name: inventory_count_lines inventory_count_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.inventory_count_lines
    ADD CONSTRAINT inventory_count_lines_pkey PRIMARY KEY (id);


--
-- Name: inventory_count_sessions inventory_count_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.inventory_count_sessions
    ADD CONSTRAINT inventory_count_sessions_pkey PRIMARY KEY (id);


--
-- Name: inventory_defaults inventory_defaults_company_id_key; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.inventory_defaults
    ADD CONSTRAINT inventory_defaults_company_id_key UNIQUE (company_id);


--
-- Name: inventory_defaults inventory_defaults_pkey; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.inventory_defaults
    ADD CONSTRAINT inventory_defaults_pkey PRIMARY KEY (id);


--
-- Name: inventory_item_locations inventory_item_locations_pkey; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.inventory_item_locations
    ADD CONSTRAINT inventory_item_locations_pkey PRIMARY KEY (id);


--
-- Name: inventory_items inventory_items_pkey; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.inventory_items
    ADD CONSTRAINT inventory_items_pkey PRIMARY KEY (id);


--
-- Name: inventory_transaction_types inventory_transaction_types_pkey; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.inventory_transaction_types
    ADD CONSTRAINT inventory_transaction_types_pkey PRIMARY KEY (id);


--
-- Name: inventory_transactions inventory_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT inventory_transactions_pkey PRIMARY KEY (id);


--
-- Name: item_barcodes item_barcodes_pkey; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.item_barcodes
    ADD CONSTRAINT item_barcodes_pkey PRIMARY KEY (id);


--
-- Name: manufacturing_order_components manufacturing_order_components_pkey; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.manufacturing_order_components
    ADD CONSTRAINT manufacturing_order_components_pkey PRIMARY KEY (id);


--
-- Name: manufacturing_orders manufacturing_orders_order_number_key; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.manufacturing_orders
    ADD CONSTRAINT manufacturing_orders_order_number_key UNIQUE (order_number);


--
-- Name: manufacturing_orders manufacturing_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.manufacturing_orders
    ADD CONSTRAINT manufacturing_orders_pkey PRIMARY KEY (id);


--
-- Name: order_defaults order_defaults_company_id_key; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.order_defaults
    ADD CONSTRAINT order_defaults_company_id_key UNIQUE (company_id);


--
-- Name: order_defaults order_defaults_pkey; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.order_defaults
    ADD CONSTRAINT order_defaults_pkey PRIMARY KEY (id);


--
-- Name: platform_audit_logs platform_audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.platform_audit_logs
    ADD CONSTRAINT platform_audit_logs_pkey PRIMARY KEY (id);


--
-- Name: pos_cash_movements pos_cash_movements_pkey; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.pos_cash_movements
    ADD CONSTRAINT pos_cash_movements_pkey PRIMARY KEY (id);


--
-- Name: pos_defaults pos_defaults_company_id_key; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.pos_defaults
    ADD CONSTRAINT pos_defaults_company_id_key UNIQUE (company_id);


--
-- Name: pos_defaults pos_defaults_pkey; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.pos_defaults
    ADD CONSTRAINT pos_defaults_pkey PRIMARY KEY (id);


--
-- Name: pos_sessions pos_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.pos_sessions
    ADD CONSTRAINT pos_sessions_pkey PRIMARY KEY (id);


--
-- Name: pos_transaction_lines pos_transaction_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.pos_transaction_lines
    ADD CONSTRAINT pos_transaction_lines_pkey PRIMARY KEY (id);


--
-- Name: pos_transaction_types pos_transaction_types_pkey; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.pos_transaction_types
    ADD CONSTRAINT pos_transaction_types_pkey PRIMARY KEY (id);


--
-- Name: pos_transactions pos_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.pos_transactions
    ADD CONSTRAINT pos_transactions_pkey PRIMARY KEY (id);


--
-- Name: purchase_order_lines purchase_order_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.purchase_order_lines
    ADD CONSTRAINT purchase_order_lines_pkey PRIMARY KEY (id);


--
-- Name: purchase_orders purchase_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_pkey PRIMARY KEY (id);


--
-- Name: report_schedules report_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.report_schedules
    ADD CONSTRAINT report_schedules_pkey PRIMARY KEY (id);


--
-- Name: report_templates report_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.report_templates
    ADD CONSTRAINT report_templates_pkey PRIMARY KEY (id);


--
-- Name: resource_usage resource_usage_pkey; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.resource_usage
    ADD CONSTRAINT resource_usage_pkey PRIMARY KEY (id);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: sales_order_lines sales_order_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.sales_order_lines
    ADD CONSTRAINT sales_order_lines_pkey PRIMARY KEY (id);


--
-- Name: sales_orders sales_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.sales_orders
    ADD CONSTRAINT sales_orders_pkey PRIMARY KEY (id);


--
-- Name: sales_representatives sales_representatives_pkey; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.sales_representatives
    ADD CONSTRAINT sales_representatives_pkey PRIMARY KEY (id);


--
-- Name: suppliers suppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_pkey PRIMARY KEY (id);


--
-- Name: tax_types tax_types_pkey; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.tax_types
    ADD CONSTRAINT tax_types_pkey PRIMARY KEY (id);


--
-- Name: tills tills_pkey; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.tills
    ADD CONSTRAINT tills_pkey PRIMARY KEY (id);


--
-- Name: unit_of_measures unit_of_measures_pkey; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.unit_of_measures
    ADD CONSTRAINT unit_of_measures_pkey PRIMARY KEY (id);


--
-- Name: accounting_periods uq_accountingperiod_name_company; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.accounting_periods
    ADD CONSTRAINT uq_accountingperiod_name_company UNIQUE (name, company_id);


--
-- Name: ap_transactions uq_ap_doc_number_company_type; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.ap_transactions
    ADD CONSTRAINT uq_ap_doc_number_company_type UNIQUE (document_number, company_id, ap_transaction_type_id);


--
-- Name: ap_transaction_types uq_aptransactiontype_name_company; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.ap_transaction_types
    ADD CONSTRAINT uq_aptransactiontype_name_company UNIQUE (name, company_id);


--
-- Name: ar_defaults uq_ar_defaults_company_id; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.ar_defaults
    ADD CONSTRAINT uq_ar_defaults_company_id UNIQUE (company_id);


--
-- Name: ar_transactions uq_ar_doc_number_company_type; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.ar_transactions
    ADD CONSTRAINT uq_ar_doc_number_company_type UNIQUE (document_number, company_id, ar_transaction_type_id);


--
-- Name: ar_transaction_types uq_artransactiontype_name_company; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.ar_transaction_types
    ADD CONSTRAINT uq_artransactiontype_name_company UNIQUE (name, company_id);


--
-- Name: billing_configurations uq_billing_config_company; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.billing_configurations
    ADD CONSTRAINT uq_billing_config_company UNIQUE (company_id);


--
-- Name: bom_headers uq_bom_code_company; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.bom_headers
    ADD CONSTRAINT uq_bom_code_company UNIQUE (bom_code, company_id);


--
-- Name: bom_headers uq_bom_item_revision_company; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.bom_headers
    ADD CONSTRAINT uq_bom_item_revision_company UNIQUE (parent_item_id, revision, company_id);


--
-- Name: branches uq_branch_name_company; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT uq_branch_name_company UNIQUE (name, company_id);


--
-- Name: companies uq_company_code; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT uq_company_code UNIQUE (code);


--
-- Name: currencies uq_currency_code_company; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.currencies
    ADD CONSTRAINT uq_currency_code_company UNIQUE (code, company_id);


--
-- Name: customers uq_customer_code_company; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT uq_customer_code_company UNIQUE (customer_code, company_id);


--
-- Name: exchange_rate_history uq_exchange_rate_date; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.exchange_rate_history
    ADD CONSTRAINT uq_exchange_rate_date UNIQUE (currency_id, rate_date, company_id);


--
-- Name: gl_accounts uq_glaccount_code_company; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.gl_accounts
    ADD CONSTRAINT uq_glaccount_code_company UNIQUE (account_code, company_id);


--
-- Name: gl_transaction_types uq_gltransactiontype_name_company; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.gl_transaction_types
    ADD CONSTRAINT uq_gltransactiontype_name_company UNIQUE (name, company_id);


--
-- Name: inventory_items uq_inventoryitem_code_company; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.inventory_items
    ADD CONSTRAINT uq_inventoryitem_code_company UNIQUE (item_code, company_id);


--
-- Name: inventory_transaction_types uq_invtranstype_name_company; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.inventory_transaction_types
    ADD CONSTRAINT uq_invtranstype_name_company UNIQUE (name, company_id);


--
-- Name: inventory_item_locations uq_item_warehouse_company; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.inventory_item_locations
    ADD CONSTRAINT uq_item_warehouse_company UNIQUE (item_id, warehouse_id, company_id);


--
-- Name: item_barcodes uq_itembarcode_company; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.item_barcodes
    ADD CONSTRAINT uq_itembarcode_company UNIQUE (barcode, company_id);


--
-- Name: pos_transactions uq_postrans_number_company; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.pos_transactions
    ADD CONSTRAINT uq_postrans_number_company UNIQUE (transaction_number, company_id);


--
-- Name: pos_transaction_types uq_postranstype_name_company; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.pos_transaction_types
    ADD CONSTRAINT uq_postranstype_name_company UNIQUE (name, company_id);


--
-- Name: roles uq_role_name_company; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT uq_role_name_company UNIQUE (name, company_id);


--
-- Name: suppliers uq_supplier_code_company; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT uq_supplier_code_company UNIQUE (supplier_code, company_id);


--
-- Name: tax_types uq_taxtype_name_company; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.tax_types
    ADD CONSTRAINT uq_taxtype_name_company UNIQUE (name, company_id);


--
-- Name: tills uq_till_code_company; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.tills
    ADD CONSTRAINT uq_till_code_company UNIQUE (till_code, company_id);


--
-- Name: unit_of_measures uq_uom_name_company; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.unit_of_measures
    ADD CONSTRAINT uq_uom_name_company UNIQUE (name, company_id);


--
-- Name: resource_usage uq_usage_company_resource_date; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.resource_usage
    ADD CONSTRAINT uq_usage_company_resource_date UNIQUE (company_id, resource_type, usage_date);


--
-- Name: warehouses uq_warehouse_name_company; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.warehouses
    ADD CONSTRAINT uq_warehouse_name_company UNIQUE (name, company_id);


--
-- Name: ar_writeoffs uq_writeoff_document_company; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.ar_writeoffs
    ADD CONSTRAINT uq_writeoff_document_company UNIQUE (document_number, company_id);


--
-- Name: usage_alerts usage_alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.usage_alerts
    ADD CONSTRAINT usage_alerts_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (user_id, role_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: warehouses warehouses_pkey; Type: CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.warehouses
    ADD CONSTRAINT warehouses_pkey PRIMARY KEY (id);


--
-- Name: idx_billing_transaction_company_period; Type: INDEX; Schema: public; Owner: Biwi_user
--

CREATE INDEX idx_billing_transaction_company_period ON public.billing_transactions USING btree (company_id, billing_period);


--
-- Name: idx_platform_audit_logs_company_id; Type: INDEX; Schema: public; Owner: Biwi_user
--

CREATE INDEX idx_platform_audit_logs_company_id ON public.platform_audit_logs USING btree (company_id);


--
-- Name: idx_platform_audit_logs_timestamp; Type: INDEX; Schema: public; Owner: Biwi_user
--

CREATE INDEX idx_platform_audit_logs_timestamp ON public.platform_audit_logs USING btree ("timestamp");


--
-- Name: idx_platform_audit_logs_user_id; Type: INDEX; Schema: public; Owner: Biwi_user
--

CREATE INDEX idx_platform_audit_logs_user_id ON public.platform_audit_logs USING btree (user_id);


--
-- Name: idx_resource_usage_billing_period; Type: INDEX; Schema: public; Owner: Biwi_user
--

CREATE INDEX idx_resource_usage_billing_period ON public.resource_usage USING btree (billing_period);


--
-- Name: idx_resource_usage_company_date; Type: INDEX; Schema: public; Owner: Biwi_user
--

CREATE INDEX idx_resource_usage_company_date ON public.resource_usage USING btree (company_id, usage_date);


--
-- Name: ix_accounting_periods_id; Type: INDEX; Schema: public; Owner: Biwi_user
--

CREATE INDEX ix_accounting_periods_id ON public.accounting_periods USING btree (id);


--
-- Name: ix_ap_allocation_lines_id; Type: INDEX; Schema: public; Owner: Biwi_user
--

CREATE INDEX ix_ap_allocation_lines_id ON public.ap_allocation_lines USING btree (id);


--
-- Name: ix_ap_allocations_id; Type: INDEX; Schema: public; Owner: Biwi_user
--

CREATE INDEX ix_ap_allocations_id ON public.ap_allocations USING btree (id);


--
-- Name: ix_ap_defaults_id; Type: INDEX; Schema: public; Owner: Biwi_user
--

CREATE INDEX ix_ap_defaults_id ON public.ap_defaults USING btree (id);


--
-- Name: ix_ap_transaction_types_id; Type: INDEX; Schema: public; Owner: Biwi_user
--

CREATE INDEX ix_ap_transaction_types_id ON public.ap_transaction_types USING btree (id);


--
-- Name: ix_ap_transactions_id; Type: INDEX; Schema: public; Owner: Biwi_user
--

CREATE INDEX ix_ap_transactions_id ON public.ap_transactions USING btree (id);


--
-- Name: ix_ar_allocation_lines_id; Type: INDEX; Schema: public; Owner: Biwi_user
--

CREATE INDEX ix_ar_allocation_lines_id ON public.ar_allocation_lines USING btree (id);


--
-- Name: ix_ar_allocations_id; Type: INDEX; Schema: public; Owner: Biwi_user
--

CREATE INDEX ix_ar_allocations_id ON public.ar_allocations USING btree (id);


--
-- Name: ix_ar_defaults_id; Type: INDEX; Schema: public; Owner: Biwi_user
--

CREATE INDEX ix_ar_defaults_id ON public.ar_defaults USING btree (id);


--
-- Name: ix_ar_transaction_types_id; Type: INDEX; Schema: public; Owner: Biwi_user
--

CREATE INDEX ix_ar_transaction_types_id ON public.ar_transaction_types USING btree (id);


--
-- Name: ix_ar_transactions_id; Type: INDEX; Schema: public; Owner: Biwi_user
--

CREATE INDEX ix_ar_transactions_id ON public.ar_transactions USING btree (id);


--
-- Name: ix_ar_writeoffs_id; Type: INDEX; Schema: public; Owner: Biwi_user
--

CREATE INDEX ix_ar_writeoffs_id ON public.ar_writeoffs USING btree (id);


--
-- Name: ix_bank_reconciliation_items_id; Type: INDEX; Schema: public; Owner: Biwi_user
--

CREATE INDEX ix_bank_reconciliation_items_id ON public.bank_reconciliation_items USING btree (id);


--
-- Name: ix_bank_reconciliations_id; Type: INDEX; Schema: public; Owner: Biwi_user
--

CREATE INDEX ix_bank_reconciliations_id ON public.bank_reconciliations USING btree (id);


--
-- Name: ix_bom_components_id; Type: INDEX; Schema: public; Owner: Biwi_user
--

CREATE INDEX ix_bom_components_id ON public.bom_components USING btree (id);


--
-- Name: ix_bom_defaults_id; Type: INDEX; Schema: public; Owner: Biwi_user
--

CREATE INDEX ix_bom_defaults_id ON public.bom_defaults USING btree (id);


--
-- Name: ix_bom_headers_id; Type: INDEX; Schema: public; Owner: Biwi_user
--

CREATE INDEX ix_bom_headers_id ON public.bom_headers USING btree (id);


--
-- Name: ix_branches_id; Type: INDEX; Schema: public; Owner: Biwi_user
--

CREATE INDEX ix_branches_id ON public.branches USING btree (id);


--
-- Name: ix_companies_id; Type: INDEX; Schema: public; Owner: Biwi_user
--

CREATE INDEX ix_companies_id ON public.companies USING btree (id);


--
-- Name: ix_companies_name; Type: INDEX; Schema: public; Owner: Biwi_user
--

CREATE UNIQUE INDEX ix_companies_name ON public.companies USING btree (name);


--
-- Name: ix_currencies_id; Type: INDEX; Schema: public; Owner: Biwi_user
--

CREATE INDEX ix_currencies_id ON public.currencies USING btree (id);


--
-- Name: ix_customers_customer_code; Type: INDEX; Schema: public; Owner: Biwi_user
--

CREATE UNIQUE INDEX ix_customers_customer_code ON public.customers USING btree (customer_code);


--
-- Name: ix_customers_id; Type: INDEX; Schema: public; Owner: Biwi_user
--

CREATE INDEX ix_customers_id ON public.customers USING btree (id);


--
-- Name: ix_gl_accounts_account_code; Type: INDEX; Schema: public; Owner: Biwi_user
--

CREATE INDEX ix_gl_accounts_account_code ON public.gl_accounts USING btree (account_code);


--
-- Name: ix_gl_accounts_id; Type: INDEX; Schema: public; Owner: Biwi_user
--

CREATE INDEX ix_gl_accounts_id ON public.gl_accounts USING btree (id);


--
-- Name: ix_gl_defaults_id; Type: INDEX; Schema: public; Owner: Biwi_user
--

CREATE INDEX ix_gl_defaults_id ON public.gl_defaults USING btree (id);


--
-- Name: ix_gl_journal_entries_id; Type: INDEX; Schema: public; Owner: Biwi_user
--

CREATE INDEX ix_gl_journal_entries_id ON public.gl_journal_entries USING btree (id);


--
-- Name: ix_gl_journal_entry_lines_id; Type: INDEX; Schema: public; Owner: Biwi_user
--

CREATE INDEX ix_gl_journal_entry_lines_id ON public.gl_journal_entry_lines USING btree (id);


--
-- Name: ix_gl_transaction_types_id; Type: INDEX; Schema: public; Owner: Biwi_user
--

CREATE INDEX ix_gl_transaction_types_id ON public.gl_transaction_types USING btree (id);


--
-- Name: ix_goods_received_voucher_lines_id; Type: INDEX; Schema: public; Owner: Biwi_user
--

CREATE INDEX ix_goods_received_voucher_lines_id ON public.goods_received_voucher_lines USING btree (id);


--
-- Name: ix_goods_received_vouchers_id; Type: INDEX; Schema: public; Owner: Biwi_user
--

CREATE INDEX ix_goods_received_vouchers_id ON public.goods_received_vouchers USING btree (id);


--
-- Name: ix_inventory_count_lines_id; Type: INDEX; Schema: public; Owner: Biwi_user
--

CREATE INDEX ix_inventory_count_lines_id ON public.inventory_count_lines USING btree (id);


--
-- Name: ix_inventory_count_sessions_id; Type: INDEX; Schema: public; Owner: Biwi_user
--

CREATE INDEX ix_inventory_count_sessions_id ON public.inventory_count_sessions USING btree (id);


--
-- Name: ix_inventory_defaults_id; Type: INDEX; Schema: public; Owner: Biwi_user
--

CREATE INDEX ix_inventory_defaults_id ON public.inventory_defaults USING btree (id);


--
-- Name: ix_inventory_item_locations_id; Type: INDEX; Schema: public; Owner: Biwi_user
--

CREATE INDEX ix_inventory_item_locations_id ON public.inventory_item_locations USING btree (id);


--
-- Name: ix_inventory_items_id; Type: INDEX; Schema: public; Owner: Biwi_user
--

CREATE INDEX ix_inventory_items_id ON public.inventory_items USING btree (id);


--
-- Name: ix_inventory_transaction_types_id; Type: INDEX; Schema: public; Owner: Biwi_user
--

CREATE INDEX ix_inventory_transaction_types_id ON public.inventory_transaction_types USING btree (id);


--
-- Name: ix_inventory_transactions_id; Type: INDEX; Schema: public; Owner: Biwi_user
--

CREATE INDEX ix_inventory_transactions_id ON public.inventory_transactions USING btree (id);


--
-- Name: ix_item_barcodes_id; Type: INDEX; Schema: public; Owner: Biwi_user
--

CREATE INDEX ix_item_barcodes_id ON public.item_barcodes USING btree (id);


--
-- Name: ix_manufacturing_order_components_id; Type: INDEX; Schema: public; Owner: Biwi_user
--

CREATE INDEX ix_manufacturing_order_components_id ON public.manufacturing_order_components USING btree (id);


--
-- Name: ix_manufacturing_orders_id; Type: INDEX; Schema: public; Owner: Biwi_user
--

CREATE INDEX ix_manufacturing_orders_id ON public.manufacturing_orders USING btree (id);


--
-- Name: ix_order_defaults_id; Type: INDEX; Schema: public; Owner: Biwi_user
--

CREATE INDEX ix_order_defaults_id ON public.order_defaults USING btree (id);


--
-- Name: ix_pos_cash_movements_id; Type: INDEX; Schema: public; Owner: Biwi_user
--

CREATE INDEX ix_pos_cash_movements_id ON public.pos_cash_movements USING btree (id);


--
-- Name: ix_pos_defaults_id; Type: INDEX; Schema: public; Owner: Biwi_user
--

CREATE INDEX ix_pos_defaults_id ON public.pos_defaults USING btree (id);


--
-- Name: ix_pos_sessions_id; Type: INDEX; Schema: public; Owner: Biwi_user
--

CREATE INDEX ix_pos_sessions_id ON public.pos_sessions USING btree (id);


--
-- Name: ix_pos_transaction_lines_id; Type: INDEX; Schema: public; Owner: Biwi_user
--

CREATE INDEX ix_pos_transaction_lines_id ON public.pos_transaction_lines USING btree (id);


--
-- Name: ix_pos_transaction_types_id; Type: INDEX; Schema: public; Owner: Biwi_user
--

CREATE INDEX ix_pos_transaction_types_id ON public.pos_transaction_types USING btree (id);


--
-- Name: ix_pos_transactions_id; Type: INDEX; Schema: public; Owner: Biwi_user
--

CREATE INDEX ix_pos_transactions_id ON public.pos_transactions USING btree (id);


--
-- Name: ix_purchase_order_lines_id; Type: INDEX; Schema: public; Owner: Biwi_user
--

CREATE INDEX ix_purchase_order_lines_id ON public.purchase_order_lines USING btree (id);


--
-- Name: ix_purchase_orders_id; Type: INDEX; Schema: public; Owner: Biwi_user
--

CREATE INDEX ix_purchase_orders_id ON public.purchase_orders USING btree (id);


--
-- Name: ix_report_schedules_id; Type: INDEX; Schema: public; Owner: Biwi_user
--

CREATE INDEX ix_report_schedules_id ON public.report_schedules USING btree (id);


--
-- Name: ix_report_templates_id; Type: INDEX; Schema: public; Owner: Biwi_user
--

CREATE INDEX ix_report_templates_id ON public.report_templates USING btree (id);


--
-- Name: ix_roles_id; Type: INDEX; Schema: public; Owner: Biwi_user
--

CREATE INDEX ix_roles_id ON public.roles USING btree (id);


--
-- Name: ix_roles_name; Type: INDEX; Schema: public; Owner: Biwi_user
--

CREATE INDEX ix_roles_name ON public.roles USING btree (name);


--
-- Name: ix_sales_order_lines_id; Type: INDEX; Schema: public; Owner: Biwi_user
--

CREATE INDEX ix_sales_order_lines_id ON public.sales_order_lines USING btree (id);


--
-- Name: ix_sales_orders_id; Type: INDEX; Schema: public; Owner: Biwi_user
--

CREATE INDEX ix_sales_orders_id ON public.sales_orders USING btree (id);


--
-- Name: ix_sales_representatives_id; Type: INDEX; Schema: public; Owner: Biwi_user
--

CREATE INDEX ix_sales_representatives_id ON public.sales_representatives USING btree (id);


--
-- Name: ix_suppliers_id; Type: INDEX; Schema: public; Owner: Biwi_user
--

CREATE INDEX ix_suppliers_id ON public.suppliers USING btree (id);


--
-- Name: ix_suppliers_supplier_code; Type: INDEX; Schema: public; Owner: Biwi_user
--

CREATE UNIQUE INDEX ix_suppliers_supplier_code ON public.suppliers USING btree (supplier_code);


--
-- Name: ix_tax_types_id; Type: INDEX; Schema: public; Owner: Biwi_user
--

CREATE INDEX ix_tax_types_id ON public.tax_types USING btree (id);


--
-- Name: ix_tills_id; Type: INDEX; Schema: public; Owner: Biwi_user
--

CREATE INDEX ix_tills_id ON public.tills USING btree (id);


--
-- Name: ix_unit_of_measures_id; Type: INDEX; Schema: public; Owner: Biwi_user
--

CREATE INDEX ix_unit_of_measures_id ON public.unit_of_measures USING btree (id);


--
-- Name: ix_users_email; Type: INDEX; Schema: public; Owner: Biwi_user
--

CREATE UNIQUE INDEX ix_users_email ON public.users USING btree (email);


--
-- Name: ix_users_id; Type: INDEX; Schema: public; Owner: Biwi_user
--

CREATE INDEX ix_users_id ON public.users USING btree (id);


--
-- Name: ix_warehouses_id; Type: INDEX; Schema: public; Owner: Biwi_user
--

CREATE INDEX ix_warehouses_id ON public.warehouses USING btree (id);


--
-- Name: accounting_periods accounting_periods_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.accounting_periods
    ADD CONSTRAINT accounting_periods_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: ap_allocation_lines ap_allocation_lines_ap_allocation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.ap_allocation_lines
    ADD CONSTRAINT ap_allocation_lines_ap_allocation_id_fkey FOREIGN KEY (ap_allocation_id) REFERENCES public.ap_allocations(id);


--
-- Name: ap_allocation_lines ap_allocation_lines_credit_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.ap_allocation_lines
    ADD CONSTRAINT ap_allocation_lines_credit_transaction_id_fkey FOREIGN KEY (credit_transaction_id) REFERENCES public.ap_transactions(id);


--
-- Name: ap_allocation_lines ap_allocation_lines_debit_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.ap_allocation_lines
    ADD CONSTRAINT ap_allocation_lines_debit_transaction_id_fkey FOREIGN KEY (debit_transaction_id) REFERENCES public.ap_transactions(id);


--
-- Name: ap_allocations ap_allocations_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.ap_allocations
    ADD CONSTRAINT ap_allocations_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: ap_allocations ap_allocations_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.ap_allocations
    ADD CONSTRAINT ap_allocations_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);


--
-- Name: ap_defaults ap_defaults_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.ap_defaults
    ADD CONSTRAINT ap_defaults_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: ap_defaults ap_defaults_default_ap_control_gl_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.ap_defaults
    ADD CONSTRAINT ap_defaults_default_ap_control_gl_account_id_fkey FOREIGN KEY (default_ap_control_gl_account_id) REFERENCES public.gl_accounts(id);


--
-- Name: ap_defaults ap_defaults_default_expense_gl_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.ap_defaults
    ADD CONSTRAINT ap_defaults_default_expense_gl_account_id_fkey FOREIGN KEY (default_expense_gl_account_id) REFERENCES public.gl_accounts(id);


--
-- Name: ap_defaults ap_defaults_default_payment_gl_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.ap_defaults
    ADD CONSTRAINT ap_defaults_default_payment_gl_account_id_fkey FOREIGN KEY (default_payment_gl_account_id) REFERENCES public.gl_accounts(id);


--
-- Name: ap_defaults ap_defaults_default_purchase_discount_gl_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.ap_defaults
    ADD CONSTRAINT ap_defaults_default_purchase_discount_gl_account_id_fkey FOREIGN KEY (default_purchase_discount_gl_account_id) REFERENCES public.gl_accounts(id);


--
-- Name: ap_transaction_tax_lines ap_transaction_tax_lines_ap_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.ap_transaction_tax_lines
    ADD CONSTRAINT ap_transaction_tax_lines_ap_transaction_id_fkey FOREIGN KEY (ap_transaction_id) REFERENCES public.ap_transactions(id);


--
-- Name: ap_transaction_tax_lines ap_transaction_tax_lines_tax_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.ap_transaction_tax_lines
    ADD CONSTRAINT ap_transaction_tax_lines_tax_type_id_fkey FOREIGN KEY (tax_type_id) REFERENCES public.tax_types(id);


--
-- Name: ap_transaction_types ap_transaction_types_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.ap_transaction_types
    ADD CONSTRAINT ap_transaction_types_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: ap_transaction_types ap_transaction_types_default_ap_control_gl_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.ap_transaction_types
    ADD CONSTRAINT ap_transaction_types_default_ap_control_gl_account_id_fkey FOREIGN KEY (default_ap_control_gl_account_id) REFERENCES public.gl_accounts(id);


--
-- Name: ap_transaction_types ap_transaction_types_default_gl_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.ap_transaction_types
    ADD CONSTRAINT ap_transaction_types_default_gl_account_id_fkey FOREIGN KEY (default_gl_account_id) REFERENCES public.gl_accounts(id);


--
-- Name: ap_transactions ap_transactions_ap_transaction_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.ap_transactions
    ADD CONSTRAINT ap_transactions_ap_transaction_type_id_fkey FOREIGN KEY (ap_transaction_type_id) REFERENCES public.ap_transaction_types(id);


--
-- Name: ap_transactions ap_transactions_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.ap_transactions
    ADD CONSTRAINT ap_transactions_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: ap_transactions ap_transactions_currency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.ap_transactions
    ADD CONSTRAINT ap_transactions_currency_id_fkey FOREIGN KEY (currency_id) REFERENCES public.currencies(id);


--
-- Name: ap_transactions ap_transactions_linked_gl_journal_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.ap_transactions
    ADD CONSTRAINT ap_transactions_linked_gl_journal_entry_id_fkey FOREIGN KEY (linked_gl_journal_entry_id) REFERENCES public.gl_journal_entries(id);


--
-- Name: ap_transactions ap_transactions_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.ap_transactions
    ADD CONSTRAINT ap_transactions_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);


--
-- Name: ar_allocation_lines ar_allocation_lines_ar_allocation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.ar_allocation_lines
    ADD CONSTRAINT ar_allocation_lines_ar_allocation_id_fkey FOREIGN KEY (ar_allocation_id) REFERENCES public.ar_allocations(id);


--
-- Name: ar_allocation_lines ar_allocation_lines_credit_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.ar_allocation_lines
    ADD CONSTRAINT ar_allocation_lines_credit_transaction_id_fkey FOREIGN KEY (credit_transaction_id) REFERENCES public.ar_transactions(id);


--
-- Name: ar_allocation_lines ar_allocation_lines_debit_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.ar_allocation_lines
    ADD CONSTRAINT ar_allocation_lines_debit_transaction_id_fkey FOREIGN KEY (debit_transaction_id) REFERENCES public.ar_transactions(id);


--
-- Name: ar_allocations ar_allocations_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.ar_allocations
    ADD CONSTRAINT ar_allocations_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: ar_allocations ar_allocations_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.ar_allocations
    ADD CONSTRAINT ar_allocations_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: ar_defaults ar_defaults_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.ar_defaults
    ADD CONSTRAINT ar_defaults_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: ar_defaults ar_defaults_default_ar_control_gl_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.ar_defaults
    ADD CONSTRAINT ar_defaults_default_ar_control_gl_account_id_fkey FOREIGN KEY (default_ar_control_gl_account_id) REFERENCES public.gl_accounts(id);


--
-- Name: ar_defaults ar_defaults_default_bad_debt_gl_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.ar_defaults
    ADD CONSTRAINT ar_defaults_default_bad_debt_gl_account_id_fkey FOREIGN KEY (default_bad_debt_gl_account_id) REFERENCES public.gl_accounts(id);


--
-- Name: ar_defaults ar_defaults_default_receipt_gl_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.ar_defaults
    ADD CONSTRAINT ar_defaults_default_receipt_gl_account_id_fkey FOREIGN KEY (default_receipt_gl_account_id) REFERENCES public.gl_accounts(id);


--
-- Name: ar_defaults ar_defaults_default_sales_discount_gl_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.ar_defaults
    ADD CONSTRAINT ar_defaults_default_sales_discount_gl_account_id_fkey FOREIGN KEY (default_sales_discount_gl_account_id) REFERENCES public.gl_accounts(id);


--
-- Name: ar_defaults ar_defaults_default_sales_gl_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.ar_defaults
    ADD CONSTRAINT ar_defaults_default_sales_gl_account_id_fkey FOREIGN KEY (default_sales_gl_account_id) REFERENCES public.gl_accounts(id);


--
-- Name: ar_transaction_tax_lines ar_transaction_tax_lines_ar_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.ar_transaction_tax_lines
    ADD CONSTRAINT ar_transaction_tax_lines_ar_transaction_id_fkey FOREIGN KEY (ar_transaction_id) REFERENCES public.ar_transactions(id);


--
-- Name: ar_transaction_tax_lines ar_transaction_tax_lines_tax_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.ar_transaction_tax_lines
    ADD CONSTRAINT ar_transaction_tax_lines_tax_type_id_fkey FOREIGN KEY (tax_type_id) REFERENCES public.tax_types(id);


--
-- Name: ar_transaction_types ar_transaction_types_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.ar_transaction_types
    ADD CONSTRAINT ar_transaction_types_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: ar_transaction_types ar_transaction_types_default_ar_control_gl_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.ar_transaction_types
    ADD CONSTRAINT ar_transaction_types_default_ar_control_gl_account_id_fkey FOREIGN KEY (default_ar_control_gl_account_id) REFERENCES public.gl_accounts(id);


--
-- Name: ar_transaction_types ar_transaction_types_default_gl_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.ar_transaction_types
    ADD CONSTRAINT ar_transaction_types_default_gl_account_id_fkey FOREIGN KEY (default_gl_account_id) REFERENCES public.gl_accounts(id);


--
-- Name: ar_transactions ar_transactions_ar_transaction_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.ar_transactions
    ADD CONSTRAINT ar_transactions_ar_transaction_type_id_fkey FOREIGN KEY (ar_transaction_type_id) REFERENCES public.ar_transaction_types(id);


--
-- Name: ar_transactions ar_transactions_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.ar_transactions
    ADD CONSTRAINT ar_transactions_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: ar_transactions ar_transactions_currency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.ar_transactions
    ADD CONSTRAINT ar_transactions_currency_id_fkey FOREIGN KEY (currency_id) REFERENCES public.currencies(id);


--
-- Name: ar_transactions ar_transactions_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.ar_transactions
    ADD CONSTRAINT ar_transactions_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: ar_transactions ar_transactions_linked_gl_journal_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.ar_transactions
    ADD CONSTRAINT ar_transactions_linked_gl_journal_entry_id_fkey FOREIGN KEY (linked_gl_journal_entry_id) REFERENCES public.gl_journal_entries(id);


--
-- Name: ar_writeoffs ar_writeoffs_approved_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.ar_writeoffs
    ADD CONSTRAINT ar_writeoffs_approved_by_user_id_fkey FOREIGN KEY (approved_by_user_id) REFERENCES public.users(id);


--
-- Name: ar_writeoffs ar_writeoffs_ar_transaction_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.ar_writeoffs
    ADD CONSTRAINT ar_writeoffs_ar_transaction_type_id_fkey FOREIGN KEY (ar_transaction_type_id) REFERENCES public.ar_transaction_types(id);


--
-- Name: ar_writeoffs ar_writeoffs_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.ar_writeoffs
    ADD CONSTRAINT ar_writeoffs_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: ar_writeoffs ar_writeoffs_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.ar_writeoffs
    ADD CONSTRAINT ar_writeoffs_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: ar_writeoffs ar_writeoffs_linked_gl_journal_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.ar_writeoffs
    ADD CONSTRAINT ar_writeoffs_linked_gl_journal_entry_id_fkey FOREIGN KEY (linked_gl_journal_entry_id) REFERENCES public.gl_journal_entries(id);


--
-- Name: ar_writeoffs ar_writeoffs_original_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.ar_writeoffs
    ADD CONSTRAINT ar_writeoffs_original_invoice_id_fkey FOREIGN KEY (original_invoice_id) REFERENCES public.ar_transactions(id);


--
-- Name: ar_writeoffs ar_writeoffs_requested_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.ar_writeoffs
    ADD CONSTRAINT ar_writeoffs_requested_by_user_id_fkey FOREIGN KEY (requested_by_user_id) REFERENCES public.users(id);


--
-- Name: bank_reconciliation_items bank_reconciliation_items_bank_reconciliation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.bank_reconciliation_items
    ADD CONSTRAINT bank_reconciliation_items_bank_reconciliation_id_fkey FOREIGN KEY (bank_reconciliation_id) REFERENCES public.bank_reconciliations(id);


--
-- Name: bank_reconciliation_items bank_reconciliation_items_gl_journal_entry_line_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.bank_reconciliation_items
    ADD CONSTRAINT bank_reconciliation_items_gl_journal_entry_line_id_fkey FOREIGN KEY (gl_journal_entry_line_id) REFERENCES public.gl_journal_entry_lines(id);


--
-- Name: bank_reconciliations bank_reconciliations_bank_gl_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.bank_reconciliations
    ADD CONSTRAINT bank_reconciliations_bank_gl_account_id_fkey FOREIGN KEY (bank_gl_account_id) REFERENCES public.gl_accounts(id);


--
-- Name: bank_reconciliations bank_reconciliations_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.bank_reconciliations
    ADD CONSTRAINT bank_reconciliations_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: bank_reconciliations bank_reconciliations_created_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.bank_reconciliations
    ADD CONSTRAINT bank_reconciliations_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.users(id);


--
-- Name: billing_configurations billing_configurations_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.billing_configurations
    ADD CONSTRAINT billing_configurations_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: billing_transactions billing_transactions_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.billing_transactions
    ADD CONSTRAINT billing_transactions_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: bom_components bom_components_bom_header_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.bom_components
    ADD CONSTRAINT bom_components_bom_header_id_fkey FOREIGN KEY (bom_header_id) REFERENCES public.bom_headers(id);


--
-- Name: bom_components bom_components_component_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.bom_components
    ADD CONSTRAINT bom_components_component_item_id_fkey FOREIGN KEY (component_item_id) REFERENCES public.inventory_items(id);


--
-- Name: bom_components bom_components_unit_of_measure_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.bom_components
    ADD CONSTRAINT bom_components_unit_of_measure_id_fkey FOREIGN KEY (unit_of_measure_id) REFERENCES public.unit_of_measures(id);


--
-- Name: bom_defaults bom_defaults_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.bom_defaults
    ADD CONSTRAINT bom_defaults_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: bom_defaults bom_defaults_default_manufacturing_overhead_gl_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.bom_defaults
    ADD CONSTRAINT bom_defaults_default_manufacturing_overhead_gl_account_id_fkey FOREIGN KEY (default_manufacturing_overhead_gl_account_id) REFERENCES public.gl_accounts(id);


--
-- Name: bom_defaults bom_defaults_default_material_usage_gl_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.bom_defaults
    ADD CONSTRAINT bom_defaults_default_material_usage_gl_account_id_fkey FOREIGN KEY (default_material_usage_gl_account_id) REFERENCES public.gl_accounts(id);


--
-- Name: bom_defaults bom_defaults_default_scrap_gl_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.bom_defaults
    ADD CONSTRAINT bom_defaults_default_scrap_gl_account_id_fkey FOREIGN KEY (default_scrap_gl_account_id) REFERENCES public.gl_accounts(id);


--
-- Name: bom_defaults bom_defaults_default_wip_gl_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.bom_defaults
    ADD CONSTRAINT bom_defaults_default_wip_gl_account_id_fkey FOREIGN KEY (default_wip_gl_account_id) REFERENCES public.gl_accounts(id);


--
-- Name: bom_headers bom_headers_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.bom_headers
    ADD CONSTRAINT bom_headers_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: bom_headers bom_headers_parent_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.bom_headers
    ADD CONSTRAINT bom_headers_parent_item_id_fkey FOREIGN KEY (parent_item_id) REFERENCES public.inventory_items(id);


--
-- Name: bom_headers bom_headers_unit_of_measure_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.bom_headers
    ADD CONSTRAINT bom_headers_unit_of_measure_id_fkey FOREIGN KEY (unit_of_measure_id) REFERENCES public.unit_of_measures(id);


--
-- Name: branches branches_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: currencies currencies_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.currencies
    ADD CONSTRAINT currencies_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: customers customers_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: customers customers_default_ar_gl_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_default_ar_gl_account_id_fkey FOREIGN KEY (default_ar_gl_account_id) REFERENCES public.gl_accounts(id);


--
-- Name: customers customers_default_currency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_default_currency_id_fkey FOREIGN KEY (default_currency_id) REFERENCES public.currencies(id);


--
-- Name: customers customers_sales_representative_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_sales_representative_id_fkey FOREIGN KEY (sales_representative_id) REFERENCES public.sales_representatives(id);


--
-- Name: exchange_rate_history exchange_rate_history_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.exchange_rate_history
    ADD CONSTRAINT exchange_rate_history_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: exchange_rate_history exchange_rate_history_currency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.exchange_rate_history
    ADD CONSTRAINT exchange_rate_history_currency_id_fkey FOREIGN KEY (currency_id) REFERENCES public.currencies(id);


--
-- Name: companies fk_companies_created_by_user; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT fk_companies_created_by_user FOREIGN KEY (created_by_user_id) REFERENCES public.users(id);


--
-- Name: users fk_users_default_company; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk_users_default_company FOREIGN KEY (default_company_id) REFERENCES public.companies(id);


--
-- Name: forex_gain_loss forex_gain_loss_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.forex_gain_loss
    ADD CONSTRAINT forex_gain_loss_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: forex_gain_loss forex_gain_loss_gl_journal_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.forex_gain_loss
    ADD CONSTRAINT forex_gain_loss_gl_journal_entry_id_fkey FOREIGN KEY (gl_journal_entry_id) REFERENCES public.gl_journal_entries(id);


--
-- Name: gl_accounts gl_accounts_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.gl_accounts
    ADD CONSTRAINT gl_accounts_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: gl_accounts gl_accounts_parent_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.gl_accounts
    ADD CONSTRAINT gl_accounts_parent_account_id_fkey FOREIGN KEY (parent_account_id) REFERENCES public.gl_accounts(id);


--
-- Name: gl_defaults gl_defaults_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.gl_defaults
    ADD CONSTRAINT gl_defaults_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: gl_defaults gl_defaults_default_ap_control_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.gl_defaults
    ADD CONSTRAINT gl_defaults_default_ap_control_account_id_fkey FOREIGN KEY (default_ap_control_account_id) REFERENCES public.gl_accounts(id);


--
-- Name: gl_defaults gl_defaults_default_ar_control_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.gl_defaults
    ADD CONSTRAINT gl_defaults_default_ar_control_account_id_fkey FOREIGN KEY (default_ar_control_account_id) REFERENCES public.gl_accounts(id);


--
-- Name: gl_defaults gl_defaults_default_cash_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.gl_defaults
    ADD CONSTRAINT gl_defaults_default_cash_account_id_fkey FOREIGN KEY (default_cash_account_id) REFERENCES public.gl_accounts(id);


--
-- Name: gl_defaults gl_defaults_forex_gain_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.gl_defaults
    ADD CONSTRAINT gl_defaults_forex_gain_account_id_fkey FOREIGN KEY (forex_gain_account_id) REFERENCES public.gl_accounts(id);


--
-- Name: gl_defaults gl_defaults_forex_loss_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.gl_defaults
    ADD CONSTRAINT gl_defaults_forex_loss_account_id_fkey FOREIGN KEY (forex_loss_account_id) REFERENCES public.gl_accounts(id);


--
-- Name: gl_defaults gl_defaults_retained_earnings_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.gl_defaults
    ADD CONSTRAINT gl_defaults_retained_earnings_account_id_fkey FOREIGN KEY (retained_earnings_account_id) REFERENCES public.gl_accounts(id);


--
-- Name: gl_journal_entries gl_journal_entries_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.gl_journal_entries
    ADD CONSTRAINT gl_journal_entries_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: gl_journal_entries gl_journal_entries_posted_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.gl_journal_entries
    ADD CONSTRAINT gl_journal_entries_posted_by_user_id_fkey FOREIGN KEY (posted_by_user_id) REFERENCES public.users(id);


--
-- Name: gl_journal_entry_lines gl_journal_entry_lines_currency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.gl_journal_entry_lines
    ADD CONSTRAINT gl_journal_entry_lines_currency_id_fkey FOREIGN KEY (currency_id) REFERENCES public.currencies(id);


--
-- Name: gl_journal_entry_lines gl_journal_entry_lines_gl_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.gl_journal_entry_lines
    ADD CONSTRAINT gl_journal_entry_lines_gl_account_id_fkey FOREIGN KEY (gl_account_id) REFERENCES public.gl_accounts(id);


--
-- Name: gl_journal_entry_lines gl_journal_entry_lines_journal_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.gl_journal_entry_lines
    ADD CONSTRAINT gl_journal_entry_lines_journal_entry_id_fkey FOREIGN KEY (journal_entry_id) REFERENCES public.gl_journal_entries(id);


--
-- Name: gl_transaction_types gl_transaction_types_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.gl_transaction_types
    ADD CONSTRAINT gl_transaction_types_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: gl_transaction_types gl_transaction_types_default_credit_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.gl_transaction_types
    ADD CONSTRAINT gl_transaction_types_default_credit_account_id_fkey FOREIGN KEY (default_credit_account_id) REFERENCES public.gl_accounts(id);


--
-- Name: gl_transaction_types gl_transaction_types_default_debit_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.gl_transaction_types
    ADD CONSTRAINT gl_transaction_types_default_debit_account_id_fkey FOREIGN KEY (default_debit_account_id) REFERENCES public.gl_accounts(id);


--
-- Name: goods_received_voucher_lines goods_received_voucher_lines_grv_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.goods_received_voucher_lines
    ADD CONSTRAINT goods_received_voucher_lines_grv_id_fkey FOREIGN KEY (grv_id) REFERENCES public.goods_received_vouchers(id);


--
-- Name: goods_received_voucher_lines goods_received_voucher_lines_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.goods_received_voucher_lines
    ADD CONSTRAINT goods_received_voucher_lines_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.inventory_items(id);


--
-- Name: goods_received_voucher_lines goods_received_voucher_lines_purchase_order_line_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.goods_received_voucher_lines
    ADD CONSTRAINT goods_received_voucher_lines_purchase_order_line_id_fkey FOREIGN KEY (purchase_order_line_id) REFERENCES public.purchase_order_lines(id);


--
-- Name: goods_received_vouchers goods_received_vouchers_ap_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.goods_received_vouchers
    ADD CONSTRAINT goods_received_vouchers_ap_invoice_id_fkey FOREIGN KEY (ap_invoice_id) REFERENCES public.ap_transactions(id);


--
-- Name: goods_received_vouchers goods_received_vouchers_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.goods_received_vouchers
    ADD CONSTRAINT goods_received_vouchers_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: goods_received_vouchers goods_received_vouchers_purchase_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.goods_received_vouchers
    ADD CONSTRAINT goods_received_vouchers_purchase_order_id_fkey FOREIGN KEY (purchase_order_id) REFERENCES public.purchase_orders(id);


--
-- Name: goods_received_vouchers goods_received_vouchers_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.goods_received_vouchers
    ADD CONSTRAINT goods_received_vouchers_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);


--
-- Name: inventory_count_lines inventory_count_lines_inventory_count_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.inventory_count_lines
    ADD CONSTRAINT inventory_count_lines_inventory_count_session_id_fkey FOREIGN KEY (inventory_count_session_id) REFERENCES public.inventory_count_sessions(id);


--
-- Name: inventory_count_lines inventory_count_lines_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.inventory_count_lines
    ADD CONSTRAINT inventory_count_lines_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.inventory_items(id);


--
-- Name: inventory_count_sessions inventory_count_sessions_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.inventory_count_sessions
    ADD CONSTRAINT inventory_count_sessions_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: inventory_count_sessions inventory_count_sessions_warehouse_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.inventory_count_sessions
    ADD CONSTRAINT inventory_count_sessions_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES public.warehouses(id);


--
-- Name: inventory_defaults inventory_defaults_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.inventory_defaults
    ADD CONSTRAINT inventory_defaults_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: inventory_defaults inventory_defaults_default_cogs_gl_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.inventory_defaults
    ADD CONSTRAINT inventory_defaults_default_cogs_gl_account_id_fkey FOREIGN KEY (default_cogs_gl_account_id) REFERENCES public.gl_accounts(id);


--
-- Name: inventory_defaults inventory_defaults_default_inventory_adjustment_gl_account_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.inventory_defaults
    ADD CONSTRAINT inventory_defaults_default_inventory_adjustment_gl_account_fkey FOREIGN KEY (default_inventory_adjustment_gl_account_id) REFERENCES public.gl_accounts(id);


--
-- Name: inventory_defaults inventory_defaults_default_inventory_gl_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.inventory_defaults
    ADD CONSTRAINT inventory_defaults_default_inventory_gl_account_id_fkey FOREIGN KEY (default_inventory_gl_account_id) REFERENCES public.gl_accounts(id);


--
-- Name: inventory_defaults inventory_defaults_default_sales_revenue_gl_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.inventory_defaults
    ADD CONSTRAINT inventory_defaults_default_sales_revenue_gl_account_id_fkey FOREIGN KEY (default_sales_revenue_gl_account_id) REFERENCES public.gl_accounts(id);


--
-- Name: inventory_defaults inventory_defaults_default_warehouse_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.inventory_defaults
    ADD CONSTRAINT inventory_defaults_default_warehouse_id_fkey FOREIGN KEY (default_warehouse_id) REFERENCES public.warehouses(id);


--
-- Name: inventory_item_locations inventory_item_locations_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.inventory_item_locations
    ADD CONSTRAINT inventory_item_locations_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: inventory_item_locations inventory_item_locations_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.inventory_item_locations
    ADD CONSTRAINT inventory_item_locations_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.inventory_items(id);


--
-- Name: inventory_item_locations inventory_item_locations_warehouse_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.inventory_item_locations
    ADD CONSTRAINT inventory_item_locations_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES public.warehouses(id);


--
-- Name: inventory_items inventory_items_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.inventory_items
    ADD CONSTRAINT inventory_items_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: inventory_items inventory_items_default_cogs_gl_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.inventory_items
    ADD CONSTRAINT inventory_items_default_cogs_gl_account_id_fkey FOREIGN KEY (default_cogs_gl_account_id) REFERENCES public.gl_accounts(id);


--
-- Name: inventory_items inventory_items_default_inventory_gl_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.inventory_items
    ADD CONSTRAINT inventory_items_default_inventory_gl_account_id_fkey FOREIGN KEY (default_inventory_gl_account_id) REFERENCES public.gl_accounts(id);


--
-- Name: inventory_items inventory_items_default_purchase_tax_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.inventory_items
    ADD CONSTRAINT inventory_items_default_purchase_tax_type_id_fkey FOREIGN KEY (default_purchase_tax_type_id) REFERENCES public.tax_types(id);


--
-- Name: inventory_items inventory_items_default_sales_gl_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.inventory_items
    ADD CONSTRAINT inventory_items_default_sales_gl_account_id_fkey FOREIGN KEY (default_sales_gl_account_id) REFERENCES public.gl_accounts(id);


--
-- Name: inventory_items inventory_items_default_sales_tax_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.inventory_items
    ADD CONSTRAINT inventory_items_default_sales_tax_type_id_fkey FOREIGN KEY (default_sales_tax_type_id) REFERENCES public.tax_types(id);


--
-- Name: inventory_items inventory_items_unit_of_measure_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.inventory_items
    ADD CONSTRAINT inventory_items_unit_of_measure_id_fkey FOREIGN KEY (unit_of_measure_id) REFERENCES public.unit_of_measures(id);


--
-- Name: inventory_transaction_types inventory_transaction_types_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.inventory_transaction_types
    ADD CONSTRAINT inventory_transaction_types_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: inventory_transaction_types inventory_transaction_types_default_offsetting_gl_account__fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.inventory_transaction_types
    ADD CONSTRAINT inventory_transaction_types_default_offsetting_gl_account__fkey FOREIGN KEY (default_offsetting_gl_account_id) REFERENCES public.gl_accounts(id);


--
-- Name: inventory_transactions inventory_transactions_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT inventory_transactions_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: inventory_transactions inventory_transactions_currency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT inventory_transactions_currency_id_fkey FOREIGN KEY (currency_id) REFERENCES public.currencies(id);


--
-- Name: inventory_transactions inventory_transactions_inventory_transaction_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT inventory_transactions_inventory_transaction_type_id_fkey FOREIGN KEY (inventory_transaction_type_id) REFERENCES public.inventory_transaction_types(id);


--
-- Name: inventory_transactions inventory_transactions_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT inventory_transactions_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.inventory_items(id);


--
-- Name: inventory_transactions inventory_transactions_linked_gl_journal_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT inventory_transactions_linked_gl_journal_entry_id_fkey FOREIGN KEY (linked_gl_journal_entry_id) REFERENCES public.gl_journal_entries(id);


--
-- Name: inventory_transactions inventory_transactions_warehouse_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT inventory_transactions_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES public.warehouses(id);


--
-- Name: item_barcodes item_barcodes_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.item_barcodes
    ADD CONSTRAINT item_barcodes_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: item_barcodes item_barcodes_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.item_barcodes
    ADD CONSTRAINT item_barcodes_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.inventory_items(id);


--
-- Name: item_barcodes item_barcodes_unit_of_measure_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.item_barcodes
    ADD CONSTRAINT item_barcodes_unit_of_measure_id_fkey FOREIGN KEY (unit_of_measure_id) REFERENCES public.unit_of_measures(id);


--
-- Name: manufacturing_order_components manufacturing_order_components_component_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.manufacturing_order_components
    ADD CONSTRAINT manufacturing_order_components_component_item_id_fkey FOREIGN KEY (component_item_id) REFERENCES public.inventory_items(id);


--
-- Name: manufacturing_order_components manufacturing_order_components_manufacturing_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.manufacturing_order_components
    ADD CONSTRAINT manufacturing_order_components_manufacturing_order_id_fkey FOREIGN KEY (manufacturing_order_id) REFERENCES public.manufacturing_orders(id);


--
-- Name: manufacturing_orders manufacturing_orders_bom_header_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.manufacturing_orders
    ADD CONSTRAINT manufacturing_orders_bom_header_id_fkey FOREIGN KEY (bom_header_id) REFERENCES public.bom_headers(id);


--
-- Name: manufacturing_orders manufacturing_orders_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.manufacturing_orders
    ADD CONSTRAINT manufacturing_orders_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: manufacturing_orders manufacturing_orders_linked_gl_journal_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.manufacturing_orders
    ADD CONSTRAINT manufacturing_orders_linked_gl_journal_entry_id_fkey FOREIGN KEY (linked_gl_journal_entry_id) REFERENCES public.gl_journal_entries(id);


--
-- Name: manufacturing_orders manufacturing_orders_warehouse_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.manufacturing_orders
    ADD CONSTRAINT manufacturing_orders_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES public.warehouses(id);


--
-- Name: order_defaults order_defaults_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.order_defaults
    ADD CONSTRAINT order_defaults_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: platform_audit_logs platform_audit_logs_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.platform_audit_logs
    ADD CONSTRAINT platform_audit_logs_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: platform_audit_logs platform_audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.platform_audit_logs
    ADD CONSTRAINT platform_audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: pos_cash_movements pos_cash_movements_authorized_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.pos_cash_movements
    ADD CONSTRAINT pos_cash_movements_authorized_by_id_fkey FOREIGN KEY (authorized_by_id) REFERENCES public.users(id);


--
-- Name: pos_cash_movements pos_cash_movements_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.pos_cash_movements
    ADD CONSTRAINT pos_cash_movements_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: pos_cash_movements pos_cash_movements_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.pos_cash_movements
    ADD CONSTRAINT pos_cash_movements_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.pos_sessions(id);


--
-- Name: pos_defaults pos_defaults_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.pos_defaults
    ADD CONSTRAINT pos_defaults_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: pos_defaults pos_defaults_default_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.pos_defaults
    ADD CONSTRAINT pos_defaults_default_customer_id_fkey FOREIGN KEY (default_customer_id) REFERENCES public.customers(id);


--
-- Name: pos_defaults pos_defaults_default_return_transaction_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.pos_defaults
    ADD CONSTRAINT pos_defaults_default_return_transaction_type_id_fkey FOREIGN KEY (default_return_transaction_type_id) REFERENCES public.pos_transaction_types(id);


--
-- Name: pos_defaults pos_defaults_default_sale_transaction_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.pos_defaults
    ADD CONSTRAINT pos_defaults_default_sale_transaction_type_id_fkey FOREIGN KEY (default_sale_transaction_type_id) REFERENCES public.pos_transaction_types(id);


--
-- Name: pos_defaults pos_defaults_default_tax_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.pos_defaults
    ADD CONSTRAINT pos_defaults_default_tax_type_id_fkey FOREIGN KEY (default_tax_type_id) REFERENCES public.tax_types(id);


--
-- Name: pos_sessions pos_sessions_cashier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.pos_sessions
    ADD CONSTRAINT pos_sessions_cashier_id_fkey FOREIGN KEY (cashier_id) REFERENCES public.users(id);


--
-- Name: pos_sessions pos_sessions_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.pos_sessions
    ADD CONSTRAINT pos_sessions_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: pos_sessions pos_sessions_till_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.pos_sessions
    ADD CONSTRAINT pos_sessions_till_id_fkey FOREIGN KEY (till_id) REFERENCES public.tills(id);


--
-- Name: pos_transaction_lines pos_transaction_lines_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.pos_transaction_lines
    ADD CONSTRAINT pos_transaction_lines_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.inventory_items(id);


--
-- Name: pos_transaction_lines pos_transaction_lines_tax_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.pos_transaction_lines
    ADD CONSTRAINT pos_transaction_lines_tax_type_id_fkey FOREIGN KEY (tax_type_id) REFERENCES public.tax_types(id);


--
-- Name: pos_transaction_lines pos_transaction_lines_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.pos_transaction_lines
    ADD CONSTRAINT pos_transaction_lines_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.pos_transactions(id);


--
-- Name: pos_transaction_types pos_transaction_types_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.pos_transaction_types
    ADD CONSTRAINT pos_transaction_types_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: pos_transactions pos_transactions_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.pos_transactions
    ADD CONSTRAINT pos_transactions_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: pos_transactions pos_transactions_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.pos_transactions
    ADD CONSTRAINT pos_transactions_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: pos_transactions pos_transactions_linked_ar_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.pos_transactions
    ADD CONSTRAINT pos_transactions_linked_ar_transaction_id_fkey FOREIGN KEY (linked_ar_transaction_id) REFERENCES public.ar_transactions(id);


--
-- Name: pos_transactions pos_transactions_linked_gl_journal_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.pos_transactions
    ADD CONSTRAINT pos_transactions_linked_gl_journal_entry_id_fkey FOREIGN KEY (linked_gl_journal_entry_id) REFERENCES public.gl_journal_entries(id);


--
-- Name: pos_transactions pos_transactions_reference_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.pos_transactions
    ADD CONSTRAINT pos_transactions_reference_transaction_id_fkey FOREIGN KEY (reference_transaction_id) REFERENCES public.pos_transactions(id);


--
-- Name: pos_transactions pos_transactions_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.pos_transactions
    ADD CONSTRAINT pos_transactions_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.pos_sessions(id);


--
-- Name: pos_transactions pos_transactions_transaction_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.pos_transactions
    ADD CONSTRAINT pos_transactions_transaction_type_id_fkey FOREIGN KEY (transaction_type_id) REFERENCES public.pos_transaction_types(id);


--
-- Name: purchase_order_lines purchase_order_lines_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.purchase_order_lines
    ADD CONSTRAINT purchase_order_lines_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.inventory_items(id);


--
-- Name: purchase_order_lines purchase_order_lines_purchase_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.purchase_order_lines
    ADD CONSTRAINT purchase_order_lines_purchase_order_id_fkey FOREIGN KEY (purchase_order_id) REFERENCES public.purchase_orders(id);


--
-- Name: purchase_order_lines purchase_order_lines_tax_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.purchase_order_lines
    ADD CONSTRAINT purchase_order_lines_tax_type_id_fkey FOREIGN KEY (tax_type_id) REFERENCES public.tax_types(id);


--
-- Name: purchase_orders purchase_orders_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: purchase_orders purchase_orders_currency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_currency_id_fkey FOREIGN KEY (currency_id) REFERENCES public.currencies(id);


--
-- Name: purchase_orders purchase_orders_delivery_address_warehouse_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_delivery_address_warehouse_id_fkey FOREIGN KEY (delivery_address_warehouse_id) REFERENCES public.warehouses(id);


--
-- Name: purchase_orders purchase_orders_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);


--
-- Name: report_schedules report_schedules_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.report_schedules
    ADD CONSTRAINT report_schedules_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: report_schedules report_schedules_report_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.report_schedules
    ADD CONSTRAINT report_schedules_report_template_id_fkey FOREIGN KEY (report_template_id) REFERENCES public.report_templates(id);


--
-- Name: report_templates report_templates_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.report_templates
    ADD CONSTRAINT report_templates_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: report_templates report_templates_created_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.report_templates
    ADD CONSTRAINT report_templates_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.users(id);


--
-- Name: resource_usage resource_usage_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.resource_usage
    ADD CONSTRAINT resource_usage_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: roles roles_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: sales_order_lines sales_order_lines_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.sales_order_lines
    ADD CONSTRAINT sales_order_lines_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.inventory_items(id);


--
-- Name: sales_order_lines sales_order_lines_sales_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.sales_order_lines
    ADD CONSTRAINT sales_order_lines_sales_order_id_fkey FOREIGN KEY (sales_order_id) REFERENCES public.sales_orders(id);


--
-- Name: sales_order_lines sales_order_lines_tax_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.sales_order_lines
    ADD CONSTRAINT sales_order_lines_tax_type_id_fkey FOREIGN KEY (tax_type_id) REFERENCES public.tax_types(id);


--
-- Name: sales_orders sales_orders_ar_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.sales_orders
    ADD CONSTRAINT sales_orders_ar_invoice_id_fkey FOREIGN KEY (ar_invoice_id) REFERENCES public.ar_transactions(id);


--
-- Name: sales_orders sales_orders_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.sales_orders
    ADD CONSTRAINT sales_orders_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: sales_orders sales_orders_currency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.sales_orders
    ADD CONSTRAINT sales_orders_currency_id_fkey FOREIGN KEY (currency_id) REFERENCES public.currencies(id);


--
-- Name: sales_orders sales_orders_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.sales_orders
    ADD CONSTRAINT sales_orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: sales_orders sales_orders_sales_representative_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.sales_orders
    ADD CONSTRAINT sales_orders_sales_representative_id_fkey FOREIGN KEY (sales_representative_id) REFERENCES public.sales_representatives(id);


--
-- Name: sales_representatives sales_representatives_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.sales_representatives
    ADD CONSTRAINT sales_representatives_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: suppliers suppliers_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: suppliers suppliers_default_ap_gl_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_default_ap_gl_account_id_fkey FOREIGN KEY (default_ap_gl_account_id) REFERENCES public.gl_accounts(id);


--
-- Name: suppliers suppliers_default_currency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_default_currency_id_fkey FOREIGN KEY (default_currency_id) REFERENCES public.currencies(id);


--
-- Name: tax_types tax_types_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.tax_types
    ADD CONSTRAINT tax_types_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: tax_types tax_types_tax_authority_gl_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.tax_types
    ADD CONSTRAINT tax_types_tax_authority_gl_account_id_fkey FOREIGN KEY (tax_authority_gl_account_id) REFERENCES public.gl_accounts(id);


--
-- Name: tills tills_cash_gl_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.tills
    ADD CONSTRAINT tills_cash_gl_account_id_fkey FOREIGN KEY (cash_gl_account_id) REFERENCES public.gl_accounts(id);


--
-- Name: tills tills_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.tills
    ADD CONSTRAINT tills_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: tills tills_default_cashier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.tills
    ADD CONSTRAINT tills_default_cashier_id_fkey FOREIGN KEY (default_cashier_id) REFERENCES public.users(id);


--
-- Name: tills tills_default_warehouse_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.tills
    ADD CONSTRAINT tills_default_warehouse_id_fkey FOREIGN KEY (default_warehouse_id) REFERENCES public.warehouses(id);


--
-- Name: unit_of_measures unit_of_measures_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.unit_of_measures
    ADD CONSTRAINT unit_of_measures_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: usage_alerts usage_alerts_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.usage_alerts
    ADD CONSTRAINT usage_alerts_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: user_roles user_roles_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: users users_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: warehouses warehouses_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: Biwi_user
--

ALTER TABLE ONLY public.warehouses
    ADD CONSTRAINT warehouses_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- PostgreSQL database dump complete
--

