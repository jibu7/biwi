from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import date, datetime
from decimal import Decimal

class FinancialStatementLine(BaseModel):
    model_config = ConfigDict(json_encoders={Decimal: float})
    
    account_code: str
    account_name: str
    amount: Decimal
    level: int = 0  # For indentation in hierarchical reports
    is_total: bool = False
    is_subtotal: bool = False

class BalanceSheetData(BaseModel):
    model_config = ConfigDict(json_encoders={Decimal: float})
    
    assets: List[FinancialStatementLine]
    liabilities: List[FinancialStatementLine]
    equity: List[FinancialStatementLine]
    total_assets: Decimal
    total_liabilities: Decimal
    total_equity: Decimal
    as_of_date: date
    company_name: str

class IncomeStatementData(BaseModel):
    model_config = ConfigDict(json_encoders={Decimal: float})
    
    revenue: List[FinancialStatementLine]
    expenses: List[FinancialStatementLine]
    total_revenue: Decimal
    total_expenses: Decimal
    net_income: Decimal
    start_date: date
    end_date: date
    company_name: str

class CashFlowData(BaseModel):
    model_config = ConfigDict(json_encoders={Decimal: float})
    
    operating_activities: List[FinancialStatementLine]
    investing_activities: List[FinancialStatementLine]
    financing_activities: List[FinancialStatementLine]
    net_cash_from_operating: Decimal
    net_cash_from_investing: Decimal
    net_cash_from_financing: Decimal
    net_change_in_cash: Decimal
    beginning_cash: Decimal
    ending_cash: Decimal
    start_date: date
    end_date: date
    company_name: str

class ReportTemplateBase(BaseModel):
    name: str
    report_type: str
    template_data: Dict[str, Any]
    is_default: bool = False
    is_active: bool = True

class ReportTemplateCreate(ReportTemplateBase):
    pass

class ReportTemplate(ReportTemplateBase):
    id: int
    company_id: int
    created_by_user_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class BankReconciliationBase(BaseModel):
    model_config = ConfigDict(json_encoders={Decimal: float})
    
    bank_gl_account_id: int
    reconciliation_date: date
    statement_balance: Decimal
    book_balance: Decimal
    status: str = "Open"

class BankReconciliationCreate(BankReconciliationBase):
    pass

class BankReconciliation(BankReconciliationBase):
    id: int
    company_id: int
    created_by_user_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class ARAgingDetail(BaseModel):
    model_config = ConfigDict(json_encoders={Decimal: float})
    
    customer_id: int
    customer_name: str
    customer_code: str
    total_outstanding: Decimal
    current: Decimal
    days_30: Decimal
    days_60: Decimal
    days_90: Decimal
    days_120_plus: Decimal
    credit_limit: Decimal
    last_payment_date: Optional[date]

class APAgingDetail(BaseModel):
    model_config = ConfigDict(json_encoders={Decimal: float})
    
    supplier_id: int
    supplier_name: str
    supplier_code: str
    total_outstanding: Decimal
    current: Decimal
    days_30: Decimal
    days_60: Decimal
    days_90: Decimal
    days_120_plus: Decimal
    last_payment_date: Optional[date]
