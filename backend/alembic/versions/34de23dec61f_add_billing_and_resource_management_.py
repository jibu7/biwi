"""add_billing_and_resource_management_models

Revision ID: 34de23dec61f
Revises: f5d7c8b9a1e2
Create Date: 2025-07-04 19:16:54.474548

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '34de23dec61f'
down_revision: Union[str, None] = 'f5d7c8b9a1e2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add billing and resource management models"""
    
    # Create resource_usage table
    op.create_table('resource_usage',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('company_id', sa.Integer(), nullable=False),
        sa.Column('resource_type', sa.String(), nullable=False),
        sa.Column('usage_amount', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('usage_date', sa.Date(), nullable=False),
        sa.Column('billing_period', sa.String(), nullable=False),
        sa.Column('usage_metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create unique constraint for usage tracking
    op.create_unique_constraint('uq_usage_company_resource_date', 'resource_usage', 
                                ['company_id', 'resource_type', 'usage_date'])
    
    # Create indexes for resource_usage
    op.create_index('idx_resource_usage_company_date', 'resource_usage', ['company_id', 'usage_date'])
    op.create_index('idx_resource_usage_billing_period', 'resource_usage', ['billing_period'])
    
    # Create billing_configurations table
    op.create_table('billing_configurations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('company_id', sa.Integer(), nullable=False),
        sa.Column('base_monthly_fee', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('per_user_fee', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('per_gb_storage_fee', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('per_transaction_fee', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('billing_cycle', sa.String(), nullable=True),
        sa.Column('billing_email', sa.String(), nullable=True),
        sa.Column('payment_method', sa.String(), nullable=True),
        sa.Column('stripe_customer_id', sa.String(), nullable=True),
        sa.Column('stripe_subscription_id', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create unique constraint for billing configuration
    op.create_unique_constraint('uq_billing_config_company', 'billing_configurations', ['company_id'])
    
    # Create usage_alerts table
    op.create_table('usage_alerts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('company_id', sa.Integer(), nullable=False),
        sa.Column('alert_type', sa.String(), nullable=False),
        sa.Column('threshold_percentage', sa.Float(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('last_triggered', sa.DateTime(), nullable=True),
        sa.Column('alert_recipients', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create billing_transactions table
    op.create_table('billing_transactions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('company_id', sa.Integer(), nullable=False),
        sa.Column('transaction_type', sa.String(), nullable=False),
        sa.Column('amount', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('currency', sa.String(length=3), nullable=True),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('billing_period', sa.String(), nullable=False),
        sa.Column('stripe_invoice_id', sa.String(), nullable=True),
        sa.Column('stripe_charge_id', sa.String(), nullable=True),
        sa.Column('status', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create index for billing transactions
    op.create_index('idx_billing_transaction_company_period', 'billing_transactions', 
                    ['company_id', 'billing_period'])
    
    # Set default values for new columns
    op.execute("UPDATE billing_configurations SET base_monthly_fee = 0.00 WHERE base_monthly_fee IS NULL")
    op.execute("UPDATE billing_configurations SET per_user_fee = 0.00 WHERE per_user_fee IS NULL")
    op.execute("UPDATE billing_configurations SET per_gb_storage_fee = 0.00 WHERE per_gb_storage_fee IS NULL")
    op.execute("UPDATE billing_configurations SET per_transaction_fee = 0.00 WHERE per_transaction_fee IS NULL")
    op.execute("UPDATE billing_configurations SET billing_cycle = 'monthly' WHERE billing_cycle IS NULL")
    op.execute("UPDATE billing_configurations SET created_at = NOW() WHERE created_at IS NULL")
    op.execute("UPDATE billing_configurations SET updated_at = NOW() WHERE updated_at IS NULL")
    
    op.execute("UPDATE usage_alerts SET is_active = true WHERE is_active IS NULL")
    
    op.execute("UPDATE billing_transactions SET currency = 'USD' WHERE currency IS NULL")
    op.execute("UPDATE billing_transactions SET status = 'pending' WHERE status IS NULL")
    op.execute("UPDATE billing_transactions SET created_at = NOW() WHERE created_at IS NULL")
    op.execute("UPDATE billing_transactions SET updated_at = NOW() WHERE updated_at IS NULL")


def downgrade() -> None:
    """Remove billing and resource management models"""
    
    # Drop billing_transactions table
    op.drop_index('idx_billing_transaction_company_period', table_name='billing_transactions')
    op.drop_table('billing_transactions')
    
    # Drop usage_alerts table
    op.drop_table('usage_alerts')
    
    # Drop billing_configurations table
    op.drop_constraint('uq_billing_config_company', 'billing_configurations', type_='unique')
    op.drop_table('billing_configurations')
    
    # Drop resource_usage table
    op.drop_index('idx_resource_usage_billing_period', table_name='resource_usage')
    op.drop_index('idx_resource_usage_company_date', table_name='resource_usage')
    op.drop_constraint('uq_usage_company_resource_date', 'resource_usage', type_='unique')
    op.drop_table('resource_usage')
