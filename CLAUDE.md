# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Vinea ERP** is a modern, multi-tenant Enterprise Resource Planning system with FastAPI backend and Next.js frontend. The system serves multiple companies with complete data isolation and includes platform administration capabilities.

## Development Commands

### Quick Start
```bash
# Full stack development (recommended)
./setup-docker.sh
docker-compose up -d

# Backend only
cd backend && ./dev.sh server

# Frontend only  
cd frontend && npm run dev
```

### Testing
```bash
# Backend tests
cd backend && poetry run pytest
cd backend && poetry run pytest -m unit          # Unit tests only
cd backend && poetry run pytest -m integration   # Integration tests only

# Frontend tests
cd frontend && npm test
cd frontend && npm run test:e2e                  # Playwright E2E tests

# Comprehensive validation
cd backend && python scripts/run_complete_validation.py
```

### Database Operations
```bash
# Run migrations
cd backend && poetry run alembic upgrade head

# Reset database completely
cd backend && ./complete_reset.sh

# Create admin user
cd backend && poetry run python create_platform_admin.py
```

### Code Quality
```bash
# Backend linting
cd backend && poetry run black . && poetry run isort . && poetry run ruff check .

# Frontend linting
cd frontend && npm run lint
```

## Architecture Overview

### Multi-Tenant Design
- **Company-based tenancy**: Complete data isolation per company
- **Tenant middleware**: Automatic company context handling in backend
- **Platform administration**: Cross-company access with user impersonation
- **User hierarchy**: Platform Admin → Company Admin → Company User

### Backend Structure (`/backend/app/`)
- `api/v1/`: REST endpoints organized by ERP modules (GL, AR, AP, Inventory, etc.)
- `core/`: Security, permissions, tenant context management
- `crud/`: Database operations layer with multi-tenant awareness
- `models/`: SQLAlchemy models with company_id foreign keys
- `services/`: Business logic layer
- `middleware/`: Tenant isolation and audit logging

### Frontend Structure (`/frontend/src/`)
- `app/`: Next.js App Router pages with multi-tenant routing
- `components/`: Reusable UI components built with Radix UI
- `services/`: API client with tenant context headers
- `store/`: Zustand state management with company switching
- `hooks/`: Custom hooks for data fetching and state management

### ERP Modules
Core business modules include: General Ledger (GL), Accounts Receivable (AR), Accounts Payable (AP), Inventory Management, Order Entry (OE), Bill of Materials (BOM), Point of Sale (POS), and Platform Administration.

## Key Development Patterns

### Database Queries
Always scope queries by company_id to maintain tenant isolation. The tenant middleware automatically provides company context.

### API Development
- Use Pydantic schemas for request/response validation
- Follow the CRUD pattern: endpoints in `api/v1/`, operations in `crud/`, business logic in `services/`
- Multi-tenant queries are handled automatically by the tenant middleware

### Frontend Development
- Use TanStack Query for server state management
- Implement company context switching through the store
- Follow the established component patterns with TypeScript

### Testing Strategy
- Mark tests with pytest markers: `@pytest.mark.unit`, `@pytest.mark.integration`, `@pytest.mark.api`
- Frontend E2E tests use Playwright with multi-company scenarios
- Use the comprehensive validation scripts for full system testing

## Important Notes

### Database Migrations
Always create migrations for schema changes: `poetry run alembic revision --autogenerate -m "description"`

### Multi-Tenant Considerations
Every database model should have a `company_id` field. Use the tenant middleware instead of manually filtering by company.

### Platform vs Company Context
Platform admins can impersonate companies. Regular company users are restricted to their tenant data. The frontend handles this through role-based routing and component access.

## Service URLs (Development)
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs
- Database: PostgreSQL on localhost:5432