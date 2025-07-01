# Multi-Tenant Platform Administration Implementation

## Overview
Transform Vinea ERP into a true multi-tenant SaaS platform with platform-level administration capabilities.

## 1. Database Schema Updates

### A. User Types Enhancement
```python
# app/models/core.py
from enum import Enum
from sqlalchemy import Enum as SQLEnum

class UserType(str, Enum):
    PLATFORM_ADMIN = "platform_admin"  # Can access all companies
    COMPANY_ADMIN = "company_admin"    # Admin within a company
    COMPANY_USER = "company_user"      # Regular user within a company

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)  # Deprecated, use user_type
    user_type = Column(SQLEnum(UserType), default=UserType.COMPANY_USER, nullable=False)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    
    # Platform admins can have a default company for context
    default_company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    
    # Audit fields
    last_login = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    company = relationship("Company", foreign_keys=[company_id], back_populates="users")
    default_company = relationship("Company", foreign_keys=[default_company_id])
    roles = relationship("UserRole", back_populates="user")
    platform_audit_logs = relationship("PlatformAuditLog", back_populates="user")
    
    __table_args__ = (
        CheckConstraint(
            "user_type = 'platform_admin' OR company_id IS NOT NULL",
            name='ck_company_required_for_non_platform_users'
        ),
    )
```

### B. Platform Audit Log
```python
class PlatformAuditLog(Base):
    """Track all platform admin actions for compliance"""
    __tablename__ = "platform_audit_logs"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    action = Column(String, nullable=False)  # e.g., "viewed_financials", "modified_user", "exported_data"
    resource_type = Column(String, nullable=True)  # e.g., "user", "transaction", "report"
    resource_id = Column(Integer, nullable=True)
    details = Column(JSONB, nullable=True)
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    user = relationship("User", back_populates="platform_audit_logs")
    company = relationship("Company")
```

### C. Company Enhancements
```python
class Company(Base):
    __tablename__ = "companies"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    code = Column(String(10), unique=True, nullable=False)  # Short code for easy identification
    
    # Multi-tenant specific fields
    subscription_status = Column(String, default="trial")  # trial, active, suspended, cancelled
    subscription_plan = Column(String, nullable=True)  # basic, professional, enterprise
    subscription_expires = Column(Date, nullable=True)
    storage_limit_gb = Column(Integer, default=10)
    user_limit = Column(Integer, default=5)
    
    # Contact and billing
    primary_contact_email = Column(String, nullable=True)
    billing_email = Column(String, nullable=True)
    
    # Platform metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Existing fields...
    address = Column(JSONB, nullable=True)
    contact_info = Column(JSONB, nullable=True)
    default_currency_code = Column(String(3), nullable=True)
    is_active = Column(Boolean, default=True)
    is_deleted = Column(Boolean, default=False)
    
    users = relationship("User", foreign_keys=[User.company_id], back_populates="company")
```

## 2. Platform Administration API

### A. Platform Authentication Middleware
```python
# app/core/platform_security.py
from fastapi import Depends, HTTPException, Request
from app.core.security import get_current_active_user

class PlatformContext:
    """Stores the current platform context"""
    def __init__(self, platform_user: models.User, target_company_id: int = None):
        self.platform_user = platform_user
        self.target_company_id = target_company_id

async def get_platform_admin(
    current_user: models.User = Depends(get_current_active_user)
) -> models.User:
    """Ensure user is a platform admin"""
    if current_user.user_type != UserType.PLATFORM_ADMIN:
        raise HTTPException(
            status_code=403,
            detail="Platform administrator access required"
        )
    return current_user

async def get_platform_context(
    request: Request,
    platform_admin: models.User = Depends(get_platform_admin),
    db: Session = Depends(get_db)
) -> PlatformContext:
    """Get platform context with optional target company"""
    # Check for X-Target-Company-ID header
    target_company_id = request.headers.get("X-Target-Company-ID")
    
    if target_company_id:
        company = db.query(models.Company).filter(
            models.Company.id == int(target_company_id),
            models.Company.is_deleted == False
        ).first()
        
        if not company:
            raise HTTPException(status_code=404, detail="Target company not found")
        
        # Log the access
        audit_log = models.PlatformAuditLog(
            user_id=platform_admin.id,
            company_id=company.id,
            action="accessed_company",
            resource_type="company",
            resource_id=company.id,
            ip_address=request.client.host,
            user_agent=request.headers.get("User-Agent")
        )
        db.add(audit_log)
        db.commit()
        
        return PlatformContext(platform_admin, company.id)
    
    return PlatformContext(platform_admin, None)
```

### B. Platform API Endpoints
```python
# app/api/v1/endpoints/platform.py
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from app.core.platform_security import get_platform_admin, get_platform_context

router = APIRouter(prefix="/platform", tags=["platform"])

@router.get("/companies", response_model=List[schemas.CompanyWithStats])
async def list_all_companies(
    skip: int = 0,
    limit: int = 100,
    subscription_status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    platform_admin: models.User = Depends(get_platform_admin)
):
    """List all companies with statistics"""
    query = db.query(models.Company).filter(models.Company.is_deleted == False)
    
    if subscription_status:
        query = query.filter(models.Company.subscription_status == subscription_status)
    
    if search:
        query = query.filter(
            models.Company.name.ilike(f"%{search}%") |
            models.Company.code.ilike(f"%{search}%")
        )
    
    companies = query.offset(skip).limit(limit).all()
    
    # Add statistics
    company_stats = []
    for company in companies:
        stats = {
            "company": company,
            "user_count": db.query(models.User).filter(models.User.company_id == company.id).count(),
            "active_users_30d": db.query(models.User).filter(
                models.User.company_id == company.id,
                models.User.last_login >= datetime.utcnow() - timedelta(days=30)
            ).count(),
            "transaction_count": db.query(models.GLJournalEntry).filter(
                models.GLJournalEntry.company_id == company.id
            ).count(),
            "storage_used_gb": calculate_storage_usage(db, company.id),  # Implement this
        }
        company_stats.append(stats)
    
    return company_stats

@router.post("/companies/{company_id}/impersonate")
async def impersonate_company(
    company_id: int,
    db: Session = Depends(get_db),
    platform_admin: models.User = Depends(get_platform_admin)
):
    """Generate a temporary token to act as admin within a company"""
    company = db.query(models.Company).filter(
        models.Company.id == company_id,
        models.Company.is_deleted == False
    ).first()
    
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    # Create audit log
    audit_log = models.PlatformAuditLog(
        user_id=platform_admin.id,
        company_id=company_id,
        action="impersonated_company",
        resource_type="company",
        resource_id=company_id,
        details={"reason": "Support request #12345"}  # Should be provided by frontend
    )
    db.add(audit_log)
    db.commit()
    
    # Generate a special token with company context
    token_data = {
        "user_id": platform_admin.id,
        "company_id": company_id,
        "is_impersonation": True,
        "expires": datetime.utcnow() + timedelta(hours=1)  # Short-lived
    }
    
    access_token = create_access_token(data=token_data)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "company": company,
        "expires_in": 3600  # 1 hour
    }

@router.get("/companies/{company_id}/health")
async def get_company_health(
    company_id: int,
    db: Session = Depends(get_db),
    platform_context: PlatformContext = Depends(get_platform_context)
):
    """Get health metrics for a company"""
    # ... implementation
    pass

@router.post("/companies/{company_id}/suspend")
async def suspend_company(
    company_id: int,
    reason: str,
    db: Session = Depends(get_db),
    platform_admin: models.User = Depends(get_platform_admin)
):
    """Suspend a company's access"""
    company = db.query(models.Company).filter(models.Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    company.subscription_status = "suspended"
    company.is_active = False
    
    # Log action
    audit_log = models.PlatformAuditLog(
        user_id=platform_admin.id,
        company_id=company_id,
        action="suspended_company",
        details={"reason": reason}
    )
    db.add(audit_log)
    db.commit()
    
    return {"status": "suspended", "company_id": company_id}

@router.get("/audit-logs")
async def get_platform_audit_logs(
    skip: int = 0,
    limit: int = 100,
    company_id: Optional[int] = None,
    user_id: Optional[int] = None,
    action: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db),
    platform_admin: models.User = Depends(get_platform_admin)
):
    """Get platform audit logs"""
    query = db.query(models.PlatformAuditLog)
    
    if company_id:
        query = query.filter(models.PlatformAuditLog.company_id == company_id)
    if user_id:
        query = query.filter(models.PlatformAuditLog.user_id == user_id)
    if action:
        query = query.filter(models.PlatformAuditLog.action == action)
    if start_date:
        query = query.filter(models.PlatformAuditLog.timestamp >= start_date)
    if end_date:
        query = query.filter(models.PlatformAuditLog.timestamp <= end_date)
    
    return query.order_by(models.PlatformAuditLog.timestamp.desc()).offset(skip).limit(limit).all()

@router.get("/metrics/summary")
async def get_platform_metrics(
    db: Session = Depends(get_db),
    platform_admin: models.User = Depends(get_platform_admin)
):
    """Get platform-wide metrics"""
    return {
        "total_companies": db.query(models.Company).filter(models.Company.is_deleted == False).count(),
        "active_companies": db.query(models.Company).filter(
            models.Company.subscription_status == "active",
            models.Company.is_deleted == False
        ).count(),
        "total_users": db.query(models.User).filter(models.User.user_type != UserType.PLATFORM_ADMIN).count(),
        "active_users_today": db.query(models.User).filter(
            models.User.last_login >= datetime.utcnow().date()
        ).count(),
        "total_transactions": db.query(models.GLJournalEntry).count(),
        "revenue_this_month": calculate_platform_revenue(db),  # Implement based on subscription model
    }
```

## 3. Frontend Platform Administration

### A. Platform Admin Dashboard
```tsx
// frontend/src/app/(platform)/platform/dashboard/page.tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { platformService } from '@/services/platformService';
import { CompanyList } from '@/components/platform/CompanyList';
import { PlatformMetrics } from '@/components/platform/PlatformMetrics';
import { RecentAuditLogs } from '@/components/platform/RecentAuditLogs';

export default function PlatformDashboard() {
  const { data: metrics } = useQuery({
    queryKey: ['platform-metrics'],
    queryFn: platformService.getMetrics,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Platform Administration</h1>
      
      <PlatformMetrics metrics={metrics} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Active Companies</CardTitle>
          </CardHeader>
          <CardContent>
            <CompanyList filter="active" limit={5} />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Platform Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentAuditLogs limit={10} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

### B. Company Management Interface
```tsx
// frontend/src/app/(platform)/platform/companies/page.tsx
'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { platformService } from '@/services/platformService';
import { Eye, Pause, Play, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PlatformCompaniesPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const { data: companies, refetch } = useQuery({
    queryKey: ['platform-companies', search, statusFilter],
    queryFn: () => platformService.getCompanies({ search, status: statusFilter }),
  });

  const impersonateMutation = useMutation({
    mutationFn: platformService.impersonateCompany,
    onSuccess: (data) => {
      // Store impersonation token and redirect
      localStorage.setItem('impersonation_token', data.access_token);
      localStorage.setItem('impersonation_company', JSON.stringify(data.company));
      window.location.href = '/dashboard'; // Full reload to new context
    },
  });

  const columns = [
    {
      accessorKey: 'company.code',
      header: 'Code',
    },
    {
      accessorKey: 'company.name',
      header: 'Company Name',
    },
    {
      accessorKey: 'user_count',
      header: 'Users',
    },
    {
      accessorKey: 'active_users_30d',
      header: 'Active (30d)',
    },
    {
      accessorKey: 'company.subscription_status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.company.subscription_status;
        const colors = {
          trial: 'text-blue-600',
          active: 'text-green-600',
          suspended: 'text-red-600',
          cancelled: 'text-gray-600',
        };
        return <span className={colors[status]}>{status}</span>;
      },
    },
    {
      accessorKey: 'storage_used_gb',
      header: 'Storage',
      cell: ({ row }) => {
        const used = row.original.storage_used_gb;
        const limit = row.original.company.storage_limit_gb;
        return `${used}/${limit} GB`;
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const company = row.original.company;
        
        return (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => router.push(`/platform/companies/${company.id}`)}
              title="View Details"
            >
              <Eye className="h-4 w-4" />
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={() => impersonateMutation.mutate(company.id)}
              title="Access as Admin"
            >
              <Settings className="h-4 w-4" />
            </Button>
            
            {company.subscription_status === 'active' ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleSuspend(company.id)}
                title="Suspend"
              >
                <Pause className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleActivate(company.id)}
                title="Activate"
              >
                <Play className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Company Management</h1>
      
      <div className="flex gap-4">
        <Input
          placeholder="Search companies..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <option value="all">All Status</option>
          <option value="trial">Trial</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="cancelled">Cancelled</option>
        </Select>
        
        <Button onClick={() => router.push('/platform/companies/new')}>
          Create Company
        </Button>
      </div>
      
      <DataTable columns={columns} data={companies || []} />
    </div>
  );
}
```

### C. Platform Service
```typescript
// frontend/src/services/platformService.ts
import { platformAxiosInstance } from '@/lib/platformAxiosInstance';

export const platformService = {
  // Companies
  getCompanies: async (filters?: CompanyFilters) => {
    const response = await platformAxiosInstance.get('/platform/companies', { params: filters });
    return response.data;
  },
  
  getCompany: async (companyId: number) => {
    const response = await platformAxiosInstance.get(`/platform/companies/${companyId}`);
    return response.data;
  },
  
  createCompany: async (data: CompanyCreate) => {
    const response = await platformAxiosInstance.post('/platform/companies', data);
    return response.data;
  },
  
  impersonateCompany: async (companyId: number) => {
    const response = await platformAxiosInstance.post(`/platform/companies/${companyId}/impersonate`);
    return response.data;
  },
  
  suspendCompany: async (companyId: number, reason: string) => {
    const response = await platformAxiosInstance.post(`/platform/companies/${companyId}/suspend`, { reason });
    return response.data;
  },
  
  // Metrics
  getMetrics: async () => {
    const response = await platformAxiosInstance.get('/platform/metrics/summary');
    return response.data;
  },
  
  // Audit
  getAuditLogs: async (filters?: AuditLogFilters) => {
    const response = await platformAxiosInstance.get('/platform/audit-logs', { params: filters });
    return response.data;
  },
};
```

## 4. Security Considerations

### A. Separate Authentication Flow
```typescript
// frontend/src/app/(auth)/platform-login/page.tsx
export default function PlatformLoginPage() {
  // Separate login page for platform admins
  // Different branding, security warnings
  // MFA should be mandatory
}
```

### B. Enhanced Middleware
```python
# app/core/middleware.py
async def platform_security_middleware(request: Request, call_next):
    """Enhanced security for platform routes"""
    if request.url.path.startswith("/api/v1/platform"):
        # Verify IP whitelist
        # Check rate limits
        # Enforce MFA
        # Log all actions
        pass
    return await call_next(request)
```

## 5. Database Migration

```sql
-- Migration to add platform features
ALTER TABLE users ADD COLUMN user_type VARCHAR(20) DEFAULT 'company_user';
ALTER TABLE users ADD COLUMN default_company_id INTEGER REFERENCES companies(id);
ALTER TABLE users ADD COLUMN last_login TIMESTAMP;
ALTER TABLE users ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE companies ADD COLUMN code VARCHAR(10) UNIQUE NOT NULL;
ALTER TABLE companies ADD COLUMN subscription_status VARCHAR(20) DEFAULT 'trial';
ALTER TABLE companies ADD COLUMN subscription_plan VARCHAR(50);
ALTER TABLE companies ADD COLUMN subscription_expires DATE;
ALTER TABLE companies ADD COLUMN storage_limit_gb INTEGER DEFAULT 10;
ALTER TABLE companies ADD COLUMN user_limit INTEGER DEFAULT 5;
ALTER TABLE companies ADD COLUMN primary_contact_email VARCHAR(255);
ALTER TABLE companies ADD COLUMN billing_email VARCHAR(255);
ALTER TABLE companies ADD COLUMN created_by_user_id INTEGER REFERENCES users(id);

-- Update existing superusers to platform_admin
UPDATE users SET user_type = 'platform_admin' WHERE is_superuser = TRUE;

-- Create platform audit log table
CREATE TABLE platform_audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    company_id INTEGER REFERENCES companies(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id INTEGER,
    details JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_platform_audit_logs_user_id ON platform_audit_logs(user_id);
CREATE INDEX idx_platform_audit_logs_company_id ON platform_audit_logs(company_id);
CREATE INDEX idx_platform_audit_logs_timestamp ON platform_audit_logs(timestamp);
```

## 6. Deployment Considerations

1. **Separate Platform Admin Portal**: Consider deploying platform admin UI on a different subdomain (e.g., platform.vinea-erp.com)

2. **Enhanced Security**:
   - IP whitelisting for platform admins
   - Mandatory MFA
   - Session recording for compliance
   - Separate audit database

3. **Performance**:
   - Caching for cross-company queries
   - Read replicas for platform analytics
   - Separate queue for platform operations

4. **Compliance**:
   - Data residency per company
   - Audit trail retention policies
   - GDPR compliance for cross-company access