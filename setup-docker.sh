#!/bin/bash
# Docker Desktop setup script for Biwi Multi-tenant ERP

set -e

echo "🐳 Setting up Biwi Multi-tenant ERP with Docker Desktop..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose > /dev/null 2>&1; then
    echo "❌ docker-compose not found. Please install Docker Compose."
    exit 1
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p backend/logs
mkdir -p database/backups
mkdir -p nginx/ssl

# Copy environment file if it doesn't exist
if [ ! -f "backend/.env" ]; then
    echo "📝 Creating environment file..."
    cp backend/.env.multitenant backend/.env
    echo "✅ Environment file created. Please review backend/.env and update as needed."
fi

# Choose which docker-compose file to use
COMPOSE_FILE="docker-compose.yml"
if [ "$1" = "enhanced" ]; then
    COMPOSE_FILE="docker-compose.enhanced.yml"
    echo "🚀 Using enhanced Docker configuration..."
else
    echo "🚀 Using standard Docker configuration..."
    echo "   Run './setup-docker.sh enhanced' for the enhanced setup with Redis, Nginx, etc."
fi

# Stop any existing containers
echo "🛑 Stopping any existing containers..."
docker-compose -f $COMPOSE_FILE down --remove-orphans

# Build and start services
echo "🔨 Building and starting services..."
docker-compose -f $COMPOSE_FILE up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check service health
echo "🔍 Checking service health..."
if curl -f http://localhost:8000/api/v1/health > /dev/null 2>&1; then
    echo "✅ Backend is healthy"
else
    echo "⚠️  Backend might still be starting up..."
fi

if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend is accessible"
else
    echo "⚠️  Frontend might still be starting up..."
fi

echo "🎉 Setup complete!"
echo ""
echo "🌐 Services are available at:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
echo "   Database: localhost:5432"
echo ""
echo "📊 View logs with:"
echo "   docker-compose -f $COMPOSE_FILE logs -f"
echo ""
echo "🛑 Stop services with:"
echo "   docker-compose -f $COMPOSE_FILE down"
echo ""
echo "🔧 To create a platform admin user, run:"
echo "   docker-compose -f $COMPOSE_FILE exec backend poetry run python create_admin.py"
