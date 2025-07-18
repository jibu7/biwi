#!/usr/bin/env python3
"""
Initialize database and run multi-tenant migrations for testing
"""
import sys
import os
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

# Set environment variable to use local SQLite for testing
os.environ['DATABASE_URL'] = 'sqlite:///./test.db'

from app.database.database import Base, engine
from app import models
import subprocess

def init_and_migrate():
    """Initialize database and run migrations"""
    
    print("Initializing database for multi-tenant testing...")
    print("=" * 50)
    
    # Remove existing test database
    test_db_path = Path("test.db")
    if test_db_path.exists():
        test_db_path.unlink()
        print("Removed existing test.db")
    
    # Create all tables
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✓ Database tables created")
    
    # Run alembic migrations to set up multi-tenant structure
    print("\nRunning alembic migrations...")
    try:
        # Set the database URL for alembic
        env = os.environ.copy()
        env['DATABASE_URL'] = 'sqlite:///./test.db'
        
        # Run alembic upgrade
        result = subprocess.run([
            'poetry', 'run', 'alembic', 'upgrade', 'head'
        ], capture_output=True, text=True, env=env)
        
        if result.returncode == 0:
            print("✓ Alembic migrations completed successfully")
        else:
            print(f"✗ Alembic migration failed: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"✗ Error running migrations: {e}")
        return False
    
    print("\n" + "=" * 50)
    print("Database initialization complete!")
    return True

if __name__ == "__main__":
    success = init_and_migrate()
    if success:
        print("\nNow you can run the validation scripts:")
        print("poetry run python scripts/validate_migration_local.py")
        print("poetry run python scripts/create_test_platform_data.py")
    else:
        print("\nDatabase initialization failed!")
        sys.exit(1)
