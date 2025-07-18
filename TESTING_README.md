# Multi-Tenant Testing Suite

This directory contains a comprehensive testing suite for the multi-tenant ERP system running in Docker.

## Scripts Overview

### 🚀 Main Test Runner
- **`test_multi_tenant.sh`** - Master testing script that runs the complete test suite
- **`quick_test.sh`** - Quick health check and essential tests for development

### 🐍 Python Test Scripts
- **`scripts/setup_test_data.py`** - Sets up test data and prepares the environment
- **`scripts/run_all_tests.py`** - Comprehensive test runner that executes all available tests

## Usage

### Quick Health Check
```bash
./quick_test.sh
```
Runs essential tests to verify system health. Perfect for development workflow.

### Full Test Suite
```bash
./test_multi_tenant.sh
```
Runs the complete multi-tenant testing suite including:
- Infrastructure tests
- Database tests  
- Multi-tenant isolation tests
- Business logic tests
- Platform tests
- Integration tests

### Options
```bash
# Run with fresh environment
./test_multi_tenant.sh --reset

# Full reset including Docker volumes
./test_multi_tenant.sh --reset --volumes

# Show help
./test_multi_tenant.sh --help
```

## Test Categories

### 🔧 Infrastructure Tests
- Docker service health checks
- Database connectivity
- API endpoint availability
- Configuration validation

### 🗄️ Database Tests
- Migration validation
- SQL execution tests
- Connection pooling
- Transaction isolation

### 🏢 Multi-Tenant Tests
- Tenant isolation verification
- Cross-tenant data protection
- Tenant-specific configurations
- Platform admin functionality

### 💼 Business Logic Tests
- Inventory management
- General ledger operations
- Approval workflows
- Order processing

### 🔄 Integration Tests
- End-to-end workflows
- API integration
- Frontend-backend communication
- Complete business processes

## Prerequisites

### Docker Services
Ensure the following Docker services are running:
- `Biwi_db` (PostgreSQL database)
- `Biwi_backend` (FastAPI backend)
- `Biwi_frontend` (Next.js frontend)

Start services with:
```bash
docker-compose up -d
```

### Test Data
The test suite automatically sets up required test data including:
- Platform admin user
- Test tenants
- Sample business data
- GL account structure
- Units of measure

## Output and Reporting

### Console Output
Tests provide real-time feedback with colored output:
- ✅ Green for passed tests
- ❌ Red for failed tests
- ℹ️ Blue for informational messages
- ⚠️ Yellow for warnings

### Test Report
Detailed test results are saved to `/tmp/test_report.json` with:
- Test execution summary
- Individual test results
- Error details
- Performance metrics

### Service Information
After successful tests, the suite displays:
- 🌐 Frontend URL: http://localhost:3000
- 🔧 Backend API: http://localhost:8000/api/v1
- 📚 API Documentation: http://localhost:8000/docs

## Troubleshooting

### Common Issues

1. **Services Not Running**
   ```bash
   docker-compose up -d
   ```

2. **Database Connection Issues**
   ```bash
   docker-compose restart db backend
   ```

3. **Test Data Setup Failure**
   ```bash
   ./test_multi_tenant.sh --reset
   ```

4. **Complete Environment Reset**
   ```bash
   ./test_multi_tenant.sh --reset --volumes
   ```

### Debug Information
- Check service logs: `docker logs Biwi_backend`
- View test report: `cat /tmp/test_report.json`
- Monitor service status: `docker ps`

## Development Workflow

### During Development
1. Use `./quick_test.sh` for rapid feedback
2. Run specific test files directly in Docker:
   ```bash
   docker exec Biwi_backend python test_specific_feature.py
   ```

### Before Deployment
1. Run full test suite: `./test_multi_tenant.sh`
2. Verify all tests pass
3. Review test report for any warnings

### CI/CD Integration
The scripts are designed to work in CI/CD pipelines:
- Exit codes indicate success/failure
- JSON reports for automated processing
- Detailed logging for debugging

## Test Coverage

The suite covers:
- ✅ Multi-tenant data isolation
- ✅ Platform administration
- ✅ Business workflow integrity
- ✅ API endpoint functionality
- ✅ Database consistency
- ✅ User authentication/authorization
- ✅ Error handling
- ✅ Performance basics

## Contributing

When adding new tests:
1. Add test scripts to appropriate category in `run_all_tests.py`
2. Update test timeout if needed
3. Follow naming convention: `test_feature_name.py`
4. Include proper error handling and logging
5. Test both success and failure scenarios
