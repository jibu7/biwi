# app/services/reporting_service.py
from typing import Dict, List, Any, Optional, Union
from sqlalchemy.orm import Session
from sqlalchemy import text, and_, or_
from datetime import datetime, date, timedelta
from decimal import Decimal
import json
import logging

from app.models.core import Company
from app.models.gl import GLAccount, GLJournalEntry, GLJournalEntryLine, AccountType
from app.models.ar import Customer, ARTransaction
from app.models.ap import Supplier, APTransaction
from app.models.inventory import InventoryItem, InventoryTransaction
from app.models.reporting import (
    ReportTemplate, ReportSchedule, GeneratedReport, 
    FinancialReportingPeriod, ReportType
)
from app.schemas.reporting import (
    BalanceSheetData, IncomeStatementData, CashFlowData,
    FinancialStatementLine, AgingReportData, AgingBucket,
    DashboardMetrics, ReportData, ReportTypeEnum
)

logger = logging.getLogger(__name__)

class AdvancedReportingService:
    def __init__(self, db: Session, company_id: int):
        self.db = db
        self.company_id = company_id
        self.company = db.query(Company).filter(Company.id == company_id).first()
    
    def generate_balance_sheet(
        self, 
        as_of_date: date, 
        format_type: str = "standard",
        comparison_period: Optional[str] = None
    ) -> BalanceSheetData:
        """Generate Balance Sheet with enhanced features"""
        try:
            # Get all GL accounts for the company
            accounts_query = self.db.query(GLAccount).filter(
                GLAccount.company_id == self.company_id,
                GLAccount.is_active == True
            )
            
            # Calculate balances as of the specified date
            balance_query = """
                SELECT 
                    ga.id as account_id,
                    ga.account_code,
                    ga.account_name,
                    ga.account_type,
                    ga.parent_account_id,
                    COALESCE(SUM(
                        CASE 
                            WHEN ga.normal_balance = 'debit' THEN gjel.debit_amount - gjel.credit_amount
                            ELSE gjel.credit_amount - gjel.debit_amount
                        END
                    ), 0) as balance
                FROM gl_accounts ga
                LEFT JOIN gl_journal_entry_lines gjel ON ga.id = gjel.gl_account_id
                LEFT JOIN gl_journal_entries gje ON gjel.gl_journal_entry_id = gje.id
                WHERE ga.company_id = :company_id 
                    AND ga.is_active = true
                    AND (gje.transaction_date <= :as_of_date OR gje.id IS NULL)
                    AND (gje.status = 'posted' OR gje.id IS NULL)
                GROUP BY ga.id, ga.account_code, ga.account_name, ga.account_type, ga.parent_account_id
                ORDER BY ga.account_code
            """
            
            result = self.db.execute(
                text(balance_query),
                {"company_id": self.company_id, "as_of_date": as_of_date}
            )
            
            account_balances = result.fetchall()
            
            # Organize accounts by type
            assets = []
            liabilities = []
            equity = []
            
            total_assets = Decimal('0')
            total_liabilities = Decimal('0')
            total_equity = Decimal('0')
            
            for account in account_balances:
                balance = Decimal(str(account.balance))
                
                line = FinancialStatementLine(
                    account_code=account.account_code,
                    account_name=account.account_name,
                    amount=balance,
                    level=0,
                    is_total=False
                )
                
                if account.account_type in ['asset', 'current_asset', 'fixed_asset']:
                    assets.append(line)
                    total_assets += balance
                elif account.account_type in ['liability', 'current_liability', 'long_term_liability']:
                    liabilities.append(line)
                    total_liabilities += balance
                elif account.account_type in ['equity', 'retained_earnings']:
                    equity.append(line)
                    total_equity += balance
            
            return BalanceSheetData(
                assets=assets,
                liabilities=liabilities,
                equity=equity,
                total_assets=total_assets,
                total_liabilities=total_liabilities,
                total_equity=total_equity,
                as_of_date=as_of_date,
                company_name=self.company.name if self.company else "Unknown Company"
            )
            
        except Exception as e:
            logger.error(f"Error generating balance sheet: {str(e)}")
            raise
    
    def generate_income_statement(
        self,
        start_date: date,
        end_date: date,
        show_percentages: bool = True,
        group_by: str = "account"
    ) -> IncomeStatementData:
        """Generate Income Statement with enhanced features"""
        try:
            # Query for revenue and expense accounts
            income_query = """
                SELECT 
                    ga.id as account_id,
                    ga.account_code,
                    ga.account_name,
                    ga.account_type,
                    COALESCE(SUM(
                        CASE 
                            WHEN ga.account_type IN ('revenue', 'income') THEN gjel.credit_amount - gjel.debit_amount
                            WHEN ga.account_type IN ('expense', 'cost_of_goods_sold') THEN gjel.debit_amount - gjel.credit_amount
                            ELSE 0
                        END
                    ), 0) as amount
                FROM gl_accounts ga
                LEFT JOIN gl_journal_entry_lines gjel ON ga.id = gjel.gl_account_id
                LEFT JOIN gl_journal_entries gje ON gjel.gl_journal_entry_id = gje.id
                WHERE ga.company_id = :company_id 
                    AND ga.is_active = true
                    AND ga.account_type IN ('revenue', 'income', 'expense', 'cost_of_goods_sold')
                    AND gje.transaction_date BETWEEN :start_date AND :end_date
                    AND gje.status = 'posted'
                GROUP BY ga.id, ga.account_code, ga.account_name, ga.account_type
                ORDER BY ga.account_code
            """
            
            result = self.db.execute(
                text(income_query),
                {
                    "company_id": self.company_id,
                    "start_date": start_date,
                    "end_date": end_date
                }
            )
            
            account_data = result.fetchall()
            
            revenue = []
            expenses = []
            total_revenue = Decimal('0')
            total_expenses = Decimal('0')
            
            for account in account_data:
                amount = Decimal(str(account.amount))
                
                line = FinancialStatementLine(
                    account_code=account.account_code,
                    account_name=account.account_name,
                    amount=amount,
                    level=0,
                    is_total=False
                )
                
                if account.account_type in ['revenue', 'income']:
                    revenue.append(line)
                    total_revenue += amount
                else:  # expenses and COGS
                    expenses.append(line)
                    total_expenses += amount
            
            net_income = total_revenue - total_expenses
            
            return IncomeStatementData(
                revenue=revenue,
                expenses=expenses,
                total_revenue=total_revenue,
                total_expenses=total_expenses,
                net_income=net_income,
                start_date=start_date,
                end_date=end_date,
                company_name=self.company.name if self.company else "Unknown Company"
            )
            
        except Exception as e:
            logger.error(f"Error generating income statement: {str(e)}")
            raise
    
    def generate_cash_flow_statement(
        self,
        start_date: date,
        end_date: date,
        method: str = "indirect"
    ) -> CashFlowData:
        """Generate Cash Flow Statement"""
        try:
            # For simplified implementation, we'll use direct method
            # In a full implementation, this would be more sophisticated
            
            cash_accounts_query = """
                SELECT 
                    ga.account_code,
                    ga.account_name,
                    COALESCE(SUM(gjel.debit_amount - gjel.credit_amount), 0) as net_change
                FROM gl_accounts ga
                LEFT JOIN gl_journal_entry_lines gjel ON ga.id = gjel.gl_account_id
                LEFT JOIN gl_journal_entries gje ON gjel.gl_journal_entry_id = gje.id
                WHERE ga.company_id = :company_id 
                    AND ga.account_type = 'asset'
                    AND ga.account_code LIKE '1010%'  -- Cash accounts
                    AND gje.transaction_date BETWEEN :start_date AND :end_date
                    AND gje.status = 'posted'
                GROUP BY ga.id, ga.account_code, ga.account_name
            """
            
            result = self.db.execute(
                text(cash_accounts_query),
                {
                    "company_id": self.company_id,
                    "start_date": start_date,
                    "end_date": end_date
                }
            )
            
            cash_data = result.fetchall()
            
            # Simplified cash flow - in practice this would be much more detailed
            operating_activities = []
            investing_activities = []
            financing_activities = []
            
            net_cash_flow = Decimal('0')
            
            for cash_account in cash_data:
                amount = Decimal(str(cash_account.net_change))
                net_cash_flow += amount
                
                activity = {
                    "description": cash_account.account_name,
                    "amount": amount
                }
                operating_activities.append(activity)
            
            # Get beginning and ending cash balances
            beginning_cash = self._get_cash_balance_as_of(start_date - timedelta(days=1))
            ending_cash = self._get_cash_balance_as_of(end_date)
            
            return CashFlowData(
                operating_activities=operating_activities,
                investing_activities=investing_activities,
                financing_activities=financing_activities,
                net_cash_from_operating=net_cash_flow,
                net_cash_from_investing=Decimal('0'),
                net_cash_from_financing=Decimal('0'),
                net_change_in_cash=net_cash_flow,
                beginning_cash=beginning_cash,
                ending_cash=ending_cash,
                start_date=start_date,
                end_date=end_date,
                company_name=self.company.name if self.company else "Unknown Company"
            )
            
        except Exception as e:
            logger.error(f"Error generating cash flow statement: {str(e)}")
            raise
    
    def generate_ar_aging_report(
        self,
        as_of_date: date,
        aging_buckets: List[int] = [30, 60, 90],
        customer_id: Optional[int] = None
    ) -> AgingReportData:
        """Generate AR Aging Report"""
        try:
            # Build the query for AR aging
            ar_aging_query = """
                SELECT 
                    c.id as customer_id,
                    c.name as customer_name,
                    c.customer_code,
                    i.invoice_date,
                    i.due_date,
                    i.total_amount,
                    COALESCE(SUM(p.amount), 0) as payments_received,
                    (i.total_amount - COALESCE(SUM(p.amount), 0)) as outstanding_amount,
                    EXTRACT(days FROM (:as_of_date - i.due_date)) as days_overdue
                FROM ar_customers c
                JOIN ar_invoices i ON c.id = i.customer_id
                LEFT JOIN ar_payments p ON i.id = p.invoice_id
                WHERE c.company_id = :company_id
                    AND i.status = 'posted'
                    AND i.invoice_date <= :as_of_date
                    AND (i.total_amount - COALESCE(SUM(p.amount), 0)) > 0
                    {customer_filter}
                GROUP BY c.id, c.name, c.customer_code, i.id, i.invoice_date, i.due_date, i.total_amount
                ORDER BY c.customer_code, i.due_date
            """
            
            customer_filter = ""
            params = {
                "company_id": self.company_id,
                "as_of_date": as_of_date
            }
            
            if customer_id:
                customer_filter = "AND c.id = :customer_id"
                params["customer_id"] = customer_id
            
            query = ar_aging_query.format(customer_filter=customer_filter)
            result = self.db.execute(text(query), params)
            
            aging_data = result.fetchall()
            
            # Process aging buckets
            buckets = []
            bucket_ranges = [(0, aging_buckets[0])] + [
                (aging_buckets[i], aging_buckets[i+1]) 
                for i in range(len(aging_buckets)-1)
            ] + [(aging_buckets[-1], float('inf'))]
            
            bucket_names = [
                "Current",
                *[f"{bucket_ranges[i][0]}-{bucket_ranges[i][1]-1}" 
                  for i in range(1, len(bucket_ranges)-1)],
                f"Over {aging_buckets[-1]}"
            ]
            
            bucket_totals = {name: Decimal('0') for name in bucket_names}
            bucket_counts = {name: 0 for name in bucket_names}
            
            detail_lines = []
            total_amount = Decimal('0')
            total_count = 0
            
            for record in aging_data:
                outstanding = Decimal(str(record.outstanding_amount))
                days_overdue = int(record.days_overdue) if record.days_overdue else 0
                
                # Determine bucket
                bucket_name = bucket_names[0]  # Default to Current
                for i, (min_days, max_days) in enumerate(bucket_ranges):
                    if min_days <= days_overdue < max_days:
                        bucket_name = bucket_names[i]
                        break
                
                bucket_totals[bucket_name] += outstanding
                bucket_counts[bucket_name] += 1
                
                total_amount += outstanding
                total_count += 1
                
                detail_lines.append({
                    "customer_id": record.customer_id,
                    "customer_name": record.customer_name,
                    "customer_code": record.customer_code,
                    "invoice_date": record.invoice_date,
                    "due_date": record.due_date,
                    "outstanding_amount": outstanding,
                    "days_overdue": days_overdue,
                    "bucket": bucket_name
                })
            
            # Create bucket objects
            aging_buckets_result = [
                AgingBucket(
                    period=name,
                    amount=bucket_totals[name],
                    count=bucket_counts[name]
                )
                for name in bucket_names
            ]
            
            return AgingReportData(
                total_amount=total_amount,
                total_count=total_count,
                buckets=aging_buckets_result,
                detail_lines=detail_lines
            )
            
        except Exception as e:
            logger.error(f"Error generating AR aging report: {str(e)}")
            raise
    
    def generate_dashboard_metrics(self, as_of_date: date) -> DashboardMetrics:
        """Generate dashboard metrics for financial overview"""
        try:
            # Get key financial metrics
            metrics_query = """
                SELECT 
                    ga.account_type,
                    SUM(
                        CASE 
                            WHEN ga.normal_balance = 'debit' THEN gjel.debit_amount - gjel.credit_amount
                            ELSE gjel.credit_amount - gjel.debit_amount
                        END
                    ) as balance
                FROM gl_accounts ga
                LEFT JOIN gl_journal_entry_lines gjel ON ga.id = gjel.gl_account_id
                LEFT JOIN gl_journal_entries gje ON gjel.gl_journal_entry_id = gje.id
                WHERE ga.company_id = :company_id 
                    AND ga.is_active = true
                    AND (gje.transaction_date <= :as_of_date OR gje.id IS NULL)
                    AND (gje.status = 'posted' OR gje.id IS NULL)
                GROUP BY ga.account_type
            """
            
            result = self.db.execute(
                text(metrics_query),
                {"company_id": self.company_id, "as_of_date": as_of_date}
            )
            
            account_balances = result.fetchall()
            
            # Initialize metrics
            metrics = {
                'cash_balance': Decimal('0'),
                'accounts_receivable': Decimal('0'),
                'accounts_payable': Decimal('0'),
                'inventory_value': Decimal('0'),
                'total_revenue': Decimal('0'),
                'total_expenses': Decimal('0')
            }
            
            # Process account balances
            for account in account_balances:
                balance = Decimal(str(account.balance))
                
                if account.account_type == 'asset' and 'cash' in account.account_type.lower():
                    metrics['cash_balance'] += balance
                elif 'receivable' in account.account_type.lower():
                    metrics['accounts_receivable'] += balance
                elif 'payable' in account.account_type.lower():
                    metrics['accounts_payable'] += balance
                elif 'inventory' in account.account_type.lower():
                    metrics['inventory_value'] += balance
                elif account.account_type in ['revenue', 'income']:
                    metrics['total_revenue'] += balance
                elif account.account_type in ['expense', 'cost_of_goods_sold']:
                    metrics['total_expenses'] += balance
            
            net_income = metrics['total_revenue'] - metrics['total_expenses']
            
            return DashboardMetrics(
                total_revenue=metrics['total_revenue'],
                total_expenses=metrics['total_expenses'],
                net_income=net_income,
                cash_balance=metrics['cash_balance'],
                accounts_receivable=metrics['accounts_receivable'],
                accounts_payable=metrics['accounts_payable'],
                inventory_value=metrics['inventory_value'],
                metrics_date=as_of_date
            )
            
        except Exception as e:
            logger.error(f"Error generating dashboard metrics: {str(e)}")
            raise
    
    def _get_cash_balance_as_of(self, as_of_date: date) -> Decimal:
        """Helper method to get cash balance as of a specific date"""
        try:
            cash_query = """
                SELECT COALESCE(SUM(gjel.debit_amount - gjel.credit_amount), 0) as cash_balance
                FROM gl_accounts ga
                LEFT JOIN gl_journal_entry_lines gjel ON ga.id = gjel.gl_account_id
                LEFT JOIN gl_journal_entries gje ON gjel.gl_journal_entry_id = gje.id
                WHERE ga.company_id = :company_id 
                    AND ga.account_code LIKE '1010%'  -- Cash accounts
                    AND (gje.transaction_date <= :as_of_date OR gje.id IS NULL)
                    AND (gje.status = 'posted' OR gje.id IS NULL)
            """
            
            result = self.db.execute(
                text(cash_query),
                {"company_id": self.company_id, "as_of_date": as_of_date}
            )
            
            cash_balance = result.scalar()
            return Decimal(str(cash_balance)) if cash_balance else Decimal('0')
            
        except Exception as e:
            logger.error(f"Error getting cash balance: {str(e)}")
            return Decimal('0')
    
    def create_custom_report(
        self,
        report_config: Dict[str, Any],
        parameters: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create and execute a custom report based on configuration"""
        try:
            # This is a simplified implementation
            # In practice, this would build dynamic SQL based on the configuration
            
            data_source = report_config.get('data_source', 'gl_transactions')
            columns = report_config.get('columns', [])
            filters = report_config.get('filters', {})
            
            # Build basic query based on data source
            if data_source == 'gl_transactions':
                base_query = """
                    SELECT gjel.*, ga.account_code, ga.account_name, gje.transaction_date
                    FROM gl_journal_entry_lines gjel
                    JOIN gl_accounts ga ON gjel.gl_account_id = ga.id
                    JOIN gl_journal_entries gje ON gjel.gl_journal_entry_id = gje.id
                    WHERE ga.company_id = :company_id
                """
            else:
                # Add support for other data sources as needed
                base_query = "SELECT 'Not implemented' as message"
            
            result = self.db.execute(
                text(base_query),
                {"company_id": self.company_id}
            )
            
            data = [dict(row._mapping) for row in result]
            
            return {
                "report_type": "custom",
                "data_source": data_source,
                "generated_at": datetime.utcnow(),
                "parameters": parameters,
                "data": data
            }
            
        except Exception as e:
            logger.error(f"Error creating custom report: {str(e)}")
            raise
