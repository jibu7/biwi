"""Create AR models: Customer, SalesRepresentative, ARTransactionType, ARTransaction, ARAllocation, ARAllocationLine, ARDefaults

Revision ID: c6e5f8a9b3d1
Revises: b7d8e9f4c5a2
Create Date: 2025-06-12 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'c6e5f8a9b3d1'
down_revision: Union[str, None] = 'b7d8e9f4c5a2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create sales_representatives table
    op.create_table('sales_representatives',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('company_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('contact_info', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True, default=True),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_sales_representatives_id'), 'sales_representatives', ['id'], unique=False)

    # Create customers table
    op.create_table('customers',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('company_id', sa.Integer(), nullable=False),
        sa.Column('customer_code', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('address', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('contact_info', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('payment_terms', sa.String(), nullable=True),
        sa.Column('credit_limit', sa.Numeric(precision=15, scale=2), nullable=True, default=0.00),
        sa.Column('current_balance', sa.Numeric(precision=15, scale=2), nullable=True, default=0.00),
        sa.Column('sales_representative_id', sa.Integer(), nullable=True),
        sa.Column('default_ar_gl_account_id', sa.Integer(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True, default=True),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ),
        sa.ForeignKeyConstraint(['default_ar_gl_account_id'], ['gl_accounts.id'], ),
        sa.ForeignKeyConstraint(['sales_representative_id'], ['sales_representatives.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('customer_code', 'company_id', name='uq_customer_code_company')
    )
    op.create_index(op.f('ix_customers_customer_code'), 'customers', ['customer_code'], unique=True)
    op.create_index(op.f('ix_customers_id'), 'customers', ['id'], unique=False)

    # Create ar_transaction_types table
    op.create_table('ar_transaction_types',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('company_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('base_type', sa.String(), nullable=False),
        sa.Column('default_gl_account_id', sa.Integer(), nullable=True),
        sa.Column('default_ar_control_gl_account_id', sa.Integer(), nullable=True),
        sa.Column('affects_balance_direction', sa.String(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=True, default=True),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ),
        sa.ForeignKeyConstraint(['default_ar_control_gl_account_id'], ['gl_accounts.id'], ),
        sa.ForeignKeyConstraint(['default_gl_account_id'], ['gl_accounts.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name', 'company_id', name='uq_artransactiontype_name_company')
    )
    op.create_index(op.f('ix_ar_transaction_types_id'), 'ar_transaction_types', ['id'], unique=False)

    # Create ar_transactions table
    op.create_table('ar_transactions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('company_id', sa.Integer(), nullable=False),
        sa.Column('customer_id', sa.Integer(), nullable=False),
        sa.Column('ar_transaction_type_id', sa.Integer(), nullable=False),
        sa.Column('linked_gl_journal_entry_id', sa.Integer(), nullable=True),
        sa.Column('sales_order_id', sa.Integer(), nullable=True),
        sa.Column('transaction_date', sa.Date(), nullable=False),
        sa.Column('due_date', sa.Date(), nullable=True),
        sa.Column('reference', sa.String(), nullable=True),
        sa.Column('document_number', sa.String(), nullable=False),
        sa.Column('total_amount', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('open_amount', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('is_posted_to_gl', sa.Boolean(), nullable=True, default=False),
        sa.Column('status', sa.String(), nullable=False, default='Draft'),
        sa.ForeignKeyConstraint(['ar_transaction_type_id'], ['ar_transaction_types.id'], ),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ),
        sa.ForeignKeyConstraint(['customer_id'], ['customers.id'], ),
        sa.ForeignKeyConstraint(['linked_gl_journal_entry_id'], ['gl_journal_entries.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('document_number', 'company_id', 'ar_transaction_type_id', 
                           name='uq_ar_doc_number_company_type')
    )
    op.create_index(op.f('ix_ar_transactions_id'), 'ar_transactions', ['id'], unique=False)

    # Create ar_allocations table
    op.create_table('ar_allocations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('company_id', sa.Integer(), nullable=False),
        sa.Column('allocation_date', sa.Date(), nullable=False),
        sa.Column('customer_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ),
        sa.ForeignKeyConstraint(['customer_id'], ['customers.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_ar_allocations_id'), 'ar_allocations', ['id'], unique=False)

    # Create ar_allocation_lines table
    op.create_table('ar_allocation_lines',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('ar_allocation_id', sa.Integer(), nullable=False),
        sa.Column('debit_transaction_id', sa.Integer(), nullable=False),
        sa.Column('credit_transaction_id', sa.Integer(), nullable=False),
        sa.Column('allocated_amount', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.ForeignKeyConstraint(['ar_allocation_id'], ['ar_allocations.id'], ),
        sa.ForeignKeyConstraint(['credit_transaction_id'], ['ar_transactions.id'], ),
        sa.ForeignKeyConstraint(['debit_transaction_id'], ['ar_transactions.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_ar_allocation_lines_id'), 'ar_allocation_lines', ['id'], unique=False)

    # Create ar_defaults table
    op.create_table('ar_defaults',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('company_id', sa.Integer(), nullable=False),
        sa.Column('default_ar_control_gl_account_id', sa.Integer(), nullable=True),
        sa.Column('default_sales_gl_account_id', sa.Integer(), nullable=True),
        sa.Column('default_receipt_gl_account_id', sa.Integer(), nullable=True),
        sa.Column('default_sales_discount_gl_account_id', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ),
        sa.ForeignKeyConstraint(['default_ar_control_gl_account_id'], ['gl_accounts.id'], ),
        sa.ForeignKeyConstraint(['default_receipt_gl_account_id'], ['gl_accounts.id'], ),
        sa.ForeignKeyConstraint(['default_sales_discount_gl_account_id'], ['gl_accounts.id'], ),
        sa.ForeignKeyConstraint(['default_sales_gl_account_id'], ['gl_accounts.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('company_id', name='uq_ar_defaults_company_id')
    )
    op.create_index(op.f('ix_ar_defaults_id'), 'ar_defaults', ['id'], unique=False)


def downgrade() -> None:
    # Drop tables in reverse order due to foreign key constraints
    op.drop_index(op.f('ix_ar_defaults_id'), table_name='ar_defaults')
    op.drop_table('ar_defaults')
    
    op.drop_index(op.f('ix_ar_allocation_lines_id'), table_name='ar_allocation_lines')
    op.drop_table('ar_allocation_lines')
    
    op.drop_index(op.f('ix_ar_allocations_id'), table_name='ar_allocations')
    op.drop_table('ar_allocations')
    
    op.drop_index(op.f('ix_ar_transactions_id'), table_name='ar_transactions')
    op.drop_table('ar_transactions')
    
    op.drop_index(op.f('ix_ar_transaction_types_id'), table_name='ar_transaction_types')
    op.drop_table('ar_transaction_types')
    
    op.drop_index(op.f('ix_customers_id'), table_name='customers')
    op.drop_index(op.f('ix_customers_customer_code'), table_name='customers')
    op.drop_table('customers')
    
    op.drop_index(op.f('ix_sales_representatives_id'), table_name='sales_representatives')
    op.drop_table('sales_representatives')
