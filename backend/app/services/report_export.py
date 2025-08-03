# app/services/report_export.py
import io
import json
from typing import Dict, Any
from datetime import datetime
import pandas as pd
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
import xlsxwriter

class ReportExportService:
    def __init__(self):
        self.styles = getSampleStyleSheet()
    
    def export_to_pdf(self, report_data: Dict[str, Any], report_type: str) -> bytes:
        """Export report to PDF format"""
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        story = []
        
        # Add title
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1a1a1a'),
            spaceAfter=30,
            alignment=1  # Center
        )
        
        title_text = self._get_report_title(report_type)
        story.append(Paragraph(title_text, title_style))
        story.append(Spacer(1, 0.2*inch))
        
        # Add company info
        if 'company_name' in report_data:
            story.append(Paragraph(report_data['company_name'], self.styles['Heading2']))
        
        # Add report period
        if 'period_start' in report_data:
            period_text = f"Period: {report_data['period_start']} to {report_data['period_end']}"
            story.append(Paragraph(period_text, self.styles['Normal']))
        elif 'as_of_date' in report_data:
            story.append(Paragraph(f"As of: {report_data['as_of_date']}", self.styles['Normal']))
        
        story.append(Spacer(1, 0.3*inch))
        
        # Generate content based on report type
        if report_type == "balance_sheet":
            self._add_balance_sheet_to_pdf(story, report_data)
        elif report_type == "income_statement":
            self._add_income_statement_to_pdf(story, report_data)
        elif report_type == "cash_flow":
            self._add_cash_flow_to_pdf(story, report_data)
        else:
            self._add_generic_data_to_pdf(story, report_data)
        
        doc.build(story)
        buffer.seek(0)
        return buffer.read()
    
    def export_to_excel(self, report_data: Dict[str, Any], report_type: str) -> bytes:
        """Export report to Excel format"""
        buffer = io.BytesIO()
        
        with pd.ExcelWriter(buffer, engine='xlsxwriter') as writer:
            workbook = writer.book
            
            # Define formats
            header_format = workbook.add_format({
                'bold': True,
                'bg_color': '#4472C4',
                'font_color': 'white',
                'border': 1
            })
            
            currency_format = workbook.add_format({
                'num_format': '$#,##0.00',
                'border': 1
            })
            
            # Create sheets based on report type
            if report_type == "balance_sheet":
                self._create_balance_sheet_excel(writer, report_data, header_format, currency_format)
            elif report_type == "income_statement":
                self._create_income_statement_excel(writer, report_data, header_format, currency_format)
            elif report_type == "cash_flow":
                self._create_cash_flow_excel(writer, report_data, header_format, currency_format)
            else:
                # Generic data export
                if 'data' in report_data and report_data['data']:
                    df = pd.DataFrame(report_data['data'])
                    df.to_excel(writer, sheet_name='Report', index=False)
                    
                    # Apply formatting
                    worksheet = writer.sheets['Report']
                    for idx, col in enumerate(df.columns):
                        worksheet.write(0, idx, col, header_format)
        
        buffer.seek(0)
        return buffer.read()
    
    def export_to_csv(self, report_data: Dict[str, Any]) -> bytes:
        """Export report to CSV format"""
        if 'data' in report_data:
            df = pd.DataFrame(report_data['data'])
            buffer = io.StringIO()
            df.to_csv(buffer, index=False)
            return buffer.getvalue().encode('utf-8')
        
        # For structured reports, flatten the data
        flattened_data = self._flatten_report_data(report_data)
        df = pd.DataFrame(flattened_data)
        buffer = io.StringIO()
        df.to_csv(buffer, index=False)
        return buffer.getvalue().encode('utf-8')
    
    def export_to_json(self, report_data: Dict[str, Any]) -> bytes:
        """Export report to JSON format"""
        return json.dumps(report_data, indent=2, default=str).encode('utf-8')
    
    def _get_report_title(self, report_type: str) -> str:
        """Get formatted report title"""
        titles = {
            "balance_sheet": "Balance Sheet",
            "income_statement": "Income Statement",
            "cash_flow": "Cash Flow Statement",
            "trial_balance": "Trial Balance",
            "ar_aging": "Accounts Receivable Aging",
            "ap_aging": "Accounts Payable Aging",
            "custom": "Custom Report"
        }
        return titles.get(report_type, "Financial Report")
    
    def _add_balance_sheet_to_pdf(self, story: list, data: Dict):
        """Add balance sheet content to PDF"""
        # Assets section
        story.append(Paragraph("<b>ASSETS</b>", self.styles['Heading2']))
        
        # Current Assets
        if 'assets' in data and 'current_assets' in data['assets']:
            story.append(Paragraph("Current Assets", self.styles['Heading3']))
            asset_data = [['Account', 'Amount']]
            for account, amount in data['assets']['current_assets'].items():
                asset_data.append([account, f"${amount:,.2f}"])
            asset_data.append(['Total Current Assets', f"${sum(data['assets']['current_assets'].values()):,.2f}"])
            
            table = Table(asset_data, colWidths=[4*inch, 2*inch])
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
            ]))
            story.append(table)
            story.append(Spacer(1, 0.2*inch))
        
        # Similar sections for Fixed Assets, Liabilities, and Equity...
    
    def _add_income_statement_to_pdf(self, story: list, data: Dict):
        """Add income statement content to PDF"""
        story.append(Paragraph("<b>REVENUE</b>", self.styles['Heading2']))
        
        revenue_data = [['Category', 'Amount', 'Percentage']]
        if 'revenue' in data:
            total_revenue = data['revenue'].get('total_revenue', 0)
            for category, amount in data['revenue'].items():
                if category != 'total_revenue':
                    percentage = (amount / total_revenue * 100) if total_revenue > 0 else 0
                    revenue_data.append([category.replace('_', ' ').title(), f"${amount:,.2f}", f"{percentage:.1f}%"])
        
        # Add table with styling
        table = Table(revenue_data, colWidths=[3*inch, 2*inch, 1.5*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('ALIGN', (1, 0), (2, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        story.append(table)
    
    def _add_cash_flow_to_pdf(self, story: list, data: Dict):
        """Add cash flow content to PDF"""
        story.append(Paragraph("<b>CASH FLOW STATEMENT</b>", self.styles['Heading2']))
        
        # Operating Activities
        if 'operating_activities' in data:
            story.append(Paragraph("Operating Activities", self.styles['Heading3']))
            operating_data = [['Description', 'Amount']]
            operating_data.append(['Net Income', f"${data['operating_activities'].get('net_income', 0):,.2f}"])
            operating_data.append(['Net Cash from Operating', f"${data['operating_activities'].get('net_cash_from_operating', 0):,.2f}"])
            
            table = Table(operating_data, colWidths=[4*inch, 2*inch])
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ]))
            story.append(table)
    
    def _add_generic_data_to_pdf(self, story: list, data: Dict):
        """Add generic report data to PDF"""
        if 'data' in data and isinstance(data['data'], list) and data['data']:
            # Convert list of dicts to table
            if isinstance(data['data'][0], dict):
                headers = list(data['data'][0].keys())
                table_data = [headers]
                for row in data['data']:
                    table_data.append([str(row.get(header, '')) for header in headers])
                
                table = Table(table_data)
                table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ]))
                story.append(table)
    
    def _create_balance_sheet_excel(self, writer, data: Dict, header_format, currency_format):
        """Create balance sheet in Excel"""
        worksheet = writer.book.add_worksheet('Balance Sheet')
        
        row = 0
        worksheet.write(row, 0, 'BALANCE SHEET', header_format)
        worksheet.write(row, 1, f"As of {data.get('as_of_date', '')}", header_format)
        
        row += 2
        worksheet.write(row, 0, 'ASSETS', header_format)
        row += 1
        
        # Write current assets
        if 'assets' in data and 'current_assets' in data['assets']:
            worksheet.write(row, 0, 'Current Assets')
            row += 1
            for account, amount in data['assets']['current_assets'].items():
                worksheet.write(row, 0, account)
                worksheet.write(row, 1, amount, currency_format)
                row += 1
        
        # Continue with other sections...
    
    def _create_income_statement_excel(self, writer, data: Dict, header_format, currency_format):
        """Create income statement in Excel"""
        worksheet = writer.book.add_worksheet('Income Statement')
        
        row = 0
        worksheet.write(row, 0, 'INCOME STATEMENT', header_format)
        worksheet.write(row, 1, f"Period: {data.get('period_start', '')} to {data.get('period_end', '')}", header_format)
        
        row += 2
        worksheet.write(row, 0, 'REVENUE', header_format)
        row += 1
        
        if 'revenue' in data:
            for category, amount in data['revenue'].items():
                if category != 'total_revenue':
                    worksheet.write(row, 0, category.replace('_', ' ').title())
                    worksheet.write(row, 1, amount, currency_format)
                    row += 1
    
    def _create_cash_flow_excel(self, writer, data: Dict, header_format, currency_format):
        """Create cash flow statement in Excel"""
        worksheet = writer.book.add_worksheet('Cash Flow')
        
        row = 0
        worksheet.write(row, 0, 'CASH FLOW STATEMENT', header_format)
        worksheet.write(row, 1, f"Period: {data.get('period_start', '')} to {data.get('period_end', '')}", header_format)
        
        row += 2
        worksheet.write(row, 0, 'OPERATING ACTIVITIES', header_format)
        row += 1
        
        if 'operating_activities' in data:
            operating = data['operating_activities']
            worksheet.write(row, 0, 'Net Income')
            worksheet.write(row, 1, operating.get('net_income', 0), currency_format)
            row += 1
            worksheet.write(row, 0, 'Net Cash from Operating')
            worksheet.write(row, 1, operating.get('net_cash_from_operating', 0), currency_format)
    
    def _flatten_report_data(self, data: Dict, prefix: str = '') -> list:
        """Flatten nested dictionary for CSV export"""
        result = []
        for key, value in data.items():
            if isinstance(value, dict):
                result.extend(self._flatten_report_data(value, f"{prefix}{key}_"))
            elif isinstance(value, list):
                for i, item in enumerate(value):
                    if isinstance(item, dict):
                        result.extend(self._flatten_report_data(item, f"{prefix}{key}_{i}_"))
            else:
                result.append({f"{prefix}{key}": value})
        return result
