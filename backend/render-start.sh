#!/bin/bash
# Render Start Script for ChannelZap Backend

echo "🚀 Starting ChannelZap ERP Backend..."

# Wait a moment for database to be ready
sleep 2

# Run database migrations
echo "🔄 Running database migrations..."
poetry run alembic upgrade head

# Fix admin permissions (ensure admin has all permissions)
echo "🔧 Fixing admin permissions..."
if poetry run python fix_admin_permissions.py; then
    echo "✅ Admin permissions updated successfully"
else
    echo "⚠️ Admin permissions fix failed, but continuing startup..."
fi

# Start the application with Uvicorn (like Docker)
echo "🌟 Starting web server..."
poetry run uvicorn app.main:app \
    --host 0.0.0.0 \
    --port $PORT \
    --workers 1
