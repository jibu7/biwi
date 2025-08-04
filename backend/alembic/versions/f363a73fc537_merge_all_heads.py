"""merge_all_heads

Revision ID: f363a73fc537
Revises: 8ad3711ab3b0, f35b1fc66465, 48e6301b03ab
Create Date: 2025-08-04 22:39:04.267854

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f363a73fc537'
down_revision: Union[str, None] = ('8ad3711ab3b0', 'f35b1fc66465', '48e6301b03ab')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
