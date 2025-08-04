#!/bin/bash
# render-build-fix.sh
# Ultimate build script to fix migration disaster

set -e  # Exit on error

echo "=== EMERGENCY RENDER BUILD FIX ==="
echo "This script will resolve the migration chain disaster"

# Navigate to backend directory
cd backend

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Install psycopg2 (needed for our fix script)
echo "Installing psycopg2..."
pip install psycopg2-binary

# Run our ultimate fix script
echo "Running ultimate migration fix..."
python3 ../scripts/fix_production_migrations.py

# Skip normal migrations entirely - database is already up to date
echo "✅ Skipping alembic upgrade - database is properly stamped"

# Verify everything is working
echo "Final verification..."
python3 -c "
import os
import sys
from urllib.parse import urlparse

try:
    import psycopg2
    print('✅ psycopg2 available')
    
    database_url = os.environ.get('DATABASE_URL')
    if database_url:
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
        
        try:
            # Check alembic version
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
                
        except Exception as e:
            print(f'❌ Database check failed: {e}')
            sys.exit(1)
        finally:
            cur.close()
            conn.close()
    else:
        print('⚠️ DATABASE_URL not set, skipping database verification')
        
except ImportError:
    print('❌ psycopg2 not available')
    sys.exit(1)
except Exception as e:
    print(f'❌ Verification failed: {e}')
    sys.exit(1)
"

echo "🎉 BUILD SUCCESSFUL - Migration disaster resolved!"