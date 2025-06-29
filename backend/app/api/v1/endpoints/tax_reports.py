from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import date
from app.database.database import get_db
from app.core.permissions import PermissionChecker, GL_REPORTS_VIEW
from app.crud.tax_reports import TaxReportService
from app import models

router = APIRouter()

@router.get("/tax-summary")
def get_tax_summary(
    start_date: date = Query(...),
    end_date: date = Query(...),
    current_user: models.User = Depends(PermissionChecker([GL_REPORTS_VIEW])),
    db: Session = Depends(get_db)
):
    """Generate tax summary report showing input/output taxes"""
    return TaxReportService.get_tax_summary_report(
        db, current_user.company_id, start_date, end_date
    )

@router.get("/tax-detailed")
def get_detailed_tax_report(
    start_date: date = Query(...),
    end_date: date = Query(...),
    tax_type_id: int = Query(None),
    current_user: models.User = Depends(PermissionChecker([GL_REPORTS_VIEW])),
    db: Session = Depends(get_db)
):
    """Generate detailed tax report showing all transactions with tax"""
    return TaxReportService.get_detailed_tax_report(
        db, current_user.company_id, start_date, end_date, tax_type_id
    )

@router.get("/tax-return")
def get_tax_return_data(
    start_date: date = Query(...),
    end_date: date = Query(...),
    current_user: models.User = Depends(PermissionChecker([GL_REPORTS_VIEW])),
    db: Session = Depends(get_db)
):
    """Generate tax return data for filing with tax authorities"""
    return TaxReportService.get_tax_return_data(
        db, current_user.company_id, start_date, end_date
    )

@router.get("/tax-multi-currency")
def get_multi_currency_tax_report(
    start_date: date = Query(...),
    end_date: date = Query(...),
    current_user: models.User = Depends(PermissionChecker([GL_REPORTS_VIEW])),
    db: Session = Depends(get_db)
):
    """Generate tax report showing taxes in multiple currencies"""
    return TaxReportService.get_multi_currency_tax_report(
        db, current_user.company_id, start_date, end_date
    )
