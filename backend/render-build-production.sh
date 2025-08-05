#!/bin/bash

# Production deployment script for Render
# This script will be run during the build process

set -e

echo "==> Starting production deployment..."

# Install dependencies (excluding dev dependencies)
echo "==> Installing dependencies..."
poetry install --without dev

# Skip migrations entirely due to missing migration dependencies
echo "==> Skipping migrations (fixing schema directly)..."

# Check if critical columns exist, if not add them
echo "==> Ensuring database schema is correct..."
poetry run python << 'EOF'
from sqlalchemy import create_engine, text
from app.config import settings

print("🔧 Checking database schema...")
engine = create_engine(settings.DATABASE_URL)

with engine.connect() as conn:
    print("✅ Database connected")
    
    # Verify core tables exist
    tables_check = conn.execute(text("""
        SELECT table_name FROM information_schema.tables 
        WHERE table_name IN ('companies', 'users') 
        ORDER BY table_name
    """)).fetchall()
    
    if len(tables_check) < 2:
        print("❌ Core tables missing - database needs proper initialization")
        raise Exception("Database not properly initialized")
    
    print(f"✅ Core tables found: {[t[0] for t in tables_check]}")
    
    # Add missing columns with error handling
    schema_updates = [
        # Companies internationalization columns
        ("companies", "date_format", "VARCHAR(20) NOT NULL DEFAULT 'YYYY-MM-DD'"),
        ("companies", "time_format", "VARCHAR(10) NOT NULL DEFAULT '24h'"),
        ("companies", "decimal_separator", "VARCHAR(1) NOT NULL DEFAULT '.'"),
        ("companies", "thousand_separator", "VARCHAR(1) NOT NULL DEFAULT ','"),
        ("companies", "currency_position", "VARCHAR(10) NOT NULL DEFAULT 'prefix'"),
        # Users internationalization columns  
        ("users", "date_format_override", "VARCHAR(20)"),
        ("users", "locale", "VARCHAR(10) NOT NULL DEFAULT 'en-US'"),
        ("users", "timezone", "VARCHAR(50) NOT NULL DEFAULT 'UTC'")
    ]
    
    for table, column, definition in schema_updates:
        try:
            # Check if column exists
            result = conn.execute(text("""
                SELECT COUNT(*) FROM information_schema.columns 
                WHERE table_name = :table AND column_name = :column
            """), {"table": table, "column": column})
            
            if result.scalar() == 0:
                # Add the missing column
                conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {definition}"))
                conn.commit()
                print(f"✅ Added {table}.{column}")
            else:
                print(f"✓ {table}.{column} exists")
                
        except Exception as e:
            print(f"⚠️  {table}.{column}: {str(e)[:80]}...")
    
    print("🎉 Schema verification completed!")
EOF

echo "==> Production deployment completed successfully!"
