#!/bin/bash
# Test the production fix script locally to make sure it works

echo "🧪 Testing Production Migration Fix Script"
echo "This will test the fix script against your local database"

# Check if we're in the right directory
if [ ! -f "scripts/fix_production_migrations.py" ]; then
    echo "❌ Error: Must be run from project root directory"
    echo "Current directory: $(pwd)"
    exit 1
fi

# Set up local database URL if not already set
if [ -z "$DATABASE_URL" ]; then
    export DATABASE_URL="postgresql://postgres:password@localhost:5432/biwi"
    echo "Using local database: $DATABASE_URL"
fi

echo "Testing the fix script..."
python3 scripts/fix_production_migrations.py

echo "✅ Test completed!"
