"""add is_base_unit field with default values

Revision ID: de03255fae9f
Revises: 8d55acdfad4d
Create Date: 2025-07-25 11:35:14.309118

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'de03255fae9f'
down_revision: Union[str, None] = '8d55acdfad4d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add is_base_unit field to unit_of_measures table with proper handling of existing data"""
    
    # Step 1: Add the column as nullable first
    op.add_column('unit_of_measures', sa.Column('is_base_unit', sa.Boolean(), nullable=True))
    
    # Step 2: Set default value for existing records (all false initially)
    op.execute("UPDATE unit_of_measures SET is_base_unit = false WHERE is_base_unit IS NULL")
    
    # Step 3: For each company, set the first unit (ordered by ID) as the base unit
    op.execute("""
        UPDATE unit_of_measures 
        SET is_base_unit = true 
        WHERE id IN (
            SELECT DISTINCT ON (company_id) id 
            FROM unit_of_measures 
            ORDER BY company_id, id ASC
        )
    """)
    
    # Step 4: Make the column NOT NULL now that all rows have values
    op.alter_column('unit_of_measures', 'is_base_unit', nullable=False)
    
    # Step 5: Add unique constraint to ensure only one base unit per company
    op.create_index(
        'ix_company_base_unit', 
        'unit_of_measures', 
        ['company_id', 'is_base_unit'], 
        unique=True, 
        postgresql_where=sa.text('is_base_unit = true')
    )
    
    # Step 6: Add regular indexes for better performance
    op.create_index('ix_uom_company', 'unit_of_measures', ['company_id'], unique=False)
    op.create_unique_constraint('uq_uom_abbrev_company', 'unit_of_measures', ['abbreviation', 'company_id'])


def downgrade() -> None:
    """Remove is_base_unit field and related constraints"""
    
    # Remove constraints and indexes
    op.drop_constraint('uq_uom_abbrev_company', 'unit_of_measures', type_='unique')
    op.drop_index('ix_uom_company', table_name='unit_of_measures')
    op.drop_index('ix_company_base_unit', table_name='unit_of_measures', postgresql_where=sa.text('is_base_unit = true'))
    
    # Remove the column
    op.drop_column('unit_of_measures', 'is_base_unit')
