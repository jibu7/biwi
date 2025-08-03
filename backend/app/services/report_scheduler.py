# app/services/report_scheduler.py
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Optional
import asyncio
from app import models
from app.schemas.reporting import ReportScheduleCreate
from app.services.financial_reports import FinancialReportService
from app.services.report_export import ReportExportService
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email.mime.text import MIMEText
from email import encoders
import os

class ReportScheduler:
    def __init__(self, db: Session):
        self.db = db
        self.export_service = ReportExportService()
    
    def create_schedule(self, schedule: ReportScheduleCreate, company_id: int) -> models.ReportSchedule:
        """Create a new report schedule"""
        db_schedule = models.ReportSchedule(
            company_id=company_id,
            template_id=schedule.template_id,
            frequency=schedule.frequency,
            schedule_config=schedule.schedule_config,
            recipient_emails=schedule.recipient_emails,
            export_formats=schedule.export_formats,
            is_active=schedule.is_active,
            next_run_at=self._calculate_next_run(schedule.frequency, schedule.schedule_config)
        )
        
        self.db.add(db_schedule)
        self.db.commit()
        self.db.refresh(db_schedule)
        return db_schedule
    
    def run_scheduled_reports(self) -> List[dict]:
        """Run all due scheduled reports"""
        current_time = datetime.utcnow()
        
        # Get all due schedules
        due_schedules = self.db.query(models.ReportSchedule).filter(
            models.ReportSchedule.is_active == True,
            models.ReportSchedule.next_run_at <= current_time
        ).all()
        
        results = []
        for schedule in due_schedules:
            try:
                result = self._execute_scheduled_report(schedule)
                results.append(result)
                
                # Update schedule
                schedule.last_run_at = current_time
                schedule.next_run_at = self._calculate_next_run(
                    schedule.frequency, 
                    schedule.schedule_config
                )
                self.db.commit()
                
            except Exception as e:
                results.append({
                    "schedule_id": schedule.id,
                    "status": "failed",
                    "error": str(e)
                })
        
        return results
    
    def _execute_scheduled_report(self, schedule: models.ReportSchedule) -> dict:
        """Execute a single scheduled report"""
        # Get report template
        template = self.db.query(models.ReportTemplate).filter(
            models.ReportTemplate.id == schedule.template_id
        ).first()
        
        if not template:
            raise ValueError(f"Template {schedule.template_id} not found")
        
        # Generate report based on template type
        report_service = FinancialReportService(self.db, schedule.company_id)
        
        report_data = None
        if template.report_type == models.ReportType.BALANCE_SHEET:
            report_data = report_service.generate_balance_sheet(
                template.configuration
            )
        elif template.report_type == models.ReportType.INCOME_STATEMENT:
            report_data = report_service.generate_income_statement(
                template.configuration
            )
        # ... handle other report types
        
        if not report_data:
            raise ValueError(f"Unable to generate report for type {template.report_type}")
        
        # Export in requested formats
        exported_files = []
        for format in schedule.export_formats:
            if format == "pdf":
                file_data = self.export_service.export_to_pdf(
                    report_data, 
                    template.report_type.value
                )
            elif format == "excel":
                file_data = self.export_service.export_to_excel(
                    report_data,
                    template.report_type.value
                )
            elif format == "csv":
                file_data = self.export_service.export_to_csv(report_data)
            else:
                continue
            
            # Save to storage
            file_path = self._save_report_file(
                file_data,
                template.name,
                format,
                schedule.company_id
            )
            exported_files.append({
                "format": format,
                "path": file_path
            })
        
        # Send email if configured
        if schedule.recipient_emails:
            self._send_report_email(
                schedule.recipient_emails,
                template.name,
                exported_files
            )
        
        # Save generated report record
        generated_report = models.GeneratedReport(
            company_id=schedule.company_id,
            template_id=template.id,
            report_type=template.report_type,
            report_name=template.name,
            parameters=template.configuration,
            generated_at=datetime.utcnow(),
            format=",".join(schedule.export_formats)
        )
        self.db.add(generated_report)
        self.db.commit()
        
        return {
            "schedule_id": schedule.id,
            "status": "success",
            "files": exported_files,
            "emails_sent": len(schedule.recipient_emails) if schedule.recipient_emails else 0
        }
    
    def _calculate_next_run(self, frequency: str, config: dict) -> datetime:
        """Calculate next run time based on frequency"""
        now = datetime.utcnow()
        
        if frequency == "daily":
            hour = config.get("hour", 0)
            minute = config.get("minute", 0)
            next_run = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
            if next_run <= now:
                next_run += timedelta(days=1)
                
        elif frequency == "weekly":
            day_of_week = config.get("day_of_week", 0)  # 0 = Monday
            hour = config.get("hour", 0)
            days_ahead = day_of_week - now.weekday()
            if days_ahead <= 0:
                days_ahead += 7
            next_run = now + timedelta(days=days_ahead)
            next_run = next_run.replace(hour=hour, minute=0, second=0, microsecond=0)
            
        elif frequency == "monthly":
            day = config.get("day", 1)
            hour = config.get("hour", 0)
            next_run = now.replace(day=day, hour=hour, minute=0, second=0, microsecond=0)
            if next_run <= now:
                # Move to next month
                if now.month == 12:
                    next_run = next_run.replace(year=now.year + 1, month=1)
                else:
                    next_run = next_run.replace(month=now.month + 1)
                    
        else:  # on_demand or unknown
            next_run = now + timedelta(days=365)  # Far future
        
        return next_run
    
    def _save_report_file(self, file_data: bytes, report_name: str, format: str, company_id: int) -> str:
        """Save report file to storage"""
        # For production, use S3 or similar. For now, local storage
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        filename = f"{report_name}_{timestamp}.{format}"
        
        # Create directory if not exists
        directory = f"reports/{company_id}"
        os.makedirs(directory, exist_ok=True)
        
        file_path = f"{directory}/{filename}"
        with open(file_path, 'wb') as f:
            f.write(file_data)
        
        return file_path
    
    def _send_report_email(self, recipients: List[str], report_name: str, files: List[dict]):
        """Send report via email"""
        # Email configuration from settings
        smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        smtp_port = int(os.getenv("SMTP_PORT", "587"))
        smtp_user = os.getenv("SMTP_USER")
        smtp_password = os.getenv("SMTP_PASSWORD")
        
        if not smtp_user or not smtp_password:
            return  # Skip email if not configured
        
        msg = MIMEMultipart()
        msg['From'] = smtp_user
        msg['To'] = ', '.join(recipients)
        msg['Subject'] = f"Scheduled Report: {report_name}"
        
        body = f"""
        Dear User,
        
        Please find attached your scheduled report: {report_name}
        Generated at: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC
        
        Best regards,
        Vinea ERP System
        """
        
        msg.attach(MIMEText(body, 'plain'))
        
        # Attach files
        for file_info in files:
            with open(file_info['path'], 'rb') as f:
                part = MIMEBase('application', 'octet-stream')
                part.set_payload(f.read())
                encoders.encode_base64(part)
                part.add_header(
                    'Content-Disposition',
                    f'attachment; filename= {os.path.basename(file_info["path"])}'
                )
                msg.attach(part)
        
        # Send email
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.send_message(msg)
