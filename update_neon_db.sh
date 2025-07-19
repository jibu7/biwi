#!/bin/bash

# Script to update Neon database with latest Alembic migrations
# Usage: ./update_neon_db.sh "your_neon_connection_string"

if [ -z "$1" ]; then
    echo "Usage: $0 'postgresql://user:pass@host.neon.tech/dbname?sslmode=require'"
    echo ""
    echo "Get your connection string from: https://console.neon.tech/app/projects"
    echo "It should look like: postgresql://user:pass@ep-xxx.us-east-1.neon.tech/dbname?sslmode=require"
    exit 1
fi

NEON_DATABASE_URL="$1"

echo "🔄 Updating Neon database with latest migrations..."
echo "📍 Current local migration: ff859d8ad766 (head)"
echo ""

# Check if backend container is running
if ! docker ps --filter name=backend --format "table {{.Names}}" | grep -q backend; then
    echo "❌ Backend container not running. Please start it first:"
    echo "   docker-compose up -d backend"
    exit 1
fi

# Run migrations against Neon database
echo "🚀 Running alembic upgrade head against Neon..."
docker exec -it $(docker ps -q --filter name=backend) bash -c "DATABASE_URL='$NEON_DATABASE_URL' alembic upgrade head"

if [ $? -eq 0 ]; then
    echo "✅ Neon database successfully updated to latest migration!"
    echo ""
    echo "🔍 Verifying migration status in Neon..."
    docker exec -it $(docker ps -q --filter name=backend) bash -c "DATABASE_URL='$NEON_DATABASE_URL' alembic current"
else
    echo "❌ Migration failed. Please check the error above."
    exit 1
fi
