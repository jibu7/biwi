#!/bin/bash

# Test script to verify platform API endpoints are working
BASE_URL="http://localhost:8000/api/v1"
echo "Testing Platform API Endpoints..."

# First get a token (you'll need to adjust this based on your authentication)
echo "1. Testing platform metrics endpoint..."
curl -X GET "$BASE_URL/platform/metrics/summary" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" | jq '.'

echo -e "\n2. Testing platform users endpoint..."
curl -X GET "$BASE_URL/platform/users" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" | jq '.'

echo -e "\n3. Testing platform user stats endpoint..."
curl -X GET "$BASE_URL/platform/users/stats" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" | jq '.'

echo -e "\n4. Testing platform alerts endpoint..."
curl -X GET "$BASE_URL/platform/alerts" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" | jq '.'

echo -e "\n5. Testing platform security stats endpoint..."
curl -X GET "$BASE_URL/platform/security/stats" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" | jq '.'

echo -e "\n6. Testing platform security events endpoint..."
curl -X GET "$BASE_URL/platform/security/events" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" | jq '.'

echo -e "\n7. Testing platform analytics revenue endpoint..."
curl -X GET "$BASE_URL/platform/analytics/revenue" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" | jq '.'

echo -e "\n8. Testing platform analytics usage endpoint..."
curl -X GET "$BASE_URL/platform/analytics/usage" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" | jq '.'

echo -e "\n9. Testing platform settings endpoint..."
curl -X GET "$BASE_URL/platform/settings" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" | jq '.'

echo -e "\nAll endpoint tests completed!"
