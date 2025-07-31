#!/bin/bash

# Test script to verify tax configuration implementation and Docker status
echo "🧪 Testing Tax Configuration Implementation in Docker..."

# Check Docker containers status
echo ""
echo "📋 Checking Docker containers status..."
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(Biwi_|biwi_)" || echo "❌ No Biwi containers found running"

echo ""
echo "🔍 Checking backend container health..."
if docker ps | grep -q "Biwi_backend"; then
    echo "✅ Backend container is running"
    
    echo ""
    echo "🗄️ Checking database migration status..."
    docker exec Biwi_backend bash -c "cd /app && alembic current" || echo "❌ Could not check migration status"
    
    echo ""
    echo "🧪 Running tax configuration test..."
    docker exec Biwi_backend bash -c "cd /app && python test_tax_configuration.py" || echo "❌ Tax configuration test failed"
    
    echo ""
    echo "🔧 Testing backend health endpoint..."
    if curl -f http://localhost:8000/api/v1/health > /dev/null 2>&1; then
        echo "✅ Backend health endpoint is responding"
    else
        echo "⚠️ Backend health endpoint is not responding"
    fi
    
else
    echo "❌ Backend container is not running"
fi

echo ""
echo "🎉 Test completion report:"
echo "If all items above show ✅, the tax configuration is properly implemented!"
