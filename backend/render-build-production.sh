#!/bin/bash

# Production deployment script for Render
# This script will be run during the build process

set -e

echo "==> Starting production deployment..."

# Install dependencies (excluding dev dependencies)
echo "==> Installing dependencies..."
poetry install --without dev

# Apply database migrations properly
echo "==> Running database migrations..."
poetry run alembic upgrade head

echo "==> ✅ Migration approach completed successfully!"

echo "==> Production deployment completed successfully!"
