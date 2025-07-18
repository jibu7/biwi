"""add_company_id_to_inventory_oe_models

Revision ID: ff859d8ad766
Revises: 190c3dc42451
Create Date: 2025-07-18 19:40:16.544686

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ff859d8ad766'
down_revision: Union[str, None] = '190c3dc42451'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
