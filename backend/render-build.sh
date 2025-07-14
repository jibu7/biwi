#!/bin/bash
# Render Build Script for ChannelZap Backend

echo "🚀 Starting Render deployment build..."

# Install Poetry
echo "📦 Installing Poetry..."
pip install poetry

# Install dependencies
echo "📦 Installing Python dependencies..."
poetry config virtualenvs.create false
poetry install --no-dev --no-interaction --no-ansi

# Run database migrations
echo "🗄️ Running database migrations..."
poetry run alembic upgrade head

echo "✅ Build completed successfully!"
