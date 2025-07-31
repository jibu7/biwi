"""Add tax configuration to GL transaction types

Revision ID: f1a2b3c4d5e6
Revises: 802fdf577b87
Create Date: 2025-07-31 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f1a2b3c4d5e6'
down_revision: Union[str, None] = '802fdf577b87'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create the enum type first
    tax_calculation_method_enum = sa.Enum('NONE', 'INCLUSIVE', 'EXCLUSIVE', name='taxcalculationmethod')
    tax_calculation_method_enum.create(op.get_bind(), checkfirst=True)
    
    # Add tax configuration fields to gl_transaction_types
    op.add_column('gl_transaction_types', sa.Column('is_tax_applicable', sa.Boolean(), nullable=True, default=False))
    op.add_column('gl_transaction_types', sa.Column('tax_rate', sa.Numeric(precision=5, scale=2), nullable=True))
    op.add_column('gl_transaction_types', sa.Column('tax_calculation_method', tax_calculation_method_enum, nullable=True, default='NONE'))
    op.add_column('gl_transaction_types', sa.Column('tax_type_id', sa.Integer(), nullable=True))
    
    # Add foreign key constraint for tax_type_id
    op.create_foreign_key('fk_gl_transaction_types_tax_type_id', 'gl_transaction_types', 'tax_types', ['tax_type_id'], ['id'])
    
    # Add tax support fields to gl_journal_entry_lines
    op.add_column('gl_journal_entry_lines', sa.Column('is_tax_line', sa.Boolean(), nullable=True, default=False))
    op.add_column('gl_journal_entry_lines', sa.Column('tax_base_amount', sa.Numeric(precision=15, scale=2), nullable=True))
    
    # Add transaction_type_id to gl_journal_entries
    op.add_column('gl_journal_entries', sa.Column('transaction_type_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_gl_journal_entries_transaction_type_id', 'gl_journal_entries', 'gl_transaction_types', ['transaction_type_id'], ['id'])
    
    # Set default values for existing records
    op.execute("UPDATE gl_transaction_types SET is_tax_applicable = false WHERE is_tax_applicable IS NULL")
    op.execute("UPDATE gl_transaction_types SET tax_calculation_method = 'NONE' WHERE tax_calculation_method IS NULL")
    op.execute("UPDATE gl_journal_entry_lines SET is_tax_line = false WHERE is_tax_line IS NULL")
    
    # Make the columns not nullable now that we have default values
    op.alter_column('gl_transaction_types', 'is_tax_applicable', nullable=False)
    op.alter_column('gl_transaction_types', 'tax_calculation_method', nullable=False)
    op.alter_column('gl_journal_entry_lines', 'is_tax_line', nullable=False)


def downgrade() -> None:
    # Remove foreign key constraints
    op.drop_constraint('fk_gl_journal_entries_transaction_type_id', 'gl_journal_entries', type_='foreignkey')
    op.drop_constraint('fk_gl_transaction_types_tax_type_id', 'gl_transaction_types', type_='foreignkey')
    
    # Remove columns from gl_journal_entries
    op.drop_column('gl_journal_entries', 'transaction_type_id')
    
    # Remove columns from gl_journal_entry_lines
    op.drop_column('gl_journal_entry_lines', 'tax_base_amount')
    op.drop_column('gl_journal_entry_lines', 'is_tax_line')
    
    # Remove columns from gl_transaction_types
    op.drop_column('gl_transaction_types', 'tax_type_id')
    op.drop_column('gl_transaction_types', 'tax_calculation_method')
    op.drop_column('gl_transaction_types', 'tax_rate')
    op.drop_column('gl_transaction_types', 'is_tax_applicable')
    
    # Drop the enum type
    sa.Enum(name='taxcalculationmethod').drop(op.get_bind(), checkfirst=True)
