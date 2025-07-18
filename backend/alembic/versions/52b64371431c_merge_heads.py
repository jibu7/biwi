"""Merge heads

Revision ID: 52b64371431c
Revises: a1b2c3d4e5f6, c2dd6c57576a
Create Date: 2025-07-18 13:07:32.280688

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '52b64371431c'
down_revision: Union[str, None] = ('a1b2c3d4e5f6', 'c2dd6c57576a')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
