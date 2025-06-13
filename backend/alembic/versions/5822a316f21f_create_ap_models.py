"""Create AP models: Supplier, APTransactionType, APTransaction, APAllocation, APAllocationLine, APDefaults

Revision ID: 5822a316f21f
Revises: c6e5f8a9b3d1
Create Date: 2025-06-13 08:25:49.470745

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '5822a316f21f'
down_revision: Union[str, None] = 'c6e5f8a9b3d1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create AP tables."""
    # Create suppliers table
    op.create_table('suppliers',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('company_id', sa.Integer(), nullable=False),
        sa.Column('supplier_code', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('address', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('contact_info', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('payment_terms', sa.String(), nullable=True),
        sa.Column('current_balance', sa.Numeric(precision=15, scale=2), nullable=True, default=0.00),
        sa.Column('default_ap_gl_account_id', sa.Integer(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True, default=True),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ),
        sa.ForeignKeyConstraint(['default_ap_gl_account_id'], ['gl_accounts.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('supplier_code', 'company_id', name='uq_supplier_code_company')
    )
    op.create_index(op.f('ix_suppliers_id'), 'suppliers', ['id'], unique=False)
    op.create_index(op.f('ix_suppliers_supplier_code'), 'suppliers', ['supplier_code'], unique=True)

    # Create ap_transaction_types table
    op.create_table('ap_transaction_types',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('company_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('base_type', sa.String(), nullable=False),
        sa.Column('default_gl_account_id', sa.Integer(), nullable=True),
        sa.Column('default_ap_control_gl_account_id', sa.Integer(), nullable=True),
        sa.Column('affects_balance_direction', sa.String(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=True, default=True),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ),
        sa.ForeignKeyConstraint(['default_gl_account_id'], ['gl_accounts.id'], ),
        sa.ForeignKeyConstraint(['default_ap_control_gl_account_id'], ['gl_accounts.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name', 'company_id', name='uq_aptransactiontype_name_company')
    )
    op.create_index(op.f('ix_ap_transaction_types_id'), 'ap_transaction_types', ['id'], unique=False)

    # Create ap_transactions table
    op.create_table('ap_transactions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('company_id', sa.Integer(), nullable=False),
        sa.Column('supplier_id', sa.Integer(), nullable=False),
        sa.Column('ap_transaction_type_id', sa.Integer(), nullable=False),
        sa.Column('linked_gl_journal_entry_id', sa.Integer(), nullable=True),
        sa.Column('purchase_order_id', sa.Integer(), nullable=True),
        sa.Column('transaction_date', sa.Date(), nullable=False),
        sa.Column('due_date', sa.Date(), nullable=True),
        sa.Column('reference', sa.String(), nullable=True),
        sa.Column('document_number', sa.String(), nullable=False),
        sa.Column('total_amount', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('open_amount', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('is_posted_to_gl', sa.Boolean(), nullable=True, default=False),
        sa.Column('status', sa.String(), nullable=False, default='Draft'),
        sa.ForeignKeyConstraint(['ap_transaction_type_id'], ['ap_transaction_types.id'], ),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ),
        sa.ForeignKeyConstraint(['linked_gl_journal_entry_id'], ['gl_journal_entries.id'], ),
        sa.ForeignKeyConstraint(['supplier_id'], ['suppliers.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('document_number', 'company_id', 'ap_transaction_type_id', 
                          name='uq_ap_doc_number_company_type')
    )
    op.create_index(op.f('ix_ap_transactions_id'), 'ap_transactions', ['id'], unique=False)

    # Create ap_allocations table
    op.create_table('ap_allocations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('company_id', sa.Integer(), nullable=False),
        sa.Column('allocation_date', sa.Date(), nullable=False),
        sa.Column('supplier_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ),
        sa.ForeignKeyConstraint(['supplier_id'], ['suppliers.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_ap_allocations_id'), 'ap_allocations', ['id'], unique=False)

    # Create ap_allocation_lines table
    op.create_table('ap_allocation_lines',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('ap_allocation_id', sa.Integer(), nullable=False),
        sa.Column('credit_transaction_id', sa.Integer(), nullable=False),
        sa.Column('debit_transaction_id', sa.Integer(), nullable=False),
        sa.Column('allocated_amount', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.ForeignKeyConstraint(['ap_allocation_id'], ['ap_allocations.id'], ),
        sa.ForeignKeyConstraint(['credit_transaction_id'], ['ap_transactions.id'], ),
        sa.ForeignKeyConstraint(['debit_transaction_id'], ['ap_transactions.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_ap_allocation_lines_id'), 'ap_allocation_lines', ['id'], unique=False)

    # Create ap_defaults table
    op.create_table('ap_defaults',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('company_id', sa.Integer(), nullable=False),
        sa.Column('default_ap_control_gl_account_id', sa.Integer(), nullable=True),
        sa.Column('default_expense_gl_account_id', sa.Integer(), nullable=True),
        sa.Column('default_payment_gl_account_id', sa.Integer(), nullable=True),
        sa.Column('default_purchase_discount_gl_account_id', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ),
        sa.ForeignKeyConstraint(['default_ap_control_gl_account_id'], ['gl_accounts.id'], ),
        sa.ForeignKeyConstraint(['default_expense_gl_account_id'], ['gl_accounts.id'], ),
        sa.ForeignKeyConstraint(['default_payment_gl_account_id'], ['gl_accounts.id'], ),
        sa.ForeignKeyConstraint(['default_purchase_discount_gl_account_id'], ['gl_accounts.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('company_id')
    )
    op.create_index(op.f('ix_ap_defaults_id'), 'ap_defaults', ['id'], unique=False)


def downgrade() -> None:
    """Drop AP tables."""
    # Drop tables in reverse order due to foreign key dependencies
    op.drop_index(op.f('ix_ap_defaults_id'), table_name='ap_defaults')
    op.drop_table('ap_defaults')
    
    op.drop_index(op.f('ix_ap_allocation_lines_id'), table_name='ap_allocation_lines')
    op.drop_table('ap_allocation_lines')
    
    op.drop_index(op.f('ix_ap_allocations_id'), table_name='ap_allocations')
    op.drop_table('ap_allocations')
    
    op.drop_index(op.f('ix_ap_transactions_id'), table_name='ap_transactions')
    op.drop_table('ap_transactions')
    
    op.drop_index(op.f('ix_ap_transaction_types_id'), table_name='ap_transaction_types')
    op.drop_table('ap_transaction_types')
    
    op.drop_index(op.f('ix_suppliers_supplier_code'), table_name='suppliers')
    op.drop_index(op.f('ix_suppliers_id'), table_name='suppliers')
    op.drop_table('suppliers')
