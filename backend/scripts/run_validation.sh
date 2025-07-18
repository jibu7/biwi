#!/bin/bash

# Multi-Tenant Migration Validation Script
echo "Starting Multi-Tenant Migration Validation"
echo "==========================================="

cd /home/ubuntu24/proj/biwi/backend

# 1. Run validation script
echo
echo "Step 1: Running migration validation..."
echo "--------------------------------------"
poetry run python scripts/validate_migration.py

# 2. Create test data
echo
echo "Step 2: Creating test platform data..."
echo "-------------------------------------"
poetry run python scripts/create_test_platform_data.py

# 3. Test platform admin login
echo
echo "Step 3: Creating/verifying platform admin..."
echo "--------------------------------------------"
poetry run python create_admin.py

# 4. Test multi-tenant functionality
echo
echo "Step 4: Testing multi-tenant functionality..."
echo "---------------------------------------------"
poetry run python scripts/test_multitenant_functionality.py

echo
echo "==========================================="
echo "Multi-tenant validation complete!"
echo "==========================================="
