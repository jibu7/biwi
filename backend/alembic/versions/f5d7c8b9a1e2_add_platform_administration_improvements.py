"""Add platform administration improvements

Revision ID: f5d7c8b9a1e2
Revises: cb021f26c404
Create Date: 2025-07-04 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'f5d7c8b9a1e2'
down_revision: Union[str, None] = 'cb021f26c404'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add platform administration improvements"""
    
    # Use raw SQL to add columns only if they don't exist
    # This prevents DuplicateColumn errors
    
    # Add columns to companies table
    op.execute("""
        DO $$ 
        BEGIN 
            -- Add code column if it doesn't exist
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='code') THEN
                ALTER TABLE companies ADD COLUMN code VARCHAR(10);
            END IF;
            
            -- Add subscription_status column if it doesn't exist
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='subscription_status') THEN
                ALTER TABLE companies ADD COLUMN subscription_status VARCHAR;
            END IF;
            
            -- Add subscription_plan column if it doesn't exist
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='subscription_plan') THEN
                ALTER TABLE companies ADD COLUMN subscription_plan VARCHAR;
            END IF;
            
            -- Add subscription_expires column if it doesn't exist
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='subscription_expires') THEN
                ALTER TABLE companies ADD COLUMN subscription_expires DATE;
            END IF;
            
            -- Add storage_limit_gb column if it doesn't exist
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='storage_limit_gb') THEN
                ALTER TABLE companies ADD COLUMN storage_limit_gb INTEGER;
            END IF;
            
            -- Add user_limit column if it doesn't exist
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='user_limit') THEN
                ALTER TABLE companies ADD COLUMN user_limit INTEGER;
            END IF;
            
            -- Add primary_contact_email column if it doesn't exist
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='primary_contact_email') THEN
                ALTER TABLE companies ADD COLUMN primary_contact_email VARCHAR;
            END IF;
            
            -- Add billing_email column if it doesn't exist
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='billing_email') THEN
                ALTER TABLE companies ADD COLUMN billing_email VARCHAR;
            END IF;
            
            -- Add created_at column if it doesn't exist
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='created_at') THEN
                ALTER TABLE companies ADD COLUMN created_at TIMESTAMP;
            END IF;
            
            -- Add created_by_user_id column if it doesn't exist
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='created_by_user_id') THEN
                ALTER TABLE companies ADD COLUMN created_by_user_id INTEGER;
            END IF;
            
            -- Add is_deleted column if it doesn't exist
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='is_deleted') THEN
                ALTER TABLE companies ADD COLUMN is_deleted BOOLEAN;
            END IF;
        END $$;
    """)
    
    # Add columns to users table
    op.execute("""
        DO $$ 
        BEGIN 
            -- Add user_type column if it doesn't exist
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='user_type') THEN
                ALTER TABLE users ADD COLUMN user_type VARCHAR;
            END IF;
            
            -- Add default_company_id column if it doesn't exist
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='default_company_id') THEN
                ALTER TABLE users ADD COLUMN default_company_id INTEGER;
            END IF;
            
            -- Add last_login column if it doesn't exist
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='last_login') THEN
                ALTER TABLE users ADD COLUMN last_login TIMESTAMP;
            END IF;
            
            -- Add created_at column if it doesn't exist
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='created_at') THEN
                ALTER TABLE users ADD COLUMN created_at TIMESTAMP;
            END IF;
            
            -- Add updated_at column if it doesn't exist
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='updated_at') THEN
                ALTER TABLE users ADD COLUMN updated_at TIMESTAMP;
            END IF;
        END $$;
    """)
    
    # Set default values for new columns (safe updates)
    op.execute("UPDATE companies SET subscription_status = 'trial' WHERE subscription_status IS NULL")
    op.execute("UPDATE companies SET storage_limit_gb = 10 WHERE storage_limit_gb IS NULL")
    op.execute("UPDATE companies SET user_limit = 5 WHERE user_limit IS NULL")
    op.execute("UPDATE companies SET is_deleted = false WHERE is_deleted IS NULL")
    op.execute("UPDATE companies SET created_at = NOW() WHERE created_at IS NULL")
    
    # Generate unique codes for existing companies
    op.execute("""
        UPDATE companies 
        SET code = 'COMP' || LPAD(id::text, 3, '0') 
        WHERE code IS NULL
    """)
    
    # Set default values for users
    op.execute("UPDATE users SET user_type = 'company_user' WHERE user_type IS NULL")
    op.execute("UPDATE users SET created_at = NOW() WHERE created_at IS NULL")
    op.execute("UPDATE users SET updated_at = NOW() WHERE updated_at IS NULL")
    op.execute("UPDATE users SET user_type = 'platform_admin' WHERE is_superuser = true")
    
    # Create platform_audit_logs table if it doesn't exist
    op.execute("""
        CREATE TABLE IF NOT EXISTS platform_audit_logs (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id),
            company_id INTEGER REFERENCES companies(id),
            action VARCHAR NOT NULL,
            resource_type VARCHAR,
            resource_id INTEGER,
            details JSONB,
            ip_address VARCHAR,
            user_agent VARCHAR,
            timestamp TIMESTAMP NOT NULL DEFAULT NOW()
        )
    """)
    
    # Add constraints and indexes safely
    op.execute("""
        DO $$ 
        BEGIN 
            -- Add foreign key constraints if they don't exist
            IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='fk_companies_created_by_user_id') THEN
                ALTER TABLE companies ADD CONSTRAINT fk_companies_created_by_user_id FOREIGN KEY (created_by_user_id) REFERENCES users(id);
            END IF;
            
            IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='fk_users_default_company_id') THEN
                ALTER TABLE users ADD CONSTRAINT fk_users_default_company_id FOREIGN KEY (default_company_id) REFERENCES companies(id);
            END IF;
            
            -- Add unique constraint for company code if it doesn't exist
            IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='uq_companies_code') THEN
                ALTER TABLE companies ADD CONSTRAINT uq_companies_code UNIQUE (code);
            END IF;
        END $$;
    """)


def downgrade() -> None:
    """Remove platform administration improvements"""
    
    # Drop platform_audit_logs table
    op.drop_index('idx_platform_audit_logs_timestamp', table_name='platform_audit_logs')
    op.drop_index('idx_platform_audit_logs_company_id', table_name='platform_audit_logs')
    op.drop_index('idx_platform_audit_logs_user_id', table_name='platform_audit_logs')
    op.drop_table('platform_audit_logs')
    
    # Remove check constraint from users table
    op.drop_constraint('ck_company_required_for_non_platform_users', 'users', type_='check')
    
    # Remove foreign key constraint from users table
    op.drop_constraint('fk_users_default_company_id', 'users', type_='foreignkey')
    
    # Remove new columns from users table
    op.drop_column('users', 'updated_at')
    op.drop_column('users', 'created_at')
    op.drop_column('users', 'last_login')
    op.drop_column('users', 'default_company_id')
    op.drop_column('users', 'user_type')
    
    # Make company_id not nullable again
    op.alter_column('users', 'company_id', nullable=False)
    
    # Remove foreign key constraint from companies table
    op.drop_constraint('fk_companies_created_by_user_id', 'companies', type_='foreignkey')
    
    # Remove unique constraint from companies table
    op.drop_constraint('uq_companies_code', 'companies', type_='unique')
    
    # Remove new columns from companies table
    op.drop_column('companies', 'is_deleted')
    op.drop_column('companies', 'created_by_user_id')
    op.drop_column('companies', 'created_at')
    op.drop_column('companies', 'billing_email')
    op.drop_column('companies', 'primary_contact_email')
    op.drop_column('companies', 'user_limit')
    op.drop_column('companies', 'storage_limit_gb')
    op.drop_column('companies', 'subscription_expires')
    op.drop_column('companies', 'subscription_plan')
    op.drop_column('companies', 'subscription_status')
    op.drop_column('companies', 'code')
