"""add multi tenant support

Revision ID: beb4f4aa9311
Revises: 34de23dec61f
Create Date: 2025-07-17 04:57:27.521029

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'beb4f4aa9311'
down_revision: Union[str, None] = '34de23dec61f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    # Create enums
    user_type_enum = postgresql.ENUM('platform_admin', 'company_admin', 'company_user', name='usertype')
    subscription_status_enum = postgresql.ENUM('trial', 'active', 'suspended', 'cancelled', name='subscriptionstatus')
    
    user_type_enum.create(op.get_bind())
    subscription_status_enum.create(op.get_bind())
    
    # Update companies table
    op.add_column('companies', sa.Column('code', sa.String(10), nullable=True))
    op.add_column('companies', sa.Column('subscription_status', subscription_status_enum, nullable=False, server_default='trial'))
    op.add_column('companies', sa.Column('subscription_plan', sa.String(50), nullable=True))
    op.add_column('companies', sa.Column('subscription_expires', sa.Date(), nullable=True))
    op.add_column('companies', sa.Column('storage_limit_gb', sa.Integer(), nullable=False, server_default='10'))
    op.add_column('companies', sa.Column('user_limit', sa.Integer(), nullable=False, server_default='5'))
    op.add_column('companies', sa.Column('primary_contact_email', sa.String(255), nullable=True))
    op.add_column('companies', sa.Column('billing_email', sa.String(255), nullable=True))
    op.add_column('companies', sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()))
    op.add_column('companies', sa.Column('created_by_user_id', sa.Integer(), nullable=True))
    op.add_column('companies', sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('companies', sa.Column('deleted_at', sa.DateTime(), nullable=True))
    
    # Generate codes for existing companies
    op.execute("""
        UPDATE companies 
        SET code = 'COMP' || LPAD(id::text, 4, '0')
        WHERE code IS NULL
    """)
    
    # Make code not nullable and unique
    op.alter_column('companies', 'code', nullable=False)
    op.create_unique_constraint('uq_company_code', 'companies', ['code'])
    op.create_index('idx_company_code', 'companies', ['code'])
    
    # Update users table
    op.add_column('users', sa.Column('user_type', user_type_enum, nullable=False, server_default='company_user'))
    op.add_column('users', sa.Column('default_company_id', sa.Integer(), nullable=True))
    op.add_column('users', sa.Column('last_login', sa.DateTime(), nullable=True))
    op.add_column('users', sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()))
    op.add_column('users', sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()))
    op.add_column('users', sa.Column('mfa_secret', sa.String(), nullable=True))
    
    # Make company_id nullable for platform admins
    op.alter_column('users', 'company_id', nullable=True)
    
    # Add foreign keys
    op.create_foreign_key('fk_users_default_company', 'users', 'companies', ['default_company_id'], ['id'])
    op.create_foreign_key('fk_companies_created_by_user', 'companies', 'users', ['created_by_user_id'], ['id'])
    
    # Add check constraint
    op.create_check_constraint(
        'ck_company_required_for_non_platform_users',
        'users',
        "user_type = 'platform_admin' OR company_id IS NOT NULL"
    )
    
    # Create platform_audit_logs table
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
    
    # Create indexes for platform_audit_logs
    op.create_index('idx_platform_audit_logs_user_id', 'platform_audit_logs', ['user_id'])
    op.create_index('idx_platform_audit_logs_company_id', 'platform_audit_logs', ['company_id'])
    op.create_index('idx_platform_audit_logs_timestamp', 'platform_audit_logs', ['timestamp'])
    op.create_index('idx_platform_audit_logs_action', 'platform_audit_logs', ['action'])
    op.create_index('idx_platform_audit_company_timestamp', 'platform_audit_logs', ['company_id', 'timestamp'])
    op.create_index('idx_platform_audit_user_timestamp', 'platform_audit_logs', ['user_id', 'timestamp'])
    
    # Create resource_usage table
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
    
    # Create billing_configurations table
    op.create_table('billing_configurations',
        sa.Column('company_id', sa.Integer(), nullable=False),
        sa.Column('billing_provider', sa.String(), nullable=False, server_default='stripe'),
        sa.Column('customer_id', sa.String(), nullable=True),
        sa.Column('subscription_id', sa.String(), nullable=True),
        sa.Column('payment_method_id', sa.String(), nullable=True),
        sa.Column('billing_cycle', sa.String(), nullable=False, server_default='monthly'),
        sa.Column('next_billing_date', sa.Date(), nullable=True),
        sa.Column('custom_pricing', postgresql.JSONB(), nullable=True),
        sa.Column('discount_percentage', sa.Numeric(precision=5, scale=2), nullable=False, server_default='0'),
        sa.PrimaryKeyConstraint('company_id'),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], )
    )
    
    # Create usage_alerts table
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
    
    # Add missing company_id columns to tables that need them
    tables_needing_company_id = [
        'gl_transaction_types',
        # Add other tables as identified
    ]
    
    for table in tables_needing_company_id:
        try:
            op.add_column(table, sa.Column('company_id', sa.Integer(), nullable=True))
            
            # Set company_id from related records
            if table == 'gl_transaction_types':
                op.execute(f"""
                    UPDATE {table} 
                    SET company_id = (SELECT company_id FROM gl_defaults LIMIT 1)
                    WHERE company_id IS NULL
                """)
            
            # Make not nullable after setting values
            op.alter_column(table, 'company_id', nullable=False)
            
            # Add foreign key
            op.create_foreign_key(f'fk_{table}_company', table, 'companies', ['company_id'], ['id'])
            
            # Add index
            op.create_index(f'idx_{table}_company', table, ['company_id'])
            
        except Exception as e:
            print(f"Skipping {table}, may already have company_id: {e}")
    
    # Update existing superusers to platform_admin
    op.execute("UPDATE users SET user_type = 'platform_admin' WHERE is_superuser = TRUE")
    
    # Add composite unique constraints
    unique_constraints = [
        ('gl_accounts', 'account_code', 'uq_glaccount_code_company'),
        ('customers', 'customer_code', 'uq_customer_code_company'),
        ('suppliers', 'supplier_code', 'uq_supplier_code_company'),
        ('inventory_items', 'item_code', 'uq_item_code_company'),
        ('warehouses', 'name', 'uq_warehouse_name_company'),
        ('unit_of_measures', 'name', 'uq_uom_name_company'),
        ('currencies', 'code', 'uq_currency_code_company'),
        ('tax_types', 'name', 'uq_taxtype_name_company'),
        ('branches', 'name', 'uq_branch_name_company'),
    ]
    
    for table, column, constraint_name in unique_constraints:
        try:
            # Drop existing unique constraint if it exists
            op.drop_constraint(f'{table}_{column}_key', table, type_='unique')
        except:
            pass
        
        # Create new composite unique constraint
        op.create_unique_constraint(constraint_name, table, [column, 'company_id'])
    
    # Add performance indexes
    performance_indexes = [
        ('gl_journal_entries', ['company_id', 'entry_date'], 'idx_gl_je_company_date'),
        ('gl_journal_entries', ['company_id', 'status'], 'idx_gl_je_company_status'),
        ('ar_transactions', ['company_id', 'customer_id'], 'idx_ar_trans_company_customer'),
        ('ar_transactions', ['company_id', 'transaction_date'], 'idx_ar_trans_company_date'),
        ('ap_transactions', ['company_id', 'supplier_id'], 'idx_ap_trans_company_supplier'),
        ('inventory_transactions', ['company_id', 'item_id'], 'idx_inv_trans_company_item'),
        ('sales_orders', ['company_id', 'customer_id'], 'idx_so_company_customer'),
        ('purchase_orders', ['company_id', 'supplier_id'], 'idx_po_company_supplier'),
    ]
    
    for table, columns, index_name in performance_indexes:
        try:
            op.create_index(index_name, table, columns)
        except:
            pass


def downgrade():
    # Drop all new tables
    op.drop_table('usage_alerts')
    op.drop_table('billing_configurations')
    op.drop_table('resource_usage')
    op.drop_table('platform_audit_logs')
    
    # Remove constraints and columns
    op.drop_constraint('ck_company_required_for_non_platform_users', 'users')
    op.drop_constraint('fk_users_default_company', 'users')
    
    # Drop columns from users
    op.drop_column('users', 'mfa_secret')
    op.drop_column('users', 'updated_at')
    op.drop_column('users', 'created_at')
    op.drop_column('users', 'last_login')
    op.drop_column('users', 'default_company_id')
    op.drop_column('users', 'user_type')
    
    # Make company_id not nullable again
    op.alter_column('users', 'company_id', nullable=False)
    
    # Drop columns from companies
    op.drop_constraint('fk_companies_created_by_user', 'companies')
    op.drop_column('companies', 'deleted_at')
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
    op.drop_constraint('uq_company_code', 'companies')
    op.drop_column('companies', 'code')
    
    # Drop enums
    sa.Enum(name='usertype').drop(op.get_bind())
    sa.Enum(name='subscriptionstatus').drop(op.get_bind())
