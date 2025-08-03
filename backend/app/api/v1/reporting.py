# app/api/v1/reporting.py
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Query
from sqlalchemy.orm import Session
from datetime import datetime, date

from app.database.database import get_db
from app.api.deps import get_current_active_user
from app.core.tenant_context import get_current_tenant_id
from app.core.permissions import check_permissions
from app.core.permissions import (
    REPORTS_FINANCIAL_VIEW, REPORTS_FINANCIAL_EXPORT,
    REPORTS_CUSTOM_CREATE, REPORTS_CUSTOM_EDIT, 
    REPORTS_SCHEDULE_MANAGE, REPORTS_DASHBOARD_VIEW,
    REPORTS_TRIAL_BALANCE_VIEW, REPORTS_INVENTORY_VALUATION_VIEW
)
from app.models.core import User
from app.services.reporting_service import AdvancedReportingService
from app.repositories.reporting_repository import ReportingRepository
from app.schemas.reporting import (
    # Request schemas
    BalanceSheetRequest, IncomeStatementRequest, CashFlowRequest,
    TrialBalanceRequest, AgingReportRequest, CustomReportBuilder,
    ReportTemplateCreate, ReportTemplateUpdate, ReportTemplateResponse,
    ReportScheduleCreate, ReportScheduleUpdate, ReportSchedule,
    ExportRequest, FinancialReportingPeriodCreate, FinancialReportingPeriodUpdate,
    # Response schemas
    BalanceSheetData, IncomeStatementData, CashFlowData,
    AgingReportData, DashboardMetrics, ReportData, ReportTypeEnum,
    GeneratedReport, FinancialReportingPeriod
)

router = APIRouter()

@router.get("/dashboard/metrics", response_model=DashboardMetrics)
async def get_dashboard_metrics(
    as_of_date: date = Query(default_factory=date.today),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    _: bool = Depends(check_permissions([REPORTS_DASHBOARD_VIEW]))
):
    """Get financial dashboard metrics"""
    company_id = get_current_tenant_id()
    reporting_service = AdvancedReportingService(db, company_id)
    
    try:
        metrics = reporting_service.generate_dashboard_metrics(as_of_date)
        return metrics
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating dashboard metrics: {str(e)}"
        )

@router.post("/balance-sheet", response_model=BalanceSheetData)
async def generate_balance_sheet(
    request: BalanceSheetRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    _: bool = Depends(check_permissions([REPORTS_FINANCIAL_VIEW]))
):
    """Generate Balance Sheet report"""
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
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating balance sheet: {str(e)}"
        )

@router.post("/income-statement", response_model=IncomeStatementData)
async def generate_income_statement(
    request: IncomeStatementRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    _: bool = Depends(check_permissions([REPORTS_FINANCIAL_VIEW]))
):
    """Generate Income Statement (P&L) report"""
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
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating income statement: {str(e)}"
        )

@router.post("/cash-flow", response_model=CashFlowData)
async def generate_cash_flow(
    request: CashFlowRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
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
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating cash flow statement: {str(e)}"
        )

@router.post("/ar-aging", response_model=AgingReportData)
async def generate_ar_aging(
    request: AgingReportRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    _: bool = Depends(check_permissions([REPORTS_FINANCIAL_VIEW]))
):
    """Generate Accounts Receivable Aging Report"""
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
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating AR aging report: {str(e)}"
        )

@router.post("/custom-report", response_model=Dict[str, Any])
async def generate_custom_report(
    request: CustomReportBuilder,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
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
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating custom report: {str(e)}"
        )

# Report Templates
@router.post("/templates", response_model=ReportTemplateResponse)
async def create_report_template(
    template: ReportTemplateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
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
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating report template: {str(e)}"
        )

@router.get("/templates", response_model=List[ReportTemplateResponse])
async def get_report_templates(
    report_type: Optional[ReportTypeEnum] = None,
    is_active: Optional[bool] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
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

@router.get("/templates/{template_id}", response_model=ReportTemplateResponse)
async def get_report_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    _: bool = Depends(check_permissions([REPORTS_FINANCIAL_VIEW]))
):
    """Get a specific report template"""
    company_id = get_current_tenant_id()
    repo = ReportingRepository(db)
    
    template = repo.get_report_template(company_id, template_id)
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report template not found"
        )
    return template

@router.put("/templates/{template_id}", response_model=ReportTemplateResponse)
async def update_report_template(
    template_id: int,
    template_update: ReportTemplateUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    _: bool = Depends(check_permissions([REPORTS_CUSTOM_EDIT]))
):
    """Update a report template"""
    company_id = get_current_tenant_id()
    repo = ReportingRepository(db)
    
    template = repo.update_report_template(
        company_id=company_id,
        template_id=template_id,
        template_data=template_update
    )
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report template not found"
        )
    return template

@router.delete("/templates/{template_id}")
async def delete_report_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    _: bool = Depends(check_permissions([REPORTS_CUSTOM_EDIT]))
):
    """Delete a report template"""
    company_id = get_current_tenant_id()
    repo = ReportingRepository(db)
    
    success = repo.delete_report_template(company_id, template_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report template not found"
        )
    return {"message": "Report template deleted successfully"}

# Report Schedules
@router.post("/schedules", response_model=ReportSchedule)
async def create_report_schedule(
    schedule: ReportScheduleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    _: bool = Depends(check_permissions([REPORTS_SCHEDULE_MANAGE]))
):
    """Create a new report schedule"""
    company_id = get_current_tenant_id()
    repo = ReportingRepository(db)
    
    try:
        db_schedule = repo.create_report_schedule(
            company_id=company_id,
            schedule_data=schedule
        )
        return db_schedule
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating report schedule: {str(e)}"
        )

@router.get("/schedules", response_model=List[ReportSchedule])
async def get_report_schedules(
    template_id: Optional[int] = None,
    is_active: Optional[bool] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    _: bool = Depends(check_permissions([REPORTS_SCHEDULE_MANAGE]))
):
    """Get report schedules"""
    company_id = get_current_tenant_id()
    repo = ReportingRepository(db)
    
    schedules = repo.get_report_schedules(
        company_id=company_id,
        template_id=template_id,
        is_active=is_active,
        skip=skip,
        limit=limit
    )
    return schedules

@router.put("/schedules/{schedule_id}", response_model=ReportSchedule)
async def update_report_schedule(
    schedule_id: int,
    schedule_update: ReportScheduleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    _: bool = Depends(check_permissions([REPORTS_SCHEDULE_MANAGE]))
):
    """Update a report schedule"""
    company_id = get_current_tenant_id()
    repo = ReportingRepository(db)
    
    schedule = repo.update_report_schedule(
        company_id=company_id,
        schedule_id=schedule_id,
        schedule_data=schedule_update
    )
    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report schedule not found"
        )
    return schedule

# Generated Reports
@router.get("/generated", response_model=List[GeneratedReport])
async def get_generated_reports(
    report_type: Optional[ReportTypeEnum] = None,
    template_id: Optional[int] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    _: bool = Depends(check_permissions([REPORTS_FINANCIAL_VIEW]))
):
    """Get generated reports history"""
    company_id = get_current_tenant_id()
    repo = ReportingRepository(db)
    
    reports = repo.get_generated_reports(
        company_id=company_id,
        report_type=report_type,
        template_id=template_id,
        user_id=current_user.id,
        start_date=start_date,
        end_date=end_date,
        skip=skip,
        limit=limit
    )
    return reports

@router.post("/export", response_model=Dict[str, Any])
async def export_report(
    export_request: ExportRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
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

# Financial Reporting Periods
@router.post("/periods", response_model=FinancialReportingPeriod)
async def create_financial_period(
    period: FinancialReportingPeriodCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    _: bool = Depends(check_permissions([REPORTS_FINANCIAL_VIEW]))
):
    """Create a new financial reporting period"""
    company_id = get_current_tenant_id()
    repo = ReportingRepository(db)
    
    try:
        db_period = repo.create_financial_period(
            company_id=company_id,
            period_data=period
        )
        return db_period
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating financial period: {str(e)}"
        )

@router.get("/periods", response_model=List[FinancialReportingPeriod])
async def get_financial_periods(
    period_type: Optional[str] = None,
    is_closed: Optional[bool] = None,
    year: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    _: bool = Depends(check_permissions([REPORTS_FINANCIAL_VIEW]))
):
    """Get financial reporting periods"""
    company_id = get_current_tenant_id()
    repo = ReportingRepository(db)
    
    periods = repo.get_financial_periods(
        company_id=company_id,
        period_type=period_type,
        is_closed=is_closed,
        year=year,
        skip=skip,
        limit=limit
    )
    return periods
