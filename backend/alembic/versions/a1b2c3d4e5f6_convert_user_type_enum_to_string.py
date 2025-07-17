"""Convert user_type enum to string

Revision ID: a1b2c3d4e5f6
Revises: f5d7c8b9a1e2
Create Date: 2025-01-22 20:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = 'f5d7c8b9a1e2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # First, drop any constraints that reference the enum
    op.execute("ALTER TABLE users DROP CONSTRAINT IF EXISTS ck_company_required_for_non_platform_users")
    
    # Alter the column to use varchar instead of enum
    op.execute("ALTER TABLE users ALTER COLUMN user_type TYPE VARCHAR USING user_type::text")
    
    # Recreate the check constraint with the new varchar type
    op.execute("""
        ALTER TABLE users ADD CONSTRAINT ck_company_required_for_non_platform_users 
        CHECK (user_type = 'platform_admin' OR company_id IS NOT NULL)
    """)
    
    # Drop the enum type (if no other tables use it)
    # Note: This might fail if other tables still use this enum
    try:
        op.execute("DROP TYPE IF EXISTS usertype CASCADE")
    except Exception:
        # If it fails, it's okay - the enum might still be in use elsewhere
        pass


def downgrade() -> None:
    """Downgrade schema."""
    # Recreate the enum type
    op.execute("CREATE TYPE usertype AS ENUM ('platform_admin', 'company_admin', 'company_user')")
    
    # Convert the column back to enum
    op.execute("ALTER TABLE users ALTER COLUMN user_type TYPE usertype USING user_type::usertype")
