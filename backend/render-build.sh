#!/bin/bash
# Render Build Script for ChannelZap Backend

echo "🚀 Starting Render deployment build..."

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

# Run database migrations
echo "🗄️ Running database migrations..."
poetry run alembic upgrade head

echo "✅ Build completed successfully!"
