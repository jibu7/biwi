"""add_internationalization_columns

Revision ID: cc82585ad554
Revises: 2025080501
Create Date: 2025-08-05 01:13:03.308396

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'cc82585ad554'
down_revision: Union[str, None] = '2025080501'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
