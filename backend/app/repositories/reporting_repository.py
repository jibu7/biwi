# app/repositories/reporting_repository.py
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, func
from datetime import datetime, date

from app.models.reporting import (
    ReportTemplate, ReportSchedule, GeneratedReport, 
    FinancialReportingPeriod, ReportType, ReportFrequency
)
from app.schemas.reporting import (
    ReportTemplateCreate, ReportTemplateUpdate,
    ReportScheduleCreate, ReportScheduleUpdate,
    GeneratedReportCreate, FinancialReportingPeriodCreate,
    FinancialReportingPeriodUpdate
)

class ReportingRepository:
    def __init__(self, db: Session):
        self.db = db
    
    # Report Templates
    def create_report_template(
        self, 
        company_id: int,
        template_data: ReportTemplateCreate,
        created_by_user_id: int
    ) -> ReportTemplate:
        """Create a new report template"""
        db_template = ReportTemplate(
            company_id=company_id,
            name=template_data.name,
            report_type=template_data.report_type,
            configuration=template_data.configuration,
            is_system=template_data.is_system,
            is_active=template_data.is_active,
            created_by_user_id=created_by_user_id
        )
        
        self.db.add(db_template)
        self.db.commit()
        self.db.refresh(db_template)
        return db_template
    
    def get_report_template(self, company_id: int, template_id: int) -> Optional[ReportTemplate]:
        """Get a specific report template"""
        return self.db.query(ReportTemplate).filter(
            and_(
                ReportTemplate.id == template_id,
                ReportTemplate.company_id == company_id
            )
        ).first()
    
    def get_report_templates(
        self, 
        company_id: int,
        report_type: Optional[ReportType] = None,
        is_active: Optional[bool] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[ReportTemplate]:
        """Get report templates with optional filtering"""
        query = self.db.query(ReportTemplate).filter(
            ReportTemplate.company_id == company_id
        )
        
        if report_type:
            query = query.filter(ReportTemplate.report_type == report_type)
        
        if is_active is not None:
            query = query.filter(ReportTemplate.is_active == is_active)
        
        return query.offset(skip).limit(limit).all()
    
    def update_report_template(
        self,
        company_id: int,
        template_id: int,
        template_data: ReportTemplateUpdate
    ) -> Optional[ReportTemplate]:
        """Update an existing report template"""
        db_template = self.get_report_template(company_id, template_id)
        if not db_template:
            return None
        
        update_data = template_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_template, field, value)
        
        self.db.commit()
        self.db.refresh(db_template)
        return db_template
    
    def delete_report_template(self, company_id: int, template_id: int) -> bool:
        """Delete a report template (soft delete by marking inactive)"""
        db_template = self.get_report_template(company_id, template_id)
        if not db_template:
            return False
        
        db_template.is_active = False
        self.db.commit()
        return True
    
    # Report Schedules
    def create_report_schedule(
        self, 
        company_id: int,
        schedule_data: ReportScheduleCreate
    ) -> ReportSchedule:
        """Create a new report schedule"""
        db_schedule = ReportSchedule(
            company_id=company_id,
            template_id=schedule_data.template_id,
            frequency=schedule_data.frequency,
            schedule_config=schedule_data.schedule_config,
            recipient_emails=schedule_data.recipient_emails,
            export_formats=schedule_data.export_formats,
            is_active=schedule_data.is_active
        )
        
        self.db.add(db_schedule)
        self.db.commit()
        self.db.refresh(db_schedule)
        return db_schedule
    
    def get_report_schedule(self, company_id: int, schedule_id: int) -> Optional[ReportSchedule]:
        """Get a specific report schedule"""
        return self.db.query(ReportSchedule).filter(
            and_(
                ReportSchedule.id == schedule_id,
                ReportSchedule.company_id == company_id
            )
        ).first()
    
    def get_report_schedules(
        self,
        company_id: int,
        template_id: Optional[int] = None,
        is_active: Optional[bool] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[ReportSchedule]:
        """Get report schedules with optional filtering"""
        query = self.db.query(ReportSchedule).filter(
            ReportSchedule.company_id == company_id
        )
        
        if template_id:
            query = query.filter(ReportSchedule.template_id == template_id)
        
        if is_active is not None:
            query = query.filter(ReportSchedule.is_active == is_active)
        
        return query.order_by(desc(ReportSchedule.next_run_at)).offset(skip).limit(limit).all()
    
    def update_report_schedule(
        self,
        company_id: int,
        schedule_id: int,
        schedule_data: ReportScheduleUpdate
    ) -> Optional[ReportSchedule]:
        """Update an existing report schedule"""
        db_schedule = self.get_report_schedule(company_id, schedule_id)
        if not db_schedule:
            return None
        
        update_data = schedule_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_schedule, field, value)
        
        self.db.commit()
        self.db.refresh(db_schedule)
        return db_schedule
    
    def get_due_schedules(self, cutoff_time: datetime) -> List[ReportSchedule]:
        """Get schedules that are due to run"""
        return self.db.query(ReportSchedule).filter(
            and_(
                ReportSchedule.is_active == True,
                ReportSchedule.next_run_at <= cutoff_time
            )
        ).all()
    
    def update_schedule_run_times(
        self,
        schedule_id: int,
        last_run_at: datetime,
        next_run_at: datetime
    ) -> None:
        """Update schedule run times after execution"""
        schedule = self.db.query(ReportSchedule).filter(
            ReportSchedule.id == schedule_id
        ).first()
        
        if schedule:
            schedule.last_run_at = last_run_at
            schedule.next_run_at = next_run_at
            self.db.commit()
    
    # Generated Reports
    def create_generated_report(
        self,
        company_id: int,
        report_data: GeneratedReportCreate
    ) -> GeneratedReport:
        """Create a record of a generated report"""
        db_report = GeneratedReport(
            company_id=company_id,
            template_id=report_data.template_id,
            report_type=report_data.report_type,
            report_name=report_data.report_name,
            parameters=report_data.parameters,
            file_path=report_data.file_path,
            format=report_data.format,
            generated_at=datetime.utcnow(),
            generated_by_user_id=report_data.generated_by_user_id,
            file_size=report_data.file_size
        )
        
        self.db.add(db_report)
        self.db.commit()
        self.db.refresh(db_report)
        return db_report
    
    def get_generated_report(self, company_id: int, report_id: int) -> Optional[GeneratedReport]:
        """Get a specific generated report"""
        return self.db.query(GeneratedReport).filter(
            and_(
                GeneratedReport.id == report_id,
                GeneratedReport.company_id == company_id
            )
        ).first()
    
    def get_generated_reports(
        self,
        company_id: int,
        report_type: Optional[ReportType] = None,
        template_id: Optional[int] = None,
        user_id: Optional[int] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[GeneratedReport]:
        """Get generated reports with optional filtering"""
        query = self.db.query(GeneratedReport).filter(
            GeneratedReport.company_id == company_id
        )
        
        if report_type:
            query = query.filter(GeneratedReport.report_type == report_type)
        
        if template_id:
            query = query.filter(GeneratedReport.template_id == template_id)
        
        if user_id:
            query = query.filter(GeneratedReport.generated_by_user_id == user_id)
        
        if start_date:
            query = query.filter(GeneratedReport.generated_at >= start_date)
        
        if end_date:
            query = query.filter(GeneratedReport.generated_at <= end_date)
        
        return query.order_by(desc(GeneratedReport.generated_at)).offset(skip).limit(limit).all()
    
    def delete_generated_report(self, company_id: int, report_id: int) -> bool:
        """Delete a generated report record"""
        db_report = self.get_generated_report(company_id, report_id)
        if not db_report:
            return False
        
        self.db.delete(db_report)
        self.db.commit()
        return True
    
    # Financial Reporting Periods
    def create_financial_period(
        self,
        company_id: int,
        period_data: FinancialReportingPeriodCreate
    ) -> FinancialReportingPeriod:
        """Create a new financial reporting period"""
        db_period = FinancialReportingPeriod(
            company_id=company_id,
            period_type=period_data.period_type,
            period_name=period_data.period_name,
            start_date=period_data.start_date,
            end_date=period_data.end_date,
            is_closed=period_data.is_closed,
            closing_entries_posted=period_data.closing_entries_posted
        )
        
        self.db.add(db_period)
        self.db.commit()
        self.db.refresh(db_period)
        return db_period
    
    def get_financial_period(self, company_id: int, period_id: int) -> Optional[FinancialReportingPeriod]:
        """Get a specific financial reporting period"""
        return self.db.query(FinancialReportingPeriod).filter(
            and_(
                FinancialReportingPeriod.id == period_id,
                FinancialReportingPeriod.company_id == company_id
            )
        ).first()
    
    def get_financial_periods(
        self,
        company_id: int,
        period_type: Optional[str] = None,
        is_closed: Optional[bool] = None,
        year: Optional[int] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[FinancialReportingPeriod]:
        """Get financial reporting periods with optional filtering"""
        query = self.db.query(FinancialReportingPeriod).filter(
            FinancialReportingPeriod.company_id == company_id
        )
        
        if period_type:
            query = query.filter(FinancialReportingPeriod.period_type == period_type)
        
        if is_closed is not None:
            query = query.filter(FinancialReportingPeriod.is_closed == is_closed)
        
        if year:
            query = query.filter(
                func.extract('year', FinancialReportingPeriod.start_date) == year
            )
        
        return query.order_by(desc(FinancialReportingPeriod.start_date)).offset(skip).limit(limit).all()
    
    def update_financial_period(
        self,
        company_id: int,
        period_id: int,
        period_data: FinancialReportingPeriodUpdate
    ) -> Optional[FinancialReportingPeriod]:
        """Update an existing financial reporting period"""
        db_period = self.get_financial_period(company_id, period_id)
        if not db_period:
            return None
        
        update_data = period_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_period, field, value)
        
        self.db.commit()
        self.db.refresh(db_period)
        return db_period
    
    def get_current_period(self, company_id: int, as_of_date: date) -> Optional[FinancialReportingPeriod]:
        """Get the current financial period for a given date"""
        return self.db.query(FinancialReportingPeriod).filter(
            and_(
                FinancialReportingPeriod.company_id == company_id,
                FinancialReportingPeriod.start_date <= as_of_date,
                FinancialReportingPeriod.end_date >= as_of_date
            )
        ).first()
    
    def get_system_report_templates(self, company_id: int) -> List[ReportTemplate]:
        """Get all system-defined report templates for a company"""
        return self.db.query(ReportTemplate).filter(
            and_(
                ReportTemplate.company_id == company_id,
                ReportTemplate.is_system == True,
                ReportTemplate.is_active == True
            )
        ).all()
    
    def get_custom_report_templates(self, company_id: int) -> List[ReportTemplate]:
        """Get all custom report templates for a company"""
        return self.db.query(ReportTemplate).filter(
            and_(
                ReportTemplate.company_id == company_id,
                ReportTemplate.is_system == False,
                ReportTemplate.is_active == True
            )
        ).all()
