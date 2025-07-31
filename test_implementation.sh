#!/bin/bash

echo "🐳 Checking Docker containers..."
docker ps

echo -e "\n🏃 Running transaction type implementation test..."
cd /home/ubuntu24/proj/biwi/backend

# First run the basic test
python test_transaction_type_implementation.py

echo -e "\n🔍 Checking for any linting issues..."
python -m py_compile app/crud/gl.py
python -m py_compile app/api/v1/endpoints/gl.py

echo -e "\n✅ Implementation verification complete!"
