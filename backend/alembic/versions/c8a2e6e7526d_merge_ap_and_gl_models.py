"""merge ap and gl models

Revision ID: c8a2e6e7526d
Revises: 5822a316f21f, 7c9a5381f90f
Create Date: 2025-06-13 09:30:09.117110

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c8a2e6e7526d'
down_revision: Union[str, None] = ('5822a316f21f', '7c9a5381f90f')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
