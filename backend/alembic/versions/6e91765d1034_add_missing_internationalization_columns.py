"""add_missing_internationalization_columns

Revision ID: 6e91765d1034
Revises: 3b75312144d6
Create Date: 2025-08-05 00:40:09.434049

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6e91765d1034'
down_revision: Union[str, None] = '3b75312144d6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add internationalization columns to companies table
    with op.batch_alter_table('companies') as batch_op:
        batch_op.add_column(sa.Column('date_format', sa.String(20), nullable=False, server_default='YYYY-MM-DD'))
        batch_op.add_column(sa.Column('time_format', sa.String(10), nullable=False, server_default='24h'))
        batch_op.add_column(sa.Column('decimal_separator', sa.String(1), nullable=False, server_default='.'))
        batch_op.add_column(sa.Column('thousand_separator', sa.String(1), nullable=False, server_default=','))
        batch_op.add_column(sa.Column('currency_position', sa.String(10), nullable=False, server_default='prefix'))
    
    # Add internationalization columns to users table
    with op.batch_alter_table('users') as batch_op:
        batch_op.add_column(sa.Column('date_format_override', sa.String(20), nullable=True))
        batch_op.add_column(sa.Column('locale', sa.String(10), nullable=False, server_default='en-US'))
        batch_op.add_column(sa.Column('timezone', sa.String(50), nullable=False, server_default='UTC'))


def downgrade() -> None:
    """Downgrade schema."""
    # Remove internationalization columns from users table
    with op.batch_alter_table('users') as batch_op:
        batch_op.drop_column('timezone')
        batch_op.drop_column('locale')
        batch_op.drop_column('date_format_override')
    
    # Remove internationalization columns from companies table
    with op.batch_alter_table('companies') as batch_op:
        batch_op.drop_column('currency_position')
        batch_op.drop_column('thousand_separator')
        batch_op.drop_column('decimal_separator')
        batch_op.drop_column('time_format')
        batch_op.drop_column('date_format')
