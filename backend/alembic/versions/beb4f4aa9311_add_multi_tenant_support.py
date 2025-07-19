"""add multi tenant support

Revision ID: beb4f4aa9311
Revises: 34de23dec61f
Create Date: 2025-07-17 04:57:27.521029

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'beb4f4aa9311'
down_revision: Union[str, None] = '34de23dec61f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    # Use raw SQL to add columns and constraints only if they don't exist
    # This prevents DuplicateColumn and other errors
    
    # Create enums if they don't exist
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
    
    # Add columns to companies table if they don't exist
    op.execute("""
        DO $$ 
        BEGIN 
            -- Add code column if it doesn't exist
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='code') THEN
                ALTER TABLE companies ADD COLUMN code VARCHAR(10);
            END IF;
            
            -- Add subscription_status column if it doesn't exist
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='subscription_status') THEN
                ALTER TABLE companies ADD COLUMN subscription_status subscriptionstatus DEFAULT 'trial'::subscriptionstatus NOT NULL;
            END IF;
            
            -- Add subscription_plan column if it doesn't exist
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='subscription_plan') THEN
                ALTER TABLE companies ADD COLUMN subscription_plan VARCHAR(50);
            END IF;
            
            -- Add subscription_expires column if it doesn't exist
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='subscription_expires') THEN
                ALTER TABLE companies ADD COLUMN subscription_expires DATE;
            END IF;
            
            -- Add storage_limit_gb column if it doesn't exist
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='storage_limit_gb') THEN
                ALTER TABLE companies ADD COLUMN storage_limit_gb INTEGER DEFAULT 10 NOT NULL;
            END IF;
            
            -- Add user_limit column if it doesn't exist
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='user_limit') THEN
                ALTER TABLE companies ADD COLUMN user_limit INTEGER DEFAULT 5 NOT NULL;
            END IF;
            
            -- Add primary_contact_email column if it doesn't exist
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='primary_contact_email') THEN
                ALTER TABLE companies ADD COLUMN primary_contact_email VARCHAR(255);
            END IF;
            
            -- Add billing_email column if it doesn't exist
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='billing_email') THEN
                ALTER TABLE companies ADD COLUMN billing_email VARCHAR(255);
            END IF;
            
            -- Add created_at column if it doesn't exist
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='created_at') THEN
                ALTER TABLE companies ADD COLUMN created_at TIMESTAMP DEFAULT NOW() NOT NULL;
            END IF;
            
            -- Add created_by_user_id column if it doesn't exist
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='created_by_user_id') THEN
                ALTER TABLE companies ADD COLUMN created_by_user_id INTEGER;
            END IF;
            
            -- Add is_deleted column if it doesn't exist
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='is_deleted') THEN
                ALTER TABLE companies ADD COLUMN is_deleted BOOLEAN DEFAULT false NOT NULL;
            END IF;
            
            -- Add deleted_at column if it doesn't exist
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='deleted_at') THEN
                ALTER TABLE companies ADD COLUMN deleted_at TIMESTAMP;
            END IF;
        END $$;
    """)
    
    # Add columns to users table if they don't exist
    op.execute("""
        DO $$ 
        BEGIN 
            -- Add user_type column if it doesn't exist
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='user_type') THEN
                ALTER TABLE users ADD COLUMN user_type usertype DEFAULT 'company_user'::usertype NOT NULL;
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
                ALTER TABLE users ADD COLUMN created_at TIMESTAMP DEFAULT NOW() NOT NULL;
            END IF;
            
            -- Add updated_at column if it doesn't exist
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='updated_at') THEN
                ALTER TABLE users ADD COLUMN updated_at TIMESTAMP DEFAULT NOW() NOT NULL;
            END IF;
            
            -- Add mfa_secret column if it doesn't exist
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='mfa_secret') THEN
                ALTER TABLE users ADD COLUMN mfa_secret VARCHAR;
            END IF;
        END $$;
    """)
    
    # Generate codes for existing companies
    op.execute("""
        UPDATE companies 
        SET code = 'COMP' || LPAD(id::text, 4, '0')
        WHERE code IS NULL
    """)
    
    # Update existing superusers to platform_admin
    op.execute("UPDATE users SET user_type = 'platform_admin' WHERE is_superuser = TRUE")
    
    # Add constraints and indexes safely
    op.execute("""
        DO $$ 
        BEGIN 
            -- Make company_id nullable for platform admins
            BEGIN
                ALTER TABLE users ALTER COLUMN company_id DROP NOT NULL;
            EXCEPTION
                WHEN OTHERS THEN NULL;
            END;
            
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
            
            -- Add index for company code if it doesn't exist
            IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname='idx_company_code') THEN
                CREATE INDEX idx_company_code ON companies (code);
            END IF;
            
            -- Add check constraint if it doesn't exist
            IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='ck_company_required_for_non_platform_users') THEN
                ALTER TABLE users ADD CONSTRAINT ck_company_required_for_non_platform_users 
                CHECK (user_type = 'platform_admin' OR company_id IS NOT NULL);
            END IF;
        END $$;
    """)
    
    # Create tables if they don't exist
    op.execute("""
        CREATE TABLE IF NOT EXISTS platform_audit_logs (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id),
            company_id INTEGER REFERENCES companies(id),
            action VARCHAR(100) NOT NULL,
            resource_type VARCHAR(50),
            resource_id INTEGER,
            details JSONB,
            ip_address VARCHAR(45),
            user_agent TEXT,
            timestamp TIMESTAMP NOT NULL DEFAULT NOW()
        )
    """)
    
    op.execute("""
        CREATE TABLE IF NOT EXISTS resource_usage (
            id SERIAL PRIMARY KEY,
            company_id INTEGER NOT NULL REFERENCES companies(id),
            resource_type VARCHAR NOT NULL,
            usage_date DATE NOT NULL,
            quantity NUMERIC(15,4) NOT NULL,
            unit VARCHAR NOT NULL,
            usage_metadata JSONB,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            UNIQUE(company_id, resource_type, usage_date)
        )
    """)
    
    op.execute("""
        CREATE TABLE IF NOT EXISTS billing_configurations (
            company_id INTEGER PRIMARY KEY REFERENCES companies(id),
            billing_provider VARCHAR NOT NULL DEFAULT 'stripe',
            customer_id VARCHAR,
            subscription_id VARCHAR,
            payment_method_id VARCHAR,
            billing_cycle VARCHAR NOT NULL DEFAULT 'monthly',
            next_billing_date DATE,
            custom_pricing JSONB,
            discount_percentage NUMERIC(5,2) NOT NULL DEFAULT 0
        )
    """)
    
    op.execute("""
        CREATE TABLE IF NOT EXISTS usage_alerts (
            id SERIAL PRIMARY KEY,
            company_id INTEGER NOT NULL REFERENCES companies(id),
            alert_type VARCHAR NOT NULL,
            threshold_value NUMERIC(15,4) NOT NULL,
            current_value NUMERIC(15,4) NOT NULL,
            alert_date TIMESTAMP NOT NULL DEFAULT NOW(),
            acknowledged BOOLEAN NOT NULL DEFAULT false,
            acknowledged_by INTEGER REFERENCES users(id)
        )
    """)
    
    # Create indexes safely
    op.execute("""
        DO $$ 
        BEGIN 
            -- Create indexes if they don't exist
            IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname='idx_platform_audit_logs_user_id') THEN
                CREATE INDEX idx_platform_audit_logs_user_id ON platform_audit_logs (user_id);
            END IF;
            
            IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname='idx_platform_audit_logs_company_id') THEN
                CREATE INDEX idx_platform_audit_logs_company_id ON platform_audit_logs (company_id);
            END IF;
            
            IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname='idx_platform_audit_logs_timestamp') THEN
                CREATE INDEX idx_platform_audit_logs_timestamp ON platform_audit_logs (timestamp);
            END IF;
            
            IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname='idx_resource_usage_company_date') THEN
                CREATE INDEX idx_resource_usage_company_date ON resource_usage (company_id, usage_date);
            END IF;
        END $$;
    """)


def downgrade():
    # Drop all new tables
    op.drop_table('usage_alerts')
    op.drop_table('billing_configurations')
    op.drop_table('resource_usage')
    op.drop_table('platform_audit_logs')
    
    # Remove constraints and columns
    op.drop_constraint('ck_company_required_for_non_platform_users', 'users')
    op.drop_constraint('fk_users_default_company', 'users')
    
    # Drop columns from users
    op.drop_column('users', 'mfa_secret')
    op.drop_column('users', 'updated_at')
    op.drop_column('users', 'created_at')
    op.drop_column('users', 'last_login')
    op.drop_column('users', 'default_company_id')
    op.drop_column('users', 'user_type')
    
    # Make company_id not nullable again
    op.alter_column('users', 'company_id', nullable=False)
    
    # Drop columns from companies
    op.drop_constraint('fk_companies_created_by_user', 'companies')
    op.drop_column('companies', 'deleted_at')
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
    op.drop_constraint('uq_company_code', 'companies')
    op.drop_column('companies', 'code')
    
    # Drop enums
    sa.Enum(name='usertype').drop(op.get_bind())
    sa.Enum(name='subscriptionstatus').drop(op.get_bind())
