#!/bin/bash
# Quick test runner for development - runs essential tests only

echo "🏃‍♂️ Running Quick Multi-Tenant Tests"
echo "===================================="

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    case $1 in
        "SUCCESS") echo -e "${GREEN}✅ $2${NC}" ;;
        "ERROR") echo -e "${RED}❌ $2${NC}" ;;
        "INFO") echo -e "${BLUE}ℹ️ $2${NC}" ;;
    esac
}

# Quick health checks
print_status "INFO" "Running quick health checks..."

# Check if services are running
if ! docker ps | grep -q "Biwi_backend"; then
    print_status "ERROR" "Backend service is not running!"
    exit 1
fi

if ! docker ps | grep -q "Biwi_db"; then
    print_status "ERROR" "Database service is not running!"
    exit 1
fi

print_status "SUCCESS" "Docker services are running"

# Test database connection
if docker exec Biwi_backend python -c "from app.database.database import get_db; next(get_db()); print('DB OK')" >/dev/null 2>&1; then
    print_status "SUCCESS" "Database connection OK"
else
    print_status "ERROR" "Database connection failed"
    exit 1
fi

# Test backend health
if docker exec Biwi_backend python -c "import requests; r = requests.get('http://localhost:8000/health'); exit(0 if r.status_code == 200 else 1)" >/dev/null 2>&1; then
    print_status "SUCCESS" "Backend API health OK"
else
    print_status "ERROR" "Backend API health check failed"
    exit 1
fi

# Run essential tests only
print_status "INFO" "Running essential tests..."

essential_tests=(
    "python test_multitenant.py:Multi-Tenant Core"
    "python test_inventory_simple.py:Basic Inventory"
    "python test_gl_endpoints.py:GL Endpoints"
)

failed_tests=0

for test_cmd in "${essential_tests[@]}"; do
    IFS=':' read -r cmd name <<< "$test_cmd"
    
    print_status "INFO" "Testing: $name"
    
    if docker exec Biwi_backend $cmd >/dev/null 2>&1; then
        print_status "SUCCESS" "$name - PASSED"
    else
        print_status "ERROR" "$name - FAILED"
        failed_tests=$((failed_tests + 1))
    fi
done

echo ""
echo "===================================="

if [ $failed_tests -eq 0 ]; then
    print_status "SUCCESS" "Quick tests passed! System looks healthy."
    print_status "INFO" "Run './test_multi_tenant.sh' for comprehensive testing"
else
    print_status "ERROR" "$failed_tests essential tests failed"
    print_status "INFO" "Run './test_multi_tenant.sh' for detailed diagnostics"
fi

echo "===================================="
exit $failed_tests
