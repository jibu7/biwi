# 🚀 Ultimate Biwi ERP Development Guide

**Document Version:** 2.0  
**Date:** December 2024  
**Project Name:**  (Biwi)  
**Purpose:** Complete AI-driven development guide for building a comprehensive ERP system from scratch

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Development Approach](#development-approach)
4. [Phase 0: Project Initialization](#phase-0-project-initialization--core-setup)
5. [Phase 1: Core System Backend](#phase-1-core-system-backend-foundation)
6. [Phase 2: Core System Frontend](#phase-2-core-system-frontend-foundation)
7. [Phase 3: General Ledger Module](#phase-3-general-ledger-module)
8. [Phase 4: Accounts Receivable Module](#phase-4-accounts-receivable-module)
9. [Phase 5: Accounts Payable Module](#phase-5-accounts-payable-module)
10. [Phase 6: Inventory Management Module](#phase-6-inventory-management-module)
11. [Phase 7: Order Entry Module](#phase-7-order-entry-module)
12. [Phase 8: Advanced Maintenance](#phase-8-advanced-maintenance--common-features)

## Project Overview

### Vision
 is a modern, web-based Enterprise Resource Planning system designed for small to medium-sized enterprises. It provides comprehensive business management capabilities including accounting, inventory management, order processing, and advanced reporting.

### Core Modules
- **System Administration**: User management, RBAC, multi-company support
- **General Ledger**: Chart of accounts, journal entries, financial reporting
- **Accounts Receivable**: Customer management, invoicing, payments, allocations
- **Accounts Payable**: Supplier management, bills, payments, allocations
- **Inventory Management**: Item master, warehouses, stock movements, valuation
- **Order Entry**: Sales orders, purchase orders, goods received vouchers
- **Advanced Features**: Multi-currency, tax management, branches
- **Bill of Materials** (Future)
- **Point of Sale** (Future)

## Technology Stack

### Backend
- **Framework**: FastAPI
- **Language**: Python 3.12
- **ORM**: SQLAlchemy with Alembic
- **Database**: PostgreSQL
- **Authentication**: JWT
- **Security**: Bcrypt for hashing
- **Dependency Management**: Poetry

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Data Fetching**: Tanstack React Query
- **HTTP Client**: Axios
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React
- **Cookies**: js-cookie

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Testing**: Pytest (backend), Jest/React Testing Library (frontend)
- **E2E Testing**: Cypress/Playwright (Phase 13)

## Development Approach

### Core Principles
1. **Iterative Development**: Complete each phase fully before proceeding
2. **Clear Instructions**: Every task has specific actions and expected outcomes
3. **Dependency Awareness**: Explicit dependencies between phases
4. **Quality First**: Comprehensive testing and error handling throughout
5. **Intent-Based UI**: Navigation organized by user intent (Maintenance, Transactions, Reports)

### AI Collaboration Guidelines
- Each phase must be explicitly confirmed complete before proceeding
- Instructions are granular with specific file paths and content hints
- All features must respect RBAC and multi-company isolation
- Backend logic must handle GL posting and cross-module integration
- Frontend must use permission-based UI filtering

---

## Phase 0: Project Initialization & Core Setup

### Objective
Establish the foundational project structure, version control, and initial development environment for both frontend and backend.

### Instructions

#### 1. Create Root Directory
```bash
mkdir Biwi
cd Biwi
```

#### 2. Initialize Git Repository
```bash
git init
```

Create `.gitignore`:
```gitignore
# Python
__pycache__/
*.pyc
*.egg-info/
venv/
.env
*.log
.pytest_cache/

# Node.js
node_modules/
.next/
out/
build/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# OS
.DS_Store
Thumbs.db

# IDE
.idea/
.vscode/

# Docker
*.pid
```

#### 3. Create Project Structure
```bash
mkdir frontend backend database docker docs
echo "# " > README.md
echo "A modern, comprehensive ERP system built with FastAPI and Next.js" >> README.md
```

#### 4. Backend Initialization

Navigate to backend directory:
```bash
cd backend
```

Initialize Poetry project:
```bash
poetry init --name backend --description " Backend" --python "^3.12" -n
```

Add dependencies:
```bash
poetry add fastapi uvicorn sqlalchemy psycopg2-binary alembic python-jose[cryptography] passlib[bcrypt] python-multipart pydantic[email] pydantic-settings
poetry add --group dev pytest httpx black isort mypy ruff
```

Create app structure:
```bash
mkdir -p app/api/v1/endpoints app/core app/crud app/database app/models app/schemas
touch app/__init__.py app/main.py app/config.py
```

Create `app/main.py`:
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title=" Backend")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": " Backend is running"}
```

Create `app/config.py`:
```python
from pydantic_settings import BaseSettings, SettingsConfigDict
import os

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://user:password@localhost/Biwi_db"
    SECRET_KEY: str = "your_super_secret_key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    ALLOWED_HOSTS: list[str] = ["*"]
    
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
```

Create `app/database/database.py`:
```python
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

Initialize Alembic:
```bash
poetry run alembic init alembic
```

Update `alembic.ini`:
```ini
sqlalchemy.url = postgresql://Biwi_user:Biwi_password@localhost/Biwi_db
```

Update `alembic/env.py` to import Base and models:
```python
from app.database.database import Base
from app.models import core  # Import all models
target_metadata = Base.metadata

from app.config import settings
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)
```

Create `.env.example`:
```env
DATABASE_URL=postgresql://Biwi_user:Biwi_password@db:5432/Biwi_db
SECRET_KEY=generate_a_strong_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

Create `setup.sh`:
```bash
#!/bin/bash
poetry install
poetry run alembic upgrade head
```

Create `dev.sh`:
```bash
#!/bin/bash
if [ "$1" == "init-db" ]; then
  poetry run python app/init_db.py
elif [ "$1" == "server" ]; then
  poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
else
  echo "Usage: ./dev.sh [init-db|server]"
fi
```

Create `app/init_db.py` (stub):
```python
from app.database.database import SessionLocal, engine, Base
from app.config import settings

def init_db():
    db = SessionLocal()
    print("Database initialization script - to be populated in Phase 1")
    db.close()

if __name__ == "__main__":
    print("Initializing database...")
    init_db()
    print("Database initialization finished.")
```

#### 5. Frontend Initialization

Navigate to frontend directory:
```bash
cd ../frontend
```

Initialize Next.js project:
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --use-npm
```

Add dependencies:
```bash
npm install @tanstack/react-query axios react-hook-form @hookform/resolvers zod lucide-react js-cookie zustand
npm install --save-dev @types/node @types/js-cookie
```

Create folder structure:
```bash
mkdir -p src/components/ui src/components/layout src/components/modules
mkdir -p src/hooks src/lib src/services src/store src/types src/styles
```

#### 6. Docker Setup

Create `docker-compose.yml` in root:
```yaml
version: '3.8'

services:
  db:
    image: postgres:15
    container_name: Biwi_db
    volumes:
      - postgres_data:/var/lib/postgresql/data/
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: Biwi_user
      POSTGRES_PASSWORD: Biwi_password
      POSTGRES_DB: Biwi_db
    networks:
      - Biwi_network

  backend:
    build:
      context: ./backend
      dockerfile: ../docker/Dockerfile.backend
    container_name: Biwi_backend
    command: poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000
    volumes:
      - ./backend:/app
    ports:
      - "8000:8000"
    depends_on:
      - db
    env_file:
      - ./backend/.env
    networks:
      - Biwi_network

  frontend:
    build:
      context: ./frontend
      dockerfile: ../docker/Dockerfile.frontend
    container_name: Biwi_frontend
    command: npm run dev
    volumes:
      - ./frontend:/app
      - /app/node_modules
      - /app/.next
    ports:
      - "3000:3000"
    depends_on:
      - backend
    environment:
      NEXT_PUBLIC_API_BASE_URL: http://backend:8000/api
    networks:
      - Biwi_network

volumes:
  postgres_data:

networks:
  Biwi_network:
    driver: bridge
```

Create `docker/Dockerfile.backend`:
```dockerfile
FROM python:3.9-slim

WORKDIR /app

RUN pip install poetry

COPY pyproject.toml poetry.lock* /app/

RUN poetry config virtualenvs.create false && poetry install --no-interaction --no-ansi --only main

COPY . /app

EXPOSE 8000

CMD ["poetry", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Create `docker/Dockerfile.frontend`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm install

COPY . ./

EXPOSE 3000

CMD ["npm", "run", "dev"]
```

### Definition of Done - Phase 0
- [ ] Git repository initialized with comprehensive .gitignore
- [ ] Complete directory structure created
- [ ] Backend project initialized with Poetry and all dependencies
- [ ] Frontend project initialized with Next.js and all dependencies
- [ ] Docker setup complete with all services configured
- [ ] Application runs via `docker-compose up --build`
- [ ] Backend accessible at http://localhost:8000
- [ ] Frontend accessible at http://localhost:3000

---

## Phase 1: Core System Backend Foundation

### Objective
Implement fundamental backend services for authentication, authorization (RBAC), user management, company setup, and accounting period management.

### Instructions

#### 1. Database Models

Create `app/models/core.py`:
```python
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Date, JSONB, Numeric, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database.database import Base

class Company(Base):
    __tablename__ = "companies"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    address = Column(JSONB, nullable=True)
    contact_info = Column(JSONB, nullable=True)
    default_currency_code = Column(String(3), nullable=True)
    is_active = Column(Boolean, default=True)
    
    users = relationship("User", back_populates="company")
    roles = relationship("Role", back_populates="company")
    accounting_periods = relationship("AccountingPeriod", back_populates="company")

class Role(Base):
    __tablename__ = "roles"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    description = Column(String, nullable=True)
    permissions = Column(JSONB, nullable=True)  # List of permission strings
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    
    company = relationship("Company", back_populates="roles")
    users = relationship("UserRole", back_populates="role")
    
    __table_args__ = (UniqueConstraint('name', 'company_id', name='uq_role_name_company'),)

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    
    company = relationship("Company", back_populates="users")
    roles = relationship("UserRole", back_populates="user")

class UserRole(Base):
    __tablename__ = "user_roles"
    
    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    role_id = Column(Integer, ForeignKey("roles.id"), primary_key=True)
    
    user = relationship("User", back_populates="roles")
    role = relationship("Role", back_populates="users")

class AccountingPeriod(Base):
    __tablename__ = "accounting_periods"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    name = Column(String, nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    status = Column(String, nullable=False)  # "Open", "Closed", "Future"
    
    company = relationship("Company", back_populates="accounting_periods")
    
    __table_args__ = (UniqueConstraint('name', 'company_id', name='uq_accountingperiod_name_company'),)
```

Update `app/models/__init__.py`:
```python
from .core import User, Role, UserRole, Company, AccountingPeriod
```

#### 2. Pydantic Schemas

Create `app/schemas/core.py`:
```python
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import date

# Company Schemas
class CompanyBase(BaseModel):
    name: str
    address: Optional[dict] = None
    contact_info: Optional[dict] = None
    default_currency_code: Optional[str] = None
    is_active: bool = True

class CompanyCreate(CompanyBase):
    pass

class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[dict] = None
    contact_info: Optional[dict] = None
    default_currency_code: Optional[str] = None
    is_active: Optional[bool] = None

class Company(CompanyBase):
    id: int
    
    class Config:
        from_attributes = True

# Role Schemas
class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None
    permissions: List[str] = []

class RoleCreate(RoleBase):
    pass

class RoleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    permissions: Optional[List[str]] = None

class Role(RoleBase):
    id: int
    company_id: int
    
    class Config:
        from_attributes = True

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    is_active: bool = True
    is_superuser: bool = False

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None
    is_superuser: Optional[bool] = None

class User(UserBase):
    id: int
    company_id: int
    
    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str

# Accounting Period Schemas
class AccountingPeriodBase(BaseModel):
    name: str
    start_date: date
    end_date: date
    status: str = "Open"

class AccountingPeriodCreate(AccountingPeriodBase):
    pass

class AccountingPeriodUpdate(BaseModel):
    name: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[str] = None

class AccountingPeriod(AccountingPeriodBase):
    id: int
    company_id: int
    
    class Config:
        from_attributes = True

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    user_id: Optional[int] = None
    permissions: List[str] = []
```

#### 3. Security & Permissions

Create `app/core/security.py`:
```python
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.config import settings
from app.database.database import get_db
from app import models

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> models.User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
    
    user_id = payload.get("user_id")
    if user_id is None:
        raise credentials_exception
    
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        raise credentials_exception
    
    return user

async def get_current_active_user(
    current_user: models.User = Depends(get_current_user)
) -> models.User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

async def get_current_active_superuser(
    current_user: models.User = Depends(get_current_active_user)
) -> models.User:
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions"
        )
    return current_user
```

Create `app/core/permissions.py`:
```python
from typing import List
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.database import get_db
from app import models
from app.core.security import get_current_active_user

# User Permissions
USER_CREATE = "users:create"
USER_READ = "users:read"
USER_UPDATE = "users:update"
USER_DELETE = "users:delete"
USER_MANAGE_ROLES = "users:manage_roles"

# Role Permissions
ROLE_CREATE = "roles:create"
ROLE_READ = "roles:read"
ROLE_UPDATE = "roles:update"
ROLE_DELETE = "roles:delete"
ROLE_MANAGE_PERMISSIONS = "roles:manage_permissions"

# Company Permissions
COMPANY_CREATE = "company:create"
COMPANY_READ = "company:read"
COMPANY_UPDATE = "company:update"

# Accounting Period Permissions
ACCOUNTING_PERIOD_MANAGE = "accounting_periods:manage"

# GL Permissions (for future phases)
GL_SETUP_MANAGE = "gl:setup_manage"
GL_JOURNAL_POST = "gl:journal_post"
GL_REPORTS_VIEW = "gl:reports_view"

# AR Permissions (for future phases)
AR_SETUP_MANAGE = "ar:setup_manage"
AR_TRANSACTIONS_POST = "ar:transactions_post"
AR_REPORTS_VIEW = "ar:reports_view"

# AP Permissions (for future phases)
AP_SETUP_MANAGE = "ap:setup_manage"
AP_TRANSACTIONS_POST = "ap:transactions_post"
AP_REPORTS_VIEW = "ap:reports_view"

# Inventory Permissions (for future phases)
INV_SETUP_MANAGE = "inv:setup_manage"
INV_TRANSACTIONS_ADJUST = "inv:transactions_adjust"
INV_REPORTS_VIEW = "inv:reports_view"

# OE Permissions (for future phases)
OE_SETUP_MANAGE = "oe:setup_manage"
OE_SALES_ORDERS_MANAGE = "oe:sales_orders_manage"
OE_PURCHASE_ORDERS_MANAGE = "oe:purchase_orders_manage"
OE_GRV_PROCESS = "oe:grv_process"
OE_REPORTS_VIEW = "oe:reports_view"

# Common Setup Permissions (for future phases)
COMMON_SETUP_CURRENCIES = "common:setup_currencies"
COMMON_SETUP_TAXES = "common:setup_taxes"
COMMON_SETUP_BRANCHES = "common:setup_branches"

ALL_PERMISSIONS_LIST = [
    USER_CREATE, USER_READ, USER_UPDATE, USER_DELETE, USER_MANAGE_ROLES,
    ROLE_CREATE, ROLE_READ, ROLE_UPDATE, ROLE_DELETE, ROLE_MANAGE_PERMISSIONS,
    COMPANY_READ, COMPANY_UPDATE, ACCOUNTING_PERIOD_MANAGE,
    GL_SETUP_MANAGE, GL_JOURNAL_POST, GL_REPORTS_VIEW,
    AR_SETUP_MANAGE, AR_TRANSACTIONS_POST, AR_REPORTS_VIEW,
    AP_SETUP_MANAGE, AP_TRANSACTIONS_POST, AP_REPORTS_VIEW,
    INV_SETUP_MANAGE, INV_TRANSACTIONS_ADJUST, INV_REPORTS_VIEW,
    OE_SETUP_MANAGE, OE_SALES_ORDERS_MANAGE, OE_PURCHASE_ORDERS_MANAGE, 
    OE_GRV_PROCESS, OE_REPORTS_VIEW,
    COMMON_SETUP_CURRENCIES, COMMON_SETUP_TAXES, COMMON_SETUP_BRANCHES,
]

class PermissionChecker:
    def __init__(self, required_permissions: List[str]):
        self.required_permissions = required_permissions
    
    async def __call__(
        self,
        user: models.User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
    ):
        if user.is_superuser:
            return user
        
        # Get user's permissions from all roles
        user_permissions = []
        for user_role in user.roles:
            role = db.query(models.Role).filter(
                models.Role.id == user_role.role_id
            ).first()
            if role and role.permissions:
                user_permissions.extend(role.permissions)
        
        # Check if user has all required permissions
        for permission in self.required_permissions:
            if permission not in user_permissions:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not enough permissions"
                )
        
        return user

def get_all_permissions() -> List[str]:
    return ALL_PERMISSIONS_LIST
```

#### 4. CRUD Operations

Create `app/crud/core.py`:
```python
from sqlalchemy.orm import Session
from typing import Optional, List
from app import models, schemas
from app.core.security import get_password_hash

# User CRUD
def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate, company_id: int) -> models.User:
    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name,
        is_active=user.is_active,
        is_superuser=user.is_superuser,
        company_id=company_id
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user(db: Session, user_db_obj: models.User, user_in: schemas.UserUpdate) -> models.User:
    update_data = user_in.model_dump(exclude_unset=True)
    if "password" in update_data:
        update_data["hashed_password"] = get_password_hash(update_data.pop("password"))
    
    for field, value in update_data.items():
        setattr(user_db_obj, field, value)
    
    db.add(user_db_obj)
    db.commit()
    db.refresh(user_db_obj)
    return user_db_obj

def get_users_by_company(db: Session, company_id: int, skip: int = 0, limit: int = 100) -> List[models.User]:
    return db.query(models.User).filter(
        models.User.company_id == company_id
    ).offset(skip).limit(limit).all()

def get_user(db: Session, user_id: int) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.id == user_id).first()

def delete_user(db: Session, user_id: int) -> Optional[models.User]:
    user = get_user(db, user_id)
    if user:
        db.delete(user)
        db.commit()
    return user

# Role CRUD
def create_role(db: Session, role: schemas.RoleCreate, company_id: int) -> models.Role:
    db_role = models.Role(
        name=role.name,
        description=role.description,
        permissions=role.permissions,
        company_id=company_id
    )
    db.add(db_role)
    db.commit()
    db.refresh(db_role)
    return db_role

def get_role(db: Session, role_id: int, company_id: int) -> Optional[models.Role]:
    return db.query(models.Role).filter(
        models.Role.id == role_id,
        models.Role.company_id == company_id
    ).first()

def get_roles_by_company(db: Session, company_id: int, skip: int = 0, limit: int = 100) -> List[models.Role]:
    return db.query(models.Role).filter(
        models.Role.company_id == company_id
    ).offset(skip).limit(limit).all()

def update_role(db: Session, role_db_obj: models.Role, role_in: schemas.RoleUpdate) -> models.Role:
    update_data = role_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(role_db_obj, field, value)
    
    db.add(role_db_obj)
    db.commit()
    db.refresh(role_db_obj)
    return role_db_obj

def delete_role(db: Session, role_id: int, company_id: int) -> Optional[models.Role]:
    role = get_role(db, role_id, company_id)
    if role:
        db.delete(role)
        db.commit()
    return role

def assign_role_to_user(db: Session, user_id: int, role_id: int, company_id: int) -> models.User:
    user = get_user(db, user_id)
    role = get_role(db, role_id, company_id)
    
    if not user or not role:
        return None
   ```

Update `app/crud/__init__.py`:
```python
from . import core
```

#### 5. API Endpoints

Create `app/api/v1/endpoints/auth.py`:
```python
from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app import crud, models, schemas
from app.api import deps
from app.core import security
from app.core.config import settings
from app.database.database import get_db

router = APIRouter()

@router.post("/login", response_model=schemas.Token)
async def login(
    db: Session = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """OAuth2 compatible token login"""
    user = crud.core.get_user_by_email(db, email=form_data.username)
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        {"user_id": user.id, "email": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=schemas.User)
async def read_users_me(
    current_user: models.User = Depends(security.get_current_active_user),
) -> Any:
    """Get current user"""
    return current_user
```

Create `app/api/v1/endpoints/users.py`:
```python
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import crud, models, schemas
from app.core.permissions import PermissionChecker, USER_CREATE, USER_READ, USER_UPDATE, USER_DELETE, USER_MANAGE_ROLES
from app.core.security import get_current_active_user
from app.database.database import get_db

router = APIRouter()

@router.post("/", response_model=schemas.User, dependencies=[Depends(PermissionChecker([USER_CREATE]))])
def create_user(
    *,
    db: Session = Depends(get_db),
    user_in: schemas.UserCreate,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Create new user"""
    user = crud.core.get_user_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
    user = crud.core.create_user(db, user=user_in, company_id=current_user.company_id)
    return user

@router.get("/", response_model=List[schemas.User], dependencies=[Depends(PermissionChecker([USER_READ]))])
def read_users(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Retrieve users"""
    users = crud.core.get_users_by_company(
        db, company_id=current_user.company_id, skip=skip, limit=limit
    )
    return users

@router.get("/{user_id}", response_model=schemas.User, dependencies=[Depends(PermissionChecker([USER_READ]))])
def read_user(
    user_id: int,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    """Get user by ID"""
    user = crud.core.get_user(db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.company_id != current_user.company_id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return user

@router.put("/{user_id}", response_model=schemas.User, dependencies=[Depends(PermissionChecker([USER_UPDATE]))])
def update_user(
    *,
    db: Session = Depends(get_db),
    user_id: int,
    user_in: schemas.UserUpdate,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Update user"""
    user = crud.core.get_user(db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.company_id != current_user.company_id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    user = crud.core.update_user(db, user_db_obj=user, user_in=user_in)
    return user

@router.delete("/{user_id}", response_model=schemas.User, dependencies=[Depends(PermissionChecker([USER_DELETE]))])
def delete_user(
    *,
    db: Session = Depends(get_db),
    user_id: int,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Delete user"""
    user = crud.core.get_user(db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.company_id != current_user.company_id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    user = crud.core.delete_user(db, user_id=user_id)
    return user

@router.post("/{user_id}/roles/{role_id}", response_model=schemas.User, dependencies=[Depends(PermissionChecker([USER_MANAGE_ROLES]))])
def assign_role_to_user(
    user_id: int,
    role_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Assign role to user"""
    user = crud.core.assign_role_to_user(
        db, user_id=user_id, role_id=role_id, company_id=current_user.company_id
    )
    if not user:
        raise HTTPException(status_code=404, detail="User or role not found")
    return user

@router.delete("/{user_id}/roles/{role_id}", response_model=schemas.User, dependencies=[Depends(PermissionChecker([USER_MANAGE_ROLES]))])
def revoke_role_from_user(
    user_id: int,
    role_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Revoke role from user"""
    user = crud.core.revoke_role_from_user(
        db, user_id=user_id, role_id=role_id, company_id=current_user.company_id
    )
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
```

Create `app/api/v1/endpoints/roles.py`:
```python
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import crud, models, schemas
from app.core.permissions import (
    PermissionChecker, ROLE_CREATE, ROLE_READ, ROLE_UPDATE, 
    ROLE_DELETE, ROLE_MANAGE_PERMISSIONS, get_all_permissions
)
from app.core.security import get_current_active_user
from app.database.database import get_db

router = APIRouter()

@router.post("/", response_model=schemas.Role, dependencies=[Depends(PermissionChecker([ROLE_CREATE]))])
def create_role(
    *,
    db: Session = Depends(get_db),
    role_in: schemas.RoleCreate,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Create new role"""
    role = crud.core.create_role(db, role=role_in, company_id=current_user.company_id)
    return role

@router.get("/", response_model=List[schemas.Role], dependencies=[Depends(PermissionChecker([ROLE_READ]))])
def read_roles(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Retrieve roles"""
    roles = crud.core.get_roles_by_company(
        db, company_id=current_user.company_id, skip=skip, limit=limit
    )
    return roles

@router.get("/permissions/all", response_model=List[str])
def get_all_available_permissions(
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Get all available permissions"""
    return get_all_permissions()

@router.get("/{role_id}", response_model=schemas.Role, dependencies=[Depends(PermissionChecker([ROLE_READ]))])
def read_role(
    role_id: int,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    """Get role by ID"""
    role = crud.core.get_role(db, role_id=role_id, company_id=current_user.company_id)
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    return role

@router.put("/{role_id}", response_model=schemas.Role, dependencies=[Depends(PermissionChecker([ROLE_UPDATE, ROLE_MANAGE_PERMISSIONS]))])
def update_role(
    *,
    db: Session = Depends(get_db),
    role_id: int,
    role_in: schemas.RoleUpdate,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Update role"""
    role = crud.core.get_role(db, role_id=role_id, company_id=current_user.company_id)
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    role = crud.core.update_role(db, role_db_obj=role, role_in=role_in)
    return role

@router.delete("/{role_id}", response_model=schemas.Role, dependencies=[Depends(PermissionChecker([ROLE_DELETE]))])
def delete_role(
    *,
    db: Session = Depends(get_db),
    role_id: int,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Delete role"""
    role = crud.core.delete_role(db, role_id=role_id, company_id=current_user.company_id)
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    return role
```

Create `app/api/v1/endpoints/companies.py`:
```python
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import crud, models, schemas
from app.core.permissions import PermissionChecker, COMPANY_CREATE, COMPANY_READ, COMPANY_UPDATE
from app.core.security import get_current_active_user, get_current_active_superuser
from app.database.database import get_db

router = APIRouter()

@router.post("/", response_model=schemas.Company)
def create_company(
    *,
    db: Session = Depends(get_db),
    company_in: schemas.CompanyCreate,
    current_user: models.User = Depends(get_current_active_superuser),
) -> Any:
    """Create new company (superuser only)"""
    company = crud.core.create_company(db, company=company_in)
    return company

@router.get("/", response_model=List[schemas.Company])
def read_companies(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(get_current_active_superuser),
) -> Any:
    """Retrieve companies (superuser only)"""
    companies = crud.core.get_companies(db, skip=skip, limit=limit)
    return companies

@router.get("/current", response_model=schemas.Company)
def read_current_company(
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    """Get current user's company"""
    company = crud.core.get_company(db, company_id=current_user.company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company

@router.get("/{company_id}", response_model=schemas.Company, dependencies=[Depends(PermissionChecker([COMPANY_READ]))])
def read_company(
    company_id: int,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    """Get company by ID"""
    company = crud.core.get_company(db, company_id=company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    if company.id != current_user.company_id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return company

@router.put("/{company_id}", response_model=schemas.Company, dependencies=[Depends(PermissionChecker([COMPANY_UPDATE]))])
def update_company(
    *,
    db: Session = Depends(get_db),
    company_id: int,
    company_in: schemas.CompanyUpdate,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Update company"""
    company = crud.core.get_company(db, company_id=company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    if company.id != current_user.company_id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    company = crud.core.update_company(db, company_db_obj=company, company_in=company_in)
    return company
```

Create `app/api/v1/endpoints/accounting_periods.py`:
```python
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import crud, models, schemas
from app.core.permissions import PermissionChecker, ACCOUNTING_PERIOD_MANAGE
from app.core.security import get_current_active_user
from app.database.database import get_db

router = APIRouter()

@router.post("/", response_model=schemas.AccountingPeriod, dependencies=[Depends(PermissionChecker([ACCOUNTING_PERIOD_MANAGE]))])
def create_accounting_period(
    *,
    db: Session = Depends(get_db),
    period_in: schemas.AccountingPeriodCreate,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Create new accounting period"""
    period = crud.core.create_accounting_period(
        db, period=period_in, company_id=current_user.company_id
    )
    return period

@router.get("/", response_model=List[schemas.AccountingPeriod], dependencies=[Depends(PermissionChecker([ACCOUNTING_PERIOD_MANAGE]))])
def read_accounting_periods(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Retrieve accounting periods"""
    periods = crud.core.get_accounting_periods_by_company(
        db, company_id=current_user.company_id, skip=skip, limit=limit
    )
    return periods

@router.put("/{period_id}", response_model=schemas.AccountingPeriod, dependencies=[Depends(PermissionChecker([ACCOUNTING_PERIOD_MANAGE]))])
def update_accounting_period(
    *,
    db: Session = Depends(get_db),
    period_id: int,
    period_in: schemas.AccountingPeriodUpdate,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Update accounting period"""
    period = db.query(models.AccountingPeriod).filter(
        models.AccountingPeriod.id == period_id,
        models.AccountingPeriod.company_id == current_user.company_id
    ).first()
    if not period:
        raise HTTPException(status_code=404, detail="Accounting period not found")
    period = crud.core.update_accounting_period(db, period_db_obj=period, period_in=period_in)
    return period
```

Create `app/api/v1/api.py`:
```python
from fastapi import APIRouter
from .endpoints import auth, users, roles, companies, accounting_periods

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(roles.router, prefix="/roles", tags=["roles"])
api_router.include_router(companies.router, prefix="/companies", tags=["companies"])
api_router.include_router(accounting_periods.router, prefix="/accounting-periods", tags=["accounting-periods"])
```

Update `app/main.py`:
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.api import api_router

app = FastAPI(title=" Backend")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)

@app.get("/")
async def root():
    return {"message": " Backend is running"}
```

#### 6. Database Migrations

Generate initial migration:
```bash
poetry run alembic revision --autogenerate -m "Initial core tables"
poetry run alembic upgrade head
```

#### 7. Initial Database Seeding

Update `app/init_db.py`:
```python
from sqlalchemy.orm import Session
from app.database.database import SessionLocal, engine, Base
from app.config import settings
from app import crud, schemas
from app.core.security import get_password_hash
from app.core.permissions import ALL_PERMISSIONS_LIST

def init_db():
    db = SessionLocal()
    
    # Create default company if none exists
    company = crud.core.get_companies(db, skip=0, limit=1)
    if not company:
        company_in = schemas.CompanyCreate(
            name="Vinea Corp Default",
            is_active=True
        )
        company = crud.core.create_company(db, company=company_in)
        print(f"Created default company: {company.name}")
    else:
        company = company[0]
    
    # Create Administrator role with all permissions
    admin_role = db.query(models.Role).filter(
        models.Role.name == "Administrator",
        models.Role.company_id == company.id
    ).first()
    
    if not admin_role:
        role_in = schemas.RoleCreate(
            name="Administrator",
            description="Full system access",
            permissions=ALL_PERMISSIONS_LIST
        )
        admin_role = crud.core.create_role(db, role=role_in, company_id=company.id)
        print("Created Administrator role")
    
    # Create default admin user
    admin_user = crud.core.get_user_by_email(db, email="admin@biwi.com")
    if not admin_user:
        user_in = schemas.UserCreate(
            email="admin@biwi.com",
            password="admin123",
            full_name="System Administrator",
            is_active=True,
            is_superuser=True
        )
        admin_user = crud.core.create_user(db, user=user_in, company_id=company.id)
        print("Created admin user")
        
        # Assign Administrator role
        crud.core.assign_role_to_user(
            db, user_id=admin_user.id, role_id=admin_role.id, company_id=company.id
        )
        print("Assigned Administrator role to admin user")
    
    # Create other default roles
    default_roles = [
        {
            "name": "Accountant",
            "description": "Manages financial transactions and reports",
            "permissions": [
                "gl:setup_manage", "gl:journal_post", "gl:reports_view",
                "ar:transactions_post", "ar:reports_view",
                "ap:transactions_post", "ap:reports_view"
            ]
        },
        {
            "name": "Sales Manager",
            "description": "Manages sales and customer relationships",
            "permissions": [
                "ar:setup_manage", "ar:transactions_post", "ar:reports_view",
                "oe:sales_orders_manage", "oe:reports_view"
            ]
        },
        {
            "name": "Clerk",
            "description": "Basic data entry permissions",
            "permissions": [
                "company:read", "users:read", "gl:reports_view",
                "ar:reports_view", "ap:reports_view"
            ]
        }
    ]
    
    for role_data in default_roles:
        existing_role = db.query(models.Role).filter(
            models.Role.name == role_data["name"],
            models.Role.company_id == company.id
        ).first()
        
        if not existing_role:
            role_in = schemas.RoleCreate(**role_data)
            crud.core.create_role(db, role=role_in, company_id=company.id)
            print(f"Created {role_data['name']} role")
    
    db.close()

if __name__ == "__main__":
    print("Initializing database...")
    init_db()
    print("Database initialization finished.")
```

#### 8. Backend Testing

Create `backend/tests/conftest.py`:
```python
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database.database import Base, get_db
from app.main import app
from app.config import settings

# Use in-memory SQLite for tests
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def test_db():
    return TestingSessionLocal()
```

Create `backend/tests/api/v1/test_auth.py`:
```python
from fastapi.testclient import TestClient

def test_login_success(client: TestClient):
    # First create a test user
    # Then test login
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "admin@biwi.com", "password": "admin123"}
    )
    assert response.status_code == 200
    assert "access_token" in response.json()
    assert response.json()["token_type"] == "bearer"

def test_login_fail(client: TestClient):
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "wrong@email.com", "password": "wrongpass"}
    )
    assert response.status_code == 401

def test_me_endpoint(client: TestClient):
    # Login first
    login_response = client.post(
        "/api/v1/auth/login",
        data={"username": "admin@biwi.com", "password": "admin123"}
    )
    token = login_response.json()["access_token"]
    
    # Test /me endpoint
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    assert response.json()["email"] == "admin@biwi.com"
```

### Definition of Done - Phase 1
- [ ] All SQLAlchemy models (Company, User, Role, UserRole, AccountingPeriod) defined
- [ ] Corresponding Pydantic schemas created
- [ ] Core CRUD operations implemented
- [ ] JWT# 🚀 Ultimate Biwi ERP Development Guide

**Document Version:** 2.0  
**Date:** December 2024  
**Project Name:**  (Biwi)  
**Purpose:** Complete AI-driven development guide for building a comprehensive ERP system from scratch

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Development Approach](#development-approach)
4. [Phase 0: Project Initialization](#phase-0-project-initialization--core-setup)
5. [Phase 1: Core System Backend](#phase-1-core-system-backend-foundation)
6. [Phase 2: Core System Frontend](#phase-2-core-system-frontend-foundation)
7. [Phase 3: General Ledger Module](#phase-3-general-ledger-module)
8. [Phase 4: Accounts Receivable Module](#phase-4-accounts-receivable-module)
9. [Phase 5: Accounts Payable Module](#phase-5-accounts-payable-module)
10. [Phase 6: Inventory Management Module](#phase-6-inventory-management-module)
11. [Phase 7: Order Entry Module](#phase-7-order-entry-module)
12. [Phase 8: Advanced Maintenance](#phase-8-advanced-maintenance--common-features)

## Project Overview

### Vision
 is a modern, web-based Enterprise Resource Planning system designed for small to medium-sized enterprises. It provides comprehensive business management capabilities including accounting, inventory management, order processing, and advanced reporting.

### Core Modules
- **System Administration**: User management, RBAC, multi-company support
- **General Ledger**: Chart of accounts, journal entries, financial reporting
- **Accounts Receivable**: Customer management, invoicing, payments, allocations
- **Accounts Payable**: Supplier management, bills, payments, allocations
- **Inventory Management**: Item master, warehouses, stock movements, valuation
- **Order Entry**: Sales orders, purchase orders, goods received vouchers
- **Advanced Features**: Multi-currency, tax management, branches
- **Bill of Materials** (Future)
- **Point of Sale** (Future)

## Technology Stack

### Backend
- **Framework**: FastAPI
- **Language**: Python 3.9+
- **ORM**: SQLAlchemy with Alembic
- **Database**: PostgreSQL
- **Authentication**: JWT
- **Security**: Bcrypt for hashing
- **Dependency Management**: Poetry

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Data Fetching**: Tanstack React Query
- **HTTP Client**: Axios
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React
- **Cookies**: js-cookie

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Testing**: Pytest (backend), Jest/React Testing Library (frontend)
- **E2E Testing**: Cypress/Playwright (Phase 13)

## Development Approach

### Core Principles
1. **Iterative Development**: Complete each phase fully before proceeding
2. **Clear Instructions**: Every task has specific actions and expected outcomes
3. **Dependency Awareness**: Explicit dependencies between phases
4. **Quality First**: Comprehensive testing and error handling throughout
5. **Intent-Based UI**: Navigation organized by user intent (Maintenance, Transactions, Reports)

### AI Collaboration Guidelines
- Each phase must be explicitly confirmed complete before proceeding
- Instructions are granular with specific file paths and content hints
- All features must respect RBAC and multi-company isolation
- Backend logic must handle GL posting and cross-module integration
- Frontend must use permission-based UI filtering

---

## Phase 0: Project Initialization & Core Setup

### Objective
Establish the foundational project structure, version control, and initial development environment for both frontend and backend.

### Instructions

#### 1. Create Root Directory
```bash
mkdir Biwi
cd Biwi
```

#### 2. Initialize Git Repository
```bash
git init
```

Create `.gitignore`:
```gitignore
# Python
__pycache__/
*.pyc
*.egg-info/
venv/
.env
*.log
.pytest_cache/

# Node.js
node_modules/
.next/
out/
build/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# OS
.DS_Store
Thumbs.db

# IDE
.idea/
.vscode/

# Docker
*.pid
```

#### 3. Create Project Structure
```bash
mkdir frontend backend database docker docs
echo "# " > README.md
echo "A modern, comprehensive ERP system built with FastAPI and Next.js" >> README.md
```

#### 4. Backend Initialization

Navigate to backend directory:
```bash
cd backend
```

Initialize Poetry project:
```bash
poetry init --name backend --description " Backend" --python "^3.12" -n
```

Add dependencies:
```bash
poetry add fastapi uvicorn sqlalchemy psycopg2-binary alembic python-jose[cryptography] passlib[bcrypt] python-multipart pydantic[email] pydantic-settings
poetry add --group dev pytest httpx black isort mypy ruff
```

Create app structure:
```bash
mkdir -p app/api/v1/endpoints app/core app/crud app/database app/models app/schemas
touch app/__init__.py app/main.py app/config.py
```

Create `app/main.py`:
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title=" Backend")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": " Backend is running"}
```

Create `app/config.py`:
```python
from pydantic_settings import BaseSettings, SettingsConfigDict
import os

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://user:password@localhost/Biwi_db"
    SECRET_KEY: str = "your_super_secret_key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    ALLOWED_HOSTS: list[str] = ["*"]
    
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
```

Create `app/database/database.py`:
```python
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

Initialize Alembic:
```bash
poetry run alembic init alembic
```

Update `alembic.ini`:
```ini
sqlalchemy.url = postgresql://Biwi_user:Biwi_password@localhost/Biwi_db
```

Update `alembic/env.py` to import Base and models:
```python
from app.database.database import Base
from app.models import core  # Import all models
target_metadata = Base.metadata

from app.config import settings
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)
```

Create `.env.example`:
```env
DATABASE_URL=postgresql://Biwi_user:Biwi_password@db:5432/Biwi_db
SECRET_KEY=generate_a_strong_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

Create `setup.sh`:
```bash
#!/bin/bash
poetry install
poetry run alembic upgrade head
```

Create `dev.sh`:
```bash
#!/bin/bash
if [ "$1" == "init-db" ]; then
  poetry run python app/init_db.py
elif [ "$1" == "server" ]; then
  poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
else
  echo "Usage: ./dev.sh [init-db|server]"
fi
```

Create `app/init_db.py` (stub):
```python
from app.database.database import SessionLocal, engine, Base
from app.config import settings

def init_db():
    db = SessionLocal()
    print("Database initialization script - to be populated in Phase 1")
    db.close()

if __name__ == "__main__":
    print("Initializing database...")
    init_db()
    print("Database initialization finished.")
```

#### 5. Frontend Initialization

Navigate to frontend directory:
```bash
cd ../frontend
```

Initialize Next.js project:
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --use-npm
```

Add dependencies:
```bash
npm install @tanstack/react-query axios react-hook-form @hookform/resolvers zod lucide-react js-cookie zustand
npm install --save-dev @types/node @types/js-cookie
```

Create folder structure:
```bash
mkdir -p src/components/ui src/components/layout src/components/modules
mkdir -p src/hooks src/lib src/services src/store src/types src/styles
```

#### 6. Docker Setup

Create `docker-compose.yml` in root:
```yaml
version: '3.8'

services:
  db:
    image: postgres:15
    container_name: Biwi_db
    volumes:
      - postgres_data:/var/lib/postgresql/data/
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: Biwi_user
      POSTGRES_PASSWORD: Biwi_password
      POSTGRES_DB: Biwi_db
    networks:
      - Biwi_network

  backend:
    build:
      context: ./backend
      dockerfile: ../docker/Dockerfile.backend
    container_name: Biwi_backend
    command: poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000
    volumes:
      - ./backend:/app
    ports:
      - "8000:8000"
    depends_on:
      - db
    env_file:
      - ./backend/.env
    networks:
      - Biwi_network

  frontend:
    build:
      context: ./frontend
      dockerfile: ../docker/Dockerfile.frontend
    container_name: Biwi_frontend
    command: npm run dev
    volumes:
      - ./frontend:/app
      - /app/node_modules
      - /app/.next
    ports:
      - "3000:3000"
    depends_on:
      - backend
    environment:
      NEXT_PUBLIC_API_BASE_URL: http://backend:8000/api
    networks:
      - Biwi_network

volumes:
  postgres_data:

networks:
  Biwi_network:
    driver: bridge
```

Create `docker/Dockerfile.backend`:
```dockerfile
FROM python:3.9-slim

WORKDIR /app

RUN pip install poetry

COPY pyproject.toml poetry.lock* /app/

RUN poetry config virtualenvs.create false && poetry install --no-interaction --no-ansi --only main

COPY . /app

EXPOSE 8000

CMD ["poetry", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Create `docker/Dockerfile.frontend`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm install

COPY . ./

EXPOSE 3000

CMD ["npm", "run", "dev"]
```

### Definition of Done - Phase 0
- [ ] Git repository initialized with comprehensive .gitignore
- [ ] Complete directory structure created
- [ ] Backend project initialized with Poetry and all dependencies
- [ ] Frontend project initialized with Next.js and all dependencies
- [ ] Docker setup complete with all services configured
- [ ] Application runs via `docker-compose up --build`
- [ ] Backend accessible at http://localhost:8000
- [ ] Frontend accessible at http://localhost:3000

---

## Phase 1: Core System Backend Foundation

### Objective
Implement fundamental backend services for authentication, authorization (RBAC), user management, company setup, and accounting period management.

### Instructions

#### 1. Database Models

Create `app/models/core.py`:
```python
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Date, JSONB, Numeric, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database.database import Base

class Company(Base):
    __tablename__ = "companies"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    address = Column(JSONB, nullable=True)
    contact_info = Column(JSONB, nullable=True)
    default_currency_code = Column(String(3), nullable=True)
    is_active = Column(Boolean, default=True)
    
    users = relationship("User", back_populates="company")
    roles = relationship("Role", back_populates="company")
    accounting_periods = relationship("AccountingPeriod", back_populates="company")

class Role(Base):
    __tablename__ = "roles"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    description = Column(String, nullable=True)
    permissions = Column(JSONB, nullable=True)  # List of permission strings
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    
    company = relationship("Company", back_populates="roles")
    users = relationship("UserRole", back_populates="role")
    
    __table_args__ = (UniqueConstraint('name', 'company_id', name='uq_role_name_company'),)

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    
    company = relationship("Company", back_populates="users")
    roles = relationship("UserRole", back_populates="user")

class UserRole(Base):
    __tablename__ = "user_roles"
    
    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    role_id = Column(Integer, ForeignKey("roles.id"), primary_key=True)
    
    user = relationship("User", back_populates="roles")
    role = relationship("Role", back_populates="users")

class AccountingPeriod(Base):
    __tablename__ = "accounting_periods"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    name = Column(String, nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    status = Column(String, nullable=False)  # "Open", "Closed", "Future"
    
    company = relationship("Company", back_populates="accounting_periods")
    
    __table_args__ = (UniqueConstraint('name', 'company_id', name='uq_accountingperiod_name_company'),)
```

Update `app/models/__init__.py`:
```python
from .core import User, Role, UserRole, Company, AccountingPeriod
```

Update `app/crud/__init__.py`:
```python
from . import core
```

#### 2. Pydantic Schemas

Create `app/schemas/core.py`:
```python
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import date

# Company Schemas
class CompanyBase(BaseModel):
    name: str
    address: Optional[dict] = None
    contact_info: Optional[dict] = None
    default_currency_code: Optional[str] = None
    is_active: bool = True

class CompanyCreate(CompanyBase):
    pass

class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[dict] = None
    contact_info: Optional[dict] = None
    default_currency_code: Optional[str] = None
    is_active: Optional[bool] = None

class Company(CompanyBase):
    id: int
    
    class Config:
        from_attributes = True

# Role Schemas
class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None
    permissions: List[str] = []

class RoleCreate(RoleBase):
    pass

class RoleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    permissions: Optional[List[str]] = None

class Role(RoleBase):
    id: int
    company_id: int
    
    class Config:
        from_attributes = True

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    is_active: bool = True
    is_superuser: bool = False

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None
    is_superuser: Optional[bool] = None

class User(UserBase):
    id: int
    company_id: int
    
    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str

# Accounting Period Schemas
class AccountingPeriodBase(BaseModel):
    name: str
    start_date: date
    end_date: date
    status: str = "Open"

class AccountingPeriodCreate(AccountingPeriodBase):
    pass

class AccountingPeriodUpdate(BaseModel):
    name: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[str] = None

class AccountingPeriod(AccountingPeriodBase):
    id: int
    company_id: int
    
    class Config:
        from_attributes = True

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    user_id: Optional[int] = None
    permissions: List[str] = []
```

#### 3. Security & Permissions

Create `app/core/security.py`:
```python
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.config import settings
from app.database.database import get_db
from app import models

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> models.User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
    
    user_id = payload.get("user_id")
    if user_id is None:
        raise credentials_exception
    
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        raise credentials_exception
    
    return user

async def get_current_active_user(
    current_user: models.User = Depends(get_current_user)
) -> models.User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

async def get_current_active_superuser(
    current_user: models.User = Depends(get_current_active_user)
) -> models.User:
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions"
        )
    return current_user
```

Create `app/core/permissions.py`:
```python
from typing import List
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.database import get_db
from app import models
from app.core.security import get_current_active_user

# User Permissions
USER_CREATE = "users:create"
USER_READ = "users:read"
USER_UPDATE = "users:update"
USER_DELETE = "users:delete"
USER_MANAGE_ROLES = "users:manage_roles"

# Role Permissions
ROLE_CREATE = "roles:create"
ROLE_READ = "roles:read"
ROLE_UPDATE = "roles:update"
ROLE_DELETE = "roles:delete"
ROLE_MANAGE_PERMISSIONS = "roles:manage_permissions"

# Company Permissions
COMPANY_CREATE = "company:create"
COMPANY_READ = "company:read"
COMPANY_UPDATE = "company:update"

# Accounting Period Permissions
ACCOUNTING_PERIOD_MANAGE = "accounting_periods:manage"

# GL Permissions (for future phases)
GL_SETUP_MANAGE = "gl:setup_manage"
GL_JOURNAL_POST = "gl:journal_post"
GL_REPORTS_VIEW = "gl:reports_view"

# AR Permissions (for future phases)
AR_SETUP_MANAGE = "ar:setup_manage"
AR_TRANSACTIONS_POST = "ar:transactions_post"
AR_REPORTS_VIEW = "ar:reports_view"

# AP Permissions (for future phases)
AP_SETUP_MANAGE = "ap:setup_manage"
AP_TRANSACTIONS_POST = "ap:transactions_post"
AP_REPORTS_VIEW = "ap:reports_view"

# Inventory Permissions (for future phases)
INV_SETUP_MANAGE = "inv:setup_manage"
INV_TRANSACTIONS_ADJUST = "inv:transactions_adjust"
INV_REPORTS_VIEW = "inv:reports_view"

# OE Permissions (for future phases)
OE_SETUP_MANAGE = "oe:setup_manage"
OE_SALES_ORDERS_MANAGE = "oe:sales_orders_manage"
OE_PURCHASE_ORDERS_MANAGE = "oe:purchase_orders_manage"
OE_GRV_PROCESS = "oe:grv_process"
OE_REPORTS_VIEW = "oe:reports_view"

# Common Setup Permissions (for future phases)
COMMON_SETUP_CURRENCIES = "common:setup_currencies"
COMMON_SETUP_TAXES = "common:setup_taxes"
COMMON_SETUP_BRANCHES = "common:setup_branches"

ALL_PERMISSIONS_LIST = [
    USER_CREATE, USER_READ, USER_UPDATE, USER_DELETE, USER_MANAGE_ROLES,
    ROLE_CREATE, ROLE_READ, ROLE_UPDATE, ROLE_DELETE, ROLE_MANAGE_PERMISSIONS,
    COMPANY_READ, COMPANY_UPDATE, ACCOUNTING_PERIOD_MANAGE,
    GL_SETUP_MANAGE, GL_JOURNAL_POST, GL_REPORTS_VIEW,
    AR_SETUP_MANAGE, AR_TRANSACTIONS_POST, AR_REPORTS_VIEW,
    AP_SETUP_MANAGE, AP_TRANSACTIONS_POST, AP_REPORTS_VIEW,
    INV_SETUP_MANAGE, INV_TRANSACTIONS_ADJUST, INV_REPORTS_VIEW,
    OE_SETUP_MANAGE, OE_SALES_ORDERS_MANAGE, OE_PURCHASE_ORDERS_MANAGE, 
    OE_GRV_PROCESS, OE_REPORTS_VIEW,
    COMMON_SETUP_CURRENCIES, COMMON_SETUP_TAXES, COMMON_SETUP_BRANCHES,
]

class PermissionChecker:
    def __init__(self, required_permissions: List[str]):
        self.required_permissions = required_permissions
    
    async def __call__(
        self,
        user: models.User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
    ):
        if user.is_superuser:
            return user
        
        # Get user's permissions from all roles
        user_permissions = []
        for user_role in user.roles:
            role = db.query(models.Role).filter(
                models.Role.id == user_role.role_id
            ).first()
            if role and role.permissions:
                user_permissions.extend(role.permissions)
        
        # Check if user has all required permissions
        for permission in self.required_permissions:
            if permission not in user_permissions:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not enough permissions"
                )
        
        return user

def get_all_permissions() -> List[str]:
    return ALL_PERMISSIONS_LIST
```

#### 4. CRUD Operations

Create `app/crud/core.py`:
```python
from sqlalchemy.orm import Session
from typing import Optional, List
from app import models, schemas
from app.core.security import get_password_hash

# User CRUD
def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate, company_id: int) -> models.User:
    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name,
        is_active=user.is_active,
        is_superuser=user.is_superuser,
        company_id=company_id
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user(db: Session, user_db_obj: models.User, user_in: schemas.UserUpdate) -> models.User:
    update_data = user_in.model_dump(exclude_unset=True)
    if "password" in update_data:
        update_data["hashed_password"] = get_password_hash(update_data.pop("password"))
    
    for field, value in update_data.items():
        setattr(user_db_obj, field, value)
    
    db.add(user_db_obj)
    db.commit()
    db.refresh(user_db_obj)
    return user_db_obj

def get_users_by_company(db: Session, company_id: int, skip: int = 0, limit: int = 100) -> List[models.User]:
    return db.query(models.User).filter(
        models.User.company_id == company_id
    ).offset(skip).limit(limit).all()

def get_user(db: Session, user_id: int) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.id == user_id).first()

def delete_user(db: Session, user_id: int) -> Optional[models.User]:
    user = get_user(db, user_id)
    if user:
        db.delete(user)
        db.commit()
    return user

# Role CRUD
def create_role(db: Session, role: schemas.RoleCreate, company_id: int) -> models.Role:
    db_role = models.Role(
        name=role.name,
        description=role.description,
        permissions=role.permissions,
        company_id=company_id
    )
    db.add(db_role)
    db.commit()
    db.refresh(db_role)
    return db_role

def get_role(db: Session, role_id: int, company_id: int) -> Optional[models.Role]:
    return db.query(models.Role).filter(
        models.Role.id == role_id,
        models.Role.company_id == company_id
    ).first()

def get_roles_by_company(db: Session, company_id: int, skip: int = 0, limit: int = 100) -> List[models.Role]:
    return db.query(models.Role).filter(
        models.Role.company_id == company_id
    ).offset(skip).limit(limit).all()

def update_role(db: Session, role_db_obj: models.Role, role_in: schemas.RoleUpdate) -> models.Role:
    update_data = role_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(role_db_obj, field, value)
    
    db.add(role_db_obj)
    db.commit()
    db.refresh(role_db_obj)
    return role_db_obj

def delete_role(db: Session, role_id: int, company_id: int) -> Optional[models.Role]:
    role = get_role(db, role_id, company_id)
    if role:
        db.delete(role)
        db.commit()
    return role

def assign_role_to_user(db: Session, user_id: int, role_id: int, company_id: int) -> models.User:
    user = get_user(db, user_id)
    role = get_role(db, role_id, company_id)
    
    if not user or not role:
        return None
    
    # Check if role already assigned
    existing = db.query(models.UserRole).filter(
        models.UserRole.user_id == user_id,
        models.UserRole.role_id == role_id
    ).first()
    
    if not existing:
        user_role = models.UserRole(user_id=user_id, role_id=role_id)
        db.add(user_role)
        db.commit()
        db.refresh(user)
    
    return user

def revoke_role_from_user(db: Session, user_id: int, role_id: int, company_id: int) -> models.User:
    user = get_user(db, user_id)
    if not user:
        return None
    
    user_role = db.query(models.UserRole).filter(
        models.UserRole.user_id == user_id,
        models.UserRole.role_id == role_id
    ).first()
    
    if user_role:
        db.delete(user_role)
        db.commit()
        db.refresh(user)
    
    return user

# Company CRUD
def create_company(db: Session, company: schemas.CompanyCreate) -> models.Company:
    db_company = models.Company(**company.model_dump())
    db.add(db_company)
    db.commit()
    db.refresh(db_company)
    return db_company

def get_company(db: Session, company_id: int) -> Optional[models.Company]:
    return db.query(models.Company).filter(models.Company.id == company_id).first()

def get_companies(db: Session, skip: int = 0, limit: int = 100) -> List[models.Company]:
    return db.query(models.Company).offset(skip).limit(limit).all()

def update_company(db: Session, company_db_obj: models.Company, company_in: schemas.CompanyUpdate) -> models.Company:
    update_data = company_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(company_db_obj, field, value)
    
    db.add(company_db_obj)
    db.commit()
    db.refresh(company_db_obj)
    return company_db_obj

# Accounting Period CRUD
def create_accounting_period(db: Session, period: schemas.AccountingPeriodCreate, company_id: int) -> models.AccountingPeriod:
    db_period = models.AccountingPeriod(
        **period.model_dump(),
        company_id=company_id
    )
    db.add(db_period)
    db.commit()
    db.refresh(db_period)
    return db_period

def get_accounting_periods_by_company(db: Session, company_id: int, skip: int = 0, limit: int = 100) -> List[models.AccountingPeriod]:
    return db.query(models.AccountingPeriod).filter(
        models.AccountingPeriod.company_id == company_id
    ).offset(skip).limit(limit).all()

def update_accounting_period(db: Session, period_db_obj: models.AccountingPeriod, period_in: schemas.AccountingPeriodUpdate) -> models.AccountingPeriod:
    update_data = period_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(period_db_obj, field, value)
    
    db.add(period_db_obj)
    db.commit()
    db.refresh(period_db_obj)
    return period_db_obj
```

Create `frontend/src/components/layout/ProtectedRoute.tsx`:
```tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/store/authStore';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
```

Create `frontend/src/app/(auth)/login/page.tsx`:
```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/store/authStore';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setError(null);
      await login(data);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid email or password');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to 
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                {...register('password')}
                type="password"
                autoComplete="current-password"
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

Create `frontend/src/app/(dashboard)/layout.tsx`:
```tsx
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-gray-100">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
            <div className="container mx-auto px-6 py-8">{children}</div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
```

Create `frontend/src/components/layout/Sidebar.tsx`:
```tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { navItems } from '@/lib/navigationItems';
import { usePermissions } from '@/hooks/usePermissions';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const pathname = usePathname();
  const { hasPermission } = usePermissions();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpanded = (label: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(label)) {
        newSet.delete(label);
      } else {
        newSet.add(label);
      }
      return newSet;
    });
  };

  const renderNavItem = (item: any, level = 0) => {
    // Check permissions
    if (item.requiredPermission && !hasPermission(item.requiredPermission)) {
      return null;
    }

    // Filter children based on permissions
    const visibleChildren = item.children?.filter(
      (child: any) => !child.requiredPermission || hasPermission(child.requiredPermission)
    );

    // Don't render if no visible children and no href
    if (!item.href && (!visibleChildren || visibleChildren.length === 0)) {
      return null;
    }

    const hasChildren = visibleChildren && visibleChildren.length > 0;
    const isExpanded = expandedItems.has(item.label);
    const Icon = item.icon;

    return (
      <div key={item.label}>
        {item.href ? (
          <Link
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-md transition-colors',
              pathname === item.href
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-700 hover:bg-gray-100',
              level > 0 && 'ml-6'
            )}
          >
            {Icon && <Icon className="h-5 w-5" />}
            {item.label}
          </Link>
        ) : (
          <button
            onClick={() => toggleExpanded(item.label)}
            className={cn(
              'w-full flex items-center justify-between gap-3 px-4 py-2 text-sm font-medium rounded-md transition-colors text-gray-700 hover:bg-gray-100',
              level > 0 && 'ml-6'
            )}
          >
            <div className="flex items-center gap-3">
              {Icon && <Icon className="h-5 w-5" />}
              {item.label}
            </div>
            {hasChildren &&
              (isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              ))}
          </button>
        )}
        {hasChildren && isExpanded && (
          <div className="mt-1">
            {visibleChildren.map((child: any) => renderNavItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white w-64 min-h-screen shadow-lg">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-800"></h2>
      </div>
      <nav className="px-4 pb-4">
        {navItems.map((item) => renderNavItem(item))}
      </nav>
    </div>
  );
}
```

Create `frontend/src/components/layout/Header.tsx`:
```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, ChevronDown, Building } from 'lucide-react';
import { useAuth } from '@/store/authStore';
import { useQuery } from '@tanstack/react-query';
import { companyService } from '@/services/companyService';

export function Header() {
  const router = useRouter();
  const { user, company, logout, selectedCompanyId, setSelectedCompanyId } = useAuth();
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);

  const { data: companies } = useQuery({
    queryKey: ['companies'],
    queryFn: () => companyService.getCompanies(),
    enabled: user?.is_superuser || false,
  });

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleCompanyChange = (companyId: string) => {
    setSelectedCompanyId(companyId);
    setShowCompanyDropdown(false);
    // Refresh page to reload data for new company
    window.location.reload();
  };

  return (
    <header className="bg-white shadow-md px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {company && (
            <div className="relative">
              <button
                onClick={() => setShowCompanyDropdown(!showCompanyDropdown)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                <Building className="h-4 w-4" />
                <span className="font-medium">{company.name}</span>
                {user?.is_superuser && <ChevronDown className="h-4 w-4" />}
              </button>
              {user?.is_superuser && showCompanyDropdown && companies && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                  {companies.map((comp) => (
                    <button
                      key={comp.id}
                      onClick={() => handleCompanyChange(comp.id.toString())}
                      className={cn(
                        'w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors',
                        selectedCompanyId === comp.id.toString() && 'bg-blue-50'
                      )}
                    >
                      {comp.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">{user?.full_name || user?.email}</p>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
```

Create `frontend/src/lib/utils.ts`:
```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

#### 8. Dashboard Page

Create `frontend/src/app/(dashboard)/dashboard/page.tsx`:
```tsx
'use client';

import Link from 'next/link';
import { useAuth } from '@/store/authStore';
import { Cog, FileText, BarChart3 } from 'lucide-react';

export default function DashboardPage() {
  const { user, company } = useAuth();

  const quickLinks = [
    {
      title: 'Maintenance',
      description: 'Manage system setup and master data',
      icon: Cog,
      href: '/maintenance',
      color: 'bg-blue-500',
    },
    {
      title: 'Transactions',
      description: 'Process daily business transactions',
      icon: FileText,
      href: '/transactions',
      color: 'bg-green-500',
    },
    {
      title: 'Reports',
      description: 'View analytics and reports',
      icon: BarChart3,
      href: '/reports',
      color: 'bg-purple-500',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome to 
        </h1>
        <p className="text-gray-600 mt-2">
          {user?.full_name || user?.email} - {company?.name}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {quickLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.title}
              href={link.href}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
            >
              <div className={`${link.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {link.title}
              </h3>
              <p className="text-gray-600 text-sm">{link.description}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
```

#### 9. CRUD UI Components

Create `frontend/src/components/ui/Table.tsx`:
```tsx
interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  className?: string;
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  actions?: (item: T) => React.ReactNode;
}

export function Table<T extends { id: number }>({ data, columns, actions }: TableProps<T>) {
  return (
    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                className={cn(
                  'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
                  column.className
                )}
              >
                {column.header}
              </th>
            ))}
            {actions && (
              <th className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((item) => (
            <tr key={item.id}>
              {columns.map((column, index) => (
                <td
                  key={index}
                  className={cn('px-6 py-4 whitespace-nowrap text-sm text-gray-900', column.className)}
                >
                  {typeof column.accessor === 'function'
                    ? column.accessor(item)
                    : item[column.accessor]}
                </td>
              ))}
              {actions && (
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {actions(item)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

#### 10. User Management UI

Create `frontend/src/app/(dashboard)/maintenance/system/users/page.tsx`:
```tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, Trash2, Plus, UserPlus } from 'lucide-react';
import { userService } from '@/services/userService';
import { Table } from '@/components/ui/Table';
import { usePermissions } from '@/hooks/usePermissions';
import * as permissions from '@/lib/permissions';

export default function UsersPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getUsers(),
  });

  const deleteMutation = useMutation({
    mutationFn: userService.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { header: 'Email', accessor: 'email' as keyof typeof users[0] },
    { header: 'Full Name', accessor: 'full_name' as keyof typeof users[0] },
    {
      header: 'Status',
      accessor: (user: typeof users[0]) => (
        <span
          className={cn(
            'px-2 py-1 text-xs rounded-full',
            user.is_active
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          )}
        >
          {user.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      header: 'Type',
      accessor: (user: typeof users[0]) =>
        user.is_superuser ? (
          <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
            Superuser
          </span>
        ) : (
          <span className="text-gray-500">Regular</span>
        ),
    },
  ];

  const actions = (user: typeof users[0]) => (
    <div className="flex items-center gap-2">
      {hasPermission(permissions.USER_UPDATE) && (
        <Link
          href={`/maintenance/system/users/${user.id}`}
          className="text-blue-600 hover:text-blue-900"
        >
          <Pencil className="h-4 w-4" />
        </Link>
      )}
      {hasPermission(permissions.USER_DELETE) && (
        <button
          onClick={() => {
            if (confirm('Are you sure you want to delete this user?')) {
              deleteMutation.mutate(user.id);
            }
          }}
          className="text-red-600 hover:text-red-900"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage system users and their access
          </p>
        </div>
        {hasPermission(permissions.USER_CREATE) && (
          <Link
            href="/maintenance/system/users/new"
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Link>
        )}
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <Table data={filteredUsers} columns={columns} actions={actions} />
    </div>
  );
}
```

Create `frontend/src/app/(dashboard)/maintenance/system/users/new/page.tsx`:
```tsx
'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { userService } from '@/services/userService';

const userSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  full_name: z.string().optional(),
  is_active: z.boolean().default(true),
  is_superuser: z.boolean().default(false),
});

type UserFormData = z.infer<typeof userSchema>;

export default function NewUserPage() {
  const router = useRouter();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      is_active: true,
      is_superuser: false,
    },
  });

  const createMutation = useMutation({
    mutationFn: userService.createUser,
    onSuccess: () => {
      router.push('/maintenance/system/users');
    },
  });

  const onSubmit = async (data: UserFormData) => {
    await createMutation.mutateAsync(data);
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Create New User</h1>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Email Address
          </label>
          <input
            type="email"
            {...register('email')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            type="password"
            {...register('password')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Full Name
          </label>
          <input
            type="text"
            {...register('full_name')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              {...register('is_active')}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Active</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              {...register('is_superuser')}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Superuser</span>
          </label>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Creating...' : 'Create User'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/maintenance/system/users')}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
```

### Definition of Done - Phase 2
- [ ] Frontend API client configured with authentication
- [ ] All service functions created for API interactions
- [ ] Zustand authStore manages authentication state
- [ ] Client-side permission system functional
- [ ] Login page with form validation
- [ ] Protected routes implemented
- [ ] Three-tier navigation system with permission filtering
- [ ] Header with user info and company selector
- [ ] CRUD UIs for Users, Roles, Companies, Accounting Periods
- [ ] Dashboard page with quick links
- [ ] All components styled with Tailwind CSS
- [ ] Data fetching uses Tanstack React Query

---

## Phase 3: General Ledger Module

### Objective
Implement core General Ledger functionality including Chart of Accounts, Journal Entries, GL Transaction Types, GL Defaults, and basic GL reports.

### Instructions

#### 1. Backend GL Models

Create `backend/app/models/gl.py`:
```python
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Date, Numeric, Text, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.database import Base

class GLAccount(Base):
    __tablename__ = "gl_accounts"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    account_code = Column(String, index=True, nullable=False)
    account_name = Column(String, nullable=False)
    account_type = Column(String, nullable=False)  # Asset, Liability, Equity, Income, Expense
    parent_account_id = Column(Integer, ForeignKey("gl_accounts.id"), nullable=True)
    current_balance = Column(Numeric(precision=15, scale=2), default=0.00)
    is_active = Column(Boolean, default=True)
    is_control_account = Column(Boolean, default=False)
    
    # Relationships
    company = relationship("Company")
    parent = relationship("GLAccount", remote_side=[id], backref="children")
    
    __table_args__ = (
        UniqueConstraint('account_code', 'company_id', name='uq_glaccount_code_company'),
    )

class GLJournalEntry(Base):
    __tablename__ = "gl_journal_entries"
    
    ```

Update `app/crud/__init__.py`:
```python
from . import core
```

#### 5. API Endpoints

Create `app/api/v1/endpoints/auth.py`:
```python
from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app import crud, models, schemas
from app.api import deps
from app.core import security
from app.core.config import settings
from app.database.database import get_db

router = APIRouter()

@router.post("/login", response_model=schemas.Token)
async def login(
    db: Session = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """OAuth2 compatible token login"""
    user = crud.core.get_user_by_email(db, email=form_data.username)
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        {"user_id": user.id, "email": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=schemas.User)
async def read_users_me(
    current_user: models.User = Depends(security.get_current_active_user),
) -> Any:
    """Get current user"""
    return current_user
```

Create `app/api/v1/endpoints/users.py`:
```python
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import crud, models, schemas
from app.core.permissions import PermissionChecker, USER_CREATE, USER_READ, USER_UPDATE, USER_DELETE, USER_MANAGE_ROLES
from app.core.security import get_current_active_user
from app.database.database import get_db

router = APIRouter()

@router.post("/", response_model=schemas.User, dependencies=[Depends(PermissionChecker([USER_CREATE]))])
def create_user(
    *,
    db: Session = Depends(get_db),
    user_in: schemas.UserCreate,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Create new user"""
    user = crud.core.get_user_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
    user = crud.core.create_user(db, user=user_in, company_id=current_user.company_id)
    return user

@router.get("/", response_model=List[schemas.User], dependencies=[Depends(PermissionChecker([USER_READ]))])
def read_users(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Retrieve users"""
    users = crud.core.get_users_by_company(
        db, company_id=current_user.company_id, skip=skip, limit=limit
    )
    return users

@router.get("/{user_id}", response_model=schemas.User, dependencies=[Depends(PermissionChecker([USER_READ]))])
def read_user(
    user_id: int,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    """Get user by ID"""
    user = crud.core.get_user(db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.company_id != current_user.company_id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return user

@router.put("/{user_id}", response_model=schemas.User, dependencies=[Depends(PermissionChecker([USER_UPDATE]))])
def update_user(
    *,
    db: Session = Depends(get_db),
    user_id: int,
    user_in: schemas.UserUpdate,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Update user"""
    user = crud.core.get_user(db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.company_id != current_user.company_id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    user = crud.core.update_user(db, user_db_obj=user, user_in=user_in)
    return user

@router.delete("/{user_id}", response_model=schemas.User, dependencies=[Depends(PermissionChecker([USER_DELETE]))])
def delete_user(
    *,
    db: Session = Depends(get_db),
    user_id: int,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Delete user"""
    user = crud.core.get_user(db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.company_id != current_user.company_id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    user = crud.core.delete_user(db, user_id=user_id)
    return user

@router.post("/{user_id}/roles/{role_id}", response_model=schemas.User, dependencies=[Depends(PermissionChecker([USER_MANAGE_ROLES]))])
def assign_role_to_user(
    user_id: int,
    role_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Assign role to user"""
    user = crud.core.assign_role_to_user(
        db, user_id=user_id, role_id=role_id, company_id=current_user.company_id
    )
    if not user:
        raise HTTPException(status_code=404, detail="User or role not found")
    return user

@router.delete("/{user_id}/roles/{role_id}", response_model=schemas.User, dependencies=[Depends(PermissionChecker([USER_MANAGE_ROLES]))])
def revoke_role_from_user(
    user_id: int,
    role_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Revoke role from user"""
    user = crud.core.revoke_role_from_user(
        db, user_id=user_id, role_id=role_id, company_id=current_user.company_id
    )
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
```

Create `app/api/v1/endpoints/roles.py`:
```python
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import crud, models, schemas
from app.core.permissions import (
    PermissionChecker, ROLE_CREATE, ROLE_READ, ROLE_UPDATE, 
    ROLE_DELETE, ROLE_MANAGE_PERMISSIONS, get_all_permissions
)
from app.core.security import get_current_active_user
from app.database.database import get_db

router = APIRouter()

@router.post("/", response_model=schemas.Role, dependencies=[Depends(PermissionChecker([ROLE_CREATE]))])
def create_role(
    *,
    db: Session = Depends(get_db),
    role_in: schemas.RoleCreate,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Create new role"""
    role = crud.core.create_role(db, role=role_in, company_id=current_user.company_id)
    return role

@router.get("/", response_model=List[schemas.Role], dependencies=[Depends(PermissionChecker([ROLE_READ]))])
def read_roles(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Retrieve roles"""
    roles = crud.core.get_roles_by_company(
        db, company_id=current_user.company_id, skip=skip, limit=limit
    )
    return roles

@router.get("/permissions/all", response_model=List[str])
def get_all_available_permissions(
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Get all available permissions"""
    return get_all_permissions()

@router.get("/{role_id}", response_model=schemas.Role, dependencies=[Depends(PermissionChecker([ROLE_READ]))])
def read_role(
    role_id: int,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    """Get role by ID"""
    role = crud.core.get_role(db, role_id=role_id, company_id=current_user.company_id)
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    return role

@router.put("/{role_id}", response_model=schemas.Role, dependencies=[Depends(PermissionChecker([ROLE_UPDATE, ROLE_MANAGE_PERMISSIONS]))])
def update_role(
    *,
    db: Session = Depends(get_db),
    role_id: int,
    role_in: schemas.RoleUpdate,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Update role"""
    role = crud.core.get_role(db, role_id=role_id, company_id=current_user.company_id)
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    role = crud.core.update_role(db, role_db_obj=role, role_in=role_in)
    return role

@router.delete("/{role_id}", response_model=schemas.Role, dependencies=[Depends(PermissionChecker([ROLE_DELETE]))])
def delete_role(
    *,
    db: Session = Depends(get_db),
    role_id: int,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Delete role"""
    role = crud.core.delete_role(db, role_id=role_id, company_id=current_user.company_id)
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    return role
```

Create `app/api/v1/endpoints/companies.py`:
```python
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import crud, models, schemas
from app.core.permissions import PermissionChecker, COMPANY_CREATE, COMPANY_READ, COMPANY_UPDATE
from app.core.security import get_current_active_user, get_current_active_superuser
from app.database.database import get_db

router = APIRouter()

@router.post("/", response_model=schemas.Company)
def create_company(
    *,
    db: Session = Depends(get_db),
    company_in: schemas.CompanyCreate,
    current_user: models.User = Depends(get_current_active_superuser),
) -> Any:
    """Create new company (superuser only)"""
    company = crud.core.create_company(db, company=company_in)
    return company

@router.get("/", response_model=List[schemas.Company])
def read_companies(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(get_current_active_superuser),
) -> Any:
    """Retrieve companies (superuser only)"""
    companies = crud.core.get_companies(db, skip=skip, limit=limit)
    return companies

@router.get("/current", response_model=schemas.Company)
def read_current_company(
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    """Get current user's company"""
    company = crud.core.get_company(db, company_id=current_user.company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company

@router.get("/{company_id}", response_model=schemas.Company, dependencies=[Depends(PermissionChecker([COMPANY_READ]))])
def read_company(
    company_id: int,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    """Get company by ID"""
    company = crud.core.get_company(db, company_id=company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    if company.id != current_user.company_id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return company

@router.put("/{company_id}", response_model=schemas.Company, dependencies=[Depends(PermissionChecker([COMPANY_UPDATE]))])
def update_company(
    *,
    db: Session = Depends(get_db),
    company_id: int,
    company_in: schemas.CompanyUpdate,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Update company"""
    company = crud.core.get_company(db, company_id=company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    if company.id != current_user.company_id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    company = crud.core.update_company(db, company_db_obj=company, company_in=company_in)
    return company
```

Create `app/api/v1/endpoints/accounting_periods.py`:
```python
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import crud, models, schemas
from app.core.permissions import PermissionChecker, ACCOUNTING_PERIOD_MANAGE
from app.core.security import get_current_active_user
from app.database.database import get_db

router = APIRouter()

@router.post("/", response_model=schemas.AccountingPeriod, dependencies=[Depends(PermissionChecker([ACCOUNTING_PERIOD_MANAGE]))])
def create_accounting_period(
    *,
    db: Session = Depends(get_db),
    period_in: schemas.AccountingPeriodCreate,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Create new accounting period"""
    period = crud.core.create_accounting_period(
        db, period=period_in, company_id=current_user.company_id
    )
    return period

@router.get("/", response_model=List[schemas.AccountingPeriod], dependencies=[Depends(PermissionChecker([ACCOUNTING_PERIOD_MANAGE]))])
def read_accounting_periods(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Retrieve accounting periods"""
    periods = crud.core.get_accounting_periods_by_company(
        db, company_id=current_user.company_id, skip=skip, limit=limit
    )
    return periods

@router.put("/{period_id}", response_model=schemas.AccountingPeriod, dependencies=[Depends(PermissionChecker([ACCOUNTING_PERIOD_MANAGE]))])
def update_accounting_period(
    *,
    db: Session = Depends(get_db),
    period_id: int,
    period_in: schemas.AccountingPeriodUpdate,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Update accounting period"""
    period = db.query(models.AccountingPeriod).filter(
        models.AccountingPeriod.id == period_id,
        models.AccountingPeriod.company_id == current_user.company_id
    ).first()
    if not period:
        raise HTTPException(status_code=404, detail="Accounting period not found")
    period = crud.core.update_accounting_period(db, period_db_obj=period, period_in=period_in)
    return period
```

Create `app/api/v1/api.py`:
```python
from fastapi import APIRouter
from .endpoints import auth, users, roles, companies, accounting_periods

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(roles.router, prefix="/roles", tags=["roles"])
api_router.include_router(companies.router, prefix="/companies", tags=["companies"])
api_router.include_router(accounting_periods.router, prefix="/accounting-periods", tags=["accounting-periods"])
```

Update `app/main.py`:
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.api import api_router

app = FastAPI(title=" Backend")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)

@app.get("/")
async def root():
    return {"message": " Backend is running"}
```

#### 6. Database Migrations

Generate initial migration:
```bash
poetry run alembic revision --autogenerate -m "Initial core tables"
poetry run alembic upgrade head
```

#### 7. Initial Database Seeding

Update `app/init_db.py`:
```python
from sqlalchemy.orm import Session
from app.database.database import SessionLocal, engine, Base
from app.config import settings
from app import crud, schemas
from app.core.security import get_password_hash
from app.core.permissions import ALL_PERMISSIONS_LIST

def init_db():
    db = SessionLocal()
    
    # Create default company if none exists
    company = crud.core.get_companies(db, skip=0, limit=1)
    if not company:
        company_in = schemas.CompanyCreate(
            name="Vinea Corp Default",
            is_active=True
        )
        company = crud.core.create_company(db, company=company_in)
        print(f"Created default company: {company.name}")
    else:
        company = company[0]
    
    # Create Administrator role with all permissions
    admin_role = db.query(models.Role).filter(
        models.Role.name == "Administrator",
        models.Role.company_id == company.id
    ).first()
    
    if not admin_role:
        role_in = schemas.RoleCreate(
            name="Administrator",
            description="Full system access",
            permissions=ALL_PERMISSIONS_LIST
        )
        admin_role = crud.core.create_role(db, role=role_in, company_id=company.id)
        print("Created Administrator role")
    
    # Create default admin user
    admin_user = crud.core.get_user_by_email(db, email="admin@biwi.com")
    if not admin_user:
        user_in = schemas.UserCreate(
            email="admin@biwi.com",
            password="admin123",
            full_name="System Administrator",
            is_active=True,
            is_superuser=True
        )
        admin_user = crud.core.create_user(db, user=user_in, company_id=company.id)
        print("Created admin user")
        
        # Assign Administrator role
        crud.core.assign_role_to_user(
            db, user_id=admin_user.id, role_id=admin_role.id, company_id=company.id
        )
        print("Assigned Administrator role to admin user")
    
    # Create other default roles
    default_roles = [
        {
            "name": "Accountant",
            "description": "Manages financial transactions and reports",
            "permissions": [
                "gl:setup_manage", "gl:journal_post", "gl:reports_view",
                "ar:transactions_post", "ar:reports_view",
                "ap:transactions_post", "ap:reports_view"
            ]
        },
        {
            "name": "Sales Manager",
            "description": "Manages sales and customer relationships",
            "permissions": [
                "ar:setup_manage", "ar:transactions_post", "ar:reports_view",
                "oe:sales_orders_manage", "oe:reports_view"
            ]
        },
        {
            "name": "Clerk",
            "description": "Basic data entry permissions",
            "permissions": [
                "company:read", "users:read", "gl:reports_view",
                "ar:reports_view", "ap:reports_view"
            ]
        }
    ]
    
    for role_data in default_roles:
        existing_role = db.query(models.Role).filter(
            models.Role.name == role_data["name"],
            models.Role.company_id == company.id
        ).first()
        
        if not existing_role:
            role_in = schemas.RoleCreate(**role_data)
            crud.core.create_role(db, role=role_in, company_id=company.id)
            print(f"Created {role_data['name']} role")
    
    db.close()

if __name__ == "__main__":
    print("Initializing database...")
    init_db()
    print("Database initialization finished.")
```

#### 8. Backend Testing

Create `backend/tests/conftest.py`:
```python
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database.database import Base, get_db
from app.main import app
from app.config import settings

# Use in-memory SQLite for tests
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def test_db():
    return TestingSessionLocal()
```

Create `backend/tests/api/v1/test_auth.py`:
```python
from fastapi.testclient import TestClient

def test_login_success(client: TestClient):
    # First create a test user
    # Then test login
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "admin@biwi.com", "password": "admin123"}
    )
    assert response.status_code == 200
    assert "access_token" in response.json()
    assert response.json()["token_type"] == "bearer"

def test_login_fail(client: TestClient):
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "wrong@email.com", "password": "wrongpass"}
    )
    assert response.status_code == 401

def test_me_endpoint(client: TestClient):
    # Login first
    login_response = client.post(
        "/api/v1/auth/login",
        data={"username": "admin@biwi.com", "password": "admin123"}
    )
    token = login_response.json()["access_token"]
    
    # Test /me endpoint
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    assert response.json()["email"] == "admin@biwi.com"
```

### Definition of Done - Phase 1
- [ ] All SQLAlchemy models (Company, User, Role, UserRole, AccountingPeriod) defined
- [ ] Corresponding Pydantic schemas created
- [ ] Core CRUD operations implemented
- [ ] JWT authentication working (login, token generation/validation)
- [ ] RBAC permission system functional (PermissionChecker)
- [ ] All API endpoints implemented and wired to main.py
- [ ] Alembic migration generated and applied
- [ ] init_db.py successfully seeds database with default data
- [ ] Basic tests pass
- [ ] API documentation accessible at http://localhost:8000/docs

---

## Phase 2: Core System Frontend Foundation

### Objective
Build the frontend infrastructure including authentication UI, three-tier intent-based navigation system, and administrative interfaces for core entities.

### Instructions

#### 1. Frontend API Client Setup

Create `frontend/src/lib/axiosInstance.ts`:
```typescript
import axios from 'axios';
import Cookies from 'js-cookie';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const token = Cookies.get('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      Cookies.remove('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
```

#### 2. TypeScript Types

Create `frontend/src/types/index.ts`:
```typescript
// Auth Types
export interface User {
  id: number;
  email: string;
  full_name?: string;
  is_active: boolean;
  is_superuser: boolean;
  company_id: number;
}

export interface UserCreate {
  email: string;
  password: string;
  full_name?: string;
  is_active?: boolean;
  is_superuser?: boolean;
}

export interface UserUpdate {
  email?: string;
  full_name?: string;
  password?: string;
  is_active?: boolean;
  is_superuser?: boolean;
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}

// Company Types
export interface Company {
  id: number;
  name: string;
  address?: any;
  contact_info?: any;
  default_currency_code?: string;
  is_active: boolean;
}

export interface CompanyCreate {
  name: string;
  address?: any;
  contact_info?: any;
  default_currency_code?: string;
  is_active?: boolean;
}

export interface CompanyUpdate {
  name?: string;
  address?: any;
  contact_info?: any;
  default_currency_code?: string;
  is_active?: boolean;
}

// Role Types
export interface Role {
  id: number;
  name: string;
  description?: string;
  permissions: string[];
  company_id: number;
}

export interface RoleCreate {
  name: string;
  description?: string;
  permissions: string[];
}

export interface RoleUpdate {
  name?: string;
  description?: string;
  permissions?: string[];
}

// Accounting Period Types
export interface AccountingPeriod {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  status: 'Open' | 'Closed' | 'Future';
  company_id: number;
}

export interface AccountingPeriodCreate {
  name: string;
  start_date: string;
  end_date: string;
  status?: 'Open' | 'Closed' | 'Future';
}

export interface AccountingPeriodUpdate {
  name?: string;
  start_date?: string;
  end_date?: string;
  status?: 'Open' | 'Closed' | 'Future';
}
```

#### 3. API Service Functions

Create `frontend/src/services/authService.ts`:
```typescript
import axiosInstance from '@/lib/axiosInstance';
import { User, UserLogin, Token } from '@/types';
import Cookies from 'js-cookie';

export const authService = {
  async login(credentials: UserLogin): Promise<Token> {
    const formData = new FormData();
    formData.append('username', credentials.email);
    formData.append('password', credentials.password);
    
    const response = await axiosInstance.post<Token>('/auth/login', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    
    // Store token
    Cookies.set('access_token', response.data.access_token, { 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    
    return response.data;
  },

  async getMe(): Promise<User> {
    const response = await axiosInstance.get<User>('/auth/me');
    return response.data;
  },

  logout() {
    Cookies.remove('access_token');
  }
};
```

Create `frontend/src/services/userService.ts`:
```typescript
import axiosInstance from '@/lib/axiosInstance';
import { User, UserCreate, UserUpdate } from '@/types';

export const userService = {
  async getUsers(skip = 0, limit = 100): Promise<User[]> {
    const response = await axiosInstance.get<User[]>('/users', {
      params: { skip, limit }
    });
    return response.data;
  },

  async getUser(id: number): Promise<User> {
    const response = await axiosInstance.get<User>(`/users/${id}`);
    return response.data;
  },

  async createUser(data: UserCreate): Promise<User> {
    const response = await axiosInstance.post<User>('/users', data);
    return response.data;
  },

  async updateUser(id: number, data: UserUpdate): Promise<User> {
    const response = await axiosInstance.put<User>(`/users/${id}`, data);
    return response.data;
  },

  async deleteUser(id: number): Promise<User> {
    const response = await axiosInstance.delete<User>(`/users/${id}`);
    return response.data;
  },

  async assignRole(userId: number, roleId: number): Promise<User> {
    const response = await axiosInstance.post<User>(`/users/${userId}/roles/${roleId}`);
    return response.data;
  },

  async revokeRole(userId: number, roleId: number): Promise<User> {
    const response = await axiosInstance.delete<User>(`/users/${userId}/roles/${roleId}`);
    return response.data;
  }
};
```

Create similar service files for:
- `roleService.ts`
- `companyService.ts`
- `accountingPeriodService.ts`

#### 4. Authentication Store

Create `frontend/src/store/authStore.ts`:
```typescript
import { create } from 'zustand';
import { User, Company, UserLogin } from '@/types';
import { authService } from '@/services/authService';
import { companyService } from '@/services/companyService';
import Cookies from 'js-cookie';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  company: Company | null;
  selectedCompanyId: string | null;
  
  login: (credentials: UserLogin) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  loadAuthData: () => Promise<void>;
  setSelectedCompanyId: (companyId: string) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  company: null,
  selectedCompanyId: null,

  login: async (credentials) => {
    try {
      const tokenData = await authService.login(credentials);
      const user = await authService.getMe();
      const company = await companyService.getCurrentCompany();
      
      set({
        token: tokenData.access_token,
        user,
        company,
        isAuthenticated: true,
        selectedCompanyId: user.company_id.toString(),
      });
      
      localStorage.setItem('selectedCompanyId', user.company_id.toString());
    } catch (error) {
      set({ isAuthenticated: false, user: null, token: null });
      throw error;
    }
  },

  logout: () => {
    authService.logout();
    localStorage.removeItem('selectedCompanyId');
    set({
      user: null,
      token: null,
      company: null,
      isAuthenticated: false,
      selectedCompanyId: null,
    });
  },

  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),

  loadAuthData: async () => {
    set({ isLoading: true });
    try {
      const token = Cookies.get('access_token');
      if (token) {
        const user = await authService.getMe();
        const company = await companyService.getCurrentCompany();
        const savedCompanyId = localStorage.getItem('selectedCompanyId');
        
        set({
          token,
          user,
          company,
          isAuthenticated: true,
          selectedCompanyId: savedCompanyId || user.company_id.toString(),
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      set({ isLoading: false, isAuthenticated: false });
    }
  },

  setSelectedCompanyId: (companyId) => {
    localStorage.setItem('selectedCompanyId', companyId);
    set({ selectedCompanyId: companyId });
  },
}));

export const useAuth = () => useAuthStore();
```

#### 5. Permissions System

Create `frontend/src/lib/permissions.ts`:
```typescript
// User Permissions
export const USER_CREATE = "users:create";
export const USER_READ = "users:read";
export const USER_UPDATE = "users:update";
export const USER_DELETE = "users:delete";
export const USER_MANAGE_ROLES = "users:manage_roles";

// Role Permissions
export const ROLE_CREATE = "roles:create";
export const ROLE_READ = "roles:read";
export const ROLE_UPDATE = "roles:update";
export const ROLE_DELETE = "roles:delete";
export const ROLE_MANAGE_PERMISSIONS = "roles:manage_permissions";

// Company Permissions
export const COMPANY_CREATE = "company:create";
export const COMPANY_READ = "company:read";
export const COMPANY_UPDATE = "company:update";

// Accounting Period Permissions
export const ACCOUNTING_PERIOD_MANAGE = "accounting_periods:manage";

// GL Permissions
export const GL_SETUP_MANAGE = "gl:setup_manage";
export const GL_JOURNAL_POST = "gl:journal_post";
export const GL_REPORTS_VIEW = "gl:reports_view";

// AR Permissions
export const AR_SETUP_MANAGE = "ar:setup_manage";
export const AR_TRANSACTIONS_POST = "ar:transactions_post";
export const AR_REPORTS_VIEW = "ar:reports_view";

// AP Permissions
export const AP_SETUP_MANAGE = "ap:setup_manage";
export const AP_TRANSACTIONS_POST = "ap:transactions_post";
export const AP_REPORTS_VIEW = "ap:reports_view";

// Inventory Permissions
export const INV_SETUP_MANAGE = "inv:setup_manage";
export const INV_TRANSACTIONS_ADJUST = "inv:transactions_adjust";
export const INV_REPORTS_VIEW = "inv:reports_view";

// OE Permissions
export const OE_SETUP_MANAGE = "oe:setup_manage";
export const OE_SALES_ORDERS_MANAGE = "oe:sales_orders_manage";
export const OE_PURCHASE_ORDERS_MANAGE = "oe:purchase_orders_manage";
export const OE_GRV_PROCESS = "oe:grv_process";
export const OE_REPORTS_VIEW = "oe:reports_view";

// Common Permissions
export const COMMON_SETUP_CURRENCIES = "common:setup_currencies";
export const COMMON_SETUP_TAXES = "common:setup_taxes";
export const COMMON_SETUP_BRANCHES = "common:setup_branches";
```

Create `frontend/src/hooks/usePermissions.ts`:
```typescript
import { useAuth } from '@/store/authStore';
import { roleService } from '@/services/roleService';
import { useQuery } from '@tanstack/react-query';

export const usePermissions = () => {
  const { user } = useAuth();
  
  const { data: userRoles } = useQuery({
    queryKey: ['userRoles', user?.id],
    queryFn: async () => {
      if (!user) return [];
      // Fetch user's roles with permissions
      // This would need an endpoint to get user's roles
      return [];
    },
    enabled: !!user,
  });

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (user.is_superuser) return true;
    
    // Check if user has permission through roles
    const permissions = userRoles?.flatMap(role => role.permissions) || [];
    return permissions.includes(permission);
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    if (!user) return false;
    if (user.is_superuser) return true;
    
    return permissions.some(permission => hasPermission(permission));
  };

  return {
    hasPermission,
    hasAnyPermission,
  };
};
```

#### 6. Navigation Structure

Create `frontend/src/lib/navigationItems.ts`:
```typescript
import { 
  Cog, 
  FileText, 
  BarChart3, 
  Users, 
  Building, 
  Calendar,
  BookOpen,
  UserCheck,
  CreditCard,
  Package,
  ShoppingCart,
  DollarSign,
  Globe,
  Percent,
  GitBranch
} from 'lucide-react';
import * as permissions from './permissions';

export interface NavItem {
  label: string;
  href?: string;
  icon?: any;
  requiredPermission?: string;
  children?: NavItem[];
}

export const navItems: NavItem[] = [
  {
    label: "Maintenance",
    icon: Cog,
    children: [
      {
        label: "System & Company",
        href: "/maintenance/system",
        requiredPermission: permissions.COMPANY_READ,
        children: [
          { 
            label: "Company Details", 
            href: "/maintenance/system/company", 
            requiredPermission: permissions.COMPANY_READ 
          },
          { 
            label: "Users", 
            href: "/maintenance/system/users", 
            requiredPermission: permissions.USER_READ 
          },
          { 
            label: "Roles", 
            href: "/maintenance/system/roles", 
            requiredPermission: permissions.ROLE_READ 
          },
          { 
            label: "Accounting Periods", 
            href: "/maintenance/system/accounting-periods", 
            requiredPermission: permissions.ACCOUNTING_PERIOD_MANAGE 
          },
          { 
            label: "Currencies", 
            href: "/maintenance/system/currencies", 
            requiredPermission: permissions.COMMON_SETUP_CURRENCIES 
          },
          { 
            label: "Tax Types", 
            href: "/maintenance/system/tax-types", 
            requiredPermission: permissions.COMMON_SETUP_TAXES 
          },
          { 
            label: "Branches", 
            href: "/maintenance/system/branches", 
            requiredPermission: permissions.COMMON_SETUP_BRANCHES 
          },
        ],
      },
      {
        label: "GL Setup",
        href: "/maintenance/gl",
        requiredPermission: permissions.GL_SETUP_MANAGE,
        children: [
          { 
            label: "Chart of Accounts", 
            href: "/maintenance/gl/accounts", 
            requiredPermission: permissions.GL_SETUP_MANAGE 
          },
          { 
            label: "Transaction Types", 
            href: "/maintenance/gl/transaction-types", 
            requiredPermission: permissions.GL_SETUP_MANAGE 
          },
          { 
            label: "Defaults", 
            href: "/maintenance/gl/defaults", 
            requiredPermission: permissions.GL_SETUP_MANAGE 
          },
        ],
      },
      {
        label: "AR Setup",
        href: "/maintenance/ar",
        requiredPermission: permissions.AR_SETUP_MANAGE,
        children: [
          { 
            label: "Customers", 
            href: "/maintenance/ar/customers", 
            requiredPermission: permissions.AR_SETUP_MANAGE 
          },
          { 
            label: "Sales Representatives", 
            href: "/maintenance/ar/sales-reps", 
            requiredPermission: permissions.AR_SETUP_MANAGE 
          },
          { 
            label: "Transaction Types", 
            href: "/maintenance/ar/transaction-types", 
            requiredPermission: permissions.AR_SETUP_MANAGE 
          },
          { 
            label: "Defaults", 
            href: "/maintenance/ar/defaults", 
            requiredPermission: permissions.AR_SETUP_MANAGE 
          },
        ],
      },
      {
        label: "AP Setup",
        href: "/maintenance/ap",
        requiredPermission: permissions.AP_SETUP_MANAGE,
        children: [
          { 
            label: "Suppliers", 
            href: "/maintenance/ap/suppliers", 
            requiredPermission: permissions.AP_SETUP_MANAGE 
          },
          { 
            label: "Transaction Types", 
            href: "/maintenance/ap/transaction-types", 
            requiredPermission: permissions.AP_SETUP_MANAGE 
          },
          { 
            label: "Defaults", 
            href: "/maintenance/ap/defaults", 
            requiredPermission: permissions.AP_SETUP_MANAGE 
          },
        ],
      },
      {
        label: "Inventory Setup",
        href: "/maintenance/inventory",
        requiredPermission: permissions.INV_SETUP_MANAGE,
        children: [
          { 
            label: "Items", 
            href: "/maintenance/inventory/items", 
            requiredPermission: permissions.INV_SETUP_MANAGE 
          },
          { 
            label: "Warehouses", 
            href: "/maintenance/inventory/warehouses", 
            requiredPermission: permissions.INV_SETUP_MANAGE 
          },
          { 
            label: "Transaction Types", 
            href: "/maintenance/inventory/transaction-types", 
            requiredPermission: permissions.INV_SETUP_MANAGE 
          },
          { 
            label: "Units of Measure", 
            href: "/maintenance/inventory/uom", 
            requiredPermission: permissions.INV_SETUP_MANAGE 
          },
          { 
            label: "Barcodes", 
            href: "/maintenance/inventory/barcodes", 
            requiredPermission: permissions.INV_SETUP_MANAGE 
          },
          { 
            label: "Defaults", 
            href: "/maintenance/inventory/defaults", 
            requiredPermission: permissions.INV_SETUP_MANAGE 
          },
        ],
      },
      {
        label: "OE Setup",
        href: "/maintenance/oe",
        requiredPermission: permissions.OE_SETUP_MANAGE,
        children: [
          { 
            label: "Order Defaults", 
            href: "/maintenance/oe/defaults", 
            requiredPermission: permissions.OE_SETUP_MANAGE 
          },
        ],
      },
    ],
  },
  {
    label: "Transactions",
    icon: FileText,
    children: [
      {
        label: "General Ledger",
        href: "/transactions/gl",
        requiredPermission: permissions.GL_JOURNAL_POST,
        children: [
          { 
            label: "Journal Entry", 
            href: "/transactions/gl/journal-entry/new", 
            requiredPermission: permissions.GL_JOURNAL_POST 
          },
          { 
            label: "View Journal Entries", 
            href: "/transactions/gl/journal-entries", 
            requiredPermission: permissions.GL_REPORTS_VIEW 
          },
        ],
      },
      {
        label: "Accounts Receivable",
        href: "/transactions/ar",
        requiredPermission: permissions.AR_TRANSACTIONS_POST,
        children: [
          { 
            label: "New Invoice", 
            href: "/transactions/ar/invoices/new", 
            requiredPermission: permissions.AR_TRANSACTIONS_POST 
          },
          { 
            label: "New Credit Note", 
            href: "/transactions/ar/credit-notes/new", 
            requiredPermission: permissions.AR_TRANSACTIONS_POST 
          },
          { 
            label: "New Receipt", 
            href: "/transactions/ar/receipts/new", 
            requiredPermission: permissions.AR_TRANSACTIONS_POST 
          },
          { 
            label: "Allocate Transactions", 
            href: "/transactions/ar/allocations/new", 
            requiredPermission: permissions.AR_TRANSACTIONS_POST 
          },
          { 
            label: "View Transactions", 
            href: "/transactions/ar/list", 
            requiredPermission: permissions.AR_REPORTS_VIEW 
          },
        ],
      },
      {
        label: "Accounts Payable",
        href: "/transactions/ap",
        requiredPermission: permissions.AP_TRANSACTIONS_POST,
        children: [
          { 
            label: "New Supplier Invoice", 
            href: "/transactions/ap/invoices/new", 
            requiredPermission: permissions.AP_TRANSACTIONS_POST 
          },
          { 
            label: "New Debit Note", 
            href: "/transactions/ap/debit-notes/new", 
            requiredPermission: permissions.AP_TRANSACTIONS_POST 
          },
          { 
            label: "New Payment", 
            href: "/transactions/ap/payments/new", 
            requiredPermission: permissions.AP_TRANSACTIONS_POST 
          },
          { 
            label: "Allocate Transactions", 
            href: "/transactions/ap/allocations/new", 
            requiredPermission: permissions.AP_TRANSACTIONS_POST 
          },
          { 
            label: "View Transactions", 
            href: "/transactions/ap/list", 
            requiredPermission: permissions.AP_REPORTS_VIEW 
          },
        ],
      },
      {
        label: "Inventory",
        href: "/transactions/inventory",
        requiredPermission: permissions.INV_TRANSACTIONS_ADJUST,
        children: [
          { 
            label: "Adjustments", 
            href: "/transactions/inventory/adjustments/new", 
            requiredPermission: permissions.INV_TRANSACTIONS_ADJUST 
          },
          { 
            label: "Warehouse Transfers", 
            href: "/transactions/inventory/transfers/new", 
            requiredPermission: permissions.INV_TRANSACTIONS_ADJUST 
          },
          { 
            label: "Inventory Counts", 
            href: "/transactions/inventory/counts", 
            requiredPermission: permissions.INV_TRANSACTIONS_ADJUST 
          },
        ],
      },
      {
        label: "Order Entry",
        href: "/transactions/oe",
        requiredPermission: permissions.OE_SALES_ORDERS_MANAGE,
        children: [
          { 
            label: "New Sales Order", 
            href: "/transactions/oe/sales-orders/new", 
            requiredPermission: permissions.OE_SALES_ORDERS_MANAGE 
          },
          { 
            label: "View Sales Orders", 
            href: "/transactions/oe/sales-orders", 
            requiredPermission: permissions.OE_SALES_ORDERS_MANAGE 
          },
          { 
            label: "New Purchase Order", 
            href: "/transactions/oe/purchase-orders/new", 
            requiredPermission: permissions.OE_PURCHASE_ORDERS_MANAGE 
          },
          { 
            label: "View Purchase Orders", 
            href: "/transactions/oe/purchase-orders", 
            requiredPermission: permissions.OE_PURCHASE_ORDERS_MANAGE 
          },
          { 
            label: "New GRV", 
            href: "/transactions/oe/grvs/new", 
            requiredPermission: permissions.OE_GRV_PROCESS 
          },
          { 
            label: "View GRVs", 
            href: "/transactions/oe/grvs", 
            requiredPermission: permissions.OE_GRV_PROCESS 
          },
        ],
      },
    ],
  },
  {
    label: "Reports",
    icon: BarChart3,
    children: [
      {
        label: "Financial Reports",
        href: "/reports/gl",
        requiredPermission: permissions.GL_REPORTS_VIEW,
        children: [
          { 
            label: "Trial Balance", 
            href: "/reports/gl/trial-balance", 
            requiredPermission: permissions.GL_REPORTS_VIEW 
          },
          { 
            label: "Account Transactions", 
            href: "/reports/gl/account-transactions", 
            requiredPermission: permissions.GL_REPORTS_VIEW 
          },
        ],
      },
      {
        label: "AR Reports",
        href: "/reports/ar",
        requiredPermission: permissions.AR_REPORTS_VIEW,
        children: [
          { 
            label: "Age Analysis", 
            href: "/reports/ar/age-analysis", 
            requiredPermission: permissions.AR_REPORTS_VIEW 
          },
          { 
            label: "Customer Listing", 
            href: "/reports/ar/customer-listing", 
            requiredPermission: permissions.AR_REPORTS_VIEW 
          },
          { 
            label: "Customer Statement", 
            href: "/reports/ar/statement", 
            requiredPermission: permissions.AR_REPORTS_VIEW 
          },
        ],
      },
      {
        label: "AP Reports",
        href: "/reports/ap",
        requiredPermission: permissions.AP_REPORTS_VIEW,
        children: [
          { 
            label: "Age Analysis", 
            href: "/reports/ap/age-analysis", 
            requiredPermission: permissions.AP_REPORTS_VIEW 
          },
          { 
            label: "Supplier Listing", 
            href: "/reports/ap/supplier-listing", 
            requiredPermission: permissions.AP_REPORTS_VIEW 
          },
          { 
            label: "Supplier Statement", 
            href: "/reports/ap/statement", 
            requiredPermission: permissions.AP_REPORTS_VIEW 
          },
        ],
      },
      {
        label: "Inventory Reports",
        href: "/reports/inventory",
        requiredPermission: permissions.INV_REPORTS_VIEW,
        children: [
          { 
            label: "Item Listing", 
            href: "/reports/inventory/item-listing", 
            requiredPermission: permissions.INV_REPORTS_VIEW 
          },
          { 
            label: "Stock Quantity", 
            href: "/reports/inventory/stock-quantity", 
            requiredPermission: permissions.INV_REPORTS_VIEW 
          },
          { 
            label: "Movement Report", 
            href: "/reports/inventory/movement", 
            requiredPermission: permissions.INV_REPORTS_VIEW 
          },
          { 
            label: "Valuation Report", 
            href: "/reports/inventory/valuation", 
            requiredPermission: permissions.INV_REPORTS_VIEW 
          },
        ],
      },
      {
        label: "OE Reports",
        href: "/reports/oe",
        requiredPermission: permissions.OE_REPORTS_VIEW,
        children: [
          { 
            label: "Sales Order Listing", 
            href: "/reports/oe/sales-orders", 
            requiredPermission: permissions.OE_REPORTS_VIEW 
          },
          { 
            label: "Purchase Order Listing", 
            href: "/reports/oe/purchase-orders", 
            requiredPermission: permissions.OE_REPORTS_VIEW 
          },
          { 
            label: "GRV Listing", 
            href: "/reports/oe/grvs", 
            requiredPermission: permissions.OE_REPORTS_VIEW 
          },
        ],
      },
    ],
  },
];
```

#### 7. Layout Components

Create `frontend/src/app/layout.tsx`:
```tsx
import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '',
  description: 'Modern Enterprise Resource Planning System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

Create `frontend/src/app/providers.tsx`:
```tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  const loadAuthData = useAuthStore((state) => state.loadAuthData);

  useEffect(() => {
    loadAuthData();
  }, [loadAuthData]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}# 🚀 Ultimate Biwi ERP Development Guide

**Document Version:** 2.0  
**Date:** December 2024  
**Project Name:**  (Biwi)  
**Purpose:** Complete AI-driven development guide for building a comprehensive ERP system from scratch

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Development Approach](#development-approach)
4. [Phase 0: Project Initialization](#phase-0-project-initialization--core-setup)
5. [Phase 1: Core System Backend](#phase-1-core-system-backend-foundation)
6. [Phase 2: Core System Frontend](#phase-2-core-system-frontend-foundation)
7. [Phase 3: General Ledger Module](#phase-3-general-ledger-module)
8. [Phase 4: Accounts Receivable Module](#phase-4-accounts-receivable-module)
9. [Phase 5: Accounts Payable Module](#phase-5-accounts-payable-module)
10. [Phase 6: Inventory Management Module](#phase-6-inventory-management-module)
11. [Phase 7: Order Entry Module](#phase-7-order-entry-module)
12. [Phase 8: Advanced Maintenance](#phase-8-advanced-maintenance--common-features)

## Project Overview

### Vision
 is a modern, web-based Enterprise Resource Planning system designed for small to medium-sized enterprises. It provides comprehensive business management capabilities including accounting, inventory management, order processing, and advanced reporting.

### Core Modules
- **System Administration**: User management, RBAC, multi-company support
- **General Ledger**: Chart of accounts, journal entries, financial reporting
- **Accounts Receivable**: Customer management, invoicing, payments, allocations
- **Accounts Payable**: Supplier management, bills, payments, allocations
- **Inventory Management**: Item master, warehouses, stock movements, valuation
- **Order Entry**: Sales orders, purchase orders, goods received vouchers
- **Advanced Features**: Multi-currency, tax management, branches
- **Bill of Materials** (Future)
- **Point of Sale** (Future)

## Technology Stack

### Backend
- **Framework**: FastAPI
- **Language**: Python 3.9+
- **ORM**: SQLAlchemy with Alembic
- **Database**: PostgreSQL
- **Authentication**: JWT
- **Security**: Bcrypt for hashing
- **Dependency Management**: Poetry

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Data Fetching**: Tanstack React Query
- **HTTP Client**: Axios
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React
- **Cookies**: js-cookie

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Testing**: Pytest (backend), Jest/React Testing Library (frontend)
- **E2E Testing**: Cypress/Playwright (Phase 13)

## Development Approach

### Core Principles
1. **Iterative Development**: Complete each phase fully before proceeding
2. **Clear Instructions**: Every task has specific actions and expected outcomes
3. **Dependency Awareness**: Explicit dependencies between phases
4. **Quality First**: Comprehensive testing and error handling throughout
5. **Intent-Based UI**: Navigation organized by user intent (Maintenance, Transactions, Reports)

### AI Collaboration Guidelines
- Each phase must be explicitly confirmed complete before proceeding
- Instructions are granular with specific file paths and content hints
- All features must respect RBAC and multi-company isolation
- Backend logic must handle GL posting and cross-module integration
- Frontend must use permission-based UI filtering

---

## Phase 0: Project Initialization & Core Setup

### Objective
Establish the foundational project structure, version control, and initial development environment for both frontend and backend.

### Instructions

#### 1. Create Root Directory
```bash
mkdir Biwi
cd Biwi
```

#### 2. Initialize Git Repository
```bash
git init
```

Create `.gitignore`:
```gitignore
# Python
__pycache__/
*.pyc
*.egg-info/
venv/
.env
*.log
.pytest_cache/

# Node.js
node_modules/
.next/
out/
build/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# OS
.DS_Store
Thumbs.db

# IDE
.idea/
.vscode/

# Docker
*.pid
```

#### 3. Create Project Structure
```bash
mkdir frontend backend database docker docs
echo "# " > README.md
echo "A modern, comprehensive ERP system built with FastAPI and Next.js" >> README.md
```

#### 4. Backend Initialization

Navigate to backend directory:
```bash
cd backend
```

Initialize Poetry project:
```bash
poetry init --name backend --description " Backend" --python "^3.12" -n
```

Add dependencies:
```bash
poetry add fastapi uvicorn sqlalchemy psycopg2-binary alembic python-jose[cryptography] passlib[bcrypt] python-multipart pydantic[email] pydantic-settings
poetry add --group dev pytest httpx black isort mypy ruff
```

Create app structure:
```bash
mkdir -p app/api/v1/endpoints app/core app/crud app/database app/models app/schemas
touch app/__init__.py app/main.py app/config.py
```

Create `app/main.py`:
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title=" Backend")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": " Backend is running"}
```

Create `app/config.py`:
```python
from pydantic_settings import BaseSettings, SettingsConfigDict
import os

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://user:password@localhost/Biwi_db"
    SECRET_KEY: str = "your_super_secret_key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    ALLOWED_HOSTS: list[str] = ["*"]
    
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
```

Create `app/database/database.py`:
```python
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

Initialize Alembic:
```bash
poetry run alembic init alembic
```

Update `alembic.ini`:
```ini
sqlalchemy.url = postgresql://Biwi_user:Biwi_password@localhost/Biwi_db
```

Update `alembic/env.py` to import Base and models:
```python
from app.database.database import Base
from app.models import core  # Import all models
target_metadata = Base.metadata

from app.config import settings
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)
```

Create `.env.example`:
```env
DATABASE_URL=postgresql://Biwi_user:Biwi_password@db:5432/Biwi_db
SECRET_KEY=generate_a_strong_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

Create `setup.sh`:
```bash
#!/bin/bash
poetry install
poetry run alembic upgrade head
```

Create `dev.sh`:
```bash
#!/bin/bash
if [ "$1" == "init-db" ]; then
  poetry run python app/init_db.py
elif [ "$1" == "server" ]; then
  poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
else
  echo "Usage: ./dev.sh [init-db|server]"
fi
```

Create `app/init_db.py` (stub):
```python
from app.database.database import SessionLocal, engine, Base
from app.config import settings

def init_db():
    db = SessionLocal()
    print("Database initialization script - to be populated in Phase 1")
    db.close()

if __name__ == "__main__":
    print("Initializing database...")
    init_db()
    print("Database initialization finished.")
```

#### 5. Frontend Initialization

Navigate to frontend directory:
```bash
cd ../frontend
```

Initialize Next.js project:
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --use-npm
```

Add dependencies:
```bash
npm install @tanstack/react-query axios react-hook-form @hookform/resolvers zod lucide-react js-cookie zustand
npm install --save-dev @types/node @types/js-cookie
```

Create folder structure:
```bash
mkdir -p src/components/ui src/components/layout src/components/modules
mkdir -p src/hooks src/lib src/services src/store src/types src/styles
```

#### 6. Docker Setup

Create `docker-compose.yml` in root:
```yaml
version: '3.8'

services:
  db:
    image: postgres:15
    container_name: Biwi_db
    volumes:
      - postgres_data:/var/lib/postgresql/data/
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: Biwi_user
      POSTGRES_PASSWORD: Biwi_password
      POSTGRES_DB: Biwi_db
    networks:
      - Biwi_network

  backend:
    build:
      context: ./backend
      dockerfile: ../docker/Dockerfile.backend
    container_name: Biwi_backend
    command: poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000
    volumes:
      - ./backend:/app
    ports:
      - "8000:8000"
    depends_on:
      - db
    env_file:
      - ./backend/.env
    networks:
      - Biwi_network

  frontend:
    build:
      context: ./frontend
      dockerfile: ../docker/Dockerfile.frontend
    container_name: Biwi_frontend
    command: npm run dev
    volumes:
      - ./frontend:/app
      - /app/node_modules
      - /app/.next
    ports:
      - "3000:3000"
    depends_on:
      - backend
    environment:
      NEXT_PUBLIC_API_BASE_URL: http://backend:8000/api
    networks:
      - Biwi_network

volumes:
  postgres_data:

networks:
  Biwi_network:
    driver: bridge
```

Create `docker/Dockerfile.backend`:
```dockerfile
FROM python:3.9-slim

WORKDIR /app

RUN pip install poetry

COPY pyproject.toml poetry.lock* /app/

RUN poetry config virtualenvs.create false && poetry install --no-interaction --no-ansi --only main

COPY . /app

EXPOSE 8000

CMD ["poetry", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Create `docker/Dockerfile.frontend`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm install

COPY . ./

EXPOSE 3000

CMD ["npm", "run", "dev"]
```

### Definition of Done - Phase 0
- [ ] Git repository initialized with comprehensive .gitignore
- [ ] Complete directory structure created
- [ ] Backend project initialized with Poetry and all dependencies
- [ ] Frontend project initialized with Next.js and all dependencies
- [ ] Docker setup complete with all services configured
- [ ] Application runs via `docker-compose up --build`
- [ ] Backend accessible at http://localhost:8000
- [ ] Frontend accessible at http://localhost:3000

---

## Phase 1: Core System Backend Foundation

### Objective
Implement fundamental backend services for authentication, authorization (RBAC), user management, company setup, and accounting period management.

### Instructions

#### 1. Database Models

Create `app/models/core.py`:
```python
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Date, JSONB, Numeric, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database.database import Base

class Company(Base):
    __tablename__ = "companies"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    address = Column(JSONB, nullable=True)
    contact_info = Column(JSONB, nullable=True)
    default_currency_code = Column(String(3), nullable=True)
    is_active = Column(Boolean, default=True)
    
    users = relationship("User", back_populates="company")
    roles = relationship("Role", back_populates="company")
    accounting_periods = relationship("AccountingPeriod", back_populates="company")

class Role(Base):
    __tablename__ = "roles"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    description = Column(String, nullable=True)
    permissions = Column(JSONB, nullable=True)  # List of permission strings
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    
    company = relationship("Company", back_populates="roles")
    users = relationship("UserRole", back_populates="role")
    
    __table_args__ = (UniqueConstraint('name', 'company_id', name='uq_role_name_company'),)

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    
    company = relationship("Company", back_populates="users")
    roles = relationship("UserRole", back_populates="user")

class UserRole(Base):
    __tablename__ = "user_roles"
    
    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    role_id = Column(Integer, ForeignKey("roles.id"), primary_key=True)
    
    user = relationship("User", back_populates="roles")
    role = relationship("Role", back_populates="users")

class AccountingPeriod(Base):
    __tablename__ = "accounting_periods"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    name = Column(String, nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    status = Column(String, nullable=False)  # "Open", "Closed", "Future"
    
    company = relationship("Company", back_populates="accounting_periods")
    
    __table_args__ = (UniqueConstraint('name', 'company_id', name='uq_accountingperiod_name_company'),)
```

Update `app/models/__init__.py`:
```python
from .core import User, Role, UserRole, Company, AccountingPeriod
```

Update `app/crud/__init__.py`:
```python
from . import core
```

#### 2. Pydantic Schemas

Create `app/schemas/core.py`:
```python
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import date

# Company Schemas
class CompanyBase(BaseModel):
    name: str
    address: Optional[dict] = None
    contact_info: Optional[dict] = None
    default_currency_code: Optional[str] = None
    is_active: bool = True

class CompanyCreate(CompanyBase):
    pass

class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[dict] = None
    contact_info: Optional[dict] = None
    default_currency_code: Optional[str] = None
    is_active: Optional[bool] = None

class Company(CompanyBase):
    id: int
    
    class Config:
        from_attributes = True

# Role Schemas
class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None
    permissions: List[str] = []

class RoleCreate(RoleBase):
    pass

class RoleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    permissions: Optional[List[str]] = None

class Role(RoleBase):
    id: int
    company_id: int
    
    class Config:
        from_attributes = True

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    is_active: bool = True
    is_superuser: bool = False

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None
    is_superuser: Optional[bool] = None

class User(UserBase):
    id: int
    company_id: int
    
    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str

# Accounting Period Schemas
class AccountingPeriodBase(BaseModel):
    name: str
    start_date: date
    end_date: date
    status: str = "Open"

class AccountingPeriodCreate(AccountingPeriodBase):
    pass

class AccountingPeriodUpdate(BaseModel):
    name: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[str] = None

class AccountingPeriod(AccountingPeriodBase):
    id: int
    company_id: int
    
    class Config:
        from_attributes = True

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    user_id: Optional[int] = None
    permissions: List[str] = []
```

#### 3. Security & Permissions

Create `app/core/security.py`:
```python
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.config import settings
from app.database.database import get_db
from app import models

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> models.User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
    
    user_id = payload.get("user_id")
    if user_id is None:
        raise credentials_exception
    
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        raise credentials_exception
    
    return user

async def get_current_active_user(
    current_user: models.User = Depends(get_current_user)
) -> models.User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

async def get_current_active_superuser(
    current_user: models.User = Depends(get_current_active_user)
) -> models.User:
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions"
        )
    return current_user
```

Create `app/core/permissions.py`:
```python
from typing import List
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.database import get_db
from app import models
from app.core.security import get_current_active_user

# User Permissions
USER_CREATE = "users:create"
USER_READ = "users:read"
USER_UPDATE = "users:update"
USER_DELETE = "users:delete"
USER_MANAGE_ROLES = "users:manage_roles"

# Role Permissions
ROLE_CREATE = "roles:create"
ROLE_READ = "roles:read"
ROLE_UPDATE = "roles:update"
ROLE_DELETE = "roles:delete"
ROLE_MANAGE_PERMISSIONS = "roles:manage_permissions"

# Company Permissions
COMPANY_CREATE = "company:create"
COMPANY_READ = "company:read"
COMPANY_UPDATE = "company:update"

# Accounting Period Permissions
ACCOUNTING_PERIOD_MANAGE = "accounting_periods:manage"

# GL Permissions (for future phases)
GL_SETUP_MANAGE = "gl:setup_manage"
GL_JOURNAL_POST = "gl:journal_post"
GL_REPORTS_VIEW = "gl:reports_view"

# AR Permissions (for future phases)
AR_SETUP_MANAGE = "ar:setup_manage"
AR_TRANSACTIONS_POST = "ar:transactions_post"
AR_REPORTS_VIEW = "ar:reports_view"

# AP Permissions (for future phases)
AP_SETUP_MANAGE = "ap:setup_manage"
AP_TRANSACTIONS_POST = "ap:transactions_post"
AP_REPORTS_VIEW = "ap:reports_view"

# Inventory Permissions (for future phases)
INV_SETUP_MANAGE = "inv:setup_manage"
INV_TRANSACTIONS_ADJUST = "inv:transactions_adjust"
INV_REPORTS_VIEW = "inv:reports_view"

# OE Permissions (for future phases)
OE_SETUP_MANAGE = "oe:setup_manage"
OE_SALES_ORDERS_MANAGE = "oe:sales_orders_manage"
OE_PURCHASE_ORDERS_MANAGE = "oe:purchase_orders_manage"
OE_GRV_PROCESS = "oe:grv_process"
OE_REPORTS_VIEW = "oe:reports_view"

# Common Setup Permissions (for future phases)
COMMON_SETUP_CURRENCIES = "common:setup_currencies"
COMMON_SETUP_TAXES = "common:setup_taxes"
COMMON_SETUP_BRANCHES = "common:setup_branches"

ALL_PERMISSIONS_LIST = [
    USER_CREATE, USER_READ, USER_UPDATE, USER_DELETE, USER_MANAGE_ROLES,
    ROLE_CREATE, ROLE_READ, ROLE_UPDATE, ROLE_DELETE, ROLE_MANAGE_PERMISSIONS,
    COMPANY_READ, COMPANY_UPDATE, ACCOUNTING_PERIOD_MANAGE,
    GL_SETUP_MANAGE, GL_JOURNAL_POST, GL_REPORTS_VIEW,
    AR_SETUP_MANAGE, AR_TRANSACTIONS_POST, AR_REPORTS_VIEW,
    AP_SETUP_MANAGE, AP_TRANSACTIONS_POST, AP_REPORTS_VIEW,
    INV_SETUP_MANAGE, INV_TRANSACTIONS_ADJUST, INV_REPORTS_VIEW,
    OE_SETUP_MANAGE, OE_SALES_ORDERS_MANAGE, OE_PURCHASE_ORDERS_MANAGE, 
    OE_GRV_PROCESS, OE_REPORTS_VIEW,
    COMMON_SETUP_CURRENCIES, COMMON_SETUP_TAXES, COMMON_SETUP_BRANCHES,
]

class PermissionChecker:
    def __init__(self, required_permissions: List[str]):
        self.required_permissions = required_permissions
    
    async def __call__(
        self,
        user: models.User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
    ):
        if user.is_superuser:
            return user
        
        # Get user's permissions from all roles
        user_permissions = []
        for user_role in user.roles:
            role = db.query(models.Role).filter(
                models.Role.id == user_role.role_id
            ).first()
            if role and role.permissions:
                user_permissions.extend(role.permissions)
        
        # Check if user has all required permissions
        for permission in self.required_permissions:
            if permission not in user_permissions:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not enough permissions"
                )
        
        return user

def get_all_permissions() -> List[str]:
    return ALL_PERMISSIONS_LIST
```

#### 4. CRUD Operations

Create `app/crud/core.py`:
```python
from sqlalchemy.orm import Session
from typing import Optional, List
from app import models, schemas
from app.core.security import get_password_hash

# User CRUD
def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate, company_id: int) -> models.User:
    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name,
        is_active=user.is_active,
        is_superuser=user.is_superuser,
        company_id=company_id
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user(db: Session, user_db_obj: models.User, user_in: schemas.UserUpdate) -> models.User:
    update_data = user_in.model_dump(exclude_unset=True)
    if "password" in update_data:
        update_data["hashed_password"] = get_password_hash(update_data.pop("password"))
    
    for field, value in update_data.items():
        setattr(user_db_obj, field, value)
    
    db.add(user_db_obj)
    db.commit()
    db.refresh(user_db_obj)
    return user_db_obj

def get_users_by_company(db: Session, company_id: int, skip: int = 0, limit: int = 100) -> List[models.User]:
    return db.query(models.User).filter(
        models.User.company_id == company_id
    ).offset(skip).limit(limit).all()

def get_user(db: Session, user_id: int) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.id == user_id).first()

def delete_user(db: Session, user_id: int) -> Optional[models.User]:
    user = get_user(db, user_id)
    if user:
        db.delete(user)
        db.commit()
    return user

# Role CRUD
def create_role(db: Session, role: schemas.RoleCreate, company_id: int) -> models.Role:
    db_role = models.Role(
        name=role.name,
        description=role.description,
        permissions=role.permissions,
        company_id=company_id
    )
    db.add(db_role)
    db.commit()
    db.refresh(db_role)
    return db_role

def get_role(db: Session, role_id: int, company_id: int) -> Optional[models.Role]:
    return db.query(models.Role).filter(
        models.Role.id == role_id,
        models.Role.company_id == company_id
    ).first()

def get_roles_by_company(db: Session, company_id: int, skip: int = 0, limit: int = 100) -> List[models.Role]:
    return db.query(models.Role).filter(
        models.Role.company_id == company_id
    ).offset(skip).limit(limit).all()

def update_role(db: Session, role_db_obj: models.Role, role_in: schemas.RoleUpdate) -> models.Role:
    update_data = role_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(role_db_obj, field, value)
    
    db.add(role_db_obj)
    db.commit()
    db.refresh(role_db_obj)
    return role_db_obj

def delete_role(db: Session, role_id: int, company_id: int) -> Optional[models.Role]:
    role = get_role(db, role_id, company_id)
    if role:
        db.delete(role)
        db.commit()
    return role

def assign_role_to_user(db: Session, user_id: int, role_id: int, company_id: int) -> models.User:
    user = get_user(db, user_id)
    role = get_role(db, role_id, company_id)
    
    if not user or not role:
        return None
    
    # Check if role already assigned
    existing = db.query(models.UserRole).filter(
        models.UserRole.user_id == user_id,
        models.UserRole.role_id == role_id
    ).first()
    
    if not existing:
        user_role = models.UserRole(user_id=user_id, role_id=role_id)
        db.add(user_role)
        db.commit()
        db.refresh(user)
    
    return user

def revoke_role_from_user(db: Session, user_id: int, role_id: int, company_id: int) -> models.User:
    user = get_user(db, user_id)
    if not user:
        return None
    
    user_role = db.query(models.UserRole).filter(
        models.UserRole.user_id == user_id,
        models.UserRole.role_id == role_id
    ).first()
    
    if user_role:
        db.delete(user_role)
        db.commit()
        db.refresh(user)
    
    return user

# Company CRUD
def create_company(db: Session, company: schemas.CompanyCreate) -> models.Company:
    db_company = models.Company(**company.model_dump())
    db.add(db_company)
    db.commit()
    db.refresh(db_company)
    return db_company

def get_company(db: Session, company_id: int) -> Optional[models.Company]:
    return db.query(models.Company).filter(models.Company.id == company_id).first()

def get_companies(db: Session, skip: int = 0, limit: int = 100) -> List[models.Company]:
    return db.query(models.Company).offset(skip).limit(limit).all()

def update_company(db: Session, company_db_obj: models.Company, company_in: schemas.CompanyUpdate) -> models.Company:
    update_data = company_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(company_db_obj, field, value)
    
    db.add(company_db_obj)
    db.commit()
    db.refresh(company_db_obj)
    return company_db_obj

# Accounting Period CRUD
def create_accounting_period(db: Session, period: schemas.AccountingPeriodCreate, company_id: int) -> models.AccountingPeriod:
    db_period = models.AccountingPeriod(
        **period.model_dump(),
        company_id=company_id
    )
    db.add(db_period)
    db.commit()
    db.refresh(db_period)
    return db_period

def get_accounting_periods_by_company(db: Session, company_id: int, skip: int = 0, limit: int = 100) -> List[models.AccountingPeriod]:
    return db.query(models.AccountingPeriod).filter(
        models.AccountingPeriod.company_id == company_id
    ).offset(skip).limit(limit).all()

def update_accounting_period(db: Session, period_db_obj: models.AccountingPeriod, period_in: schemas.AccountingPeriodUpdate) -> models.AccountingPeriod:
    update_data = period_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(period_db_obj, field, value)
    
    db.add(period_db_obj)
    db.commit()
    db.refresh(period_db_obj)
    return period_db_obj
id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    entry_date = Column(Date, nullable=False)
    reference = Column(String, nullable=True)
    description = Column(String, nullable=True)
    posted_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String, nullable=False, default="Draft")  # Draft, Posted
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    company = relationship("Company")
    posted_by = relationship("User")
    lines = relationship("GLJournalEntryLine", back_populates="journal_entry", cascade="all, delete-orphan")

class GLJournalEntryLine(Base):
    __tablename__ = "gl_journal_entry_lines"
    
    id = Column(Integer, primary_key=True, index=True)
    journal_entry_id = Column(Integer, ForeignKey("gl_journal_entries.id"), nullable=False)
    gl_account_id = Column(Integer, ForeignKey("gl_accounts.id"), nullable=False)
    description = Column(String, nullable=True)
    debit_amount = Column(Numeric(precision=15, scale=2), default=0.00)
    credit_amount = Column(Numeric(precision=15, scale=2), default=0.00)
    
    # Relationships
    journal_entry = relationship("GLJournalEntry", back_populates="lines")
    gl_account = relationship("GLAccount")

class GLTransactionType(Base):
    __tablename__ = "gl_transaction_types"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    default_debit_account_id = Column(Integer, ForeignKey("gl_accounts.id"), nullable=True)
    default_credit_account_id = Column(Integer, ForeignKey("gl_accounts.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    company = relationship("Company")
    default_debit_account = relationship("GLAccount", foreign_keys=[default_debit_account_id])
    default_credit_account = relationship("GLAccount", foreign_keys=[default_credit_account_id])
    
    __table_args__ = (
        UniqueConstraint('name', 'company_id', name='uq_gltransactiontype_name_company'),
    )

class GLDefaults(Base):
    __tablename__ = "gl_defaults"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), unique=True, nullable=False)
    retained_earnings_account_id = Column(Integer, ForeignKey("gl_accounts.id"), nullable=True)
    default_cash_account_id = Column(Integer, ForeignKey("gl_accounts.id"), nullable=True)
    default_ar_control_account_id = Column(Integer, ForeignKey("gl_accounts.id"), nullable=True)
    default_ap_control_account_id = Column(Integer, ForeignKey("gl_accounts.id"), nullable=True)
    
    # Relationships
    company = relationship("Company")
    retained_earnings_account = relationship("GLAccount", foreign_keys=[retained_earnings_account_id])
    default_cash_account = relationship("GLAccount", foreign_keys=[default_cash_account_id])
    default_ar_control_account = relationship("GLAccount", foreign_keys=[default_ar_control_account_id])
    default_ap_control_account = relationship("GLAccount", foreign_keys=[default_ap_control_account_id])
```

Update `backend/app/models/__init__.py`:
```python
from .core import User, Role, UserRole, Company, AccountingPeriod
from .gl import GLAccount, GLJournalEntry, GLJournalEntryLine, GLTransactionType, GLDefaults
```

#### 2. Backend GL Schemas

Create `backend/app/schemas/gl.py`:
```python
from pydantic import BaseModel, validator
from typing import Optional, List
from datetime import date, datetime
from decimal import Decimal

# GL Account Schemas
class GLAccountBase(BaseModel):
    account_code: str
    account_name: str
    account_type: str
    parent_account_id: Optional[int] = None
    is_active: bool = True
    is_control_account: bool = False

class GLAccountCreate(GLAccountBase):
    pass

class GLAccountUpdate(BaseModel):
    account_code: Optional[str] = None
    account_name: Optional[str] = None
    account_type: Optional[str] = None
    parent_account_id: Optional[int] = None
    is_active: Optional[bool] = None
    is_control_account: Optional[bool] = None

class GLAccount(GLAccountBase):
    id: int
    company_id: int
    current_balance: Decimal
    
    class Config:
        from_attributes = True

# GL Journal Entry Line Schemas
class GLJournalEntryLineBase(BaseModel):
    gl_account_id: int
    description: Optional[str] = None
    debit_amount: Decimal = Decimal('0.00')
    credit_amount: Decimal = Decimal('0.00')
    
    @validator('debit_amount', 'credit_amount')
    def validate_amounts(cls, v):
        if v < 0:
            raise ValueError('Amount cannot be negative')
        return v

class GLJournalEntryLineCreate(GLJournalEntryLineBase):
    pass

class GLJournalEntryLine(GLJournalEntryLineBase):
    id: int
    journal_entry_id: int
    
    class Config:
        from_attributes = True

# GL Journal Entry Schemas
class GLJournalEntryBase(BaseModel):
    entry_date: date
    reference: Optional[str] = None
    description: Optional[str] = None

class GLJournalEntryCreate(GLJournalEntryBase):
    lines: List[GLJournalEntryLineCreate]
    
    @validator('lines')
    def validate_balanced(cls, lines):
        total_debit = sum(line.debit_amount for line in lines)
        total_credit = sum(line.credit_amount for line in lines)
        if total_debit != total_credit:
            raise ValueError(f'Journal entry not balanced. Debit: {total_debit}, Credit: {total_credit}')
        if total_debit == 0:
            raise ValueError('Journal entry cannot have zero value')
        return lines

class GLJournalEntryUpdate(BaseModel):
    entry_date: Optional[date] = None
    reference: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None

class GLJournalEntry(GLJournalEntryBase):
    id: int
    company_id: int
    posted_by_user_id: int
    status: str
    created_at: datetime
    updated_at: datetime
    lines: List[GLJournalEntryLine] = []
    
    class Config:
        from_attributes = True

# GL Transaction Type Schemas
class GLTransactionTypeBase(BaseModel):
    name: str
    description: Optional[str] = None
    default_debit_account_id: Optional[int] = None
    default_credit_account_id: Optional[int] = None
    is_active: bool = True

class GLTransactionTypeCreate(GLTransactionTypeBase):
    pass

class GLTransactionTypeUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    default_debit_account_id: Optional[int] = None
    default_credit_account_id: Optional[int] = None
    is_active: Optional[bool] = None

class GLTransactionType(GLTransactionTypeBase):
    id: int
    company_id: int
    
    class Config:
        from_attributes = True

# GL Defaults Schemas
class GLDefaultsBase(BaseModel):
    retained_earnings_account_id: Optional[int] = None
    default_cash_account_id: Optional[int] = None
    default_ar_control_account_id: Optional[int] = None
    default_ap_control_account_id: Optional[int] = None

class GLDefaultsCreate(GLDefaultsBase):
    pass

class GLDefaultsUpdate(GLDefaultsBase):
    pass

class GLDefaults(GLDefaultsBase):
    id: int
    company_id: int
    
    class Config:
        from_attributes = True

# Report Schemas
class TrialBalanceItem(BaseModel):
    account_code: str
    account_name: str
    account_type: str
    debit_balance: Decimal
    credit_balance: Decimal

class AccountTransaction(BaseModel):
    date: date
    reference: str
    description: str
    debit_amount: Decimal
    credit_amount: Decimal
    balance: Decimal
```

Update `backend/app/schemas/__init__.py` to include GL schemas.

#### 3. Backend GL CRUD Operations

Create `backend/app/crud/gl.py`:
```python
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import Optional, List
from datetime import date
from decimal import Decimal
from fastapi import HTTPException
from app import models, schemas

# GL Account CRUD
def create_gl_account(db: Session, account: schemas.GLAccountCreate, company_id: int) -> models.GLAccount:
    db_account = models.GLAccount(
        **account.model_dump(),
        company_id=company_id,
        current_balance=Decimal('0.00')
    )
    db.add(db_account)
    db.commit()
    db.refresh(db_account)
    return db_account

def get_gl_accounts_by_company(
    db: Session, 
    company_id: int, 
    skip: int = 0, 
    limit: int = 100,
    include_inactive: bool = False
) -> List[models.GLAccount]:
    query = db.query(models.GLAccount).filter(models.GLAccount.company_id == company_id)
    if not include_inactive:
        query = query.filter(models.GLAccount.is_active == True)
    return query.offset(skip).limit(limit).all()

def get_gl_account(db: Session, account_id: int, company_id: int) -> Optional[models.GLAccount]:
    return db.query(models.GLAccount).filter(
        models.GLAccount.id == account_id,
        models.GLAccount.company_id == company_id
    ).first()

def update_gl_account(
    db: Session, 
    account_db_obj: models.GLAccount, 
    account_in: schemas.GLAccountUpdate
) -> models.GLAccount:
    update_data = account_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(account_db_obj, field, value)
    db.add(account_db_obj)
    db.commit()
    db.refresh(account_db_obj)
    return account_db_obj

def delete_gl_account(db: Session, account_id: int, company_id: int) -> Optional[models.GLAccount]:
    account = get_gl_account(db, account_id, company_id)
    if account:
        # Check if account has transactions
        has_transactions = db.query(models.GLJournalEntryLine).filter(
            models.GLJournalEntryLine.gl_account_id == account_id
        ).first()
        if has_transactions:
            # Soft delete only
            account.is_active = False
            db.commit()
        else:
            db.delete(account)
            db.commit()
    return account

# GL Journal Entry CRUD
def create_journal_entry(
    db: Session, 
    entry_in: schemas.GLJournalEntryCreate, 
    company_id: int, 
    user_id: int
) -> models.GLJournalEntry:
    # Create journal entry
    db_entry = models.GLJournalEntry(
        company_id=company_id,
        entry_date=entry_in.entry_date,
        reference=entry_in.reference,
        description=entry_in.description,
        posted_by_user_id=user_id,
        status="Posted"  # Auto-post for now
    )
    db.add(db_entry)
    db.flush()  # Get the ID without committing
    
    # Create journal entry lines
    for line_in in entry_in.lines:
        db_line = models.GLJournalEntryLine(
            journal_entry_id=db_entry.id,
            **line_in.model_dump()
        )
        db.add(db_line)
        
        # Update account balance if posted
        if db_entry.status == "Posted":
            account = db.query(models.GLAccount).filter(
                models.GLAccount.id == line_in.gl_account_id
            ).first()
            if account:
                # Apply debit/credit rules based on account type
                if account.account_type in ['Asset', 'Expense']:
                    # Debit increases, Credit decreases
                    account.current_balance += line_in.debit_amount - line_in.credit_amount
                else:  # Liability, Equity, Income
                    # Credit increases, Debit decreases
                    account.current_balance += line_in.credit_amount - line_in.debit_amount
    
    db.commit()
    db.refresh(db_entry)
    return db_entry

def get_journal_entry(db: Session, entry_id: int, company_id: int) -> Optional[models.GLJournalEntry]:
    return db.query(models.GLJournalEntry).filter(
        models.GLJournalEntry.id == entry_id,
        models.GLJournalEntry.company_id == company_id
    ).first()

def get_journal_entries_by_company(
    db: Session, 
    company_id: int, 
    skip: int = 0, 
    limit: int = 100,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None
) -> List[models.GLJournalEntry]:
    query = db.query(models.GLJournalEntry).filter(
        models.GLJournalEntry.company_id == company_id
    )
    if start_date:
        query = query.filter(models.GLJournalEntry.entry_date >= start_date)
    if end_date:
        query = query.filter(models.GLJournalEntry.entry_date <= end_date)
    return query.order_by(models.GLJournalEntry.entry_date.desc()).offset(skip).limit(limit).all()

# GL Transaction Type CRUD
def create_gl_transaction_type(
    db: Session, 
    trans_type: schemas.GLTransactionTypeCreate, 
    company_id: int
) -> models.GLTransactionType:
    db_type = models.GLTransactionType(
        **trans_type.model_dump(),
        company_id=company_id
    )
    db.add(db_type)
    db.commit()
    db.refresh(db_type)
    return db_type

def get_gl_transaction_types_by_company(
    db: Session, 
    company_id: int, 
    skip: int = 0, 
    limit: int = 100
) -> List[models.GLTransactionType]:
    return db.query(models.GLTransactionType).filter(
        models.GLTransactionType.company_id == company_id
    ).offset(skip).limit(limit).all()

def update_gl_transaction_type(
    db: Session,
    type_db_obj: models.GLTransactionType,
    type_in: schemas.GLTransactionTypeUpdate
) -> models.GLTransactionType:
    update_data = type_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(type_db_obj, field, value)
    db.add(type_db_obj)
    db.commit()
    db.refresh(type_db_obj)
    return type_db_obj

# GL Defaults CRUD
def get_gl_defaults(db: Session, company_id: int) -> Optional[models.GLDefaults]:
    return db.query(models.GLDefaults).filter(
        models.GLDefaults.company_id == company_id
    ).first()

def create_or_update_gl_defaults(
    db: Session,
    defaults_in: schemas.GLDefaultsCreate,
    company_id: int
) -> models.GLDefaults:
    db_defaults = get_gl_defaults(db, company_id)
    if db_defaults:
        # Update existing
        update_data = defaults_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_defaults, field, value)
    else:
        # Create new
        db_defaults = models.GLDefaults(
            **defaults_in.model_dump(),
            company_id=company_id
        )
        db.add(db_defaults)
    
    db.commit()
    db.refresh(db_defaults)
    return db_defaults

# GL Reports
def calculate_trial_balance(db: Session, company_id: int, end_date: date) -> List[dict]:
    """Calculate trial balance as of a specific date"""
    accounts = db.query(models.GLAccount).filter(
        models.GLAccount.company_id == company_id,
        models.GLAccount.is_active == True
    ).all()
    
    trial_balance = []
    for account in accounts:
        if account.current_balance != 0:
            item = {
                'account_code': account.account_code,
                'account_name': account.account_name,
                'account_type': account.account_type,
                'debit_balance': account.current_balance if account.current_balance > 0 and account.account_type in ['Asset', 'Expense'] else Decimal('0.00'),
                'credit_balance': abs(account.current_balance) if account.current_balance < 0 and account.account_type in ['Asset', 'Expense'] else (account.current_balance if account.account_type in ['Liability', 'Equity', 'Income'] else Decimal('0.00'))
            }
            trial_balance.append(item)
    
    return trial_balance

def get_account_transactions(
    db: Session,
    company_id: int,
    account_id: int,
    start_date: date,
    end_date: date
) -> List[dict]:
    """Get all transactions for a specific account within date range"""
    transactions = db.query(
        models.GLJournalEntry.entry_date,
        models.GLJournalEntry.reference,
        models.GLJournalEntry.description,
        models.GLJournalEntryLine.debit_amount,
        models.GLJournalEntryLine.credit_amount,
        models.GLJournalEntryLine.description.label('line_description')
    ).join(
        models.GLJournalEntryLine
    ).filter(
        models.GLJournalEntry.company_id == company_id,
        models.GLJournalEntryLine.gl_account_id == account_id,
        models.GLJournalEntry.entry_date >= start_date,
        models.GLJournalEntry.entry_date <= end_date,
        models.GLJournalEntry.status == 'Posted'
    ).order_by(
        models.GLJournalEntry.entry_date,
        models.GLJournalEntry.id
    ).all()
    
    # Calculate running balance
    account = db.query(models.GLAccount).filter(
        models.GLAccount.id == account_id
    ).first()
    
    result = []
    running_balance = Decimal('0.00')  # Should calculate opening balance
    
    for trans in transactions:
        if account.account_type in ['Asset', 'Expense']:
            running_balance += trans.debit_amount - trans.credit_amount
        else:
            running_balance += trans.credit_amount - trans.debit_amount
            
        result.append({
            'date': trans.entry_date,
            'reference': trans.reference or '',
            'description': trans.line_description or trans.description or '',
            'debit_amount': trans.debit_amount,
            'credit_amount': trans.credit_amount,
            'balance': running_balance
        })
    
    return result
```

Update `backend/app/crud/__init__.py` to include GL CRUD.

#### 4. Backend GL API Endpoints

Create `backend/app/api/v1/endpoints/gl.py`:
```python
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import date
from app import crud, models, schemas
from app.core.permissions import PermissionChecker, GL_SETUP_MANAGE, GL_JOURNAL_POST, GL_REPORTS_VIEW
from app.core.security import get_current_active_user
from app.database.database import get_db

router = APIRouter()

# GL Accounts endpoints
@router.post("/accounts", response_model=schemas.GLAccount, dependencies=[Depends(PermissionChecker([GL_SETUP_MANAGE]))])
def create_gl_account(
    *,
    db: Session = Depends(get_db),
    account_in: schemas.GLAccountCreate,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Create new GL account"""
    return crud.gl.create_gl_account(db, account=account_in, company_id=current_user.company_id)

@router.get("/accounts", response_model=List[schemas.GLAccount])
def read_gl_accounts(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    include_inactive: bool = False,
    current_user: models.User = Depends(PermissionChecker([GL_SETUP_MANAGE, GL_REPORTS_VIEW])),
) -> Any:
    """Retrieve GL accounts"""
    return crud.gl.get_gl_accounts_by_company(
        db, company_id=current_user.company_id, skip=skip, limit=limit, include_inactive=include_inactive
    )

@router.get("/accounts/{account_id}", response_model=schemas.GLAccount)
def read_gl_account(
    account_id: int,
    current_user: models.User = Depends(PermissionChecker([GL_SETUP_MANAGE, GL_REPORTS_VIEW])),
    db: Session = Depends(get_db),
) -> Any:
    """Get GL account by ID"""
    account = crud.gl.get_gl_account(db, account_id=account_id, company_id=current_user.company_id)
    if not account:
        raise HTTPException(status_code=404, detail="GL Account not found")
    return account

@router.put("/accounts/{account_id}", response_model=schemas.GLAccount, dependencies=[Depends(PermissionChecker([GL_SETUP_MANAGE]))])
def update_gl_account(
    *,
    db: Session = Depends(get_db),
    account_id: int,
    account_in: schemas.GLAccountUpdate,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Update GL account"""
    account = crud.gl.get_gl_account(db, account_id=account_id, company_id=current_user.company_id)
    if not account:
        raise HTTPException(status_code=404, detail="GL Account not found")
    return crud.gl.update_gl_account(db, account_db_obj=account, account_in=account_in)

@router.delete("/accounts/{account_id}", response_model=schemas.GLAccount, dependencies=[Depends(PermissionChecker([GL_SETUP_MANAGE]))])
def delete_gl_account(
    *,
    db: Session = Depends(get_db),
    account_id: int,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Delete GL account"""
    account = crud.gl.delete_gl_account(db, account_id=account_id, company_id=current_user.company_id)
    if not account:
        raise HTTPException(status_code=404, detail="GL Account not found")
    return account

# Journal Entries endpoints
@router.post("/journal-entries", response_model=schemas.GLJournalEntry, dependencies=[Depends(PermissionChecker([GL_JOURNAL_POST]))])
def create_journal_entry(
    *,
    db: Session = Depends(get_db),
    entry_in: schemas.GLJournalEntryCreate,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Create and post journal entry"""
    return crud.gl.create_journal_entry(
        db, entry_in=entry_in, company_id=current_user.company_id, user_id=current_user.id
    )

@router.get("/journal-entries", response_model=List[schemas.GLJournalEntry], dependencies=[Depends(PermissionChecker([GL_REPORTS_VIEW]))])
def read_journal_entries(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Retrieve journal entries"""
    return crud.gl.get_journal_entries_by_company(
        db, company_id=current_user.company_id, skip=skip, limit=limit,
        start_date=start_date, end_date=end_date
    )

@router.get("/journal-entries/{entry_id}", response_model=schemas.GLJournalEntry, dependencies=[Depends(PermissionChecker([GL_REPORTS_VIEW]))])
def read_journal_entry(
    entry_id: int,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    """Get journal entry by ID"""
    entry = crud.gl.get_journal_entry(db, entry_id=entry_id, company_id=current_user.company_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Journal entry not found")
    return entry

# GL Transaction Types endpoints
@router.post("/transaction-types", response_model=schemas.GLTransactionType, dependencies=[Depends(PermissionChecker([GL_SETUP_MANAGE]))])
def create_gl_transaction_type(
    *,
    db: Session = Depends(get_db),
    type_in: schemas.GLTransactionTypeCreate,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Create new GL transaction type"""
    return crud.gl.create_gl_transaction_type(db, trans_type=type_in, company_id=current_user.company_id)

@router.get("/transaction-types", response_model=List[schemas.GLTransactionType], dependencies=[Depends(PermissionChecker([GL_SETUP_MANAGE]))])
def read_gl_transaction_types(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Retrieve GL transaction types"""
    return crud.gl.get_gl_transaction_types_by_company(
        db, company_id=current_user.company_id, skip=skip, limit=limit
    )

@router.put("/transaction-types/{type_id}", response_model=schemas.GLTransactionType, dependencies=[Depends(PermissionChecker([GL_SETUP_MANAGE]))])
def update_gl_transaction_type(
    *,
    db: Session = Depends(get_db),
    type_id: int,
    type_in: schemas.GLTransactionTypeUpdate,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Update GL transaction type"""
    trans_type = db.query(models.GLTransactionType).filter(
        models.GLTransactionType.id == type_id,
        models.GLTransactionType.company_id == current_user.company_id
    ).first()
    if not trans_type:
        raise HTTPException(status_code=404, detail="GL Transaction Type not found")
    return crud.gl.update_gl_transaction_type(db, type_db_obj=trans_type, type_in=type_in)

# GL Defaults endpoints
@router.get("/defaults", response_model=schemas.GLDefaults, dependencies=[Depends(PermissionChecker([GL_SETUP_MANAGE]))])
def read_gl_defaults(
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    """Get GL defaults for company"""
    defaults = crud.gl.get_gl_defaults(db, company_id=current_user.company_id)
    if not defaults:
        # Return empty defaults
        return schemas.GLDefaults(id=0, company_id=current_user.company_id)
    return defaults

@router.put("/defaults", response_model=schemas.GLDefaults, dependencies=[Depends(PermissionChecker([GL_SETUP_MANAGE]))])
def update_gl_defaults(
    *,
    db: Session = Depends(get_db),
    defaults_in: schemas.GLDefaultsUpdate,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Update GL defaults"""
    return crud.gl.create_or_update_gl_defaults(db, defaults_in=defaults_in, company_id=current_user.company_id)

# GL Reports endpoints
@router.get("/reports/trial-balance", response_model=List[schemas.TrialBalanceItem], dependencies=[Depends(PermissionChecker([GL_REPORTS_VIEW]))])
def get_trial_balance(
    end_date: date = Query(..., description="As of date for trial balance"),
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    """Get trial balance report"""
    return crud.gl.calculate_trial_balance(db, company_id=current_user.company_id, end_date=end_date)

@router.get("/reports/account-transactions", response_model=List[schemas.AccountTransaction], dependencies=[Depends(PermissionChecker([GL_REPORTS_VIEW]))])
def get_account_transactions(
    account_id: int = Query(..., description="GL Account ID"),
    start_date: date = Query(..., description="Start date"),
    end_date: date = Query(..., description="End date"),
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    """Get account transaction details"""
    return crud.gl.get_account_transactions(
        db, company```

Create `frontend/src/components/layout/ProtectedRoute.tsx`:
```tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/store/authStore';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
```

Create `frontend/src/app/(auth)/login/page.tsx`:
```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/store/authStore';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setError(null);
      await login(data);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid email or password');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to 
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                {...register('password')}
                type="password"
                autoComplete="current-password"
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

Create `frontend/src/app/(dashboard)/layout.tsx`:
```tsx
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-gray-100">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
            <div className="container mx-auto px-6 py-8">{children}</div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
```

Create `frontend/src/components/layout/Sidebar.tsx`:
```tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { navItems } from '@/lib/navigationItems';
import { usePermissions } from '@/hooks/usePermissions';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const pathname = usePathname();
  const { hasPermission } = usePermissions();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpanded = (label: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(label)) {
        newSet.delete(label);
      } else {
        newSet.add(label);
      }
      return newSet;
    });
  };

  const renderNavItem = (item: any, level = 0) => {
    // Check permissions
    if (item.requiredPermission && !hasPermission(item.requiredPermission)) {
      return null;
    }

    // Filter children based on permissions
    const visibleChildren = item.children?.filter(
      (child: any) => !child.requiredPermission || hasPermission(child.requiredPermission)
    );

    // Don't render if no visible children and no href
    if (!item.href && (!visibleChildren || visibleChildren.length === 0)) {
      return null;
    }

    const hasChildren = visibleChildren && visibleChildren.length > 0;
    const isExpanded = expandedItems.has(item.label);
    const Icon = item.icon;

    return (
      <div key={item.label}>
        {item.href ? (
          <Link
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-md transition-colors',
              pathname === item.href
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-700 hover:bg-gray-100',
              level > 0 && 'ml-6'
            )}
          >
            {Icon && <Icon className="h-5 w-5" />}
            {item.label}
          </Link>
        ) : (
          <button
            onClick={() => toggleExpanded(item.label)}
            className={cn(
              'w-full flex items-center justify-between gap-3 px-4 py-2 text-sm font-medium rounded-md transition-colors text-gray-700 hover:bg-gray-100',
              level > 0 && 'ml-6'
            )}
          >
            <div className="flex items-center gap-3">
              {Icon && <Icon className="h-5 w-5" />}
              {item.label}
            </div>
            {hasChildren &&
              (isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              ))}
          </button>
        )}
        {hasChildren && isExpanded && (
          <div className="mt-1">
            {visibleChildren.map((child: any) => renderNavItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white w-64 min-h-screen shadow-lg">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-800"></h2>
      </div>
      <nav className="px-4 pb-4">
        {navItems.map((item) => renderNavItem(item))}
      </nav>
    </div>
  );
}
```

Create `frontend/src/components/layout/Header.tsx`:
```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, ChevronDown, Building } from 'lucide-react';
import { useAuth } from '@/store/authStore';
import { useQuery } from '@tanstack/react-query';
import { companyService } from '@/services/companyService';

export function Header() {
  const router = useRouter();
  const { user, company, logout, selectedCompanyId, setSelectedCompanyId } = useAuth();
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);

  const { data: companies } = useQuery({
    queryKey: ['companies'],
    queryFn: () => companyService.getCompanies(),
    enabled: user?.is_superuser || false,
  });

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleCompanyChange = (companyId: string) => {
    setSelectedCompanyId(companyId);
    setShowCompanyDropdown(false);
    // Refresh page to reload data for new company
    window.location.reload();
  };

  return (
    <header className="bg-white shadow-md px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {company && (
            <div className="relative">
              <button
                onClick={() => setShowCompanyDropdown(!showCompanyDropdown)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                <Building className="h-4 w-4" />
                <span className="font-medium">{company.name}</span>
                {user?.is_superuser && <ChevronDown className="h-4 w-4" />}
              </button>
              {user?.is_superuser && showCompanyDropdown && companies && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                  {companies.map((comp) => (
                    <button
                      key={comp.id}
                      onClick={() => handleCompanyChange(comp.id.toString())}
                      className={cn(
                        'w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors',
                        selectedCompanyId === comp.id.toString() && 'bg-blue-50'
                      )}
                    >
                      {comp.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">{user?.full_name || user?.email}</p>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
```

Create `frontend/src/lib/utils.ts`:
```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

#### 8. Dashboard Page

Create `frontend/src/app/(dashboard)/dashboard/page.tsx`:
```tsx
'use client';

import Link from 'next/link';
import { useAuth } from '@/store/authStore';
import { Cog, FileText, BarChart3 } from 'lucide-react';

export default function DashboardPage() {
  const { user, company } = useAuth();

  const quickLinks = [
    {
      title: 'Maintenance',
      description: 'Manage system setup and master data',
      icon: Cog,
      href: '/maintenance',
      color: 'bg-blue-500',
    },
    {
      title: 'Transactions',
      description: 'Process daily business transactions',
      icon: FileText,
      href: '/transactions',
      color: 'bg-green-500',
    },
    {
      title: 'Reports',
      description: 'View analytics and reports',
      icon: BarChart3,
      href: '/reports',
      color: 'bg-purple-500',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome to 
        </h1>
        <p className="text-gray-600 mt-2">
          {user?.full_name || user?.email} - {company?.name}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {quickLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.title}
              href={link.href}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
            >
              <div className={`${link.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {link.title}
              </h3>
              <p className="text-gray-600 text-sm">{link.description}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
```

#### 9. CRUD UI Components

Create `frontend/src/components/ui/Table.tsx`:
```tsx
interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  className?: string;
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  actions?: (item: T) => React.ReactNode;
}

export function Table<T extends { id: number }>({ data, columns, actions }: TableProps<T>) {
  return (
    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                className={cn(
                  'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
                  column.className
                )}
              >
                {column.header}
              </th>
            ))}
            {actions && (
              <th className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((item) => (
            <tr key={item.id}>
              {columns.map((column, index) => (
                <td
                  key={index}
                  className={cn('px-6 py-4 whitespace-nowrap text-sm text-gray-900', column.className)}
                >
                  {typeof column.accessor === 'function'
                    ? column.accessor(item)
                    : item[column.accessor]}
                </td>
              ))}
              {actions && (
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {actions(item)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

#### 10. User Management UI

Create `frontend/src/app/(dashboard)/maintenance/system/users/page.tsx`:
```tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, Trash2, Plus, UserPlus } from 'lucide-react';
import { userService } from '@/services/userService';
import { Table } from '@/components/ui/Table';
import { usePermissions } from '@/hooks/usePermissions';
import * as permissions from '@/lib/permissions';

export default function UsersPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getUsers(),
  });

  const deleteMutation = useMutation({
    mutationFn: userService.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { header: 'Email', accessor: 'email' as keyof typeof users[0] },
    { header: 'Full Name', accessor: 'full_name' as keyof typeof users[0] },
    {
      header: 'Status',
      accessor: (user: typeof users[0]) => (
        <span
          className={cn(
            'px-2 py-1 text-xs rounded-full',
            user.is_active
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          )}
        >
          {user.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      header: 'Type',
      accessor: (user: typeof users[0]) =>
        user.is_superuser ? (
          <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
            Superuser
          </span>
        ) : (
          <span className="text-gray-500">Regular</span>
        ),
    },
  ];

  const actions = (user: typeof users[0]) => (
    <div className="flex items-center gap-2">
      {hasPermission(permissions.USER_UPDATE) && (
        <Link
          href={`/maintenance/system/users/${user.id}`}
          className="text-blue-600 hover:text-blue-900"
        >
          <Pencil className="h-4 w-4" />
        </Link>
      )}
      {hasPermission(permissions.USER_DELETE) && (
        <button
          onClick={() => {
            if (confirm('Are you sure you want to delete this user?')) {
              deleteMutation.mutate(user.id);
            }
          }}
          className="text-red-600 hover:text-red-900"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage system users and their access
          </p>
        </div>
        {hasPermission(permissions.USER_CREATE) && (
          <Link
            href="/maintenance/system/users/new"
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Link>
        )}
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <Table data={filteredUsers} columns={columns} actions={actions} />
    </div>
  );
}
```

Create `frontend/src/app/(dashboard)/maintenance/system/users/new/page.tsx`:
```tsx
'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { userService } from '@/services/userService';

const userSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  full_name: z.string().optional(),
  is_active: z.boolean().default(true),
  is_superuser: z.boolean().default(false),
});

type UserFormData = z.infer<typeof userSchema>;

export default function NewUserPage() {
  const router = useRouter();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      is_active: true,
      is_superuser: false,
    },
  });

  const createMutation = useMutation({
    mutationFn: userService.createUser,
    onSuccess: () => {
      router.push('/maintenance/system/users');
    },
  });

  const onSubmit = async (data: UserFormData) => {
    await createMutation.mutateAsync(data);
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Create New User</h1>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Email Address
          </label>
          <input
            type="email"
            {...register('email')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            type="password"
            {...register('password')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Full Name
          </label>
          <input
            type="text"
            {...register('full_name')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              {...register('is_active')}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Active</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              {...register('is_superuser')}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Superuser</span>
          </label>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Creating...' : 'Create User'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/maintenance/system/users')}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
```

### Definition of Done - Phase 2
- [ ] Frontend API client configured with authentication
- [ ] All service functions created for API interactions
- [ ] Zustand authStore manages authentication state
- [ ] Client-side permission system functional
- [ ] Login page with form validation
- [ ] Protected routes implemented
- [ ] Three-tier navigation system with permission filtering
- [ ] Header with user info and company selector
- [ ] CRUD UIs for Users, Roles, Companies, Accounting Periods
- [ ] Dashboard page with quick links
- [ ] All components styled with Tailwind CSS
- [ ] Data fetching uses Tanstack React Query

---

## Phase 3: General Ledger Module

### Objective
Implement core General Ledger functionality including Chart of Accounts, Journal Entries, GL Transaction Types, GL Defaults, and basic GL reports.

### Instructions

#### 1. Backend GL Models

Create `backend/app/models/gl.py`:
```python
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Date, Numeric, Text, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.database import Base

class GLAccount(Base):
    __tablename__ = "gl_accounts"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    account_code = Column(String, index=True, nullable=False)
    account_name = Column(String, nullable=False)
    account_type = Column(String, nullable=False)  # Asset, Liability, Equity, Income, Expense
    parent_account_id = Column(Integer, ForeignKey("gl_accounts.id"), nullable=True)
    current_balance = Column(Numeric(precision=15, scale=2), default=0.00)
    is_active = Column(Boolean, default=True)
    is_control_account = Column(Boolean, default=False)
    
    # Relationships
    company = relationship("Company")
    parent = relationship("GLAccount", remote_side=[id], backref="children")
    
    __table_args__ = (
        UniqueConstraint('account_code', 'company_id', name='uq_glaccount_code_company'),
    )

class GLJournalEntry(Base):
    __tablename__ = "gl_journal_entries"
    
    ```

Update `app/crud/__init__.py`:
```python
from . import core
```

#### 5. API Endpoints

Create `app/api/v1/endpoints/auth.py`:
```python
from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app import crud, models, schemas
from app.api import deps
from app.core import security
from app.core.config import settings
from app.database.database import get_db

router = APIRouter()

@router.post("/login", response_model=schemas.Token)
async def login(
    db: Session = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """OAuth2 compatible token login"""
    user = crud.core.get_user_by_email(db, email=form_data.username)
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        {"user_id": user.id, "email": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=schemas.User)
async def read_users_me(
    current_user: models.User = Depends(security.get_current_active_user),
) -> Any:
    """Get current user"""
    return current_user
```

Create `app/api/v1/endpoints/users.py`:
```python
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import crud, models, schemas
from app.core.permissions import PermissionChecker, USER_CREATE, USER_READ, USER_UPDATE, USER_DELETE, USER_MANAGE_ROLES
from app.core.security import get_current_active_user
from app.database.database import get_db

router = APIRouter()

@router.post("/", response_model=schemas.User, dependencies=[Depends(PermissionChecker([USER_CREATE]))])
def create_user(
    *,
    db: Session = Depends(get_db),
    user_in: schemas.UserCreate,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Create new user"""
    user = crud.core.get_user_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
    user = crud.core.create_user(db, user=user_in, company_id=current_user.company_id)
    return user

@router.get("/", response_model=List[schemas.User], dependencies=[Depends(PermissionChecker([USER_READ]))])
def read_users(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Retrieve users"""
    users = crud.core.get_users_by_company(
        db, company_id=current_user.company_id, skip=skip, limit=limit
    )
    return users

@router.get("/{user_id}", response_model=schemas.User, dependencies=[Depends(PermissionChecker([USER_READ]))])
def read_user(
    user_id: int,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    """Get user by ID"""
    user = crud.core.get_user(db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.company_id != current_user.company_id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return user

@router.put("/{user_id}", response_model=schemas.User, dependencies=[Depends(PermissionChecker([USER_UPDATE]))])
def update_user(
    *,
    db: Session = Depends(get_db),
    user_id: int,
    user_in: schemas.UserUpdate,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Update user"""
    user = crud.core.get_user(db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.company_id != current_user.company_id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    user = crud.core.update_user(db, user_db_obj=user, user_in=user_in)
    return user

@router.delete("/{user_id}", response_model=schemas.User, dependencies=[Depends(PermissionChecker([USER_DELETE]))])
def delete_user(
    *,
    db: Session = Depends(get_db),
    user_id: int,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Delete user"""
    user = crud.core.get_user(db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.company_id != current_user.company_id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    user = crud.core.delete_user(db, user_id=user_id)
    return user

@router.post("/{user_id}/roles/{role_id}", response_model=schemas.User, dependencies=[Depends(PermissionChecker([USER_MANAGE_ROLES]))])
def assign_role_to_user(
    user_id: int,
    role_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Assign role to user"""
    user = crud.core.assign_role_to_user(
        db, user_id=user_id, role_id=role_id, company_id=current_user.company_id
    )
    if not user:
        raise HTTPException(status_code=404, detail="User or role not found")
    return user

@router.delete("/{user_id}/roles/{role_id}", response_model=schemas.User, dependencies=[Depends(PermissionChecker([USER_MANAGE_ROLES]))])
def revoke_role_from_user(
    user_id: int,
    role_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Revoke role from user"""
    user = crud.core.revoke_role_from_user(
        db, user_id=user_id, role_id=role_id, company_id=current_user.company_id
    )
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
```

Create `app/api/v1/endpoints/roles.py`:
```python
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import crud, models, schemas
from app.core.permissions import (
    PermissionChecker, ROLE_CREATE, ROLE_READ, ROLE_UPDATE, 
    ROLE_DELETE, ROLE_MANAGE_PERMISSIONS, get_all_permissions
)
from app.core.security import get_current_active_user
from app.database.database import get_db

router = APIRouter()

@router.post("/", response_model=schemas.Role, dependencies=[Depends(PermissionChecker([ROLE_CREATE]))])
def create_role(
    *,
    db: Session = Depends(get_db),
    role_in: schemas.RoleCreate,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Create new role"""
    role = crud.core.create_role(db, role=role_in, company_id=current_user.company_id)
    return role

@router.get("/", response_model=List[schemas.Role], dependencies=[Depends(PermissionChecker([ROLE_READ]))])
def read_roles(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Retrieve roles"""
    roles = crud.core.get_roles_by_company(
        db, company_id=current_user.company_id, skip=skip, limit=limit
    )
    return roles

@router.get("/permissions/all", response_model=List[str])
def get_all_available_permissions(
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Get all available permissions"""
    return get_all_permissions()

@router.get("/{role_id}", response_model=schemas.Role, dependencies=[Depends(PermissionChecker([ROLE_READ]))])
def read_role(
    role_id: int,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    """Get role by ID"""
    role = crud.core.get_role(db, role_id=role_id, company_id=current_user.company_id)
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    return role

@router.put("/{role_id}", response_model=schemas.Role, dependencies=[Depends(PermissionChecker([ROLE_UPDATE, ROLE_MANAGE_PERMISSIONS]))])
def update_role(
    *,
    db: Session = Depends(get_db),
    role_id: int,
    role_in: schemas.RoleUpdate,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Update role"""
    role = crud.core.get_role(db, role_id=role_id, company_id=current_user.company_id)
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    role = crud.core.update_role(db, role_db_obj=role, role_in=role_in)
    return role

@router.delete("/{role_id}", response_model=schemas.Role, dependencies=[Depends(PermissionChecker([ROLE_DELETE]))])
def delete_role(
    *,
    db: Session = Depends(get_db),
    role_id: int,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Delete role"""
    role = crud.core.delete_role(db, role_id=role_id, company_id=current_user.company_id)
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    return role
```

Create `app/api/v1/endpoints/companies.py`:
```python
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import crud, models, schemas
from app.core.permissions import PermissionChecker, COMPANY_CREATE, COMPANY_READ, COMPANY_UPDATE
from app.core.security import get_current_active_user, get_current_active_superuser
from app.database.database import get_db

router = APIRouter()

@router.post("/", response_model=schemas.Company)
def create_company(
    *,
    db: Session = Depends(get_db),
    company_in: schemas.CompanyCreate,
    current_user: models.User = Depends(get_current_active_superuser),
) -> Any:
    """Create new company (superuser only)"""
    company = crud.core.create_company(db, company=company_in)
    return company

@router.get("/", response_model=List[schemas.Company])
def read_companies(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(get_current_active_superuser),
) -> Any:
    """Retrieve companies (superuser only)"""
    companies = crud.core.get_companies(db, skip=skip, limit=limit)
    return companies

@router.get("/current", response_model=schemas.Company)
def read_current_company(
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    """Get current user's company"""
    company = crud.core.get_company(db, company_id=current_user.company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company

@router.get("/{company_id}", response_model=schemas.Company, dependencies=[Depends(PermissionChecker([COMPANY_READ]))])
def read_company(
    company_id: int,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    """Get company by ID"""
    company = crud.core.get_company(db, company_id=company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    if company.id != current_user.company_id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return company

@router.put("/{company_id}", response_model=schemas.Company, dependencies=[Depends(PermissionChecker([COMPANY_UPDATE]))])
def update_company(
    *,
    db: Session = Depends(get_db),
    company_id: int,
    company_in: schemas.CompanyUpdate,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Update company"""
    company = crud.core.get_company(db, company_id=company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    if company.id != current_user.company_id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    company = crud.core.update_company(db, company_db_obj=company, company_in=company_in)
    return company
```

Create `app/api/v1/endpoints/accounting_periods.py`:
```python
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import crud, models, schemas
from app.core.permissions import PermissionChecker, ACCOUNTING_PERIOD_MANAGE
from app.core.security import get_current_active_user
from app.database.database import get_db

router = APIRouter()

@router.post("/", response_model=schemas.AccountingPeriod, dependencies=[Depends(PermissionChecker([ACCOUNTING_PERIOD_MANAGE]))])
def create_accounting_period(
    *,
    db: Session = Depends(get_db),
    period_in: schemas.AccountingPeriodCreate,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Create new accounting period"""
    period = crud.core.create_accounting_period(
        db, period=period_in, company_id=current_user.company_id
    )
    return period

@router.get("/", response_model=List[schemas.AccountingPeriod], dependencies=[Depends(PermissionChecker([ACCOUNTING_PERIOD_MANAGE]))])
def read_accounting_periods(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Retrieve accounting periods"""
    periods = crud.core.get_accounting_periods_by_company(
        db, company_id=current_user.company_id, skip=skip, limit=limit
    )
    return periods

@router.put("/{period_id}", response_model=schemas.AccountingPeriod, dependencies=[Depends(PermissionChecker([ACCOUNTING_PERIOD_MANAGE]))])
def update_accounting_period(
    *,
    db: Session = Depends(get_db),
    period_id: int,
    period_in: schemas.AccountingPeriodUpdate,
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """Update accounting period"""
    period = db.query(models.AccountingPeriod).filter(
        models.AccountingPeriod.id == period_id,
        models.AccountingPeriod.company_id == current_user.company_id
    ).first()
    if not period:
        raise HTTPException(status_code=404, detail="Accounting period not found")
    period = crud.core.update_accounting_period(db, period_db_obj=period, period_in=period_in)
    return period
```

Create `app/api/v1/api.py`:
```python
from fastapi import APIRouter
from .endpoints import auth, users, roles, companies, accounting_periods

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(roles.router, prefix="/roles", tags=["roles"])
api_router.include_router(companies.router, prefix="/companies", tags=["companies"])
api_router.include_router(accounting_periods.router, prefix="/accounting-periods", tags=["accounting-periods"])
```

Update `app/main.py`:
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.api import api_router

app = FastAPI(title=" Backend")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)

@app.get("/")
async def root():
    return {"message": " Backend is running"}
```

#### 6. Database Migrations

Generate initial migration:
```bash
poetry run alembic revision --autogenerate -m "Initial core tables"
poetry run alembic upgrade head
```

#### 7. Initial Database Seeding

Update `app/init_db.py`:
```python
from sqlalchemy.orm import Session
from app.database.database import SessionLocal, engine, Base
from app.config import settings
from app import crud, schemas
from app.core.security import get_password_hash
from app.core.permissions import ALL_PERMISSIONS_LIST

def init_db():
    db = SessionLocal()
    
    # Create default company if none exists
    company = crud.core.get_companies(db, skip=0, limit=1)
    if not company:
        company_in = schemas.CompanyCreate(
            name="Vinea Corp Default",
            is_active=True
        )
        company = crud.core.create_company(db, company=company_in)
        print(f"Created default company: {company.name}")
    else:
        company = company[0]
    
    # Create Administrator role with all permissions
    admin_role = db.query(models.Role).filter(
        models.Role.name == "Administrator",
        models.Role.company_id == company.id
    ).first()
    
    if not admin_role:
        role_in = schemas.RoleCreate(
            name="Administrator",
            description="Full system access",
            permissions=ALL_PERMISSIONS_LIST
        )
        admin_role = crud.core.create_role(db, role=role_in, company_id=company.id)
        print("Created Administrator role")
    
    # Create default admin user
    admin_user = crud.core.get_user_by_email(db, email="admin@biwi.com")
    if not admin_user:
        user_in = schemas.UserCreate(
            email="admin@biwi.com",
            password="admin123",
            full_name="System Administrator",
            is_active=True,
            is_superuser=True
        )
        admin_user = crud.core.create_user(db, user=user_in, company_id=company.id)
        print("Created admin user")
        
        # Assign Administrator role
        crud.core.assign_role_to_user(
            db, user_id=admin_user.id, role_id=admin_role.id, company_id=company.id
        )
        print("Assigned Administrator role to admin user")
    
    # Create other default roles
    default_roles = [
        {
            "name": "Accountant",
            "description": "Manages financial transactions and reports",
            "permissions": [
                "gl:setup_manage", "gl:journal_post", "gl:reports_view",
                "ar:transactions_post", "ar:reports_view",
                "ap:transactions_post", "ap:reports_view"
            ]
        },
        {
            "name": "Sales Manager",
            "description": "Manages sales and customer relationships",
            "permissions": [
                "ar:setup_manage", "ar:transactions_post", "ar:reports_view",
                "oe:sales_orders_manage", "oe:reports_view"
            ]
        },
        {
            "name": "Clerk",
            "description": "Basic data entry permissions",
            "permissions": [
                "company:read", "users:read", "gl:reports_view",
                "ar:reports_view", "ap:reports_view"
            ]
        }
    ]
    
    for role_data in default_roles:
        existing_role = db.query(models.Role).filter(
            models.Role.name == role_data["name"],
            models.Role.company_id == company.id
        ).first()
        
        if not existing_role:
            role_in = schemas.RoleCreate(**role_data)
            crud.core.create_role(db, role=role_in, company_id=company.id)
            print(f"Created {role_data['name']} role")
    
    db.close()

if __name__ == "__main__":
    print("Initializing database...")
    init_db()
    print("Database initialization finished.")
```

#### 8. Backend Testing

Create `backend/tests/conftest.py`:
```python
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database.database import Base, get_db
from app.main import app
from app.config import settings

# Use in-memory SQLite for tests
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def test_db():
    return TestingSessionLocal()
```

Create `backend/tests/api/v1/test_auth.py`:
```python
from fastapi.testclient import TestClient

def test_login_success(client: TestClient):
    # First create a test user
    # Then test login
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "admin@biwi.com", "password": "admin123"}
    )
    assert response.status_code == 200
    assert "access_token" in response.json()
    assert response.json()["token_type"] == "bearer"

def test_login_fail(client: TestClient):
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "wrong@email.com", "password": "wrongpass"}
    )
    assert response.status_code == 401

def test_me_endpoint(client: TestClient):
    # Login first
    login_response = client.post(
        "/api/v1/auth/login",
        data={"username": "admin@biwi.com", "password": "admin123"}
    )
    token = login_response.json()["access_token"]
    
    # Test /me endpoint
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    assert response.json()["email"] == "admin@biwi.com"
```

### Definition of Done - Phase 1
- [ ] All SQLAlchemy models (Company, User, Role, UserRole, AccountingPeriod) defined
- [ ] Corresponding Pydantic schemas created
- [ ] Core CRUD operations implemented
- [ ] JWT authentication working (login, token generation/validation)
- [ ] RBAC permission system functional (PermissionChecker)
- [ ] All API endpoints implemented and wired to main.py
- [ ] Alembic migration generated and applied
- [ ] init_db.py successfully seeds database with default data
- [ ] Basic tests pass
- [ ] API documentation accessible at http://localhost:8000/docs

---

## Phase 2: Core System Frontend Foundation

### Objective
Build the frontend infrastructure including authentication UI, three-tier intent-based navigation system, and administrative interfaces for core entities.

### Instructions

#### 1. Frontend API Client Setup

Create `frontend/src/lib/axiosInstance.ts`:
```typescript
import axios from 'axios';
import Cookies from 'js-cookie';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const token = Cookies.get('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      Cookies.remove('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
```

#### 2. TypeScript Types

Create `frontend/src/types/index.ts`:
```typescript
// Auth Types
export interface User {
  id: number;
  email: string;
  full_name?: string;
  is_active: boolean;
  is_superuser: boolean;
  company_id: number;
}

export interface UserCreate {
  email: string;
  password: string;
  full_name?: string;
  is_active?: boolean;
  is_superuser?: boolean;
}

export interface UserUpdate {
  email?: string;
  full_name?: string;
  password?: string;
  is_active?: boolean;
  is_superuser?: boolean;
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}

// Company Types
export interface Company {
  id: number;
  name: string;
  address?: any;
  contact_info?: any;
  default_currency_code?: string;
  is_active: boolean;
}

export interface CompanyCreate {
  name: string;
  address?: any;
  contact_info?: any;
  default_currency_code?: string;
  is_active?: boolean;
}

export interface CompanyUpdate {
  name?: string;
  address?: any;
  contact_info?: any;
  default_currency_code?: string;
  is_active?: boolean;
}

// Role Types
export interface Role {
  id: number;
  name: string;
  description?: string;
  permissions: string[];
  company_id: number;
}

export interface RoleCreate {
  name: string;
  description?: string;
  permissions: string[];
}

export interface RoleUpdate {
  name?: string;
  description?: string;
  permissions?: string[];
}

// Accounting Period Types
export interface AccountingPeriod {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  status: 'Open' | 'Closed' | 'Future';
  company_id: number;
}

export interface AccountingPeriodCreate {
  name: string;
  start_date: string;
  end_date: string;
  status?: 'Open' | 'Closed' | 'Future';
}

export interface AccountingPeriodUpdate {
  name?: string;
  start_date?: string;
  end_date?: string;
  status?: 'Open' | 'Closed' | 'Future';
}
```

#### 3. API Service Functions

Create `frontend/src/services/authService.ts`:
```typescript
import axiosInstance from '@/lib/axiosInstance';
import { User, UserLogin, Token } from '@/types';
import Cookies from 'js-cookie';

export const authService = {
  async login(credentials: UserLogin): Promise<Token> {
    const formData = new FormData();
    formData.append('username', credentials.email);
    formData.append('password', credentials.password);
    
    const response = await axiosInstance.post<Token>('/auth/login', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    
    // Store token
    Cookies.set('access_token', response.data.access_token, { 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    
    return response.data;
  },

  async getMe(): Promise<User> {
    const response = await axiosInstance.get<User>('/auth/me');
    return response.data;
  },

  logout() {
    Cookies.remove('access_token');
  }
};
```

Create `frontend/src/services/userService.ts`:
```typescript
import axiosInstance from '@/lib/axiosInstance';
import { User, UserCreate, UserUpdate } from '@/types';

export const userService = {
  async getUsers(skip = 0, limit = 100): Promise<User[]> {
    const response = await axiosInstance.get<User[]>('/users', {
      params: { skip, limit }
    });
    return response.data;
  },

  async getUser(id: number): Promise<User> {
    const response = await axiosInstance.get<User>(`/users/${id}`);
    return response.data;
  },

  async createUser(data: UserCreate): Promise<User> {
    const response = await axiosInstance.post<User>('/users', data);
    return response.data;
  },

  async updateUser(id: number, data: UserUpdate): Promise<User> {
    const response = await axiosInstance.put<User>(`/users/${id}`, data);
    return response.data;
  },

  async deleteUser(id: number): Promise<User> {
    const response = await axiosInstance.delete<User>(`/users/${id}`);
    return response.data;
  },

  async assignRole(userId: number, roleId: number): Promise<User> {
    const response = await axiosInstance.post<User>(`/users/${userId}/roles/${roleId}`);
    return response.data;
  },

  async revokeRole(userId: number, roleId: number): Promise<User> {
    const response = await axiosInstance.delete<User>(`/users/${userId}/roles/${roleId}`);
    return response.data;
  }
};
```

Create similar service files for:
- `roleService.ts`
- `companyService.ts`
- `accountingPeriodService.ts`

#### 4. Authentication Store

Create `frontend/src/store/authStore.ts`:
```typescript
import { create } from 'zustand';
import { User, Company, UserLogin } from '@/types';
import { authService } from '@/services/authService';
import { companyService } from '@/services/companyService';
import Cookies from 'js-cookie';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  company: Company | null;
  selectedCompanyId: string | null;
  
  login: (credentials: UserLogin) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  loadAuthData: () => Promise<void>;
  setSelectedCompanyId: (companyId: string) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  company: null,
  selectedCompanyId: null,

  login: async (credentials) => {
    try {
      const tokenData = await authService.login(credentials);
      const user = await authService.getMe();
      const company = await companyService.getCurrentCompany();
      
      set({
        token: tokenData.access_token,
        user,
        company,
        isAuthenticated: true,
        selectedCompanyId: user.company_id.toString(),
      });
      
      localStorage.setItem('selectedCompanyId', user.company_id.toString());
    } catch (error) {
      set({ isAuthenticated: false, user: null, token: null });
      throw error;
    }
  },

  logout: () => {
    authService.logout();
    localStorage.removeItem('selectedCompanyId');
    set({
      user: null,
      token: null,
      company: null,
      isAuthenticated: false,
      selectedCompanyId: null,
    });
  },

  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),

  loadAuthData: async () => {
    set({ isLoading: true });
    try {
      const token = Cookies.get('access_token');
      if (token) {
        const user = await authService.getMe();
        const company = await companyService.getCurrentCompany();
        const savedCompanyId = localStorage.getItem('selectedCompanyId');
        
        set({
          token,
          user,
          company,
          isAuthenticated: true,
          selectedCompanyId: savedCompanyId || user.company_id.toString(),
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      set({ isLoading: false, isAuthenticated: false });
    }
  },

  setSelectedCompanyId: (companyId) => {
    localStorage.setItem('selectedCompanyId', companyId);
    set({ selectedCompanyId: companyId });
  },
}));

export const useAuth = () => useAuthStore();
```

#### 5. Permissions System

Create `frontend/src/lib/permissions.ts`:
```typescript
// User Permissions
export const USER_CREATE = "users:create";
export const USER_READ = "users:read";
export const USER_UPDATE = "users:update";
export const USER_DELETE = "users:delete";
export const USER_MANAGE_ROLES = "users:manage_roles";

// Role Permissions
export const ROLE_CREATE = "roles:create";
export const ROLE_READ = "roles:read";
export const ROLE_UPDATE = "roles:update";
export const ROLE_DELETE = "roles:delete";
export const ROLE_MANAGE_PERMISSIONS = "roles:manage_permissions";

// Company Permissions
export const COMPANY_CREATE = "company:create";
export const COMPANY_READ = "company:read";
export const COMPANY_UPDATE = "company:update";

// Accounting Period Permissions
export const ACCOUNTING_PERIOD_MANAGE = "accounting_periods:manage";

// GL Permissions
export const GL_SETUP_MANAGE = "gl:setup_manage";
export const GL_JOURNAL_POST = "gl:journal_post";
export const GL_REPORTS_VIEW = "gl:reports_view";

// AR Permissions
export const AR_SETUP_MANAGE = "ar:setup_manage";
export const AR_TRANSACTIONS_POST = "ar:transactions_post";
export const AR_REPORTS_VIEW = "ar:reports_view";

// AP Permissions
export const AP_SETUP_MANAGE = "ap:setup_manage";
export const AP_TRANSACTIONS_POST = "ap:transactions_post";
export const AP_REPORTS_VIEW = "ap:reports_view";

// Inventory Permissions
export const INV_SETUP_MANAGE = "inv:setup_manage";
export const INV_TRANSACTIONS_ADJUST = "inv:transactions_adjust";
export const INV_REPORTS_VIEW = "inv:reports_view";

// OE Permissions
export const OE_SETUP_MANAGE = "oe:setup_manage";
export const OE_SALES_ORDERS_MANAGE = "oe:sales_orders_manage";
export const OE_PURCHASE_ORDERS_MANAGE = "oe:purchase_orders_manage";
export const OE_GRV_PROCESS = "oe:grv_process";
export const OE_REPORTS_VIEW = "oe:reports_view";

// Common Permissions
export const COMMON_SETUP_CURRENCIES = "common:setup_currencies";
export const COMMON_SETUP_TAXES = "common:setup_taxes";
export const COMMON_SETUP_BRANCHES = "common:setup_branches";
```

Create `frontend/src/hooks/usePermissions.ts`:
```typescript
import { useAuth } from '@/store/authStore';
import { roleService } from '@/services/roleService';
import { useQuery } from '@tanstack/react-query';

export const usePermissions = () => {
  const { user } = useAuth();
  
  const { data: userRoles } = useQuery({
    queryKey: ['userRoles', user?.id],
    queryFn: async () => {
      if (!user) return [];
      // Fetch user's roles with permissions
      // This would need an endpoint to get user's roles
      return [];
    },
    enabled: !!user,
  });

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (user.is_superuser) return true;
    
    // Check if user has permission through roles
    const permissions = userRoles?.flatMap(role => role.permissions) || [];
    return permissions.includes(permission);
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    if (!user) return false;
    if (user.is_superuser) return true;
    
    return permissions.some(permission => hasPermission(permission));
  };

  return {
    hasPermission,
    hasAnyPermission,
  };
};
```

#### 6. Navigation Structure

Create `frontend/src/lib/navigationItems.ts`:
```typescript
import { 
  Cog, 
  FileText, 
  BarChart3, 
  Users, 
  Building, 
  Calendar,
  BookOpen,
  UserCheck,
  CreditCard,
  Package,
  ShoppingCart,
  DollarSign,
  Globe,
  Percent,
  GitBranch
} from 'lucide-react';
import * as permissions from './permissions';

export interface NavItem {
  label: string;
  href?: string;
  icon?: any;
  requiredPermission?: string;
  children?: NavItem[];
}

export const navItems: NavItem[] = [
  {
    label: "Maintenance",
    icon: Cog,
    children: [
      {
        label: "System & Company",
        href: "/maintenance/system",
        requiredPermission: permissions.COMPANY_READ,
        children: [
          { 
            label: "Company Details", 
            href: "/maintenance/system/company", 
            requiredPermission: permissions.COMPANY_READ 
          },
          { 
            label: "Users", 
            href: "/maintenance/system/users", 
            requiredPermission: permissions.USER_READ 
          },
          { 
            label: "Roles", 
            href: "/maintenance/system/roles", 
            requiredPermission: permissions.ROLE_READ 
          },
          { 
            label: "Accounting Periods", 
            href: "/maintenance/system/accounting-periods", 
            requiredPermission: permissions.ACCOUNTING_PERIOD_MANAGE 
          },
          { 
            label: "Currencies", 
            href: "/maintenance/system/currencies", 
            requiredPermission: permissions.COMMON_SETUP_CURRENCIES 
          },
          { 
            label: "Tax Types", 
            href: "/maintenance/system/tax-types", 
            requiredPermission: permissions.COMMON_SETUP_TAXES 
          },
          { 
            label: "Branches", 
            href: "/maintenance/system/branches", 
            requiredPermission: permissions.COMMON_SETUP_BRANCHES 
          },
        ],
      },
      {
        label: "GL Setup",
        href: "/maintenance/gl",
        requiredPermission: permissions.GL_SETUP_MANAGE,
        children: [
          { 
            label: "Chart of Accounts", 
            href: "/maintenance/gl/accounts", 
            requiredPermission: permissions.GL_SETUP_MANAGE 
          },
          { 
            label: "Transaction Types", 
            href: "/maintenance/gl/transaction-types", 
            requiredPermission: permissions.GL_SETUP_MANAGE 
          },
          { 
            label: "Defaults", 
            href: "/maintenance/gl/defaults", 
            requiredPermission: permissions.GL_SETUP_MANAGE 
          },
        ],
      },
      {
        label: "AR Setup",
        href: "/maintenance/ar",
        requiredPermission: permissions.AR_SETUP_MANAGE,
        children: [
          { 
            label: "Customers", 
            href: "/maintenance/ar/customers", 
            requiredPermission: permissions.AR_SETUP_MANAGE 
          },
          { 
            label: "Sales Representatives", 
            href: "/maintenance/ar/sales-reps", 
            requiredPermission: permissions.AR_SETUP_MANAGE 
          },
          { 
            label: "Transaction Types", 
            href: "/maintenance/ar/transaction-types", 
            requiredPermission: permissions.AR_SETUP_MANAGE 
          },
          { 
            label: "Defaults", 
            href: "/maintenance/ar/defaults", 
            requiredPermission: permissions.AR_SETUP_MANAGE 
          },
        ],
      },
      {
        label: "AP Setup",
        href: "/maintenance/ap",
        requiredPermission: permissions.AP_SETUP_MANAGE,
        children: [
          { 
            label: "Suppliers", 
            href: "/maintenance/ap/suppliers", 
            requiredPermission: permissions.AP_SETUP_MANAGE 
          },
          { 
            label: "Transaction Types", 
            href: "/maintenance/ap/transaction-types", 
            requiredPermission: permissions.AP_SETUP_MANAGE 
          },
          { 
            label: "Defaults", 
            href: "/maintenance/ap/defaults", 
            requiredPermission: permissions.AP_SETUP_MANAGE 
          },
        ],
      },
      {
        label: "Inventory Setup",
        href: "/maintenance/inventory",
        requiredPermission: permissions.INV_SETUP_MANAGE,
        children: [
          { 
            label: "Items", 
            href: "/maintenance/inventory/items", 
            requiredPermission: permissions.INV_SETUP_MANAGE 
          },
          { 
            label: "Warehouses", 
            href: "/maintenance/inventory/warehouses", 
            requiredPermission: permissions.INV_SETUP_MANAGE 
          },
          { 
            label: "Transaction Types", 
            href: "/maintenance/inventory/transaction-types", 
            requiredPermission: permissions.INV_SETUP_MANAGE 
          },
          { 
            label: "Units of Measure", 
            href: "/maintenance/inventory/uom", 
            requiredPermission: permissions.INV_SETUP_MANAGE 
          },
          { 
            label: "Barcodes", 
            href: "/maintenance/inventory/barcodes", 
            requiredPermission: permissions.INV_SETUP_MANAGE 
          },
          { 
            label: "Defaults", 
            href: "/maintenance/inventory/defaults", 
            requiredPermission: permissions.INV_SETUP_MANAGE 
          },
        ],
      },
      {
        label: "OE Setup",
        href: "/maintenance/oe",
        requiredPermission: permissions.OE_SETUP_MANAGE,
        children: [
          { 
            label: "Order Defaults", 
            href: "/maintenance/oe/defaults", 
            requiredPermission: permissions.OE_SETUP_MANAGE 
          },
        ],
      },
    ],
  },
  {
    label: "Transactions",
    icon: FileText,
    children: [
      {
        label: "General Ledger",
        href: "/transactions/gl",
        requiredPermission: permissions.GL_JOURNAL_POST,
        children: [
          { 
            label: "Journal Entry", 
            href: "/transactions/gl/journal-entry/new", 
            requiredPermission: permissions.GL_JOURNAL_POST 
          },
          { 
            label: "View Journal Entries", 
            href: "/transactions/gl/journal-entries", 
            requiredPermission: permissions.GL_REPORTS_VIEW 
          },
        ],
      },
      {
        label: "Accounts Receivable",
        href: "/transactions/ar",
        requiredPermission: permissions.AR_TRANSACTIONS_POST,
        children: [
          { 
            label: "New Invoice", 
            href: "/transactions/ar/invoices/new", 
            requiredPermission: permissions.AR_TRANSACTIONS_POST 
          },
          { 
            label: "New Credit Note", 
            href: "/transactions/ar/credit-notes/new", 
            requiredPermission: permissions.AR_TRANSACTIONS_POST 
          },
          { 
            label: "New Receipt", 
            href: "/transactions/ar/receipts/new", 
            requiredPermission: permissions.AR_TRANSACTIONS_POST 
          },
          { 
            label: "Allocate Transactions", 
            href: "/transactions/ar/allocations/new", 
            requiredPermission: permissions.AR_TRANSACTIONS_POST 
          },
          { 
            label: "View Transactions", 
            href: "/transactions/ar/list", 
            requiredPermission: permissions.AR_REPORTS_VIEW 
          },
        ],
      },
      {
        label: "Accounts Payable",
        href: "/transactions/ap",
        requiredPermission: permissions.AP_TRANSACTIONS_POST,
        children: [
          { 
            label: "New Supplier Invoice", 
            href: "/transactions/ap/invoices/new", 
            requiredPermission: permissions.AP_TRANSACTIONS_POST 
          },
          { 
            label: "New Debit Note", 
            href: "/transactions/ap/debit-notes/new", 
            requiredPermission: permissions.AP_TRANSACTIONS_POST 
          },
          { 
            label: "New Payment", 
            href: "/transactions/ap/payments/new", 
            requiredPermission: permissions.AP_TRANSACTIONS_POST 
          },
          { 
            label: "Allocate Transactions", 
            href: "/transactions/ap/allocations/new", 
            requiredPermission: permissions.AP_TRANSACTIONS_POST 
          },
          { 
            label: "View Transactions", 
            href: "/transactions/ap/list", 
            requiredPermission: permissions.AP_REPORTS_VIEW 
          },
        ],
      },
      {
        label: "Inventory",
        href: "/transactions/inventory",
        requiredPermission: permissions.INV_TRANSACTIONS_ADJUST,
        children: [
          { 
            label: "Adjustments", 
            href: "/transactions/inventory/adjustments/new", 
            requiredPermission: permissions.INV_TRANSACTIONS_ADJUST 
          },
          { 
            label: "Warehouse Transfers", 
            href: "/transactions/inventory/transfers/new", 
            requiredPermission: permissions.INV_TRANSACTIONS_ADJUST 
          },
          { 
            label: "Inventory Counts", 
            href: "/transactions/inventory/counts", 
            requiredPermission: permissions.INV_TRANSACTIONS_ADJUST 
          },
        ],
      },
      {
        label: "Order Entry",
        href: "/transactions/oe",
        requiredPermission: permissions.OE_SALES_ORDERS_MANAGE,
        children: [
          { 
            label: "New Sales Order", 
            href: "/transactions/oe/sales-orders/new", 
            requiredPermission: permissions.OE_SALES_ORDERS_MANAGE 
          },
          { 
            label: "View Sales Orders", 
            href: "/transactions/oe/sales-orders", 
            requiredPermission: permissions.OE_SALES_ORDERS_MANAGE 
          },
          { 
            label: "New Purchase Order", 
            href: "/transactions/oe/purchase-orders/new", 
            requiredPermission: permissions.OE_PURCHASE_ORDERS_MANAGE 
          },
          { 
            label: "View Purchase Orders", 
            href: "/transactions/oe/purchase-orders", 
            requiredPermission: permissions.OE_PURCHASE_ORDERS_MANAGE 
          },
          { 
            label: "New GRV", 
            href: "/transactions/oe/grvs/new", 
            requiredPermission: permissions.OE_GRV_PROCESS 
          },
          { 
            label: "View GRVs", 
            href: "/transactions/oe/grvs", 
            requiredPermission: permissions.OE_GRV_PROCESS 
          },
        ],
      },
    ],
  },
  {
    label: "Reports",
    icon: BarChart3,
    children: [
      {
        label: "Financial Reports",
        href: "/reports/gl",
        requiredPermission: permissions.GL_REPORTS_VIEW,
        children: [
          { 
            label: "Trial Balance", 
            href: "/reports/gl/trial-balance", 
            requiredPermission: permissions.GL_REPORTS_VIEW 
          },
          { 
            label: "Account Transactions", 
            href: "/reports/gl/account-transactions", 
            requiredPermission: permissions.GL_REPORTS_VIEW 
          },
        ],
      },
      {
        label: "AR Reports",
        href: "/reports/ar",
        requiredPermission: permissions.AR_REPORTS_VIEW,
        children: [
          { 
            label: "Age Analysis", 
            href: "/reports/ar/age-analysis", 
            requiredPermission: permissions.AR_REPORTS_VIEW 
          },
          { 
            label: "Customer Listing", 
            href: "/reports/ar/customer-listing", 
            requiredPermission: permissions.AR_REPORTS_VIEW 
          },
          { 
            label: "Customer Statement", 
            href: "/reports/ar/statement", 
            requiredPermission: permissions.AR_REPORTS_VIEW 
          },
        ],
      },
      {
        label: "AP Reports",
        href: "/reports/ap",
        requiredPermission: permissions.AP_REPORTS_VIEW,
        children: [
          { 
            label: "Age Analysis", 
            href: "/reports/ap/age-analysis", 
            requiredPermission: permissions.AP_REPORTS_VIEW 
          },
          { 
            label: "Supplier Listing", 
            href: "/reports/ap/supplier-listing", 
            requiredPermission: permissions.AP_REPORTS_VIEW 
          },
          { 
            label: "Supplier Statement", 
            href: "/reports/ap/statement", 
            requiredPermission: permissions.AP_REPORTS_VIEW 
          },
        ],
      },
      {
        label: "Inventory Reports",
        href: "/reports/inventory",
        requiredPermission: permissions.INV_REPORTS_VIEW,
        children: [
          { 
            label: "Item Listing", 
            href: "/reports/inventory/item-listing", 
            requiredPermission: permissions.INV_REPORTS_VIEW 
          },
          { 
            label: "Stock Quantity", 
            href: "/reports/inventory/stock-quantity", 
            requiredPermission: permissions.INV_REPORTS_VIEW 
          },
          { 
            label: "Movement Report", 
            href: "/reports/inventory/movement", 
            requiredPermission: permissions.INV_REPORTS_VIEW 
          },
          { 
            label: "Valuation Report", 
            href: "/reports/inventory/valuation", 
            requiredPermission: permissions.INV_REPORTS_VIEW 
          },
        ],
      },
      {
        label: "OE Reports",
        href: "/reports/oe",
        requiredPermission: permissions.OE_REPORTS_VIEW,
        children: [
          { 
            label: "Sales Order Listing", 
            href: "/reports/oe/sales-orders", 
            requiredPermission: permissions.OE_REPORTS_VIEW 
          },
          { 
            label: "Purchase Order Listing", 
            href: "/reports/oe/purchase-orders", 
            requiredPermission: permissions.OE_REPORTS_VIEW 
          },
          { 
            label: "GRV Listing", 
            href: "/reports/oe/grvs", 
            requiredPermission: permissions.OE_REPORTS_VIEW 
          },
        ],
      },
    ],
  },
];
```

#### 7. Layout Components

Create `frontend/src/app/layout.tsx`:
```tsx
import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '',
  description: 'Modern Enterprise Resource Planning System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

Create `frontend/src/app/providers.tsx`:
```tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  const loadAuthData = useAuthStore((state) => state.loadAuthData);

  useEffect(() => {
    loadAuthData();
  }, [loadAuthData]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}# 🚀 Ultimate Biwi ERP Development Guide

**Document Version:** 2.0  
**Date:** December 2024  
**Project Name:**  (Biwi)  
**Purpose:** Complete AI-driven development guide for building a comprehensive ERP system from scratch

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Development Approach](#development-approach)
4. [Phase 0: Project Initialization](#phase-0-project-initialization--core-setup)
5. [Phase 1: Core System Backend](#phase-1-core-system-backend-foundation)
6. [Phase 2: Core System Frontend](#phase-2-core-system-frontend-foundation)
7. [Phase 3: General Ledger Module](#phase-3-general-ledger-module)
8. [Phase 4: Accounts Receivable Module](#phase-4-accounts-receivable-module)
9. [Phase 5: Accounts Payable Module](#phase-5-accounts-payable-module)
10. [Phase 6: Inventory Management Module](#phase-6-inventory-management-module)
11. [Phase 7: Order Entry Module](#phase-7-order-entry-module)
12. [Phase 8: Advanced Maintenance](#phase-8-advanced-maintenance--common-features)

## Project Overview

### Vision
 is a modern, web-based Enterprise Resource Planning system designed for small to medium-sized enterprises. It provides comprehensive business management capabilities including accounting, inventory management, order processing, and advanced reporting.

### Core Modules
- **System Administration**: User management, RBAC, multi-company support
- **General Ledger**: Chart of accounts, journal entries, financial reporting
- **Accounts Receivable**: Customer management, invoicing, payments, allocations
- **Accounts Payable**: Supplier management, bills, payments, allocations
- **Inventory Management**: Item master, warehouses, stock movements, valuation
- **Order Entry**: Sales orders, purchase orders, goods received vouchers
- **Advanced Features**: Multi-currency, tax management, branches
- **Bill of Materials** (Future)
- **Point of Sale** (Future)

## Technology Stack

### Backend
- **Framework**: FastAPI
- **Language**: Python 3.9+
- **ORM**: SQLAlchemy with Alembic
- **Database**: PostgreSQL
- **Authentication**: JWT
- **Security**: Bcrypt for hashing
- **Dependency Management**: Poetry

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Data Fetching**: Tanstack React Query
- **HTTP Client**: Axios
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React
- **Cookies**: js-cookie

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Testing**: Pytest (backend), Jest/React Testing Library (frontend)
- **E2E Testing**: Cypress/Playwright (Phase 13)

## Development Approach

### Core Principles
1. **Iterative Development**: Complete each phase fully before proceeding
2. **Clear Instructions**: Every task has specific actions and expected outcomes
3. **Dependency Awareness**: Explicit dependencies between phases
4. **Quality First**: Comprehensive testing and error handling throughout
5. **Intent-Based UI**: Navigation organized by user intent (Maintenance, Transactions, Reports)

### AI Collaboration Guidelines
- Each phase must be explicitly confirmed complete before proceeding
- Instructions are granular with specific file paths and content hints
- All features must respect RBAC and multi-company isolation
- Backend logic must handle GL posting and cross-module integration
- Frontend must use permission-based UI filtering

---

## Phase 0: Project Initialization & Core Setup

### Objective
Establish the foundational project structure, version control, and initial development environment for both frontend and backend.

### Instructions

#### 1. Create Root Directory
```bash
mkdir Biwi
cd Biwi
```

#### 2. Initialize Git Repository
```bash
git init
```

Create `.gitignore`:
```gitignore
# Python
__pycache__/
*.pyc
*.egg-info/
venv/
.env
*.log
.pytest_cache/

# Node.js
node_modules/
.next/
out/
build/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# OS
.DS_Store
Thumbs.db

# IDE
.idea/
.vscode/

# Docker
*.pid
```

#### 3. Create Project Structure
```bash
mkdir frontend backend database docker docs
echo "# " > README.md
echo "A modern, comprehensive ERP system built with FastAPI and Next.js" >> README.md
```

#### 4. Backend Initialization

Navigate to backend directory:
```bash
cd backend
```

Initialize Poetry project:
```bash
poetry init --name backend --description " Backend" --python "^3.12" -n
```

Add dependencies:
```bash
poetry add fastapi uvicorn sqlalchemy psycopg2-binary alembic python-jose[cryptography] passlib[bcrypt] python-multipart pydantic[email] pydantic-settings
poetry add --group dev pytest httpx black isort mypy ruff
```

Create app structure:
```bash
mkdir -p app/api/v1/endpoints app/core app/crud app/database app/models app/schemas
touch app/__init__.py app/main.py app/config.py
```

Create `app/main.py`:
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title=" Backend")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": " Backend is running"}
```

Create `app/config.py`:
```python
from pydantic_settings import BaseSettings, SettingsConfigDict
import os

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://user:password@localhost/Biwi_db"
    SECRET_KEY: str = "your_super_secret_key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    ALLOWED_HOSTS: list[str] = ["*"]
    
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
```

Create `app/database/database.py`:
```python
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

Initialize Alembic:
```bash
poetry run alembic init alembic
```

Update `alembic.ini`:
```ini
sqlalchemy.url = postgresql://Biwi_user:Biwi_password@localhost/Biwi_db
```

Update `alembic/env.py` to import Base and models:
```python
from app.database.database import Base
from app.models import core  # Import all models
target_metadata = Base.metadata

from app.config import settings
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)
```

Create `.env.example`:
```env
DATABASE_URL=postgresql://Biwi_user:Biwi_password@db:5432/Biwi_db
SECRET_KEY=generate_a_strong_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

Create `setup.sh`:
```bash
#!/bin/bash
poetry install
poetry run alembic upgrade head
```

Create `dev.sh`:
```bash
#!/bin/bash
if [ "$1" == "init-db" ]; then
  poetry run python app/init_db.py
elif [ "$1" == "server" ]; then
  poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
else
  echo "Usage: ./dev.sh [init-db|server]"
fi
```

Create `app/init_db.py` (stub):
```python
from app.database.database import SessionLocal, engine, Base
from app.config import settings

def init_db():
    db = SessionLocal()
    print("Database initialization script - to be populated in Phase 1")
    db.close()

if __name__ == "__main__":
    print("Initializing database...")
    init_db()
    print("Database initialization finished.")
```

#### 5. Frontend Initialization

Navigate to frontend directory:
```bash
cd ../frontend
```

Initialize Next.js project:
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --use-npm
```

Add dependencies:
```bash
npm install @tanstack/react-query axios react-hook-form @hookform/resolvers zod lucide-react js-cookie zustand
npm install --save-dev @types/node @types/js-cookie
```

Create folder structure:
```bash
mkdir -p src/components/ui src/components/layout src/components/modules
mkdir -p src/hooks src/lib src/services src/store src/types src/styles
```

#### 6. Docker Setup

Create `docker-compose.yml` in root:
```yaml
version: '3.8'

services:
  db:
    image: postgres:15
    container_name: Biwi_db
    volumes:
      - postgres_data:/var/lib/postgresql/data/
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: Biwi_user
      POSTGRES_PASSWORD: Biwi_password
      POSTGRES_DB: Biwi_db
    networks:
      - Biwi_network

  backend:
    build:
      context: ./backend
      dockerfile: ../docker/Dockerfile.backend
    container_name: Biwi_backend
    command: poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000
    volumes:
      - ./backend:/app
    ports:
      - "8000:8000"
    depends_on:
      - db
    env_file:
      - ./backend/.env
    networks:
      - Biwi_network

  frontend:
    build:
      context: ./frontend
      dockerfile: ../docker/Dockerfile.frontend
    container_name: Biwi_frontend
    command: npm run dev
    volumes:
      - ./frontend:/app
      - /app/node_modules
      - /app/.next
    ports:
      - "3000:3000"
    depends_on:
      - backend
    environment:
      NEXT_PUBLIC_API_BASE_URL: http://backend:8000/api
    networks:
      - Biwi_network

volumes:
  postgres_data:

networks:
  Biwi_network:
    driver: bridge
```

Create `docker/Dockerfile.backend`:
```dockerfile
FROM python:3.9-slim

WORKDIR /app

RUN pip install poetry

COPY pyproject.toml poetry.lock* /app/

RUN poetry config virtualenvs.create false && poetry install --no-interaction --no-ansi --only main

COPY . /app

EXPOSE 8000

CMD ["poetry", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Create `docker/Dockerfile.frontend`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm install

COPY . ./

EXPOSE 3000

CMD ["npm", "run", "dev"]
```

### Definition of Done - Phase 0
- [ ] Git repository initialized with comprehensive .gitignore
- [ ] Complete directory structure created
- [ ] Backend project initialized with Poetry and all dependencies
- [ ] Frontend project initialized with Next.js and all dependencies
- [ ] Docker setup complete with all services configured
- [ ] Application runs via `docker-compose up --build`
- [ ] Backend accessible at http://localhost:8000
- [ ] Frontend accessible at http://localhost:3000
