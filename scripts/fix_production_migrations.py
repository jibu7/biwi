#!/usr/bin/env python3
"""
Production Migration Fix Script
This script will fix the persistent migration issues by:
1. Checking current database state
2. Stamping the database to the latest migration
3. Ensuring alembic_version table is correct
"""

import os
import sys
from urllib.parse import urlparse
import psycopg2
from psycopg2.extras import RealDictCursor

def get_database_url():
    """Get database URL from environment"""
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        # Try local development database
        database_url = "postgresql://postgres:password@localhost:5432/biwi"
        print(f"Using default database URL: {database_url}")
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

def check_table_exists(db_config, table_name):
    """Check if a table exists in the database"""
    conn = get_connection(db_config)
    cur = conn.cursor()
    
    try:
        cur.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = %s
            )
        """, (table_name,))
        
        result = cur.fetchone()
        return result[0] if result else False
    except Exception as e:
        print(f"Error checking table {table_name}: {e}")
        return False
    finally:
        cur.close()
        conn.close()

def check_alembic_version(db_config):
    """Check current alembic version in database"""
    conn = get_connection(db_config)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        cur.execute("SELECT version_num FROM alembic_version")
        result = cur.fetchone()
        if result:
            print(f"Current alembic version: {result['version_num']}")
            return result['version_num']
        else:
            print("No alembic version found in database")
            return None
    except psycopg2.errors.UndefinedTable:
        print("alembic_version table does not exist")
        return None
    except Exception as e:
        print(f"Error checking alembic version: {e}")
        return None
    finally:
        cur.close()
        conn.close()

def get_latest_migration():
    """Get the latest migration revision from the versions directory"""
    # Get the script directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    versions_dir = os.path.join(script_dir, '..', 'backend', 'alembic', 'versions')
    
    if not os.path.exists(versions_dir):
        print(f"ERROR: Versions directory not found at {versions_dir}")
        return None
    
    migration_files = [f for f in os.listdir(versions_dir) if f.endswith('.py') and not f.startswith('__')]
    
    if not migration_files:
        print("ERROR: No migration files found")
        return None
    
    # Sort by filename (which includes timestamp)
    migration_files.sort()
    latest_file = migration_files[-1]
    
    # Extract revision from filename
    revision = latest_file.split('_')[0]
    print(f"Latest migration file: {latest_file}")
    print(f"Latest revision: {revision}")
    
    return revision

def stamp_database(db_config, revision):
    """Stamp the database with the given revision"""
    conn = get_connection(db_config)
    cur = conn.cursor()
    
    try:
        # Create alembic_version table if it doesn't exist
        cur.execute("""
            CREATE TABLE IF NOT EXISTS alembic_version (
                version_num VARCHAR(32) NOT NULL,
                CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num)
            )
        """)
        
        # Clear any existing version
        cur.execute("DELETE FROM alembic_version")
        
        # Insert the new version
        cur.execute("INSERT INTO alembic_version (version_num) VALUES (%s)", (revision,))
        
        conn.commit()
        print(f"Successfully stamped database with revision: {revision}")
        return True
    except Exception as e:
        conn.rollback()
        print(f"ERROR stamping database: {e}")
        return False
    finally:
        cur.close()
        conn.close()

def main():
    print("=== Production Migration Fix Script ===")
    
    # Get database configuration
    database_url = get_database_url()
    db_config = parse_database_url(database_url)
    
    print(f"Database: {db_config['database']}")
    print(f"Host: {db_config['host']}")
    print()
    
    # Check if feedback_categories table exists (the problematic table)
    feedback_table_exists = check_table_exists(db_config, 'feedback_categories')
    print(f"feedback_categories table exists: {feedback_table_exists}")
    
    # Check current alembic version
    current_version = check_alembic_version(db_config)
    
    # Get latest migration
    latest_revision = get_latest_migration()
    
    if not latest_revision:
        print("ERROR: Could not determine latest migration")
        sys.exit(1)
    
    # If already at latest, we're done
    if current_version == latest_revision:
        print("Database is already at the latest migration")
        return
    
    # If feedback_categories exists but we're not at the latest migration,
    # it means the database is ahead of Alembic's knowledge
    if feedback_table_exists and not current_version:
        print("\n⚠️  Database has tables but no alembic version!")
        print("This indicates the database was manually created or migrations were run outside of Alembic")
        print("Stamping database to bring Alembic up to date...")
    elif feedback_table_exists and current_version:
        print(f"\n⚠️  Database has feedback_categories table but Alembic thinks it's at {current_version}")
        print("Updating Alembic to reflect actual database state...")
    
    # Stamp the database
    print(f"\nStamping database to revision: {latest_revision}")
    if stamp_database(db_config, latest_revision):
        print("\n✅ Database successfully stamped!")
        print("The migration system should now work correctly.")
        print("Future migrations will work properly.")
    else:
        print("\n❌ Failed to stamp database")
        sys.exit(1)

if __name__ == "__main__":
    main()