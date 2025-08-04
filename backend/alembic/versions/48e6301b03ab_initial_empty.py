"""initial_empty

Revision ID: 48e6301b03ab
Revises: 
Create Date: 2025-08-04 22:38:13.706764

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '48e6301b03ab'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    from sqlalchemy.dialects import postgresql

    billingplantype = postgresql.ENUM('trial', 'basic', 'professional', 'enterprise', 'custom', name='billingplantype')
    billingplantype.create(op.get_bind(), checkfirst=True)

    usagemetrictype = postgresql.ENUM('API_CALLS', 'STORAGE', 'USERS', 'TRANSACTIONS', 'CUSTOM', name='usagemetrictype')
    usagemetrictype.create(op.get_bind(), checkfirst=True)


def downgrade() -> None:
    """Downgrade schema."""
    pass
