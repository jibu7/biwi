"""Fix enum types for production deployment

Revision ID: 1be7468c7e9d
Revises: 446a9e672597
Create Date: 2025-08-04 14:15:36.125832

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1be7468c7e9d'
down_revision: Union[str, None] = '446a9e672597'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - Create all required enum types for production deployment."""
    
    # Get connection for enum type creation
    connection = op.get_bind()
    
    # Create all required enum types if they don't exist
    # This fixes the production deployment issue where enum types are missing
    
    connection.execute(sa.text("""
        DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'billingplantype') THEN
                CREATE TYPE billingplantype AS ENUM ('trial', 'basic', 'professional', 'enterprise', 'custom');
            END IF;
        END $$;
    """))
    
    connection.execute(sa.text("""
        DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscriptionstatus') THEN
                CREATE TYPE subscriptionstatus AS ENUM ('trial', 'active', 'cancelled', 'expired');
            END IF;
        END $$;
    """))
    
    connection.execute(sa.text("""
        DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'usagemetrictype') THEN
                CREATE TYPE usagemetrictype AS ENUM ('api_calls', 'storage', 'users', 'transactions', 'custom');
            END IF;
        END $$;
    """))
    
    connection.execute(sa.text("""
        DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'auditactiontype') THEN
                CREATE TYPE auditactiontype AS ENUM ('create', 'update', 'delete', 'login', 'logout', 'api_call', 'permission_change', 'subscription_change', 'other');
            END IF;
        END $$;
    """))
    
    connection.execute(sa.text("""
        DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reporttype') THEN
                CREATE TYPE reporttype AS ENUM ('balance_sheet', 'income_statement', 'cash_flow', 'trial_balance', 'custom', 'ar_aging', 'ap_aging', 'inventory_valuation');
            END IF;
        END $$;
    """))
    
    connection.execute(sa.text("""
        DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reportfrequency') THEN
                CREATE TYPE reportfrequency AS ENUM ('daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'on_demand');
            END IF;
        END $$;
    """))
    
    connection.execute(sa.text("""
        DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'taxcalculationmethod') THEN
                CREATE TYPE taxcalculationmethod AS ENUM ('none', 'inclusive', 'exclusive');
            END IF;
        END $$;
    """))


def downgrade() -> None:
    """Downgrade schema - Drop enum types if they exist and are not used."""
    
    # Note: We don't drop enum types in downgrade because they might be used by other tables
    # In production, it's safer to leave them than to risk breaking existing tables
    pass
