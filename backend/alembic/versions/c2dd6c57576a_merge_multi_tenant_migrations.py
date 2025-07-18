"""merge multi tenant migrations

Revision ID: c2dd6c57576a
Revises: 2a54a6f768c3, beb4f4aa9311
Create Date: 2025-07-17 10:06:40.512099

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c2dd6c57576a'
down_revision: Union[str, None] = ('2a54a6f768c3', 'beb4f4aa9311')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
