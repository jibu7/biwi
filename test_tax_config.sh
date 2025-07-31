#!/bin/bash

# Test script to verify tax configuration implementation
echo "🧪 Testing Tax Configuration Implementation..."

# Check if Docker containers are running
echo "📋 Checking Docker containers..."
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(Biwi_|biwi_)"

echo ""
echo "🔧 Running tax configuration test..."

# Test in Docker container
docker exec Biwi_backend bash -c "cd /app && python test_tax_configuration.py"

echo ""
echo "✅ Tax configuration test completed!"
