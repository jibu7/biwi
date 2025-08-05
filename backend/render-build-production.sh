#!/bin/bash

# Production deployment script for Render
# This script will be run during the build process

set -e

echo "==> Starting production deployment..."

# Install dependencies
echo "==> Installing dependencies..."
poetry install --no-dev

# Run database migrations
echo "==> Running database migrations..."
poetry run alembic upgrade head

# Check if critical columns exist, if not add them
echo "==> Ensuring internationalization columns exist..."
poetry run python -c "
import os
from sqlalchemy import create_engine, text
from app.config import settings

engine = create_engine(settings.DATABASE_URL)
with engine.connect() as conn:
    # Check and add missing columns for companies
    for col, definition in [
        ('date_format', 'VARCHAR(20) NOT NULL DEFAULT ''YYYY-MM-DD'''),
        ('time_format', 'VARCHAR(10) NOT NULL DEFAULT ''24h'''),
        ('decimal_separator', 'VARCHAR(1) NOT NULL DEFAULT ''.'''),
        ('thousand_separator', 'VARCHAR(1) NOT NULL DEFAULT '','''),
        ('currency_position', 'VARCHAR(10) NOT NULL DEFAULT ''prefix''')
    ]:
        try:
            result = conn.execute(text('''
                SELECT COUNT(*) FROM information_schema.columns 
                WHERE table_name = 'companies' AND column_name = :col
            '''), {'col': col})
            if result.scalar() == 0:
                conn.execute(text(f'ALTER TABLE companies ADD COLUMN {col} {definition}'))
                conn.commit()
                print(f'Added column companies.{col}')
        except Exception as e:
            print(f'Column companies.{col} already exists or error: {e}')
    
    # Check and add missing columns for users
    for col, definition in [
        ('date_format_override', 'VARCHAR(20)'),
        ('locale', 'VARCHAR(10) NOT NULL DEFAULT ''en-US'''),
        ('timezone', 'VARCHAR(50) NOT NULL DEFAULT ''UTC''')
    ]:
        try:
            result = conn.execute(text('''
                SELECT COUNT(*) FROM information_schema.columns 
                WHERE table_name = 'users' AND column_name = :col
            '''), {'col': col})
            if result.scalar() == 0:
                conn.execute(text(f'ALTER TABLE users ADD COLUMN {col} {definition}'))
                conn.commit()
                print(f'Added column users.{col}')
        except Exception as e:
            print(f'Column users.{col} already exists or error: {e}')
"

echo "==> Production deployment completed successfully!"
