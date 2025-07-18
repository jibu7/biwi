#!/bin/bash
# Health check script for backend container

set -e

# Check if the application is responding
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/api/v1/health || echo "000")

if [ "$response" = "200" ]; then
    echo "Backend health check: OK"
    exit 0
else
    echo "Backend health check: FAILED (HTTP $response)"
    exit 1
fi
