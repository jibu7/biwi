"""Add platform administration improvements

Revision ID: f5d7c8b9a1e2
Revises: cb021f26c404
Create Date: 2025-07-04 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'f5d7c8b9a1e2'
down_revision: Union[str, None] = 'cb021f26c404'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add platform administration improvements"""
    
    # Add new columns to companies table
    op.add_column('companies', sa.Column('code', sa.String(length=10), nullable=True))
    op.add_column('companies', sa.Column('subscription_status', sa.String(), nullable=True))
    op.add_column('companies', sa.Column('subscription_plan', sa.String(), nullable=True))
    op.add_column('companies', sa.Column('subscription_expires', sa.Date(), nullable=True))
    op.add_column('companies', sa.Column('storage_limit_gb', sa.Integer(), nullable=True))
    op.add_column('companies', sa.Column('user_limit', sa.Integer(), nullable=True))
    op.add_column('companies', sa.Column('primary_contact_email', sa.String(), nullable=True))
    op.add_column('companies', sa.Column('billing_email', sa.String(), nullable=True))
    op.add_column('companies', sa.Column('created_at', sa.DateTime(), nullable=True))
    op.add_column('companies', sa.Column('created_by_user_id', sa.Integer(), nullable=True))
    op.add_column('companies', sa.Column('is_deleted', sa.Boolean(), nullable=True))
    
    # Add foreign key constraint for created_by_user_id
    op.create_foreign_key('fk_companies_created_by_user_id', 'companies', 'users', ['created_by_user_id'], ['id'])
    
    # Add unique constraint for company code
    op.create_unique_constraint('uq_companies_code', 'companies', ['code'])
    
    # Set default values for new columns
    op.execute("UPDATE companies SET subscription_status = 'trial' WHERE subscription_status IS NULL")
    op.execute("UPDATE companies SET storage_limit_gb = 10 WHERE storage_limit_gb IS NULL")
    op.execute("UPDATE companies SET user_limit = 5 WHERE user_limit IS NULL")
    op.execute("UPDATE companies SET is_deleted = false WHERE is_deleted IS NULL")
    op.execute("UPDATE companies SET created_at = NOW() WHERE created_at IS NULL")
    
    # Generate unique codes for existing companies
    op.execute("""
        UPDATE companies 
        SET code = 'COMP' || LPAD(id::text, 3, '0') 
        WHERE code IS NULL
    """)
    
    # Make code column not nullable
    op.alter_column('companies', 'code', nullable=False)
    
    # Add new columns to users table
    op.add_column('users', sa.Column('user_type', sa.String(), nullable=True))
    op.add_column('users', sa.Column('default_company_id', sa.Integer(), nullable=True))
    op.add_column('users', sa.Column('last_login', sa.DateTime(), nullable=True))
    op.add_column('users', sa.Column('created_at', sa.DateTime(), nullable=True))
    op.add_column('users', sa.Column('updated_at', sa.DateTime(), nullable=True))
    
    # Add foreign key constraint for default_company_id
    op.create_foreign_key('fk_users_default_company_id', 'users', 'companies', ['default_company_id'], ['id'])
    
    # Set default values for new columns
    op.execute("UPDATE users SET user_type = 'company_user' WHERE user_type IS NULL")
    op.execute("UPDATE users SET created_at = NOW() WHERE created_at IS NULL")
    op.execute("UPDATE users SET updated_at = NOW() WHERE updated_at IS NULL")
    
    # Update existing superusers to platform_admin
    op.execute("UPDATE users SET user_type = 'platform_admin' WHERE is_superuser = true")
    
    # Make user_type column not nullable
    op.alter_column('users', 'user_type', nullable=False)
    
    # Make company_id nullable for platform admins
    op.alter_column('users', 'company_id', nullable=True)
    
    # Add check constraint for company_id requirement
    op.create_check_constraint(
        'ck_company_required_for_non_platform_users',
        'users',
        "user_type = 'platform_admin' OR company_id IS NOT NULL"
    )
    
    # Create platform_audit_logs table
    op.create_table('platform_audit_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('company_id', sa.Integer(), nullable=True),
        sa.Column('action', sa.String(), nullable=False),
        sa.Column('resource_type', sa.String(), nullable=True),
        sa.Column('resource_id', sa.Integer(), nullable=True),
        sa.Column('details', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('ip_address', sa.String(), nullable=True),
        sa.Column('user_agent', sa.String(), nullable=True),
        sa.Column('timestamp', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for platform_audit_logs
    op.create_index('idx_platform_audit_logs_user_id', 'platform_audit_logs', ['user_id'])
    op.create_index('idx_platform_audit_logs_company_id', 'platform_audit_logs', ['company_id'])
    op.create_index('idx_platform_audit_logs_timestamp', 'platform_audit_logs', ['timestamp'])


def downgrade() -> None:
    """Remove platform administration improvements"""
    
    # Drop platform_audit_logs table
    op.drop_index('idx_platform_audit_logs_timestamp', table_name='platform_audit_logs')
    op.drop_index('idx_platform_audit_logs_company_id', table_name='platform_audit_logs')
    op.drop_index('idx_platform_audit_logs_user_id', table_name='platform_audit_logs')
    op.drop_table('platform_audit_logs')
    
    # Remove check constraint from users table
    op.drop_constraint('ck_company_required_for_non_platform_users', 'users', type_='check')
    
    # Remove foreign key constraint from users table
    op.drop_constraint('fk_users_default_company_id', 'users', type_='foreignkey')
    
    # Remove new columns from users table
    op.drop_column('users', 'updated_at')
    op.drop_column('users', 'created_at')
    op.drop_column('users', 'last_login')
    op.drop_column('users', 'default_company_id')
    op.drop_column('users', 'user_type')
    
    # Make company_id not nullable again
    op.alter_column('users', 'company_id', nullable=False)
    
    # Remove foreign key constraint from companies table
    op.drop_constraint('fk_companies_created_by_user_id', 'companies', type_='foreignkey')
    
    # Remove unique constraint from companies table
    op.drop_constraint('uq_companies_code', 'companies', type_='unique')
    
    # Remove new columns from companies table
    op.drop_column('companies', 'is_deleted')
    op.drop_column('companies', 'created_by_user_id')
    op.drop_column('companies', 'created_at')
    op.drop_column('companies', 'billing_email')
    op.drop_column('companies', 'primary_contact_email')
    op.drop_column('companies', 'user_limit')
    op.drop_column('companies', 'storage_limit_gb')
    op.drop_column('companies', 'subscription_expires')
    op.drop_column('companies', 'subscription_plan')
    op.drop_column('companies', 'subscription_status')
    op.drop_column('companies', 'code')
