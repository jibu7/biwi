"""Add missing BOM tables: material_requisitions and production_entries (minimal)

Revision ID: b37dba45024b
Revises: b8c9d0e1f2a3
Create Date: 2025-08-04 00:22:06.806432

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'b37dba45024b'
down_revision: Union[str, None] = 'b8c9d0e1f2a3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - only create truly missing tables."""
    # Get database inspector to check existing tables
    inspector = sa.inspect(op.get_bind())
    existing_tables = inspector.get_table_names()
    
    # Only create material_requisitions if it doesn't exist
    if 'material_requisitions' not in existing_tables:
        op.create_table('material_requisitions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('company_id', sa.Integer(), nullable=False),
        sa.Column('requisition_number', sa.String(), nullable=False),
        sa.Column('production_order_id', sa.Integer(), nullable=True),
        sa.Column('requested_by', sa.Integer(), nullable=False),
        sa.Column('requested_date', sa.DateTime(), nullable=False),
        sa.Column('required_date', sa.DateTime(), nullable=True),
        sa.Column('status', sa.String(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ),
        sa.ForeignKeyConstraint(['requested_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_material_requisitions_id'), 'material_requisitions', ['id'], unique=False)
    
    # Only create production_entries if it doesn't exist
    if 'production_entries' not in existing_tables:
        op.create_table('production_entries',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('company_id', sa.Integer(), nullable=False),
        sa.Column('production_order_id', sa.Integer(), nullable=True),
        sa.Column('item_id', sa.Integer(), nullable=False),
        sa.Column('quantity_produced', sa.Numeric(precision=15, scale=4), nullable=False),
        sa.Column('production_date', sa.DateTime(), nullable=False),
        sa.Column('recorded_by', sa.Integer(), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ),
        sa.ForeignKeyConstraint(['item_id'], ['items.id'], ),
        sa.ForeignKeyConstraint(['recorded_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_production_entries_id'), 'production_entries', ['id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_production_entries_id'), table_name='production_entries')
    op.drop_table('production_entries')
    op.drop_index(op.f('ix_material_requisitions_id'), table_name='material_requisitions')
    op.drop_table('material_requisitions')
