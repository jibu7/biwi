#!/bin/bash

# Script to check current migration status in both local and Neon databases
# Usage: ./check_migration_status.sh "your_neon_connection_string"

if [ -z "$1" ]; then
    echo "Usage: $0 'postgresql://user:pass@host.neon.tech/dbname?sslmode=require'"
    echo ""
    echo "Get your connection string from: https://console.neon.tech/app/projects"
    exit 1
fi

NEON_DATABASE_URL="$1"

echo "🔍 Checking migration status..."
echo ""

# Check if backend container is running
if ! docker ps --filter name=backend --format "table {{.Names}}" | grep -q backend; then
    echo "❌ Backend container not running. Please start it first:"
    echo "   docker-compose up -d backend"
    exit 1
fi

echo "📍 Local Docker database migration status:"
docker exec -it $(docker ps -q --filter name=backend) alembic current
echo ""

echo "📍 Neon database migration status:"
docker exec -it $(docker ps -q --filter name=backend) bash -c "DATABASE_URL='$NEON_DATABASE_URL' alembic current"
echo ""

echo "📋 Available migrations (latest first):"
docker exec -it $(docker ps -q --filter name=backend) alembic history | head -20
