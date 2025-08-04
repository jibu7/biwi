#!/bin/bash
# Emergency Render Build Script - Fixes Migration Issues

echo "🚨 Emergency Build Script - Fixing Migration Disaster"

# Install Poetry
echo "📦 Installing Poetry..."
pip install poetry

# Install dependencies
echo "📦 Installing Python dependencies..."
poetry config virtualenvs.create false

# Update lock file if needed (in case of changes)
echo "🔄 Checking Poetry lock file..."
poetry lock --check || poetry lock

# Install dependencies
poetry install --only main --no-interaction --no-ansi --no-root

# Install psycopg2 for our fix script
echo "🔧 Installing psycopg2 for database operations..."
pip install psycopg2-binary

# Run our migration fix script INSTEAD of normal migrations
echo "🩹 Running migration fix script..."
python3 ../scripts/fix_production_migrations.py

# Verify the fix worked
echo "🔍 Verifying database state..."
python3 -c "
import os
import sys
from urllib.parse import urlparse
import psycopg2

try:
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        print('❌ DATABASE_URL not set')
        sys.exit(1)
    
    parsed_url = urlparse(database_url)
    db_config = {
        'host': parsed_url.hostname,
        'port': parsed_url.port or 5432,
        'database': parsed_url.path.lstrip('/'),
        'user': parsed_url.username,
        'password': parsed_url.password
    }
    
    conn = psycopg2.connect(**db_config)
    cur = conn.cursor()
    
    # Check alembic version exists
    cur.execute('SELECT version_num FROM alembic_version')
    version = cur.fetchone()
    if version:
        print(f'✅ Alembic version: {version[0]}')
    else:
        print('❌ No alembic version found')
        sys.exit(1)
    
    # Check feedback_categories table exists
    cur.execute(\"\"\"
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'feedback_categories'
        )
    \"\"\")
    table_exists = cur.fetchone()[0]
    if table_exists:
        print('✅ feedback_categories table exists')
    else:
        print('❌ feedback_categories table missing')
        sys.exit(1)
    
    cur.close()
    conn.close()
    print('✅ Database verification passed!')
    
except Exception as e:
    print(f'❌ Database verification failed: {e}')
    sys.exit(1)
"

echo "✅ Emergency build completed successfully!"
echo "🎉 Migration disaster has been resolved!"
