# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Vinea ERP (Biwi)** is a modern, multi-tenant Enterprise Resource Planning system inspired by Sage Evolution. Built with FastAPI backend and Next.js frontend, it provides comprehensive business management capabilities with complete data isolation per company and platform administration features.

## Technology Stack

### Backend
- **Framework**: FastAPI
- **Language**: Python 3.12+
- **ORM**: SQLAlchemy with Alembic
- **Database**: PostgreSQL 15+
- **Authentication**: JWT with OAuth2PasswordBearer
- **Security**: Bcrypt (passlib), python-jose
- **Dependency Management**: Poetry
- **Additional**: pydantic-settings, python-multipart

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript 5+
- **Styling**: Tailwind CSS
- **State Management**: Zustand + AuthContext
- **Data Fetching**: TanStack React Query
- **Forms**: React Hook Form + Zod validation
- **UI Components**: Radix UI / shadcn-inspired components
- **Icons**: Lucide React
- **Additional**: js-cookie, axios

## Development Commands

### Quick Start
```bash
# Initial setup
./setup-docker.sh
docker-compose up -d

# Backend only
cd backend
poetry install
./dev.sh server    # Runs on http://localhost:8000

# Frontend only  
cd frontend
npm install
npm run dev        # Runs on http://localhost:3000

# Initialize database with admin user
cd backend && ./dev.sh init-db
```

### Testing
```bash
# Backend tests
cd backend && poetry run pytest
cd backend && poetry run pytest -m unit          # Unit tests only
cd backend && poetry run pytest -m integration   # Integration tests only
cd backend && poetry run pytest -m api          # API tests only

# Frontend tests
cd frontend && npm test                          # Jest tests
cd frontend && npm run test:e2e                  # Playwright E2E tests

# Comprehensive validation
cd backend && python scripts/run_complete_validation.py
```

### Database Operations
```bash
# Run migrations
cd backend && poetry run alembic upgrade head

# Create new migration
cd backend && poetry run alembic revision --autogenerate -m "description"

# Reset database completely
cd backend && ./complete_reset.sh

# Create platform admin user
cd backend && poetry run python create_platform_admin.py

# Seed initial data
cd backend && poetry run python app/init_db.py
```

### Code Quality
```bash
# Backend
cd backend && poetry run black .                 # Format code
cd backend && poetry run isort .                 # Sort imports
cd backend && poetry run ruff check .            # Lint code
cd backend && poetry run mypy .                  # Type checking

# Frontend
cd frontend && npm run lint                      # ESLint
cd frontend && npm run format                    # Prettier
```

## Architecture Overview

### Multi-Tenant Design
- **Row-level security**: Company-based tenancy with company_id foreign keys
- **Tenant middleware**: Automatic company context injection
- **Platform administration**: Superuser access across companies
- **User hierarchy**: Platform Admin → Company Admin → Company User
- **Company isolation**: Complete data separation per tenant

### Backend Structure (`/backend/app/`)
```
app/
├── api/v1/                 # REST endpoints by module
│   ├── endpoints/         
│   │   ├── auth.py        # Authentication endpoints
│   │   ├── users.py       # User management
│   │   ├── companies.py   # Company management
│   │   ├── gl.py          # General Ledger
│   │   ├── ar.py          # Accounts Receivable
│   │   ├── ap.py          # Accounts Payable
│   │   ├── inventory.py   # Inventory Management
│   │   └── oe.py          # Order Entry
│   └── api.py             # Router aggregation
├── core/                   # Core functionality
│   ├── security.py        # JWT, password hashing
│   ├── permissions.py     # RBAC permission system
│   └── tenant.py          # Multi-tenant context
├── crud/                   # Database operations
├── models/                 # SQLAlchemy models
├── schemas/               # Pydantic schemas
├── services/              # Business logic layer
└── middleware/            # Request processing
```

### Frontend Structure (`/frontend/src/`)
```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Public auth pages
│   └── (dashboard)/       # Protected app pages
│       ├── maintenance/   # Setup & configuration
│       ├── transactions/  # Business operations
│       └── reports/       # Reporting & analytics
├── components/            
│   ├── ui/                # Base UI components
│   ├── layout/            # Navigation, headers
│   └── modules/           # Business components
├── services/              # API client layer
├── store/                 # Zustand stores
├── hooks/                 # Custom React hooks
└── lib/                   # Utilities, constants
```

### Permission System
Granular RBAC with permissions like:
- **Users**: `users:create`, `users:read`, `users:update`, `users:delete`
- **GL**: `gl:setup_manage`, `gl:journal_post`, `gl:reports_view`
- **AR**: `ar:setup_manage`, `ar:transactions_post`, `ar:reports_view`
- **AP**: `ap:setup_manage`, `ap:transactions_post`, `ap:reports_view`
- **Inventory**: `inv:setup_manage`, `inv:transactions_adjust`, `inv:reports_view`
- **OE**: `oe:sales_orders_manage`, `oe:purchase_orders_manage`, `oe:grv_process`

### ERP Modules
1. **System Administration**: Users, roles, companies, accounting periods
2. **General Ledger (GL)**: Chart of accounts, journal entries, financial reports
3. **Accounts Receivable (AR)**: Customers, invoices, receipts, allocations
4. **Accounts Payable (AP)**: Suppliers, bills, payments, allocations
5. **Inventory Management**: Items, warehouses, stock movements, counts
6. **Order Entry (OE)**: Sales orders, purchase orders, goods received
7. **Advanced Features**: Multi-currency, tax types, branches
8. **Bill of Materials (BOM)**: Manufacturing, assembly (Phase 10)
9. **Point of Sale (POS)**: Retail operations (Phase 11)

## Key Development Patterns

### Intent-Based Navigation
The UI uses a three-tier navigation system organized by user intent:
- **Maintenance**: Setup and configuration
- **Transactions**: Daily business operations  
- **Reports**: Analytics and reporting

### Database Patterns
```python
# All models include company isolation
class MyModel(Base):
    __tablename__ = "my_models"
    
    id = Column(Integer, primary_key=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    # ... other fields

# Queries automatically filtered by tenant middleware
# No need to manually filter by company_id in CRUD operations
```

### API Patterns
```python
# Endpoints use dependency injection for permissions
@router.post("/", dependencies=[Depends(PermissionChecker(["users:create"]))])
async def create_user(...):
    # Endpoint implementation

# Pydantic schemas for validation
class UserCreate(BaseModel):
    email: EmailStr
    full_name: str
    password: str
```

### Frontend Patterns
```typescript
// API service with tenant context
const userService = {
  getUsers: () => apiClient.get<User[]>('/users'),
  createUser: (data: UserCreate) => apiClient.post<User>('/users', data)
};

// TanStack Query for data fetching
const { data: users } = useQuery({
  queryKey: ['users', selectedCompanyId],
  queryFn: userService.getUsers
});

// Permission-based UI
{hasPermission('users:create') && <CreateUserButton />}
```
## Test-Driven Development Requirements

### MANDATORY TDD WORKFLOW
**IMPORTANT**: You MUST follow Test-Driven Development for EVERY piece of code you write or modify. No exceptions.

#### TDD Process (RED-GREEN-REFACTOR):
1. **RED Phase** - Write the test first:
   - Write a failing test that defines the expected behavior
   - Run the test to ensure it fails (validates the test itself)
   - Include edge cases and error scenarios

2. **GREEN Phase** - Write minimal code:
   - Write ONLY enough code to make the test pass
   - Do not add extra functionality
   - Run tests to verify they pass

3. **REFACTOR Phase** - Improve the code:
   - Refactor for clarity and efficiency
   - Ensure all tests still pass
   - Add any additional tests discovered during implementation

#### Example TDD Response Format:
```python
# STEP 1: Write the test first
def test_create_customer_with_valid_data():
    """Test that a customer can be created with valid data"""
    # Test implementation...
    assert customer.name == "Test Customer"

# STEP 2: Write the implementation
def create_customer(db: Session, customer_data: CustomerCreate):
    """Create a new customer"""
    # Implementation that makes the test pass...

# STEP 3: Verify and refactor if needed

## Important Development Guidelines

### Multi-Tenant Considerations
1. **Every model** must have a `company_id` field (except system tables)
2. **Use tenant middleware** - don't manually filter by company_id in CRUD
3. **API responses** are automatically scoped to the user's company
4. **Superusers** can access all companies via impersonation

### GL Posting Pattern
All financial transactions must post to GL:
```python
# Example: AR Invoice posts to GL
def create_ar_invoice():
    # 1. Create AR transaction
    # 2. Create GL journal entry (Debit: AR Control, Credit: Sales)
    # 3. Link GL entry to AR transaction
    # 4. Update customer balance
```

### Testing Requirements
- Unit tests for all CRUD operations
- Integration tests for cross-module features
- API tests with multi-tenant scenarios
- E2E tests covering critical business flows

### Performance Considerations
- Use pagination for all list endpoints
- Implement proper database indexes
- Cache frequently accessed data
- Use bulk operations where possible

## Service URLs (Development)
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs (Swagger/OpenAPI)
- **Database**: PostgreSQL on localhost:5432 (Biwi_db)
- **Development Admin**: admin@biwi.com / admin123 (after init-db)