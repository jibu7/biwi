"""add_remaining_multi_tenant_support

Revision ID: 2a54a6f768c3
Revises: beb4f4aa9311
Create Date: 2025-07-17 05:04:34.152710

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '2a54a6f768c3'
down_revision: Union[str, None] = '34de23dec61f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create enums if they don't exist
    try:
        user_type_enum = postgresql.ENUM('platform_admin', 'company_admin', 'company_user', name='usertype', create_type=False)
        user_type_enum.create(op.get_bind(), checkfirst=True)
    except:
        pass
    
    try:
        subscription_status_enum = postgresql.ENUM('trial', 'active', 'suspended', 'cancelled', name='subscriptionstatus', create_type=False)
        subscription_status_enum.create(op.get_bind(), checkfirst=True)
    except:
        pass
    
    # Add user columns if they don't exist
    try:
        op.add_column('users', sa.Column('user_type', postgresql.ENUM(name='usertype'), nullable=False, server_default='company_user'))
    except:
        pass
    
    try:
        op.add_column('users', sa.Column('default_company_id', sa.Integer(), nullable=True))
    except:
        pass
    
    try:
        op.add_column('users', sa.Column('last_login', sa.DateTime(), nullable=True))
    except:
        pass
    
    try:
        op.add_column('users', sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()))
    except:
        pass
    
    try:
        op.add_column('users', sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()))
    except:
        pass
    
    try:
        op.add_column('users', sa.Column('mfa_secret', sa.String(), nullable=True))
    except:
        pass
    
    # Make company_id nullable
    try:
        op.alter_column('users', 'company_id', nullable=True)
    except:
        pass
    
    # Add missing company columns
    try:
        op.add_column('companies', sa.Column('deleted_at', sa.DateTime(), nullable=True))
    except:
        pass
    
    # Add foreign keys if they don't exist
    try:
        op.create_foreign_key('fk_users_default_company', 'users', 'companies', ['default_company_id'], ['id'])
    except:
        pass
    
    # Create missing tables
    try:
        op.create_table('platform_audit_logs',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=True),
            sa.Column('company_id', sa.Integer(), nullable=True),
            sa.Column('action', sa.String(100), nullable=False),
            sa.Column('resource_type', sa.String(50), nullable=True),
            sa.Column('resource_id', sa.Integer(), nullable=True),
            sa.Column('details', postgresql.JSONB(), nullable=True),
            sa.Column('ip_address', sa.String(45), nullable=True),
            sa.Column('user_agent', sa.Text(), nullable=True),
            sa.Column('timestamp', sa.DateTime(), nullable=False, server_default=sa.func.now()),
            sa.PrimaryKeyConstraint('id'),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
            sa.ForeignKeyConstraint(['company_id'], ['companies.id'], )
        )
        op.create_index('idx_platform_audit_logs_user_id', 'platform_audit_logs', ['user_id'])
        op.create_index('idx_platform_audit_logs_company_id', 'platform_audit_logs', ['company_id'])
        op.create_index('idx_platform_audit_logs_timestamp', 'platform_audit_logs', ['timestamp'])
        op.create_index('idx_platform_audit_logs_action', 'platform_audit_logs', ['action'])
        op.create_index('idx_platform_audit_company_timestamp', 'platform_audit_logs', ['company_id', 'timestamp'])
        op.create_index('idx_platform_audit_user_timestamp', 'platform_audit_logs', ['user_id', 'timestamp'])
    except:
        pass
    
    try:
        op.create_table('resource_usage',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('company_id', sa.Integer(), nullable=False),
            sa.Column('resource_type', sa.String(), nullable=False),
            sa.Column('usage_date', sa.Date(), nullable=False),
            sa.Column('quantity', sa.Numeric(precision=15, scale=4), nullable=False),
            sa.Column('unit', sa.String(), nullable=False),
            sa.Column('usage_metadata', postgresql.JSONB(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
            sa.PrimaryKeyConstraint('id'),
            sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ),
            sa.UniqueConstraint('company_id', 'resource_type', 'usage_date', name='uq_company_resource_date')
        )
        op.create_index('idx_resource_usage_company_date', 'resource_usage', ['company_id', 'usage_date'])
    except:
        pass
    
    try:
        op.create_table('usage_alerts',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('company_id', sa.Integer(), nullable=False),
            sa.Column('alert_type', sa.String(), nullable=False),
            sa.Column('threshold_value', sa.Numeric(precision=15, scale=4), nullable=False),
            sa.Column('current_value', sa.Numeric(precision=15, scale=4), nullable=False),
            sa.Column('alert_date', sa.DateTime(), nullable=False, server_default=sa.func.now()),
            sa.Column('acknowledged', sa.Boolean(), nullable=False, server_default='false'),
            sa.Column('acknowledged_by', sa.Integer(), nullable=True),
            sa.PrimaryKeyConstraint('id'),
            sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ),
            sa.ForeignKeyConstraint(['acknowledged_by'], ['users.id'], )
        )
    except:
        pass


def downgrade() -> None:
    """Downgrade schema."""
    # Drop new tables
    op.drop_table('usage_alerts')
    op.drop_table('resource_usage')
    op.drop_table('platform_audit_logs')
    
    # Remove new columns
    op.drop_column('users', 'mfa_secret')
    op.drop_column('users', 'updated_at')
    op.drop_column('users', 'created_at')
    op.drop_column('users', 'last_login')
    op.drop_column('users', 'default_company_id')
    op.drop_column('users', 'user_type')
    
    op.drop_column('companies', 'deleted_at')
    
    # Make company_id not nullable again
    op.alter_column('users', 'company_id', nullable=False)
    
    # Drop enums
    sa.Enum(name='usertype').drop(op.get_bind())
    sa.Enum(name='subscriptionstatus').drop(op.get_bind())
