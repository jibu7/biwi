#!/usr/bin/env python3
"""
Script to fix migration conflicts by making migrations idempotent
"""

import re
import os

def make_migration_idempotent():
    """Make migrations idempotent by adding SQL-level checks"""
    
    # Path to the problematic migration files
    f5d7_path = '/app/alembic/versions/f5d7c8b9a1e2_add_platform_administration_improvements.py'
    beb4_path = '/app/alembic/versions/beb4f4aa9311_add_multi_tenant_support.py'
    
    # Simple fix: Replace problematic operations with SQL that checks existence first
    fixes = [
        # Fix for f5d7c8b9a1e2 migration
        (f5d7_path, [
            ("op.add_column('companies', sa.Column('code', sa.String(length=10), nullable=True))",
             "op.execute(\"DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='code') THEN ALTER TABLE companies ADD COLUMN code VARCHAR(10); END IF; END $$\")"),
            
            ("op.add_column('companies', sa.Column('subscription_status', sa.String(), nullable=True))",
             "op.execute(\"DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='subscription_status') THEN ALTER TABLE companies ADD COLUMN subscription_status VARCHAR; END IF; END $$\")"),
        ]),
        
        # Fix for beb4f4aa9311 migration  
        (beb4_path, [
            ("op.add_column('companies', sa.Column('code', sa.String(10), nullable=True))",
             "op.execute(\"DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='code') THEN ALTER TABLE companies ADD COLUMN code VARCHAR(10); END IF; END $$\")"),
        ])
    ]
    
    for file_path, replacements in fixes:
        if os.path.exists(file_path):
            with open(file_path, 'r') as f:
                content = f.read()
            
            for old, new in replacements:
                content = content.replace(old, new)
            
            with open(file_path, 'w') as f:
                f.write(content)
            
            print(f"Fixed {file_path}")

if __name__ == "__main__":
    make_migration_idempotent()
