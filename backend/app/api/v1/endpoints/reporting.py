from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from app.database.database import get_db
from app.core.permissions import (
    PermissionChecker, 
    REPORTING_FINANCIAL_STATEMENTS_VIEW,
    REPORTING_GL_ADVANCED_VIEW,
    REPORTING_AR_AGING_VIEW,
    REPORTING_AP_AGING_VIEW,
    REPORTING_TEMPLATES_MANAGE,
    REPORTING_BANK_RECONCILIATION_MANAGE
)
from app.crud import reporting
from app import schemas, models
from app.core.security import get_current_active_user

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
