from pydantic import BaseModel, validator
from typing import Optional, List
from datetime import date, datetime
from decimal import Decimal

# GL Account Schemas
class GLAccountBase(BaseModel):
    account_code: str
    account_name: str
    account_type: str
    parent_account_id: Optional[int] = None
    is_active: bool = True
    is_control_account: bool = False

class GLAccountCreate(GLAccountBase):
    pass

class GLAccountUpdate(BaseModel):
    account_code: Optional[str] = None
    account_name: Optional[str] = None
    account_type: Optional[str] = None
    parent_account_id: Optional[int] = None
    is_active: Optional[bool] = None
    is_control_account: Optional[bool] = None

class GLAccount(GLAccountBase):
    id: int
    company_id: int
    current_balance: Decimal
    
    class Config:
        from_attributes = True

# GL Journal Entry Line Schemas
class GLJournalEntryLineBase(BaseModel):
    gl_account_id: int
    description: Optional[str] = None
    debit_amount: Decimal = Decimal('0.00')
    credit_amount: Decimal = Decimal('0.00')
    
    @validator('debit_amount', 'credit_amount')
    def validate_amounts(cls, v):
        if v < 0:
            raise ValueError('Amount cannot be negative')
        return v

class GLJournalEntryLineCreate(GLJournalEntryLineBase):
    pass

class GLJournalEntryLineUpdate(BaseModel):
    gl_account_id: Optional[int] = None
    description: Optional[str] = None
    debit_amount: Optional[Decimal] = None
    credit_amount: Optional[Decimal] = None

class GLJournalEntryLine(GLJournalEntryLineBase):
    id: int
    journal_entry_id: int
    gl_account: Optional[GLAccount] = None
    
    class Config:
        from_attributes = True

# GL Journal Entry Schemas
class GLJournalEntryBase(BaseModel):
    entry_date: date
    reference: Optional[str] = None
    description: str
    status: Optional[str] = "Draft"

class GLJournalEntryCreate(GLJournalEntryBase):
    lines: List[GLJournalEntryLineCreate]
    
    @validator('lines')
    def validate_balanced(cls, lines):
        total_debit = sum(line.debit_amount for line in lines)
        total_credit = sum(line.credit_amount for line in lines)
        if abs(total_debit - total_credit) > 0.01:  # Allow for rounding
            raise ValueError(f'Journal entry not balanced. Debit: {total_debit}, Credit: {total_credit}')
        if total_debit == 0:
            raise ValueError('Journal entry cannot have zero value')
        if len(lines) < 2:
            raise ValueError('Journal entry must have at least 2 lines')
        return lines

class GLJournalEntryUpdate(BaseModel):
    entry_date: Optional[date] = None
    reference: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    lines: Optional[List[GLJournalEntryLineCreate]] = None

class GLJournalEntry(GLJournalEntryBase):
    id: int
    company_id: int
    posted_by_user_id: int
    status: str
    created_at: datetime
    updated_at: datetime
    posting_date: Optional[datetime] = None
    approved_by_user_id: Optional[int] = None
    approval_date: Optional[datetime] = None
    lines: List[GLJournalEntryLine] = []
    
    class Config:
        from_attributes = True

# GL Transaction Type Schemas
class GLTransactionTypeBase(BaseModel):
    name: str
    description: Optional[str] = None
    default_debit_account_id: Optional[int] = None
    default_credit_account_id: Optional[int] = None
    is_active: bool = True

class GLTransactionTypeCreate(GLTransactionTypeBase):
    pass

class GLTransactionTypeUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    default_debit_account_id: Optional[int] = None
    default_credit_account_id: Optional[int] = None
    is_active: Optional[bool] = None

class GLTransactionType(GLTransactionTypeBase):
    id: int
    company_id: int
    default_debit_account: Optional[GLAccount] = None
    default_credit_account: Optional[GLAccount] = None
    
    class Config:
        from_attributes = True

# GL Defaults Schemas
class GLDefaultsBase(BaseModel):
    retained_earnings_account_id: Optional[int] = None
    default_cash_account_id: Optional[int] = None
    default_ar_control_account_id: Optional[int] = None
    default_ap_control_account_id: Optional[int] = None

class GLDefaultsCreate(GLDefaultsBase):
    pass

class GLDefaultsUpdate(GLDefaultsBase):
    pass

class GLDefaults(GLDefaultsBase):
    id: int
    company_id: int
    retained_earnings_account: Optional[GLAccount] = None
    default_cash_account: Optional[GLAccount] = None
    default_ar_control_account: Optional[GLAccount] = None
    default_ap_control_account: Optional[GLAccount] = None
    
    class Config:
        from_attributes = True

# GL Report Schemas
class TrialBalanceItem(BaseModel):
    account_code: str
    account_name: str
    account_type: str
    debit_balance: Decimal
    credit_balance: Decimal

class TrialBalance(BaseModel):
    company_id: int
    as_of_date: date
    accounts: List[TrialBalanceItem]
    total_debits: Decimal
    total_credits: Decimal

class AccountTransaction(BaseModel):
    date: date
    reference: str
    description: str
    debit_amount: Decimal
    credit_amount: Decimal
    balance: Decimal
