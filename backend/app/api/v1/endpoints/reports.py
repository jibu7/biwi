# app/api/v1/endpoints/reports.py
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Response
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime
from app.database.database import get_db
from app.core.security import get_current_active_user
from app.core.permissions import PermissionChecker, REPORTS_FINANCIAL_VIEW, REPORTS_FINANCIAL_EXPORT, REPORTS_CUSTOM_CREATE, REPORTS_SCHEDULE_MANAGE
from app import models, schemas
from app.schemas.reporting import (
    BalanceSheetRequest, IncomeStatementRequest, CashFlowRequest,
    CustomReportBuilder, ReportScheduleCreate, ExportRequest
)
from app.services.financial_reports import FinancialReportService
from app.services.custom_reports import CustomReportService
from app.services.report_export import ReportExportService
from app.services.report_scheduler import ReportScheduler

router = APIRouter()

@router.post("/balance-sheet")
async def generate_balance_sheet(
    request: BalanceSheetRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([REPORTS_FINANCIAL_VIEW]))
):
    """Generate Balance Sheet report"""
    service = FinancialReportService(db, current_user.company_id)
    return service.generate_balance_sheet(request)

@router.post("/income-statement")
async def generate_income_statement(
    request: IncomeStatementRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([REPORTS_FINANCIAL_VIEW]))
):
    """Generate Income Statement (P&L) report"""
    service = FinancialReportService(db, current_user.company_id)
    return service.generate_income_statement(request)

@router.post("/cash-flow")
async def generate_cash_flow(
    request: CashFlowRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([REPORTS_FINANCIAL_VIEW]))
):
    """Generate Cash Flow Statement"""
    service = FinancialReportService(db, current_user.company_id)
    return service.generate_cash_flow_statement(request)

@router.post("/custom")
async def build_custom_report(
    builder: CustomReportBuilder,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([REPORTS_CUSTOM_CREATE]))
):
    """Build a custom report"""
    service = CustomReportService(db, current_user.company_id)
    return service.build_custom_report(builder)

@router.post("/export")
async def export_report(
    request: ExportRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([REPORTS_FINANCIAL_EXPORT]))
):
    """Export report in various formats"""
    export_service = ReportExportService()
    
    # Generate report data
    if request.report_type == "balance_sheet":
        service = FinancialReportService(db, current_user.company_id)
        report_data = service.generate_balance_sheet(
            BalanceSheetRequest(**request.parameters)
        )
    elif request.report_type == "income_statement":
        service = FinancialReportService(db, current_user.company_id)
        report_data = service.generate_income_statement(
            IncomeStatementRequest(**request.parameters)
        )
    # ... handle other report types
    
    # Export to requested format
    if request.format == "pdf":
        file_data = export_service.export_to_pdf(report_data, request.report_type)
        media_type = "application/pdf"
        filename = f"{request.report_type}_{datetime.now().strftime('%Y%m%d')}.pdf"
    elif request.format == "excel":
        file_data = export_service.export_to_excel(report_data, request.report_type)
        media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        filename = f"{request.report_type}_{datetime.now().strftime('%Y%m%d')}.xlsx"
    elif request.format == "csv":
        file_data = export_service.export_to_csv(report_data)
        media_type = "text/csv"
        filename = f"{request.report_type}_{datetime.now().strftime('%Y%m%d')}.csv"
    elif request.format == "json":
        file_data = export_service.export_to_json(report_data)
        media_type = "application/json"
        filename = f"{request.report_type}_{datetime.now().strftime('%Y%m%d')}.json"
    else:
        raise HTTPException(status_code=400, detail="Invalid export format")
    
    # Save generated report record
    generated_report = models.GeneratedReport(
        company_id=current_user.company_id,
        report_type=request.report_type,
        report_name=request.report_type.replace("_", " ").title(),
        parameters=request.parameters,
        format=request.format,
        generated_at=datetime.utcnow(),
        generated_by_user_id=current_user.id,
        file_size=len(file_data)
    )
    db.add(generated_report)
    db.commit()
    
    return Response(
        content=file_data,
        media_type=media_type,
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )

@router.get("/templates")
async def list_report_templates(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([REPORTS_FINANCIAL_VIEW]))
):
    """List available report templates"""
    templates = db.query(models.ReportTemplate).filter(
        models.ReportTemplate.company_id == current_user.company_id,
        models.ReportTemplate.is_active == True
    ).all()
    return templates

@router.post("/templates")
async def create_report_template(
    template: dict,  # Define proper schema
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([REPORTS_CUSTOM_CREATE]))
):
    """Create a custom report template"""
    db_template = models.ReportTemplate(
        company_id=current_user.company_id,
        name=template["name"],
        report_type=template["report_type"],
        configuration=template["configuration"],
        is_system=False,
        created_by_user_id=current_user.id,
        is_active=True
    )
    db.add(db_template)
    db.commit()
    db.refresh(db_template)
    return db_template

@router.post("/schedules")
async def create_report_schedule(
    schedule: ReportScheduleCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([REPORTS_SCHEDULE_MANAGE]))
):
    """Create a report schedule"""
    scheduler = ReportScheduler(db)
    return scheduler.create_schedule(schedule, current_user.company_id)

@router.get("/schedules")
async def list_report_schedules(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([REPORTS_SCHEDULE_MANAGE]))
):
    """List report schedules"""
    schedules = db.query(models.ReportSchedule).filter(
        models.ReportSchedule.company_id == current_user.company_id
    ).all()
    return schedules

@router.post("/schedules/run")
async def run_scheduled_reports(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([REPORTS_SCHEDULE_MANAGE]))
):
    """Manually trigger scheduled reports"""
    scheduler = ReportScheduler(db)
    background_tasks.add_task(scheduler.run_scheduled_reports)
    return {"message": "Report generation started in background"}

@router.get("/history")
async def get_report_history(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(PermissionChecker([REPORTS_FINANCIAL_VIEW]))
):
    """Get history of generated reports"""
    reports = db.query(models.GeneratedReport).filter(
        models.GeneratedReport.company_id == current_user.company_id
    ).order_by(models.GeneratedReport.generated_at.desc()).limit(limit).all()
    return reports
