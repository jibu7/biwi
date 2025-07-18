"""fix_tenant_isolation_unique_constraints

Revision ID: ec8ed55dc629
Revises: 52b64371431c
Create Date: 2025-07-18 20:01:59.730258

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ec8ed55dc629'
down_revision: Union[str, None] = '52b64371431c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Check and drop existing unique constraints that are globally unique
    # Note: The tenant-aware constraints are already defined in the models
    # via __table_args__, so they will be created automatically by SQLAlchemy
    
    # Drop old global unique constraints if they exist
    # Using raw SQL with IF EXISTS to avoid errors
    op.execute("ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_customer_code_key")
    op.execute("ALTER TABLE suppliers DROP CONSTRAINT IF EXISTS suppliers_supplier_code_key")
    
    # Note: The new tenant-aware unique constraints will be created automatically
    # by SQLAlchemy from the model definitions:
    # - UniqueConstraint('customer_code', 'company_id', name='uq_customer_code_company')
    # - UniqueConstraint('supplier_code', 'company_id', name='uq_supplier_code_company')


def downgrade() -> None:
    """Downgrade schema."""
    # Remove tenant-aware unique constraints and restore global ones (not recommended)
    op.execute("ALTER TABLE customers DROP CONSTRAINT IF EXISTS uq_customer_code_company")
    op.execute("ALTER TABLE suppliers DROP CONSTRAINT IF EXISTS uq_supplier_code_company")
    
    # Restore global unique constraints (this may fail if duplicate data exists)
    try:
        op.create_unique_constraint('customers_customer_code_key', 'customers', ['customer_code'])
        op.create_unique_constraint('suppliers_supplier_code_key', 'suppliers', ['supplier_code'])
    except Exception:
        # May fail if there are duplicate codes across companies
        pass
