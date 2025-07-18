"""remove_global_unique_indexes

Revision ID: 190c3dc42451
Revises: ec8ed55dc629
Create Date: 2025-07-18 20:15:45.276712

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '190c3dc42451'
down_revision: Union[str, None] = 'ec8ed55dc629'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Remove remaining global unique indexes that conflict with tenant isolation."""
    # Drop the global unique indexes that were created automatically by SQLAlchemy
    # These prevent proper tenant isolation
    op.execute("DROP INDEX IF EXISTS ix_customers_customer_code")
    op.execute("DROP INDEX IF EXISTS ix_suppliers_supplier_code")


def downgrade() -> None:
    """Restore global unique indexes (not recommended for multi-tenant)."""
    # Restore the global unique indexes (may fail if duplicate data exists)
    try:
        op.create_index('ix_customers_customer_code', 'customers', ['customer_code'], unique=True)
        op.create_index('ix_suppliers_supplier_code', 'suppliers', ['supplier_code'], unique=True)
    except Exception:
        # May fail if there are duplicate codes across companies
        pass
