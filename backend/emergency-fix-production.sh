#!/bin/bash

# Emergency fix script for production database schema issues
# Run this if the main build script fails

echo "==> Emergency fix: Adding missing internationalization columns..."

# Add missing columns directly via SQL
poetry run python -c "
import os
from sqlalchemy import create_engine, text
from app.config import settings

print('Connecting to database...')
engine = create_engine(settings.DATABASE_URL)

with engine.connect() as conn:
    print('Connected successfully!')
    
    # Companies table fixes
    companies_columns = [
        ('date_format', 'VARCHAR(20) NOT NULL DEFAULT ''YYYY-MM-DD'''),
        ('time_format', 'VARCHAR(10) NOT NULL DEFAULT ''24h'''),
        ('decimal_separator', 'VARCHAR(1) NOT NULL DEFAULT ''.'''),
        ('thousand_separator', 'VARCHAR(1) NOT NULL DEFAULT '','''),
        ('currency_position', 'VARCHAR(10) NOT NULL DEFAULT ''prefix''')
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
            print(f'❌ Error with companies.{col}: {e}')
    
    # Users table fixes
    users_columns = [
        ('date_format_override', 'VARCHAR(20)'),
        ('locale', 'VARCHAR(10) NOT NULL DEFAULT ''en-US'''),
        ('timezone', 'VARCHAR(50) NOT NULL DEFAULT ''UTC''')
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
            print(f'❌ Error with users.{col}: {e}')

print('Emergency fix completed!')
"

echo "==> Testing database connection..."
poetry run python -c "
from app.database.database import get_db
from sqlalchemy.orm import Session

try:
    db_gen = get_db()
    db: Session = next(db_gen)
    db.execute('SELECT 1')
    print('✅ Database connection successful!')
    db.close()
except Exception as e:
    print(f'❌ Database connection failed: {e}')
"

echo "==> Emergency fix script completed!"
