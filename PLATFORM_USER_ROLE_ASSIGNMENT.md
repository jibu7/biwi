# Platform User Role Assignment - Implementation Guide

## Overview
This document outlines the automatic role assignment system implemented for platform user creation to ensure all users have appropriate permissions.

## Problem Solved
Previously, users created through the platform interface (`http://localhost:3000/platform/users`) were not automatically assigned roles, leaving them unable to access any functionality despite successful authentication.

## Implementation Details

### 1. Platform User Creation Endpoint
**File:** `/backend/app/api/v1/endpoints/platform.py`
**Endpoint:** `POST /api/v1/platform/users`

**Automatic Role Assignment Logic:**
- **Company Admin Users** (`user_type: "company_admin"`)
  - Automatically assigned: "Company Administrator" role
  - Grants: Full system access for their company
  
- **Company Users** (`user_type: "company_user"`)
  - Automatically assigned: "Data Entry Clerk" role
  - Grants: Basic data entry and limited transaction processing

- **Platform Admins** (`user_type: "platform_admin"`)
  - No company-specific roles assigned
  - Have platform-wide administrative access

### 2. Company Management Service
**File:** `/backend/app/services/company_management.py`
**Method:** `create_company_user()`

Enhanced to also assign default roles when none are explicitly provided, ensuring consistency across all user creation methods.

### 3. Frontend Integration
**File:** `/frontend/src/components/platform/UserDialog.tsx`
**Service:** `/frontend/src/services/platformService.ts`

Uses the `/platform/users` endpoint which now automatically handles role assignment.

## Testing Verification

### Test Results ✅
- Company admin users get "Company Administrator" role automatically
- Company users get "Data Entry Clerk" role automatically
- Role assignment works for both platform and service-level creation
- Existing users can be retroactively fixed if needed

### Test Commands
```bash
# Test user creation via API
curl -X POST "http://localhost:8000/api/v1/platform/users" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <platform_admin_token>" \
  -d '{
    "email": "test@company.com",
    "password": "password123",
    "full_name": "Test User",
    "user_type": "company_admin",
    "company_id": 8,
    "is_active": true
  }'

# Verify role assignment
docker exec -it Biwi_db psql -U Biwi_user -d Biwi_db -c \
  "SELECT u.email, r.name as role_name FROM users u 
   LEFT JOIN user_roles ur ON u.id = ur.user_id 
   LEFT JOIN roles r ON ur.role_id = r.id 
   WHERE u.email = 'test@company.com';"
```

## Database Schema

### Required Tables
- `users` - User accounts
- `companies` - Company/tenant data  
- `roles` - Company-specific roles
- `user_roles` - Many-to-many relationship between users and roles

### Default Roles Required Per Company
Each company must have these roles for automatic assignment to work:
1. **Company Administrator** - For company_admin users
2. **Data Entry Clerk** - For company_user users

## Error Handling

### Missing Roles
If required roles don't exist for a company, the system:
- Logs a warning message
- Creates the user without roles (degraded but not blocked)
- Allows manual role assignment later

### Debug Logging
Role assignment includes debug logging:
```
DEBUG: Assigned Company Administrator role (ID: 2) to user
DEBUG: Assigned Data Entry Clerk role (ID: 7) to user
WARNING: Company Administrator role not found for company 8
```

## Future Maintenance

### Adding New User Types
When adding new user types, update both:
1. `/backend/app/api/v1/endpoints/platform.py` - Platform endpoint
2. `/backend/app/services/company_management.py` - Service layer

### Adding New Default Roles
Update the role assignment logic in both locations to handle new role types.

## Verification Checklist

Before deploying changes:
- [ ] Backend containers restarted
- [ ] Test user creation through platform interface
- [ ] Verify debug logs show role assignment
- [ ] Check database for proper user_roles entries
- [ ] Test user login and functionality access

## Related Files Modified
- `/backend/app/api/v1/endpoints/platform.py` - Main platform endpoint
- `/backend/app/services/company_management.py` - Service layer enhancement
- This documentation file

---
**Last Updated:** July 23, 2025
**Status:** ✅ Implemented and Tested
