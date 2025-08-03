# app/services/financial_reports.py
from sqlalchemy.orm import Session
from sqlalchemy import func, case, and_, or_
from datetime import date, datetime, timedelta
from typing import Dict, List, Any, Optional
from app import models
from app.schemas.reporting import BalanceSheetRequest, IncomeStatementRequest, CashFlowRequest
import pandas as pd

class FinancialReportService:
    def __init__(self, db: Session, company_id: int):
        self.db = db
        self.company_id = company_id
    
    def generate_balance_sheet(self, request: BalanceSheetRequest) -> Dict[str, Any]:
        """
        Generate Balance Sheet as of a specific date
        Structure:
        - Assets (Current Assets, Fixed Assets)
        - Liabilities (Current Liabilities, Long-term Liabilities)
        - Equity (Share Capital, Retained Earnings)
        """
        as_of_date = request.as_of_date
        
        # Get all GL accounts with balances
        accounts = self.db.query(
            models.GLAccount,
            func.sum(
                case(
                    (models.GLJournalEntryLine.debit_amount > 0, models.GLJournalEntryLine.debit_amount),
                    else_=0
                )
            ).label('total_debit'),
            func.sum(
                case(
                    (models.GLJournalEntryLine.credit_amount > 0, models.GLJournalEntryLine.credit_amount),
                    else_=0
                )
            ).label('total_credit')
        ).join(
            models.GLJournalEntryLine,
            models.GLAccount.id == models.GLJournalEntryLine.gl_account_id
        ).join(
            models.GLJournalEntry,
            models.GLJournalEntryLine.journal_entry_id == models.GLJournalEntry.id
        ).filter(
            models.GLAccount.company_id == self.company_id,
            models.GLJournalEntry.entry_date <= as_of_date,
            models.GLJournalEntry.status == "Posted"
        ).group_by(models.GLAccount.id).all()
        
        balance_sheet = {
            "as_of_date": as_of_date.isoformat(),
            "company_id": self.company_id,
            "assets": {
                "current_assets": {},
                "fixed_assets": {},
                "total_assets": 0
            },
            "liabilities": {
                "current_liabilities": {},
                "long_term_liabilities": {},
                "total_liabilities": 0
            },
            "equity": {
                "share_capital": 0,
                "retained_earnings": 0,
                "current_year_earnings": 0,
                "total_equity": 0
            },
            "total_liabilities_and_equity": 0
        }
        
        for account, total_debit, total_credit in accounts:
            balance = 0
            
            # Calculate balance based on account type
            if account.account_type in ["Asset", "Expense"]:
                balance = (total_debit or 0) - (total_credit or 0)
            else:  # Liability, Equity, Income
                balance = (total_credit or 0) - (total_debit or 0)
            
            if not request.include_zero_balances and balance == 0:
                continue
            
            # Categorize accounts
            if account.account_type == "Asset":
                # Simple categorization - enhance with account properties
                if "current" in account.account_name.lower():
                    balance_sheet["assets"]["current_assets"][account.account_name] = balance
                else:
                    balance_sheet["assets"]["fixed_assets"][account.account_name] = balance
                balance_sheet["assets"]["total_assets"] += balance
                
            elif account.account_type == "Liability":
                if "current" in account.account_name.lower():
                    balance_sheet["liabilities"]["current_liabilities"][account.account_name] = balance
                else:
                    balance_sheet["liabilities"]["long_term_liabilities"][account.account_name] = balance
                balance_sheet["liabilities"]["total_liabilities"] += balance
                
            elif account.account_type == "Equity":
                if "retained" in account.account_name.lower():
                    balance_sheet["equity"]["retained_earnings"] = balance
                elif "capital" in account.account_name.lower():
                    balance_sheet["equity"]["share_capital"] = balance
                else:
                    balance_sheet["equity"]["current_year_earnings"] += balance
                balance_sheet["equity"]["total_equity"] += balance
        
        balance_sheet["total_liabilities_and_equity"] = (
            balance_sheet["liabilities"]["total_liabilities"] + 
            balance_sheet["equity"]["total_equity"]
        )
        
        # Add comparison if requested
        if request.comparison_period:
            comparison_date = self._get_comparison_date(as_of_date, request.comparison_period)
            comparison_request = BalanceSheetRequest(
                as_of_date=comparison_date,
                include_zero_balances=request.include_zero_balances
            )
            balance_sheet["comparison"] = self.generate_balance_sheet(comparison_request)
        
        return balance_sheet
    
    def generate_income_statement(self, request: IncomeStatementRequest) -> Dict[str, Any]:
        """
        Generate Income Statement (P&L) for a period
        Structure:
        - Revenue
        - Cost of Goods Sold
        - Gross Profit
        - Operating Expenses
        - Net Income
        """
        # Get income and expense accounts with period totals
        transactions = self.db.query(
            models.GLAccount,
            func.sum(models.GLJournalEntryLine.credit_amount).label('credits'),
            func.sum(models.GLJournalEntryLine.debit_amount).label('debits')
        ).join(
            models.GLJournalEntryLine
        ).join(
            models.GLJournalEntry
        ).filter(
            models.GLAccount.company_id == self.company_id,
            models.GLJournalEntry.entry_date >= request.start_date,
            models.GLJournalEntry.entry_date <= request.end_date,
            models.GLJournalEntry.status == "Posted",
            models.GLAccount.account_type.in_(["Income", "Expense"])
        ).group_by(models.GLAccount.id).all()
        
        income_statement = {
            "period_start": request.start_date.isoformat(),
            "period_end": request.end_date.isoformat(),
            "company_id": self.company_id,
            "revenue": {
                "sales_revenue": 0,
                "other_revenue": 0,
                "total_revenue": 0
            },
            "cost_of_goods_sold": 0,
            "gross_profit": 0,
            "operating_expenses": {
                "administrative": 0,
                "selling": 0,
                "other": 0,
                "total_operating_expenses": 0
            },
            "operating_income": 0,
            "other_income_expenses": 0,
            "income_before_tax": 0,
            "tax_expense": 0,
            "net_income": 0
        }
        
        for account, credits, debits in transactions:
            if account.account_type == "Income":
                amount = (credits or 0) - (debits or 0)
                if "sales" in account.account_name.lower():
                    income_statement["revenue"]["sales_revenue"] += amount
                else:
                    income_statement["revenue"]["other_revenue"] += amount
                income_statement["revenue"]["total_revenue"] += amount
                
            elif account.account_type == "Expense":
                amount = (debits or 0) - (credits or 0)
                if "cost of" in account.account_name.lower() or "cogs" in account.account_name.lower():
                    income_statement["cost_of_goods_sold"] += amount
                elif "admin" in account.account_name.lower():
                    income_statement["operating_expenses"]["administrative"] += amount
                elif "selling" in account.account_name.lower() or "marketing" in account.account_name.lower():
                    income_statement["operating_expenses"]["selling"] += amount
                elif "tax" in account.account_name.lower():
                    income_statement["tax_expense"] += amount
                else:
                    income_statement["operating_expenses"]["other"] += amount
                    
                if "tax" not in account.account_name.lower():
                    income_statement["operating_expenses"]["total_operating_expenses"] += amount
        
        # Calculate derived values
        income_statement["gross_profit"] = (
            income_statement["revenue"]["total_revenue"] - 
            income_statement["cost_of_goods_sold"]
        )
        income_statement["operating_income"] = (
            income_statement["gross_profit"] - 
            income_statement["operating_expenses"]["total_operating_expenses"]
        )
        income_statement["income_before_tax"] = (
            income_statement["operating_income"] + 
            income_statement["other_income_expenses"]
        )
        income_statement["net_income"] = (
            income_statement["income_before_tax"] - 
            income_statement["tax_expense"]
        )
        
        # Add percentages if requested
        if request.show_percentages and income_statement["revenue"]["total_revenue"] > 0:
            total_revenue = income_statement["revenue"]["total_revenue"]
            income_statement["percentages"] = {
                "gross_profit_margin": (income_statement["gross_profit"] / total_revenue) * 100,
                "operating_margin": (income_statement["operating_income"] / total_revenue) * 100,
                "net_profit_margin": (income_statement["net_income"] / total_revenue) * 100
            }
        
        return income_statement
    
    def generate_cash_flow_statement(self, request: CashFlowRequest) -> Dict[str, Any]:
        """
        Generate Cash Flow Statement using indirect method
        Structure:
        - Operating Activities
        - Investing Activities
        - Financing Activities
        """
        # This is a simplified version - full implementation would track actual cash movements
        
        # Start with net income from income statement
        income_stmt_request = IncomeStatementRequest(
            start_date=request.start_date,
            end_date=request.end_date,
            show_percentages=False
        )
        income_statement = self.generate_income_statement(income_stmt_request)
        
        cash_flow = {
            "period_start": request.start_date.isoformat(),
            "period_end": request.end_date.isoformat(),
            "company_id": self.company_id,
            "operating_activities": {
                "net_income": income_statement["net_income"],
                "adjustments": {
                    "depreciation": 0,
                    "amortization": 0,
                    "changes_in_working_capital": {
                        "accounts_receivable": 0,
                        "inventory": 0,
                        "accounts_payable": 0
                    }
                },
                "net_cash_from_operating": 0
            },
            "investing_activities": {
                "capital_expenditures": 0,
                "asset_sales": 0,
                "net_cash_from_investing": 0
            },
            "financing_activities": {
                "debt_proceeds": 0,
                "debt_payments": 0,
                "equity_issued": 0,
                "dividends_paid": 0,
                "net_cash_from_financing": 0
            },
            "net_change_in_cash": 0,
            "beginning_cash": 0,
            "ending_cash": 0
        }
        
        # Calculate changes in working capital
        # AR change
        ar_change = self._calculate_balance_change(
            "Customer", request.start_date, request.end_date
        )
        cash_flow["operating_activities"]["adjustments"]["changes_in_working_capital"]["accounts_receivable"] = -ar_change
        
        # AP change
        ap_change = self._calculate_balance_change(
            "Supplier", request.start_date, request.end_date
        )
        cash_flow["operating_activities"]["adjustments"]["changes_in_working_capital"]["accounts_payable"] = ap_change
        
        # Inventory change
        inv_change = self._calculate_inventory_change(
            request.start_date, request.end_date
        )
        cash_flow["operating_activities"]["adjustments"]["changes_in_working_capital"]["inventory"] = -inv_change
        
        # Calculate net cash from operating
        cash_flow["operating_activities"]["net_cash_from_operating"] = (
            cash_flow["operating_activities"]["net_income"] +
            sum(cash_flow["operating_activities"]["adjustments"]["changes_in_working_capital"].values())
        )
        
        # Get cash account balances
        cash_accounts = self.db.query(models.GLAccount).filter(
            models.GLAccount.company_id == self.company_id,
            or_(
                models.GLAccount.account_name.ilike('%cash%'),
                models.GLAccount.account_name.ilike('%bank%')
            )
        ).all()
        
        # Calculate beginning and ending cash
        for account in cash_accounts:
            beginning_balance = self._get_account_balance(account.id, request.start_date)
            ending_balance = self._get_account_balance(account.id, request.end_date)
            cash_flow["beginning_cash"] += beginning_balance
            cash_flow["ending_cash"] += ending_balance
        
        cash_flow["net_change_in_cash"] = (
            cash_flow["operating_activities"]["net_cash_from_operating"] +
            cash_flow["investing_activities"]["net_cash_from_investing"] +
            cash_flow["financing_activities"]["net_cash_from_financing"]
        )
        
        return cash_flow
    
    def _calculate_balance_change(self, entity_type: str, start_date: date, end_date: date) -> float:
        """Helper to calculate AR/AP balance changes"""
        if entity_type == "Customer":
            model = models.Customer
        else:
            model = models.Supplier
            
        start_balance = self.db.query(
            func.sum(model.current_balance)
        ).filter(
            model.company_id == self.company_id
        ).scalar() or 0
        
        # This is simplified - should track actual changes
        return 0
    
    def _calculate_inventory_change(self, start_date: date, end_date: date) -> float:
        """Helper to calculate inventory value change"""
        # Simplified - should compare inventory valuations
        return 0
    
    def _get_account_balance(self, account_id: int, as_of_date: date) -> float:
        """Get GL account balance as of date"""
        result = self.db.query(
            func.sum(models.GLJournalEntryLine.debit_amount) - 
            func.sum(models.GLJournalEntryLine.credit_amount)
        ).join(
            models.GLJournalEntry
        ).filter(
            models.GLJournalEntryLine.gl_account_id == account_id,
            models.GLJournalEntry.entry_date <= as_of_date,
            models.GLJournalEntry.status == "Posted"
        ).scalar()
        
        return result or 0
    
    def _get_comparison_date(self, base_date: date, comparison_type: str) -> date:
        """Calculate comparison date based on type"""
        if comparison_type == "previous_period":
            return base_date - timedelta(days=30)  # Simplified
        elif comparison_type == "previous_year":
            return base_date.replace(year=base_date.year - 1)
        return base_date
