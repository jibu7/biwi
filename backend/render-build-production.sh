#!/bin/bash

# Production deployment script for Render
# This script will be run during the build process

set -e

echo "==> Starting production deployment..."

# Install dependencies (excluding dev dependencies)
echo "==> Installing dependencies..."
poetry install --without dev

# Run database migrations
echo "==> Running database migrations..."
poetry run alembic upgrade head

# Check if critical columns exist, if not add them
echo "==> Ensuring internationalization columns exist..."
poetry run python << 'EOF'
import os
from sqlalchemy import create_engine, text
from app.config import settings

print("Connecting to database...")
engine = create_engine(settings.DATABASE_URL)

with engine.connect() as conn:
    print("Connected successfully!")
    
    # Check and add missing columns for companies
    companies_columns = [
        ('date_format', "VARCHAR(20) NOT NULL DEFAULT 'YYYY-MM-DD'"),
        ('time_format', "VARCHAR(10) NOT NULL DEFAULT '24h'"),
        ('decimal_separator', "VARCHAR(1) NOT NULL DEFAULT '.'"),
        ('thousand_separator', "VARCHAR(1) NOT NULL DEFAULT ','"),
        ('currency_position', "VARCHAR(10) NOT NULL DEFAULT 'prefix'")
    ]
    
    for col, definition in companies_columns:
        try:
            result = conn.execute(text('''
                SELECT COUNT(*) FROM information_schema.columns 
                WHERE table_name = 'companies' AND column_name = :col
            '''), {'col': col})
            
            if result.scalar() == 0:
                conn.execute(text(f'ALTER TABLE companies ADD COLUMN {col} {definition}'))
                conn.commit()
                print(f'✅ Added companies.{col}')
            else:
                print(f'✓ companies.{col} already exists')
        except Exception as e:
            print(f'⚠️  companies.{col}: {e}')
    
    # Check and add missing columns for users
    users_columns = [
        ('date_format_override', 'VARCHAR(20)'),
        ('locale', "VARCHAR(10) NOT NULL DEFAULT 'en-US'"),
        ('timezone', "VARCHAR(50) NOT NULL DEFAULT 'UTC'")
    ]
    
    for col, definition in users_columns:
        try:
            result = conn.execute(text('''
                SELECT COUNT(*) FROM information_schema.columns 
                WHERE table_name = 'users' AND column_name = :col
            '''), {'col': col})
            
            if result.scalar() == 0:
                conn.execute(text(f'ALTER TABLE users ADD COLUMN {col} {definition}'))
                conn.commit()
                print(f'✅ Added users.{col}')
            else:
                print(f'✓ users.{col} already exists')
        except Exception as e:
            print(f'⚠️  users.{col}: {e}')

print("Schema verification completed!")
EOF

echo "==> Production deployment completed successfully!"
