#!/usr/bin/env python3
"""
Nuclear Migration Reset - USE WITH EXTREME CAUTION
This script completely resets the migration state and creates a baseline
"""

import os
import sys
from urllib.parse import urlparse
import psycopg2

def get_database_url():
    """Get database URL from environment"""
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        print("ERROR: DATABASE_URL environment variable not set")
        sys.exit(1)
    return database_url

def parse_database_url(database_url):
    """Parse database URL into connection parameters"""
    parsed_url = urlparse(database_url)
    return {
        'host': parsed_url.hostname,
        'port': parsed_url.port or 5432,
        'database': parsed_url.path.lstrip('/'),
        'user': parsed_url.username,
        'password': parsed_url.password
    }

def get_connection(db_config):
    """Create a database connection"""
    return psycopg2.connect(**db_config)

def nuclear_reset(db_config):
    """Completely reset migration state - DANGEROUS"""
    conn = get_connection(db_config)
    cur = conn.cursor()
    
    try:
        # Step 1: Drop alembic_version table completely
        print("🧨 Dropping alembic_version table...")
        cur.execute("DROP TABLE IF EXISTS alembic_version CASCADE")
        
        # Step 2: Create fresh alembic_version table
        print("🔧 Creating fresh alembic_version table...")
        cur.execute("""
            CREATE TABLE alembic_version (
                version_num VARCHAR(32) NOT NULL,
                CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num)
            )
        """)
        
        # Step 3: Stamp with a baseline revision that reflects current state
        baseline_revision = 'production_baseline_20250805'
        print(f"📝 Stamping with baseline revision: {baseline_revision}")
        cur.execute("""
            INSERT INTO alembic_version (version_num) 
            VALUES (%s)
        """, (baseline_revision,))
        
        conn.commit()
        print("✅ Nuclear reset complete!")
        print("⚠️  You will need to create a baseline migration file with this revision ID")
        
        return baseline_revision
        
    except Exception as e:
        conn.rollback()
        print(f"❌ ERROR during nuclear reset: {e}")
        sys.exit(1)
    finally:
        cur.close()
        conn.close()

def create_baseline_migration():
    """Create a baseline migration file that does nothing"""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    versions_dir = os.path.join(script_dir, '..', 'backend', 'alembic', 'versions')
    
    if not os.path.exists(versions_dir):
        print(f"ERROR: Versions directory not found at {versions_dir}")
        return False
    
    baseline_content = '''"""production baseline - all tables already exist

Revision ID: production_baseline_20250805
Revises: 
Create Date: 2025-08-05 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'production_baseline_20250805'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # This migration does nothing - it's just a baseline
    # All tables already exist in production
    pass

def downgrade():
    # This migration does nothing - cannot downgrade from baseline
    pass
'''
    
    baseline_file = os.path.join(versions_dir, 'production_baseline_20250805_baseline.py')
    
    try:
        with open(baseline_file, 'w') as f:
            f.write(baseline_content)
        print(f"✅ Created baseline migration: {baseline_file}")
        return True
    except Exception as e:
        print(f"❌ Failed to create baseline migration: {e}")
        return False

def main():
    print("🚨 === NUCLEAR MIGRATION RESET === 🚨")
    print("⚠️  WARNING: This will completely reset migration history!")
    print("⚠️  This should only be used as a last resort!")
    print()
    
    # Confirm the user really wants to do this
    response = input("⚠️  Type 'NUCLEAR' to confirm you want to proceed: ")
    if response != 'NUCLEAR':
        print("❌ Aborted - nuclear reset cancelled")
        sys.exit(1)
    
    # Get database configuration
    database_url = get_database_url()
    db_config = parse_database_url(database_url)
    
    print(f"Target Database: {db_config['database']}")
    print(f"Host: {db_config['host']}")
    print()
    
    # Final confirmation
    final_confirm = input("⚠️  Last chance! Type 'YES' to proceed with nuclear reset: ")
    if final_confirm != 'YES':
        print("❌ Aborted - nuclear reset cancelled")
        sys.exit(1)
    
    # Perform nuclear reset
    print("\n🧨 Beginning nuclear reset...")
    baseline_revision = nuclear_reset(db_config)
    
    # Create baseline migration file
    print("\n📝 Creating baseline migration file...")
    if create_baseline_migration():
        print("\n✅ Nuclear reset complete!")
        print(f"✅ Database stamped with baseline: {baseline_revision}")
        print("✅ Baseline migration file created")
        print()
        print("🎯 Next steps:")
        print("1. Commit the new baseline migration file")
        print("2. Deploy with normal build process")
        print("3. Future migrations will work normally")
    else:
        print("\n❌ Nuclear reset partially failed - baseline migration not created")
        print("⚠️  You may need to manually create the baseline migration file")

if __name__ == "__main__":
    main()
