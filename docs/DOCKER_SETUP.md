# Docker Setup for Biwi Multi-tenant ERP

This guide covers the Docker Desktop setup for the Biwi Multi-tenant ERP system with the new API Route Protection implementation.

## Quick Start

### Prerequisites

- Docker Desktop installed and running
- Docker Compose available
- At least 4GB of available RAM
- Ports 3000, 5432, and 8000 available

### Standard Setup

```bash
# Clone and navigate to project
cd /path/to/biwi

# Run the setup script
./setup-docker.sh

# Or manually:
docker-compose up --build -d
```

### Enhanced Setup (with Redis, Nginx, Health Checks)

```bash
# Use the enhanced configuration
./setup-docker.sh enhanced

# Or manually:
docker-compose -f docker-compose.enhanced.yml up --build -d
```

## What's New in Day 4 (API Route Protection)

### Enhanced Authentication System
- **Platform Admin Authentication**: Separate login system for platform administrators
- **Multi-tenant Context**: Automatic tenant context setting based on user type
- **Company Impersonation**: Platform admins can impersonate companies using `X-Target-Company-ID` header
- **Enhanced Permissions**: Granular permission system with role-based access control

### New API Endpoints

#### Platform Administration Endpoints
- `GET /api/v1/platform/companies` - List all companies (platform admin only)
- `POST /api/v1/platform/companies` - Create new company (platform admin only)
- `GET /api/v1/platform/companies/{id}` - Get company details (platform admin only)
- `PUT /api/v1/platform/companies/{id}` - Update company (platform admin only)
- `POST /api/v1/platform/companies/{id}/suspend` - Suspend company (platform admin only)
- `GET /api/v1/platform/audit-logs` - View platform audit logs (platform admin only)

#### Enhanced Security Features
- **JWT Token Enhancement**: Tokens now include user type and company context
- **Audit Logging**: All platform admin actions are logged
- **Permission Checking**: Enhanced dependency injection for permission validation

## Docker Configuration Files

### Standard Configuration (`docker-compose.yml`)
- PostgreSQL database
- Backend API service
- Frontend web application
- Basic health checks

### Enhanced Configuration (`docker-compose.enhanced.yml`)
- All standard services plus:
- Redis for caching and session management
- Nginx reverse proxy (production profile)
- Enhanced health checks
- Volume management for logs and data

## Environment Variables

### Multi-tenant Specific Variables
```bash
# Platform Admin Configuration
ENABLE_PLATFORM_ADMIN=true
PLATFORM_ADMIN_EMAIL=admin@platform.local
PLATFORM_ADMIN_PASSWORD=PlatformAdmin123!

# Multi-tenant Limits
MAX_COMPANIES_PER_PLATFORM=100
DEFAULT_USER_LIMIT_PER_COMPANY=5
DEFAULT_STORAGE_LIMIT_GB=10

# Feature Flags
ENABLE_PERMISSION_SYSTEM=true
ENABLE_ROLE_BASED_ACCESS=true
ENABLE_COMPANY_IMPERSONATION=true
ENABLE_PLATFORM_AUDIT_LOGS=true
```

## Testing the Setup

### Automated Testing
```bash
# Run the API test script
./test-docker-api.sh
```

### Manual Testing

1. **Health Check**:
   ```bash
   curl http://localhost:8000/api/v1/health
   ```

2. **API Documentation**:
   Visit http://localhost:8000/docs

3. **Platform Endpoints** (should return 401 without auth):
   ```bash
   curl http://localhost:8000/api/v1/platform/companies
   ```

## Creating Platform Admin User

```bash
# Method 1: Using the admin creation script
docker-compose exec backend poetry run python create_admin.py

# Method 2: Using the FastAPI CLI (if available)
docker-compose exec backend poetry run python -m app.scripts.create_platform_admin
```

## Troubleshooting

### Common Issues

1. **Port Conflicts**:
   ```bash
   # Check what's using the ports
   lsof -i :3000 -i :8000 -i :5432
   
   # Stop conflicting services
   docker-compose down
   ```

2. **Database Connection Issues**:
   ```bash
   # Check database logs
   docker-compose logs db
   
   # Reset database
   docker-compose down -v
   docker-compose up -d
   ```

3. **Backend Not Starting**:
   ```bash
   # Check backend logs
   docker-compose logs backend
   
   # Rebuild without cache
   docker-compose build --no-cache backend
   ```

### Health Checks

The enhanced Docker setup includes health checks for all services:

```bash
# Check service health
docker-compose ps

# View health check logs
docker inspect biwi_backend | grep -A 5 Health
```

## Development Workflow

### Code Changes
- Backend code changes are automatically reloaded (volume mounted)
- Frontend code changes trigger hot reload
- Database schema changes require migration: `docker-compose exec backend poetry run alembic upgrade head`

### Logs
```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db
```

### Database Management
```bash
# Access PostgreSQL directly
docker-compose exec db psql -U biwi_user -d biwi_db

# Run migrations
docker-compose exec backend poetry run alembic upgrade head

# Create new migration
docker-compose exec backend poetry run alembic revision --autogenerate -m "Description"
```

## Production Deployment

For production deployment, use the enhanced configuration with additional security:

```bash
# Use production profile with Nginx
docker-compose -f docker-compose.enhanced.yml --profile production up -d

# Set production environment variables
cp backend/.env.production backend/.env
```

## Performance Optimization

The enhanced setup includes several performance optimizations:

- **Database Connection Pooling**: Configured in environment variables
- **Redis Caching**: For session data and frequently accessed information
- **Health Checks**: Ensure services are running optimally
- **Resource Limits**: Prevent any single service from consuming too many resources

## Security Considerations

- **Network Isolation**: All services run in a custom Docker network
- **Health Checks**: Ensure services are responding correctly
- **Environment Variables**: Sensitive data is kept in environment files
- **Non-root User**: Production containers run as non-root users
- **Audit Logging**: All platform admin actions are logged

## Next Steps

1. **Test the API Route Protection**: Use the provided test scripts
2. **Create Platform Admin User**: Follow the user creation guide
3. **Configure Frontend**: Update frontend to use new authentication endpoints
4. **Test Multi-tenant Features**: Create multiple companies and test isolation
5. **Set up Monitoring**: Add monitoring and alerting for production use
