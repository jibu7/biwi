from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any, Union
from datetime import date, datetime
from decimal import Decimal
from enum import Enum

class ReportTypeEnum(str, Enum):
    BALANCE_SHEET = "balance_sheet"
    INCOME_STATEMENT = "income_statement"
    CASH_FLOW = "cash_flow"
    TRIAL_BALANCE = "trial_balance"
    CUSTOM = "custom"
    AR_AGING = "ar_aging"
    AP_AGING = "ap_aging"
    INVENTORY_VALUATION = "inventory_valuation"

class ReportFrequencyEnum(str, Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    YEARLY = "yearly"
    ON_DEMAND = "on_demand"

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
    report_type: ReportTypeEnum
    configuration: Dict[str, Any]
    is_system: bool = False
    is_active: bool = True

class ReportTemplateCreate(ReportTemplateBase):
    pass

class ReportTemplateUpdate(BaseModel):
    name: Optional[str] = None
    configuration: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None

class ReportTemplate(ReportTemplateBase):
    id: int
    company_id: int
    created_by_user_id: Optional[int]
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

# Advanced Reporting Schemas
class ReportParameters(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    accounting_period_id: Optional[int] = None
    comparison_period: Optional[str] = None  # "previous_period", "previous_year"
    department_id: Optional[int] = None
    branch_id: Optional[int] = None
    include_zero_balances: bool = False
    consolidate_companies: Optional[List[int]] = None

class BalanceSheetRequest(ReportParameters):
    as_of_date: date
    format_type: str = "standard"  # "standard", "comparative", "detailed"
    group_by_account_type: bool = True
    show_sub_accounts: bool = False

class IncomeStatementRequest(ReportParameters):
    group_by: Optional[str] = "account"  # "account", "department", "branch"
    show_percentages: bool = True
    include_budget_comparison: bool = False
    show_monthly_breakdown: bool = False

class CashFlowRequest(ReportParameters):
    method: str = "indirect"  # "direct", "indirect"
    show_monthly_breakdown: bool = False
    include_forecast: bool = False

class TrialBalanceRequest(ReportParameters):
    as_of_date: date
    include_adjusting_entries: bool = True
    show_account_numbers: bool = True

class AgingReportRequest(ReportParameters):
    aging_buckets: List[int] = [30, 60, 90]  # Default buckets
    include_credit_balances: bool = True
    customer_id: Optional[int] = None  # For AR aging
    vendor_id: Optional[int] = None     # For AP aging

class CustomReportBuilder(BaseModel):
    name: str
    report_type: str
    data_source: str  # "gl_transactions", "ar_transactions", "ap_transactions", "inventory"
    columns: List[Dict[str, Any]]
    filters: Dict[str, Any]
    grouping: Optional[List[str]] = None
    sorting: Optional[Dict[str, str]] = None
    aggregations: Optional[Dict[str, str]] = None
    joins: Optional[List[Dict[str, str]]] = None

class ReportTemplateBase(BaseModel):
    name: str
    description: Optional[str] = None
    report_type: ReportTypeEnum
    template_config: Dict[str, Any]
    is_system_template: bool = False
    is_active: bool = True

class ReportTemplateCreate(ReportTemplateBase):
    pass

class ReportTemplateUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    template_config: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None

class ReportTemplateResponse(ReportTemplateBase):
    id: int
    company_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class ReportScheduleBase(BaseModel):
    template_id: int
    frequency: ReportFrequencyEnum
    schedule_config: Dict[str, Any]
    recipient_emails: List[str]
    export_formats: List[str]
    is_active: bool = True

class ReportScheduleCreate(ReportScheduleBase):
    pass

class ReportScheduleUpdate(BaseModel):
    frequency: Optional[ReportFrequencyEnum] = None
    schedule_config: Optional[Dict[str, Any]] = None
    recipient_emails: Optional[List[str]] = None
    export_formats: Optional[List[str]] = None
    is_active: Optional[bool] = None

class ReportSchedule(ReportScheduleBase):
    id: int
    company_id: int
    last_run_at: Optional[datetime]
    next_run_at: Optional[datetime]
    
    class Config:
        from_attributes = True

class ExportRequest(BaseModel):
    report_id: Optional[int] = None
    report_type: ReportTypeEnum
    parameters: Dict[str, Any]
    format: str  # "pdf", "excel", "csv", "json"
    include_charts: bool = False
    include_summary: bool = True
    filename: Optional[str] = None

class GeneratedReportBase(BaseModel):
    template_id: Optional[int]
    report_type: ReportTypeEnum
    report_name: str
    parameters: Dict[str, Any]
    file_path: Optional[str]
    format: str
    file_size: Optional[int]

class GeneratedReportCreate(GeneratedReportBase):
    generated_by_user_id: int

class GeneratedReport(GeneratedReportBase):
    id: int
    company_id: int
    generated_at: datetime
    generated_by_user_id: int
    
    class Config:
        from_attributes = True

class FinancialReportingPeriodBase(BaseModel):
    period_type: str
    period_name: str
    start_date: datetime
    end_date: datetime
    is_closed: bool = False
    closing_entries_posted: bool = False

class FinancialReportingPeriodCreate(FinancialReportingPeriodBase):
    pass

class FinancialReportingPeriodUpdate(BaseModel):
    period_name: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_closed: Optional[bool] = None
    closing_entries_posted: Optional[bool] = None

class FinancialReportingPeriod(FinancialReportingPeriodBase):
    id: int
    company_id: int
    
    class Config:
        from_attributes = True

class AgingBucket(BaseModel):
    model_config = ConfigDict(json_encoders={Decimal: float})
    
    period: str  # "Current", "1-30", "31-60", "61-90", "Over 90"
    amount: Decimal
    count: int

class AgingReportData(BaseModel):
    model_config = ConfigDict(json_encoders={Decimal: float})
    
    total_amount: Decimal
    total_count: int
    buckets: List[AgingBucket]
    detail_lines: List[Dict[str, Any]]

class DashboardMetrics(BaseModel):
    model_config = ConfigDict(json_encoders={Decimal: float})
    
    total_revenue: Decimal
    total_expenses: Decimal
    net_income: Decimal
    cash_balance: Decimal
    accounts_receivable: Decimal
    accounts_payable: Decimal
    inventory_value: Decimal
    metrics_date: date

class ReportData(BaseModel):
    report_type: ReportTypeEnum
    generated_at: datetime
    parameters: Dict[str, Any]
    data: Union[BalanceSheetData, IncomeStatementData, CashFlowData, AgingReportData, Dict[str, Any]]
