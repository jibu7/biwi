"""Merge feedback system and tax configuration migrations

Revision ID: b7b664b3df79
Revises: a9b8c7d6e5f4, f1a2b3c4d5e6
Create Date: 2025-08-02 00:37:20.980811

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b7b664b3df79'
down_revision: Union[str, None] = ('a9b8c7d6e5f4', 'f1a2b3c4d5e6')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
