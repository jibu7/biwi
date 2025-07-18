#!/bin/bash
# Master script for multi-tenant testing in Docker environment

echo "🚀 Starting Multi-Tenant Testing Suite"
echo "======================================"

# Ensure we're in the correct directory
cd "$(dirname "$0")"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    case $1 in
        "SUCCESS") echo -e "${GREEN}✅ $2${NC}" ;;
        "ERROR") echo -e "${RED}❌ $2${NC}" ;;
        "WARNING") echo -e "${YELLOW}⚠️ $2${NC}" ;;
        "INFO") echo -e "${BLUE}ℹ️ $2${NC}" ;;
    esac
}

# Function to check if Docker services are running
check_docker_services() {
    print_status "INFO" "Checking Docker services..."
    
    services=("Biwi_db" "Biwi_backend" "Biwi_frontend")
    
    for service in "${services[@]}"; do
        if docker ps --filter "name=$service" --format "{{.Names}}" | grep -q "$service"; then
            print_status "SUCCESS" "$service is running"
        else
            print_status "ERROR" "$service is not running!"
            print_status "INFO" "Please start Docker services with: docker-compose up -d"
            exit 1
        fi
    done
    
    return 0
}

# Function to wait for services to be ready
wait_for_services() {
    print_status "INFO" "Waiting for services to be ready..."
    
    # Wait for backend to be healthy
    max_attempts=30
    attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if docker exec Biwi_backend python -c "import requests; r = requests.get('http://localhost:8000/health'); exit(0 if r.status_code == 200 else 1)" >/dev/null 2>&1; then
            print_status "SUCCESS" "Backend service is ready"
            break
        fi
        
        attempt=$((attempt + 1))
        echo "Waiting for backend... (${attempt}/${max_attempts})"
        sleep 2
    done
    
    if [ $attempt -eq $max_attempts ]; then
        print_status "ERROR" "Backend service failed to become ready"
        return 1
    fi
    
    # Wait for database to be ready
    if docker exec Biwi_backend python -c "from app.database.database import get_db; next(get_db()); print('DB ready')" >/dev/null 2>&1; then
        print_status "SUCCESS" "Database service is ready"
    else
        print_status "ERROR" "Database service is not ready"
        return 1
    fi
    
    return 0
}

# Function to setup test data
setup_test_data() {
    print_status "INFO" "Setting up test data..."
    
    if docker exec Biwi_backend python scripts/setup_test_data_container.py; then
        print_status "SUCCESS" "Test data setup completed"
        return 0
    else
        print_status "ERROR" "Test data setup failed!"
        return 1
    fi
}

# Function to run tests
run_tests() {
    print_status "INFO" "Running comprehensive tests..."
    
    if docker exec Biwi_backend python scripts/run_all_tests_container.py; then
        print_status "SUCCESS" "All tests completed successfully"
        return 0
    else
        print_status "ERROR" "Some tests failed"
        return 1
    fi
}

# Function to run quick health checks
run_quick_checks() {
    print_status "INFO" "Running quick health checks..."
    
    # Check backend health
    if docker exec Biwi_backend python -c "import requests; r = requests.get('http://localhost:8000/health'); exit(0 if r.status_code == 200 else 1)" >/dev/null 2>&1; then
        print_status "SUCCESS" "Backend health check passed"
    else
        print_status "WARNING" "Backend health check failed"
    fi
    
    # Check database connection
    if docker exec Biwi_backend python -c "from app.database.database import get_db; next(get_db()); print('✅ DB connection successful')" 2>/dev/null; then
        print_status "SUCCESS" "Database connection check passed"
    else
        print_status "WARNING" "Database connection check failed"
    fi
    
    # Check frontend (basic)
    if docker exec Biwi_frontend python -c "import requests; r = requests.get('http://localhost:3000'); exit(0 if r.status_code == 200 else 1)" >/dev/null 2>&1; then
        print_status "SUCCESS" "Frontend health check passed"
    else
        print_status "WARNING" "Frontend health check failed (may be normal if not fully loaded)"
    fi
}

# Function to display service logs in case of failure
show_service_logs() {
    print_status "INFO" "Showing recent service logs for debugging..."
    
    echo ""
    echo "=== Backend Logs (last 20 lines) ==="
    docker logs --tail 20 Biwi_backend
    
    echo ""
    echo "=== Database Logs (last 10 lines) ==="
    docker logs --tail 10 Biwi_db
    
    echo ""
    echo "=== Frontend Logs (last 10 lines) ==="
    docker logs --tail 10 Biwi_frontend
}

# Function to cleanup and reset if needed
cleanup_if_needed() {
    if [ "$1" = "--reset" ] || [ "$1" = "-r" ]; then
        print_status "WARNING" "Resetting test environment..."
        
        # Stop services
        docker-compose down
        
        # Remove volumes if specified
        if [ "$2" = "--volumes" ] || [ "$2" = "-v" ]; then
            print_status "WARNING" "Removing Docker volumes..."
            docker volume prune -f
        fi
        
        # Start services
        print_status "INFO" "Starting fresh services..."
        docker-compose up -d
        
        # Wait for services
        sleep 10
    fi
}

# Main execution
main() {
    # Parse command line arguments
    cleanup_if_needed "$1" "$2"
    
    # Check Docker services
    if ! check_docker_services; then
        exit 1
    fi
    
    # Wait for services to be ready
    if ! wait_for_services; then
        print_status "ERROR" "Services failed to become ready"
        show_service_logs
        exit 1
    fi
    
    # Run quick health checks first
    run_quick_checks
    echo ""
    
    # Setup test data
    if ! setup_test_data; then
        print_status "ERROR" "Failed to setup test data"
        show_service_logs
        exit 1
    fi
    
    echo ""
    
    # Run comprehensive tests
    if ! run_tests; then
        test_result=1
    else
        test_result=0
    fi
    
    echo ""
    echo "======================================"
    
    if [ $test_result -eq 0 ]; then
        print_status "SUCCESS" "All tests passed! Multi-tenant system is ready."
        echo ""
        print_status "INFO" "🎉 System Status: READY FOR PRODUCTION"
        print_status "INFO" "📊 Access test report at: /tmp/test_report.json"
        print_status "INFO" "🌐 Frontend: http://localhost:3000"
        print_status "INFO" "🔧 Backend API: http://localhost:8000/api/v1"
        print_status "INFO" "📚 API Docs: http://localhost:8000/docs"
    else
        print_status "ERROR" "Some tests failed. Please review the output above."
        echo ""
        print_status "INFO" "🔍 For debugging:"
        print_status "INFO" "  - Check service logs: docker logs Biwi_backend"
        print_status "INFO" "  - Check test report: /tmp/test_report.json"
        print_status "INFO" "  - Restart services: docker-compose restart"
        print_status "INFO" "  - Full reset: $0 --reset --volumes"
    fi
    
    echo "======================================"
    exit $test_result
}

# Help function
show_help() {
    echo "Multi-Tenant Testing Suite"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --reset, -r           Reset the test environment before running"
    echo "  --reset --volumes, -r -v  Reset and remove Docker volumes"
    echo "  --help, -h            Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                    Run tests with current environment"
    echo "  $0 --reset            Reset environment and run tests"
    echo "  $0 -r -v              Full reset with volume cleanup and run tests"
}

# Check for help argument
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    show_help
    exit 0
fi

# Run main function
main "$@"
