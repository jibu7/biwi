"""convert_subscription_status_to_string

Revision ID: 8d55acdfad4d
Revises: 62436246ee6e
Create Date: 2025-07-21 10:18:07.141847

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '8d55acdfad4d'
down_revision: Union[str, None] = '62436246ee6e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    """Upgrade schema."""
    # First, remove the default value from the column
    op.alter_column('companies', 'subscription_status', server_default=None)

    # Convert columns using the enum to plain strings first
    op.alter_column('companies', 'subscription_status',
        type_=sa.String(length=20),
        postgresql_using='subscription_status::text')
        
    op.alter_column('company_subscriptions', 'status',
        type_=sa.String(length=20),
        postgresql_using='status::text')

    # Now that no columns use the enum, it can be safely dropped.
    op.execute("DROP TYPE subscriptionstatus;")

    # Set the new default value
    op.alter_column('companies', 'subscription_status', server_default='trial')

def downgrade() -> None:
    """Downgrade schema."""
    # Create the enum type again
    subscriptionstatus = postgresql.ENUM('TRIAL', 'ACTIVE', 'SUSPENDED', 'CANCELLED', name='subscriptionstatus')
    subscriptionstatus.create(op.get_bind())

    # Convert columns back to the enum type
    op.alter_column('companies', 'subscription_status',
        type_=sa.Enum('TRIAL', 'ACTIVE', 'SUSPENDED', 'CANCELLED', name='subscriptionstatus', create_type=False),
        postgresql_using="subscription_status::subscriptionstatus")

    op.alter_column('company_subscriptions', 'status',
        type_=sa.Enum('TRIAL', 'ACTIVE', 'SUSPENDED', 'CANCELLED', name='subscriptionstatus', create_type=False),
        postgresql_using="status::subscriptionstatus")
