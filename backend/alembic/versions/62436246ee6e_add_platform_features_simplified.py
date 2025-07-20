"""add platform features simplified

Revision ID: 62436246ee6e
Revises: ff859d8ad766
Create Date: 2025-07-20 19:33:04.367187

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '62436246ee6e'
down_revision = 'ff859d8ad766'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Get database connection
    connection = op.get_bind()
    
    # First, handle the existing subscription_status column
    # Check if companies table already has subscription_status column
    result = connection.execute(sa.text("""
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'companies' 
        AND column_name = 'subscription_status'
    """))
    existing_column = result.fetchone()
    
    if existing_column:
        # Drop the existing column - we'll recreate it with enum type
        op.drop_column('companies', 'subscription_status')
    
    # Create all enum types using DO blocks for safety
    connection.execute(sa.text("""
        DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscriptionstatus') THEN
                CREATE TYPE subscriptionstatus AS ENUM ('TRIAL', 'ACTIVE', 'CANCELLED', 'EXPIRED');
            END IF;
        END $$;
    """))
    
    connection.execute(sa.text("""
        DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'usagemetrictype') THEN
                CREATE TYPE usagemetrictype AS ENUM ('API_CALLS', 'STORAGE', 'USERS', 'TRANSACTIONS', 'CUSTOM');
            END IF;
        END $$;
    """))
    
    connection.execute(sa.text("""
        DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'billingplantype') THEN
                CREATE TYPE billingplantype AS ENUM ('TRIAL', 'BASIC', 'PROFESSIONAL', 'ENTERPRISE', 'CUSTOM');
            END IF;
        END $$;
    """))
    
    connection.execute(sa.text("""
        DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'auditactiontype') THEN
                CREATE TYPE auditactiontype AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'API_CALL', 'PERMISSION_CHANGE', 'SUBSCRIPTION_CHANGE', 'OTHER');
            END IF;
        END $$;
    """))
    
    # Create platform_admins table
    op.create_table('platform_admins',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('hashed_password', sa.String(), nullable=False),
        sa.Column('full_name', sa.String(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('is_superadmin', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('permissions', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('last_login', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_platform_admins_email'), 'platform_admins', ['email'], unique=True)
    op.create_index(op.f('ix_platform_admins_id'), 'platform_admins', ['id'], unique=False)
    
    # Create billing_plans table
    op.create_table('billing_plans',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('plan_type', postgresql.ENUM('TRIAL', 'BASIC', 'PROFESSIONAL', 'ENTERPRISE', 'CUSTOM', name='billingplantype', create_type=False), nullable=False),
        sa.Column('price_monthly', sa.Numeric(precision=10, scale=2), nullable=False, server_default=sa.text('0')),
        sa.Column('price_yearly', sa.Numeric(precision=10, scale=2), nullable=False, server_default=sa.text('0')),
        sa.Column('features', postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column('limits', postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )
    op.create_index(op.f('ix_billing_plans_id'), 'billing_plans', ['id'], unique=False)
    
    # Add new columns to companies table
    op.add_column('companies', sa.Column('subscription_status', 
                  postgresql.ENUM('TRIAL', 'ACTIVE', 'CANCELLED', 'EXPIRED', name='subscriptionstatus', create_type=False), 
                  nullable=False, server_default=sa.text("'TRIAL'::subscriptionstatus")))
    op.add_column('companies', sa.Column('billing_plan_id', sa.Integer(), nullable=True))
    op.add_column('companies', sa.Column('subscription_start_date', sa.DateTime(), nullable=True))
    op.add_column('companies', sa.Column('subscription_end_date', sa.DateTime(), nullable=True))
    op.add_column('companies', sa.Column('trial_end_date', sa.DateTime(), nullable=True))
    op.add_column('companies', sa.Column('storage_used_mb', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('companies', sa.Column('api_calls_this_month', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('companies', sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')))
    op.add_column('companies', sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')))
    
    # Create foreign key after billing_plans table exists
    op.create_foreign_key(None, 'companies', 'billing_plans', ['billing_plan_id'], ['id'])
    
    # Create remaining tables
    op.create_table('company_subscriptions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('company_id', sa.Integer(), nullable=False),
        sa.Column('billing_plan_id', sa.Integer(), nullable=False),
        sa.Column('start_date', sa.DateTime(), nullable=False),
        sa.Column('end_date', sa.DateTime(), nullable=True),
        sa.Column('status', postgresql.ENUM('TRIAL', 'ACTIVE', 'CANCELLED', 'EXPIRED', name='subscriptionstatus', create_type=False), nullable=False),
        sa.Column('payment_method', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('next_billing_date', sa.DateTime(), nullable=True),
        sa.Column('cancellation_date', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['billing_plan_id'], ['billing_plans.id'], ),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_company_subscriptions_company_id'), 'company_subscriptions', ['company_id'], unique=False)
    op.create_index(op.f('ix_company_subscriptions_id'), 'company_subscriptions', ['id'], unique=False)
    
    op.create_table('system_configurations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('key', sa.String(), nullable=False),
        sa.Column('value', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('is_sensitive', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('updated_by_admin_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['updated_by_admin_id'], ['platform_admins.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('key')
    )
    op.create_index(op.f('ix_system_configurations_id'), 'system_configurations', ['id'], unique=False)
    
    op.create_table('system_health',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('metric_name', sa.String(), nullable=False),
        sa.Column('value', sa.Float(), nullable=False),
        sa.Column('status', sa.String(), nullable=False),
        sa.Column('details', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('recorded_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_system_health_id'), 'system_health', ['id'], unique=False)
    op.create_index(op.f('ix_system_health_metric_name'), 'system_health', ['metric_name'], unique=False)
    op.create_index(op.f('ix_system_health_recorded_at'), 'system_health', ['recorded_at'], unique=False)
    
    op.create_table('audit_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('action_type', postgresql.ENUM('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'API_CALL', 'PERMISSION_CHANGE', 'SUBSCRIPTION_CHANGE', 'OTHER', name='auditactiontype', create_type=False), nullable=False),
        sa.Column('entity_type', sa.String(), nullable=False),
        sa.Column('entity_id', sa.Integer(), nullable=True),
        sa.Column('company_id', sa.Integer(), nullable=True),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('admin_id', sa.Integer(), nullable=True),
        sa.Column('ip_address', sa.String(), nullable=True),
        sa.Column('user_agent', sa.String(), nullable=True),
        sa.Column('description', sa.String(), nullable=False),
        sa.Column('old_values', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('new_values', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['admin_id'], ['platform_admins.id'], ),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_audit_logs_action_type'), 'audit_logs', ['action_type'], unique=False)
    op.create_index(op.f('ix_audit_logs_company_id'), 'audit_logs', ['company_id'], unique=False)
    op.create_index(op.f('ix_audit_logs_created_at'), 'audit_logs', ['created_at'], unique=False)
    op.create_index(op.f('ix_audit_logs_entity_type'), 'audit_logs', ['entity_type'], unique=False)
    op.create_index(op.f('ix_audit_logs_id'), 'audit_logs', ['id'], unique=False)
    
    op.create_table('feature_flags',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('is_enabled', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('enabled_for_companies', postgresql.ARRAY(sa.Integer()), nullable=True),
        sa.Column('enabled_for_plans', postgresql.ARRAY(sa.String()), nullable=True),
        sa.Column('configuration', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('created_by_admin_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['created_by_admin_id'], ['platform_admins.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )
    op.create_index(op.f('ix_feature_flags_id'), 'feature_flags', ['id'], unique=False)
    
    op.create_table('platform_invoices',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('company_id', sa.Integer(), nullable=False),
        sa.Column('subscription_id', sa.Integer(), nullable=False),
        sa.Column('invoice_number', sa.String(), nullable=False),
        sa.Column('billing_period_start', sa.DateTime(), nullable=False),
        sa.Column('billing_period_end', sa.DateTime(), nullable=False),
        sa.Column('amount', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('tax_amount', sa.Numeric(precision=10, scale=2), nullable=False, server_default=sa.text('0')),
        sa.Column('total_amount', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('currency', sa.String(length=3), nullable=False, server_default=sa.text("'USD'")),
        sa.Column('status', sa.String(), nullable=False),
        sa.Column('payment_date', sa.DateTime(), nullable=True),
        sa.Column('payment_method', sa.String(), nullable=True),
        sa.Column('payment_reference', sa.String(), nullable=True),
        sa.Column('line_items', postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ),
        sa.ForeignKeyConstraint(['subscription_id'], ['company_subscriptions.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('invoice_number')
    )
    op.create_index(op.f('ix_platform_invoices_company_id'), 'platform_invoices', ['company_id'], unique=False)
    op.create_index(op.f('ix_platform_invoices_id'), 'platform_invoices', ['id'], unique=False)
    
    op.create_table('usage_metrics',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('company_id', sa.Integer(), nullable=False),
        sa.Column('metric_type', postgresql.ENUM('API_CALLS', 'STORAGE', 'USERS', 'TRANSACTIONS', 'CUSTOM', name='usagemetrictype', create_type=False), nullable=False),
        sa.Column('metric_name', sa.String(), nullable=True),
        sa.Column('value', sa.Numeric(), nullable=False),
        sa.Column('unit', sa.String(), nullable=True),
        sa.Column('recorded_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('billing_period', sa.DateTime(), nullable=False),
        sa.Column('details', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_usage_metrics_billing_period'), 'usage_metrics', ['billing_period'], unique=False)
    op.create_index(op.f('ix_usage_metrics_company_id'), 'usage_metrics', ['company_id'], unique=False)
    op.create_index(op.f('ix_usage_metrics_id'), 'usage_metrics', ['id'], unique=False)
    op.create_index(op.f('ix_usage_metrics_metric_type'), 'usage_metrics', ['metric_type'], unique=False)
    op.create_index(op.f('ix_usage_metrics_recorded_at'), 'usage_metrics', ['recorded_at'], unique=False)


def downgrade() -> None:
    # Drop tables in reverse order
    op.drop_index(op.f('ix_usage_metrics_recorded_at'), table_name='usage_metrics')
    op.drop_index(op.f('ix_usage_metrics_metric_type'), table_name='usage_metrics')
    op.drop_index(op.f('ix_usage_metrics_id'), table_name='usage_metrics')
    op.drop_index(op.f('ix_usage_metrics_company_id'), table_name='usage_metrics')
    op.drop_index(op.f('ix_usage_metrics_billing_period'), table_name='usage_metrics')
    op.drop_table('usage_metrics')
    
    op.drop_index(op.f('ix_platform_invoices_id'), table_name='platform_invoices')
    op.drop_index(op.f('ix_platform_invoices_company_id'), table_name='platform_invoices')
    op.drop_table('platform_invoices')
    
    op.drop_index(op.f('ix_feature_flags_id'), table_name='feature_flags')
    op.drop_table('feature_flags')
    
    op.drop_index(op.f('ix_audit_logs_id'), table_name='audit_logs')
    op.drop_index(op.f('ix_audit_logs_entity_type'), table_name='audit_logs')
    op.drop_index(op.f('ix_audit_logs_created_at'), table_name='audit_logs')
    op.drop_index(op.f('ix_audit_logs_company_id'), table_name='audit_logs')
    op.drop_index(op.f('ix_audit_logs_action_type'), table_name='audit_logs')
    op.drop_table('audit_logs')
    
    op.drop_index(op.f('ix_system_health_recorded_at'), table_name='system_health')
    op.drop_index(op.f('ix_system_health_metric_name'), table_name='system_health')
    op.drop_index(op.f('ix_system_health_id'), table_name='system_health')
    op.drop_table('system_health')
    
    op.drop_index(op.f('ix_system_configurations_id'), table_name='system_configurations')
    op.drop_table('system_configurations')
    
    op.drop_index(op.f('ix_company_subscriptions_id'), table_name='company_subscriptions')
    op.drop_index(op.f('ix_company_subscriptions_company_id'), table_name='company_subscriptions')
    op.drop_table('company_subscriptions')
    
    # Remove columns from companies table
    op.drop_constraint(None, 'companies', type_='foreignkey')
    op.drop_column('companies', 'updated_at')
    op.drop_column('companies', 'created_at')
    op.drop_column('companies', 'api_calls_this_month')
    op.drop_column('companies', 'storage_used_mb')
    op.drop_column('companies', 'trial_end_date')
    op.drop_column('companies', 'subscription_end_date')
    op.drop_column('companies', 'subscription_start_date')
    op.drop_column('companies', 'billing_plan_id')
    op.drop_column('companies', 'subscription_status')
    
    op.drop_index(op.f('ix_billing_plans_id'), table_name='billing_plans')
    op.drop_table('billing_plans')
    
    op.drop_index(op.f('ix_platform_admins_id'), table_name='platform_admins')
    op.drop_index(op.f('ix_platform_admins_email'), table_name='platform_admins')
    op.drop_table('platform_admins')
    
    # Drop enum types
    connection = op.get_bind()
    connection.execute(sa.text("DROP TYPE IF EXISTS subscriptionstatus CASCADE"))
    connection.execute(sa.text("DROP TYPE IF EXISTS usagemetrictype CASCADE"))
    connection.execute(sa.text("DROP TYPE IF EXISTS billingplantype CASCADE"))
    connection.execute(sa.text("DROP TYPE IF EXISTS auditactiontype CASCADE"))
