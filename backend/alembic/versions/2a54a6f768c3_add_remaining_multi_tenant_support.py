"""add_remaining_multi_tenant_support

Revision ID: 2a54a6f768c3
Revises: beb4f4aa9311
Create Date: 2025-07-17 05:04:34.152710

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '2a54a6f768c3'
down_revision: Union[str, None] = '34de23dec61f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    
    # This migration adds any remaining multi-tenant support that wasn't covered
    # Use SQL-based approach to avoid conflicts
    
    # Create enums if they don't exist (already handled by other migrations)
    op.execute("""
        DO $$ 
        BEGIN 
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'usertype') THEN
                CREATE TYPE usertype AS ENUM ('platform_admin', 'company_admin', 'company_user');
            END IF;
            
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscriptionstatus') THEN
                CREATE TYPE subscriptionstatus AS ENUM ('trial', 'active', 'suspended', 'cancelled');
            END IF;
        END $$;
    """)
    
    # Add any missing user columns (most should already be handled by beb4f4aa9311)
    op.execute("""
        DO $$ 
        BEGIN 
            -- These columns should already exist from beb4f4aa9311, but add them safely if they don't
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='user_type') THEN
                ALTER TABLE users ADD COLUMN user_type usertype DEFAULT 'company_user'::usertype NOT NULL;
            END IF;
            
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='default_company_id') THEN
                ALTER TABLE users ADD COLUMN default_company_id INTEGER;
            END IF;
            
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='last_login') THEN
                ALTER TABLE users ADD COLUMN last_login TIMESTAMP;
            END IF;
            
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='created_at') THEN
                ALTER TABLE users ADD COLUMN created_at TIMESTAMP DEFAULT NOW() NOT NULL;
            END IF;
            
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='updated_at') THEN
                ALTER TABLE users ADD COLUMN updated_at TIMESTAMP DEFAULT NOW() NOT NULL;
            END IF;
            
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='mfa_secret') THEN
                ALTER TABLE users ADD COLUMN mfa_secret VARCHAR;
            END IF;
        END $$;
    """)
    
    # Add any missing company columns (most should already be handled by beb4f4aa9311)
    op.execute("""
        DO $$ 
        BEGIN 
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='code') THEN
                ALTER TABLE companies ADD COLUMN code VARCHAR(10);
            END IF;
            
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='subscription_status') THEN
                ALTER TABLE companies ADD COLUMN subscription_status subscriptionstatus DEFAULT 'trial'::subscriptionstatus NOT NULL;
            END IF;
            
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='subscription_plan') THEN
                ALTER TABLE companies ADD COLUMN subscription_plan VARCHAR(50);
            END IF;
            
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='subscription_expires') THEN
                ALTER TABLE companies ADD COLUMN subscription_expires DATE;
            END IF;
            
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='storage_limit_gb') THEN
                ALTER TABLE companies ADD COLUMN storage_limit_gb INTEGER DEFAULT 10 NOT NULL;
            END IF;
            
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='user_limit') THEN
                ALTER TABLE companies ADD COLUMN user_limit INTEGER DEFAULT 5 NOT NULL;
            END IF;
            
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='primary_contact_email') THEN
                ALTER TABLE companies ADD COLUMN primary_contact_email VARCHAR(255);
            END IF;
            
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='billing_email') THEN
                ALTER TABLE companies ADD COLUMN billing_email VARCHAR(255);
            END IF;
            
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='created_at') THEN
                ALTER TABLE companies ADD COLUMN created_at TIMESTAMP DEFAULT NOW() NOT NULL;
            END IF;
            
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='created_by_user_id') THEN
                ALTER TABLE companies ADD COLUMN created_by_user_id INTEGER;
            END IF;
            
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='is_deleted') THEN
                ALTER TABLE companies ADD COLUMN is_deleted BOOLEAN DEFAULT false NOT NULL;
            END IF;
            
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='deleted_at') THEN
                ALTER TABLE companies ADD COLUMN deleted_at TIMESTAMP;
            END IF;
        END $$;
    """)
    
    # Set default values and update existing records
    op.execute("UPDATE companies SET code = 'COMP' || LPAD(id::text, 4, '0') WHERE code IS NULL")
    op.execute("UPDATE users SET user_type = 'platform_admin' WHERE is_superuser = TRUE")
    
    # Add constraints safely
    op.execute("""
        DO $$ 
        BEGIN 
            -- Add foreign key constraints if they don't exist
            IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='fk_users_default_company') THEN
                ALTER TABLE users ADD CONSTRAINT fk_users_default_company FOREIGN KEY (default_company_id) REFERENCES companies(id);
            END IF;
            
            IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='fk_companies_created_by_user') THEN
                ALTER TABLE companies ADD CONSTRAINT fk_companies_created_by_user FOREIGN KEY (created_by_user_id) REFERENCES users(id);
            END IF;
            
            -- Add unique constraint for company code if it doesn't exist
            IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='uq_company_code') THEN
                ALTER TABLE companies ADD CONSTRAINT uq_company_code UNIQUE (code);
            END IF;
            
            -- Make company_id nullable for platform admins
            BEGIN
                ALTER TABLE users ALTER COLUMN company_id DROP NOT NULL;
            EXCEPTION
                WHEN OTHERS THEN NULL;
            END;
            
            -- Add check constraint if it doesn't exist
            IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='ck_company_required_for_non_platform_users') THEN
                ALTER TABLE users ADD CONSTRAINT ck_company_required_for_non_platform_users 
                CHECK (user_type = 'platform_admin' OR company_id IS NOT NULL);
            END IF;
        END $$;
    """)


def downgrade() -> None:
    """Downgrade schema."""
    # Since this migration just ensures columns exist, we don't need to remove them
    # as they might be used by other migrations
    pass
