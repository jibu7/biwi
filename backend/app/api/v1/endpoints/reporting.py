from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import date, datetime
from app.database.database import get_db
from app.core.permissions import (
    PermissionChecker, check_permissions,
    REPORTING_FINANCIAL_STATEMENTS_VIEW,
    REPORTING_GL_ADVANCED_VIEW,
    REPORTING_AR_AGING_VIEW,
    REPORTING_AP_AGING_VIEW,
    REPORTING_TEMPLATES_MANAGE,
    REPORTING_BANK_RECONCILIATION_MANAGE,
    # Phase 9 Advanced Permissions
    REPORTS_FINANCIAL_VIEW, REPORTS_FINANCIAL_EXPORT,
    REPORTS_CUSTOM_CREATE, REPORTS_CUSTOM_EDIT,
    REPORTS_SCHEDULE_MANAGE, REPORTS_DASHBOARD_VIEW
)
from app.crud import reporting
from app.crud import gl as crud_gl
from app import schemas, models
from app.core.security import get_current_active_user
from app.core.tenant_context import get_current_tenant_id
from app.services.reporting_service import AdvancedReportingService
from app.repositories.reporting_repository import ReportingRepository
from app.schemas.reporting import (
    # Request schemas
    BalanceSheetRequest, IncomeStatementRequest, CashFlowRequest,
    TrialBalanceRequest, AgingReportRequest, CustomReportBuilder,
    ReportTemplateCreate, ReportTemplateUpdate, ReportTemplateResponse,
    ReportScheduleCreate, ReportScheduleUpdate, ReportSchedule,
    ExportRequest, FinancialReportingPeriodCreate,
    # Response schemas
    DashboardMetrics, AgingReportData, ReportTypeEnum,
    GeneratedReport, FinancialReportingPeriod
)

router = APIRouter()

@router.get("/balance-sheet", response_model=schemas.BalanceSheetData)
async def get_balance_sheet(
    as_of_date: date = Query(...),
    comparative_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([REPORTING_FINANCIAL_STATEMENTS_VIEW]))
):
    """Generate Balance Sheet report"""
    return reporting.generate_balance_sheet(
        db=db,
        company_id=current_user.company_id,
        as_of_date=as_of_date,
        comparative_date=comparative_date
    )

@router.get("/income-statement", response_model=schemas.IncomeStatementData)
async def get_income_statement(
    start_date: date = Query(...),
    end_date: date = Query(...),
    comparative_start_date: Optional[date] = Query(None),
    comparative_end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([REPORTING_FINANCIAL_STATEMENTS_VIEW]))
):
    """Generate Income Statement report"""
    return reporting.generate_income_statement(
        db=db,
        company_id=current_user.company_id,
        start_date=start_date,
        end_date=end_date,
        comparative_start_date=comparative_start_date,
        comparative_end_date=comparative_end_date
    )

@router.get("/ar-aging-detail", response_model=List[schemas.ARAgingDetail])
async def get_ar_aging_detail(
    as_of_date: date = Query(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([REPORTING_AR_AGING_VIEW]))
):
    """Generate detailed AR aging report"""
    return reporting.generate_detailed_ar_aging(
        db=db,
        company_id=current_user.company_id,
        as_of_date=as_of_date
    )

@router.get("/ap-aging-detail", response_model=List[schemas.APAgingDetail])
async def get_ap_aging_detail(
    as_of_date: date = Query(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([REPORTING_AP_AGING_VIEW]))
):
    """Generate detailed AP aging report"""
    return reporting.generate_detailed_ap_aging(
        db=db,
        company_id=current_user.company_id,
        as_of_date=as_of_date
    )

@router.get("/cashbook")
async def get_cashbook_report(
    gl_account_id: int = Query(...),
    start_date: date = Query(...),
    end_date: date = Query(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([REPORTING_GL_ADVANCED_VIEW]))
):
    """Generate cashbook report for specific GL account"""
    return reporting.get_cashbook_report(
        db=db,
        company_id=current_user.company_id,
        gl_account_id=gl_account_id,
        start_date=start_date,
        end_date=end_date
    )

@router.post("/templates", response_model=schemas.ReportTemplate)
async def create_report_template(
    template: schemas.ReportTemplateCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([REPORTING_TEMPLATES_MANAGE]))
):
    """Create custom report template"""
    return reporting.create_report_template(
        db=db,
        template=template,
        company_id=current_user.company_id,
        user_id=current_user.id
    )

@router.get("/templates", response_model=List[schemas.ReportTemplate])
async def get_report_templates(
    report_type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([REPORTING_TEMPLATES_MANAGE]))
):
    """Get all report templates for company"""
    return reporting.get_report_templates_by_company(
        db=db,
        company_id=current_user.company_id,
        report_type=report_type
    )

@router.post("/bank-reconciliation", response_model=schemas.BankReconciliation)
async def create_bank_reconciliation(
    reconciliation: schemas.BankReconciliationCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([REPORTING_BANK_RECONCILIATION_MANAGE]))
):
    """Create bank reconciliation"""
    return reporting.create_bank_reconciliation(
        db=db,
        reconciliation=reconciliation,
        company_id=current_user.company_id,
        user_id=current_user.id
    )

@router.get("/cash-flow", response_model=schemas.CashFlowData)
async def get_cash_flow_statement(
    start_date: date = Query(...),
    end_date: date = Query(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([REPORTING_FINANCIAL_STATEMENTS_VIEW]))
):
    """Generate Cash Flow Statement"""
    return reporting.generate_cash_flow_statement(
        db=db,
        company_id=current_user.company_id,
        start_date=start_date,
        end_date=end_date
    )

@router.get("/account-transactions", response_model=List[schemas.AccountTransaction])
async def get_account_transactions(
    account_code: str = Query(..., description="GL Account Code"),
    start_date: date = Query(..., description="Start date"),
    end_date: date = Query(..., description="End date"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([REPORTING_GL_ADVANCED_VIEW, REPORTING_FINANCIAL_STATEMENTS_VIEW]))
):
    """Get account transaction details by account code"""
    # First find the account by code
    account = db.query(models.GLAccount).filter(
        models.GLAccount.company_id == current_user.company_id,
        models.GLAccount.account_code == account_code
    ).first()
    
    if not account:
        raise HTTPException(status_code=404, detail=f"Account with code {account_code} not found")
    
    # Get transactions for this account
    return crud_gl.get_account_transactions(
        db, 
        company_id=current_user.company_id, 
        account_id=account.id,
        start_date=start_date, 
        end_date=end_date
    )

# ==================== PHASE 9 ADVANCED REPORTING ENDPOINTS ====================

@router.get("/dashboard/metrics", response_model=DashboardMetrics)
async def get_dashboard_metrics(
    as_of_date: date = Query(default_factory=date.today),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
    _: bool = Depends(check_permissions([REPORTS_DASHBOARD_VIEW]))
):
    """Get financial dashboard metrics"""
    company_id = get_current_tenant_id()
    reporting_service = AdvancedReportingService(db, company_id)
    
    try:
        metrics = reporting_service.generate_dashboard_metrics(as_of_date)
        return metrics
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating dashboard metrics: {str(e)}")

@router.post("/balance-sheet-advanced", response_model=schemas.BalanceSheetData)
async def generate_balance_sheet_advanced(
    request: BalanceSheetRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
    _: bool = Depends(check_permissions([REPORTS_FINANCIAL_VIEW]))
):
    """Generate advanced Balance Sheet report"""
    company_id = get_current_tenant_id()
    reporting_service = AdvancedReportingService(db, company_id)
    
    try:
        balance_sheet = reporting_service.generate_balance_sheet(
            as_of_date=request.as_of_date,
            format_type=request.format_type,
            comparison_period=request.comparison_period
        )
        return balance_sheet
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating balance sheet: {str(e)}")

@router.post("/income-statement-advanced", response_model=schemas.IncomeStatementData)
async def generate_income_statement_advanced(
    request: IncomeStatementRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
    _: bool = Depends(check_permissions([REPORTS_FINANCIAL_VIEW]))
):
    """Generate advanced Income Statement (P&L) report"""
    company_id = get_current_tenant_id()
    reporting_service = AdvancedReportingService(db, company_id)
    
    try:
        income_statement = reporting_service.generate_income_statement(
            start_date=request.start_date,
            end_date=request.end_date,
            show_percentages=request.show_percentages,
            group_by=request.group_by
        )
        return income_statement
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating income statement: {str(e)}")

@router.post("/cash-flow", response_model=schemas.CashFlowData)
async def generate_cash_flow(
    request: CashFlowRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
    _: bool = Depends(check_permissions([REPORTS_FINANCIAL_VIEW]))
):
    """Generate Cash Flow Statement"""
    company_id = get_current_tenant_id()
    reporting_service = AdvancedReportingService(db, company_id)
    
    try:
        cash_flow = reporting_service.generate_cash_flow_statement(
            start_date=request.start_date,
            end_date=request.end_date,
            method=request.method
        )
        return cash_flow
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating cash flow statement: {str(e)}")

@router.post("/ar-aging-advanced", response_model=AgingReportData)
async def generate_ar_aging_advanced(
    request: AgingReportRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
    _: bool = Depends(check_permissions([REPORTS_FINANCIAL_VIEW]))
):
    """Generate advanced Accounts Receivable Aging Report"""
    company_id = get_current_tenant_id()
    reporting_service = AdvancedReportingService(db, company_id)
    
    as_of_date = request.end_date or date.today()
    
    try:
        ar_aging = reporting_service.generate_ar_aging_report(
            as_of_date=as_of_date,
            aging_buckets=request.aging_buckets,
            customer_id=request.customer_id
        )
        return ar_aging
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating AR aging report: {str(e)}")

@router.post("/custom-report", response_model=Dict[str, Any])
async def generate_custom_report(
    request: CustomReportBuilder,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
    _: bool = Depends(check_permissions([REPORTS_CUSTOM_CREATE]))
):
    """Generate custom report based on configuration"""
    company_id = get_current_tenant_id()
    reporting_service = AdvancedReportingService(db, company_id)
    
    try:
        report_config = {
            "name": request.name,
            "report_type": request.report_type,
            "data_source": request.data_source,
            "columns": request.columns,
            "filters": request.filters,
            "grouping": request.grouping,
            "sorting": request.sorting,
            "aggregations": request.aggregations,
            "joins": request.joins
        }
        
        custom_report = reporting_service.create_custom_report(
            report_config=report_config,
            parameters={}
        )
        return custom_report
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating custom report: {str(e)}")

# Report Templates Management
@router.post("/templates", response_model=ReportTemplateResponse)
async def create_report_template(
    template: ReportTemplateCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
    _: bool = Depends(check_permissions([REPORTS_CUSTOM_CREATE]))
):
    """Create a new report template"""
    company_id = get_current_tenant_id()
    repo = ReportingRepository(db)
    
    try:
        db_template = repo.create_report_template(
            company_id=company_id,
            template_data=template,
            created_by_user_id=current_user.id
        )
        return db_template
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating report template: {str(e)}")

@router.get("/templates", response_model=List[ReportTemplateResponse])
async def get_report_templates(
    report_type: Optional[ReportTypeEnum] = None,
    is_active: Optional[bool] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
    _: bool = Depends(check_permissions([REPORTS_FINANCIAL_VIEW]))
):
    """Get report templates"""
    company_id = get_current_tenant_id()
    repo = ReportingRepository(db)
    
    templates = repo.get_report_templates(
        company_id=company_id,
        report_type=report_type,
        is_active=is_active,
        skip=skip,
        limit=limit
    )
    return templates

@router.post("/export", response_model=Dict[str, Any])
async def export_report(
    export_request: ExportRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
    _: bool = Depends(check_permissions([REPORTS_FINANCIAL_EXPORT]))
):
    """Export report in specified format"""
    company_id = get_current_tenant_id()
    
    # For now, return a simple response
    # In a full implementation, this would generate the actual file
    return {
        "message": "Report export initiated",
        "report_type": export_request.report_type,
        "format": export_request.format,
        "status": "processing",
        "estimated_completion": "2-3 minutes"
    }
