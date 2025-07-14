#!/bin/bash

echo "🚀 Starting Backend Deployment Process..."

# Set production environment
export ENVIRONMENT=production

# Install dependencies
echo "📦 Installing dependencies..."
poetry install --no-interaction --no-ansi --only main

# Run database migrations
echo "🗄️ Running database migrations..."
poetry run alembic upgrade head

# Create initial admin user (if needed)
echo "👤 Setting up admin user..."
poetry run python create_admin.py

echo "✅ Backend deployment setup complete!"
echo "🔗 Your backend will be available at your Render URL"
