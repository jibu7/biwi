"""add platform features with proper enums

Revision ID: 72406a47cf05
Revises: ff859d8ad766
Create Date: 2025-07-19 22:42:51.196272

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '72406a47cf05'
down_revision = 'ff859d8ad766'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # First, create all enum types
    # Use raw SQL to handle enum creation safely
    connection = op.get_bind()
    
    # Create enums if they don't exist
    connection.execute(sa.text("""
        DO $$ BEGIN
            CREATE TYPE subscriptionstatus AS ENUM ('TRIAL', 'ACTIVE', 'CANCELLED', 'EXPIRED');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """))
    
    connection.execute(sa.text("""
        DO $$ BEGIN
            CREATE TYPE usagemetrictype AS ENUM ('API_CALLS', 'STORAGE', 'USERS', 'TRANSACTIONS', 'CUSTOM');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """))
    
    connection.execute(sa.text("""
        DO $$ BEGIN
            CREATE TYPE billingplantype AS ENUM ('TRIAL', 'BASIC', 'PROFESSIONAL', 'ENTERPRISE', 'CUSTOM');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """))
    
    connection.execute(sa.text("""
        DO $$ BEGIN
            CREATE TYPE auditactiontype AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'API_CALL', 'PERMISSION_CHANGE', 'SUBSCRIPTION_CHANGE', 'OTHER');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """))
    
    # Create platform_admins table
    op.create_table('platform_admins',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('hashed_password', sa.String(), nullable=False),
        sa.Column('full_name', sa.String(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('is_superadmin', sa.Boolean(), nullable=False),
        sa.Column('permissions', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
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
        sa.Column('price_monthly', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('price_yearly', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('features', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('limits', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )
    op.create_index(op.f('ix_billing_plans_id'), 'billing_plans', ['id'], unique=False)
    
    # Handle the subscription_status column conversion carefully
    # First check if column exists and handle it properly
    try:
        # Remove default value if it exists
        op.alter_column('companies', 'subscription_status', server_default=None)
        
        # Update existing values to uppercase to match enum values
        connection.execute(sa.text("""
            UPDATE companies 
            SET subscription_status = CASE 
                WHEN UPPER(subscription_status) IN ('TRIAL', 'ACTIVE', 'CANCELLED', 'EXPIRED') 
                THEN UPPER(subscription_status)
                ELSE 'TRIAL'
            END
            WHERE subscription_status IS NOT NULL;
        """))
        
        # Now alter the column type with explicit casting
        op.execute(sa.text("""
            ALTER TABLE companies 
            ALTER COLUMN subscription_status 
            TYPE subscriptionstatus 
            USING CASE
                WHEN subscription_status = 'TRIAL' THEN 'TRIAL'::subscriptionstatus
                WHEN subscription_status = 'ACTIVE' THEN 'ACTIVE'::subscriptionstatus
                WHEN subscription_status = 'CANCELLED' THEN 'CANCELLED'::subscriptionstatus
                WHEN subscription_status = 'EXPIRED' THEN 'EXPIRED'::subscriptionstatus
                ELSE 'TRIAL'::subscriptionstatus
            END
        """))
        
        # Set the default value back
        op.alter_column('companies', 'subscription_status', 
                       server_default=sa.text("'TRIAL'::subscriptionstatus"))
        
    except Exception as e:
        # If the column doesn't exist, add it with the enum type
        op.add_column('companies', sa.Column('subscription_status', 
                      postgresql.ENUM('TRIAL', 'ACTIVE', 'CANCELLED', 'EXPIRED', name='subscriptionstatus', create_type=False),
                      nullable=False, server_default=sa.text("'TRIAL'::subscriptionstatus")))
    
    # Add new columns to companies table (check if they don't already exist)
    inspector = sa.inspect(connection)
    existing_columns = [col['name'] for col in inspector.get_columns('companies')]
    
    if 'billing_plan_id' not in existing_columns:
        op.add_column('companies', sa.Column('billing_plan_id', sa.Integer(), nullable=True))
    if 'subscription_start_date' not in existing_columns:
        op.add_column('companies', sa.Column('subscription_start_date', sa.DateTime(), nullable=True))
    if 'subscription_end_date' not in existing_columns:
        op.add_column('companies', sa.Column('subscription_end_date', sa.DateTime(), nullable=True))
    if 'trial_end_date' not in existing_columns:
        op.add_column('companies', sa.Column('trial_end_date', sa.DateTime(), nullable=True))
    if 'storage_used_mb' not in existing_columns:
        op.add_column('companies', sa.Column('storage_used_mb', sa.Integer(), nullable=False, server_default='0'))
    if 'api_calls_this_month' not in existing_columns:
        op.add_column('companies', sa.Column('api_calls_this_month', sa.Integer(), nullable=False, server_default='0'))
    if 'created_at' not in existing_columns:
        op.add_column('companies', sa.Column('created_at', sa.DateTime(), nullable=True))
    if 'updated_at' not in existing_columns:
        op.add_column('companies', sa.Column('updated_at', sa.DateTime(), nullable=True))
    
    # Update existing rows with default timestamps (only if columns exist and are null)
    if 'created_at' in existing_columns:
        op.execute(sa.text("UPDATE companies SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL"))
        # Make timestamp column non-nullable
        op.alter_column('companies', 'created_at', nullable=False)
    
    if 'updated_at' in existing_columns:
        op.execute(sa.text("UPDATE companies SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL"))
        # Make timestamp column non-nullable
        op.alter_column('companies', 'updated_at', nullable=False)
    
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
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
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
        sa.Column('is_sensitive', sa.Boolean(), nullable=False),
        sa.Column('updated_by_admin_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
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
        sa.Column('recorded_at', sa.DateTime(), nullable=False),
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
        sa.Column('created_at', sa.DateTime(), nullable=False),
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
        sa.Column('is_enabled', sa.Boolean(), nullable=False),
        sa.Column('enabled_for_companies', postgresql.ARRAY(sa.Integer()), nullable=True),
        sa.Column('enabled_for_plans', postgresql.ARRAY(sa.String()), nullable=True),
        sa.Column('configuration', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('created_by_admin_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
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
        sa.Column('tax_amount', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('total_amount', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('currency', sa.String(length=3), nullable=False),
        sa.Column('status', sa.String(), nullable=False),
        sa.Column('payment_date', sa.DateTime(), nullable=True),
        sa.Column('payment_method', sa.String(), nullable=True),
        sa.Column('payment_reference', sa.String(), nullable=True),
        sa.Column('line_items', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
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
        sa.Column('recorded_at', sa.DateTime(), nullable=False),
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
    
    # Convert subscription_status back to VARCHAR
    op.execute(sa.text("""
        ALTER TABLE companies 
        ALTER COLUMN subscription_status 
        TYPE VARCHAR 
        USING subscription_status::text
    """))
    
    # Set default back to lowercase
    op.execute(sa.text("UPDATE companies SET subscription_status = 'trial' WHERE subscription_status = 'TRIAL'"))
    
    op.drop_index(op.f('ix_billing_plans_id'), table_name='billing_plans')
    op.drop_table('billing_plans')
    
    op.drop_index(op.f('ix_platform_admins_id'), table_name='platform_admins')
    op.drop_index(op.f('ix_platform_admins_email'), table_name='platform_admins')
    op.drop_table('platform_admins')
    
    # Drop enum types
    connection = op.get_bind()
    connection.execute(sa.text("DROP TYPE IF EXISTS subscriptionstatus"))
    connection.execute(sa.text("DROP TYPE IF EXISTS usagemetrictype"))
    connection.execute(sa.text("DROP TYPE IF EXISTS billingplantype"))
    connection.execute(sa.text("DROP TYPE IF EXISTS auditactiontype"))
