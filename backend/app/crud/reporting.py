from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, text
from typing import List, Dict, Any, Optional
from datetime import date, datetime, timedelta
from decimal import Decimal
from app import models, schemas
from app.crud import gl, ar, ap

def generate_balance_sheet(
    db: Session, 
    company_id: int, 
    as_of_date: date,
    comparative_date: Optional[date] = None
) -> schemas.BalanceSheetData:
    """Generate Balance Sheet with optional comparative column"""
    
    # Get company info
    company = db.query(models.Company).filter(models.Company.id == company_id).first()
    
    # Get all GL accounts with their balances as of the specified date
    accounts_query = db.query(models.GLAccount).filter(
        models.GLAccount.company_id == company_id,
        models.GLAccount.is_active == True
    ).order_by(models.GLAccount.account_code)
    
    assets = []
    liabilities = []
    equity = []
    
    total_assets = Decimal('0.00')
    total_liabilities = Decimal('0.00')
    total_equity = Decimal('0.00')
    
    for account in accounts_query:
        # Calculate balance as of date by summing all transactions up to that date
        balance = calculate_account_balance_as_of_date(db, account.id, as_of_date)
        
        if balance != 0:  # Only include accounts with balances
            line = schemas.FinancialStatementLine(
                account_code=account.account_code,
                account_name=account.account_name,
                amount=balance,
                level=0  # Can be enhanced for hierarchical accounts
            )
            
            if account.account_type in ["Asset", "Assets"]:
                assets.append(line)
                total_assets += balance
            elif account.account_type in ["Liability", "Liabilities"]:
                liabilities.append(line)
                total_liabilities += balance
            elif account.account_type in ["Equity", "Owner's Equity"]:
                equity.append(line)
                total_equity += balance
    
    return schemas.BalanceSheetData(
        assets=assets,
        liabilities=liabilities,
        equity=equity,
        total_assets=total_assets,
        total_liabilities=total_liabilities,
        total_equity=total_equity,
        as_of_date=as_of_date,
        company_name=company.name
    )

def generate_income_statement(
    db: Session, 
    company_id: int, 
    start_date: date, 
    end_date: date,
    comparative_start_date: Optional[date] = None,
    comparative_end_date: Optional[date] = None
) -> schemas.IncomeStatementData:
    """Generate Income Statement with optional comparative period"""
    
    company = db.query(models.Company).filter(models.Company.id == company_id).first()
    
    accounts_query = db.query(models.GLAccount).filter(
        models.GLAccount.company_id == company_id,
        models.GLAccount.is_active == True
    ).order_by(models.GLAccount.account_code)
    
    revenue = []
    expenses = []
    
    total_revenue = Decimal('0.00')
    total_expenses = Decimal('0.00')
    
    for account in accounts_query:
        # Calculate balance for the period
        balance = calculate_account_balance_for_period(db, account.id, start_date, end_date)
        
        if balance != 0:
            line = schemas.FinancialStatementLine(
                account_code=account.account_code,
                account_name=account.account_name,
                amount=balance,
                level=0
            )
            
            if account.account_type in ["Income", "Revenue"]:
                revenue.append(line)
                total_revenue += balance
            elif account.account_type in ["Expense", "Expenses"]:
                expenses.append(line)
                total_expenses += balance
    
    net_income = total_revenue - total_expenses
    
    return schemas.IncomeStatementData(
        revenue=revenue,
        expenses=expenses,
        total_revenue=total_revenue,
        total_expenses=total_expenses,
        net_income=net_income,
        start_date=start_date,
        end_date=end_date,
        company_name=company.name
    )

def calculate_account_balance_as_of_date(db: Session, account_id: int, as_of_date: date) -> Decimal:
    """Calculate GL account balance as of a specific date"""
    
    # Sum all posted journal entry lines for this account up to the date
    result = db.query(
        func.coalesce(func.sum(models.GLJournalEntryLine.debit_amount), 0) -
        func.coalesce(func.sum(models.GLJournalEntryLine.credit_amount), 0)
    ).join(models.GLJournalEntry).filter(
        models.GLJournalEntryLine.gl_account_id == account_id,
        models.GLJournalEntry.status == "Posted",
        models.GLJournalEntry.entry_date <= as_of_date
    ).scalar()
    
    return Decimal(str(result or 0))

def calculate_account_balance_for_period(
    db: Session, 
    account_id: int, 
    start_date: date, 
    end_date: date
) -> Decimal:
    """Calculate GL account balance for a specific period"""
    
    result = db.query(
        func.coalesce(func.sum(models.GLJournalEntryLine.debit_amount), 0) -
        func.coalesce(func.sum(models.GLJournalEntryLine.credit_amount), 0)
    ).join(models.GLJournalEntry).filter(
        models.GLJournalEntryLine.gl_account_id == account_id,
        models.GLJournalEntry.status == "Posted",
        models.GLJournalEntry.entry_date >= start_date,
        models.GLJournalEntry.entry_date <= end_date
    ).scalar()
    
    return Decimal(str(result or 0))

def generate_detailed_ar_aging(
    db: Session, 
    company_id: int, 
    as_of_date: date
) -> List[schemas.ARAgingDetail]:
    """Generate detailed AR aging with customer details"""
    
    customers = db.query(models.Customer).filter(
        models.Customer.company_id == company_id,
        models.Customer.is_active == True
    ).all()
    
    aging_details = []
    
    for customer in customers:
        # Get all open AR transactions for this customer
        open_transactions = db.query(models.ARTransaction).filter(
            models.ARTransaction.customer_id == customer.id,
            models.ARTransaction.open_amount > 0,
            models.ARTransaction.status.in_(["Posted", "PartiallyPaid"])
        ).all()
        
        current = Decimal('0.00')
        days_30 = Decimal('0.00')
        days_60 = Decimal('0.00')
        days_90 = Decimal('0.00')
        days_120_plus = Decimal('0.00')
        
        for transaction in open_transactions:
            days_overdue = (as_of_date - (transaction.due_date or transaction.transaction_date)).days
            amount = transaction.open_amount
            
            if days_overdue <= 0:
                current += amount
            elif days_overdue <= 30:
                days_30 += amount
            elif days_overdue <= 60:
                days_60 += amount
            elif days_overdue <= 90:
                days_90 += amount
            else:
                days_120_plus += amount
        
        total_outstanding = current + days_30 + days_60 + days_90 + days_120_plus
        
        if total_outstanding > 0:  # Only include customers with outstanding balances
            # Get last payment date
            last_payment = db.query(models.ARTransaction).filter(
                models.ARTransaction.customer_id == customer.id,
                models.ARTransaction.ar_transaction_type.has(base_type="Receipt")
            ).order_by(models.ARTransaction.transaction_date.desc()).first()
            
            aging_details.append(schemas.ARAgingDetail(
                customer_id=customer.id,
                customer_name=customer.name,
                customer_code=customer.customer_code,
                total_outstanding=total_outstanding,
                current=current,
                days_30=days_30,
                days_60=days_60,
                days_90=days_90,
                days_120_plus=days_120_plus,
                credit_limit=customer.credit_limit,
                last_payment_date=last_payment.transaction_date if last_payment else None
            ))
    
    return aging_details

def generate_detailed_ap_aging(
    db: Session, 
    company_id: int, 
    as_of_date: date
) -> List[schemas.APAgingDetail]:
    """Generate detailed AP aging with supplier details"""
    
    suppliers = db.query(models.Supplier).filter(
        models.Supplier.company_id == company_id,
        models.Supplier.is_active == True
    ).all()
    
    aging_details = []
    
    for supplier in suppliers:
        # Get all open AP transactions for this supplier
        open_transactions = db.query(models.APTransaction).filter(
            models.APTransaction.supplier_id == supplier.id,
            models.APTransaction.open_amount > 0,
            models.APTransaction.status.in_(["Posted", "PartiallyPaid"])
        ).all()
        
        current = Decimal('0.00')
        days_30 = Decimal('0.00')
        days_60 = Decimal('0.00')
        days_90 = Decimal('0.00')
        days_120_plus = Decimal('0.00')
        
        for transaction in open_transactions:
            days_overdue = (as_of_date - (transaction.due_date or transaction.transaction_date)).days
            amount = transaction.open_amount
            
            if days_overdue <= 0:
                current += amount
            elif days_overdue <= 30:
                days_30 += amount
            elif days_overdue <= 60:
                days_60 += amount
            elif days_overdue <= 90:
                days_90 += amount
            else:
                days_120_plus += amount
        
        total_outstanding = current + days_30 + days_60 + days_90 + days_120_plus
        
        if total_outstanding > 0:
            # Get last payment date
            last_payment = db.query(models.APTransaction).filter(
                models.APTransaction.supplier_id == supplier.id,
                models.APTransaction.ap_transaction_type.has(base_type="Payment")
            ).order_by(models.APTransaction.transaction_date.desc()).first()
            
            aging_details.append(schemas.APAgingDetail(
                supplier_id=supplier.id,
                supplier_name=supplier.name,
                supplier_code=supplier.supplier_code,
                total_outstanding=total_outstanding,
                current=current,
                days_30=days_30,
                days_60=days_60,
                days_90=days_90,
                days_120_plus=days_120_plus,
                last_payment_date=last_payment.transaction_date if last_payment else None
            ))
    
    return aging_details

def get_cashbook_report(
    db: Session, 
    company_id: int, 
    gl_account_id: int, 
    start_date: date, 
    end_date: date
) -> Dict[str, Any]:
    """Generate cashbook report for a specific GL account (bank/cash)"""
    
    # Get opening balance
    opening_balance = calculate_account_balance_as_of_date(db, gl_account_id, start_date - timedelta(days=1))
    
    # Get all transactions for the period
    transactions = db.query(models.GLJournalEntryLine).join(models.GLJournalEntry).filter(
        models.GLJournalEntryLine.gl_account_id == gl_account_id,
        models.GLJournalEntry.status == "Posted",
        models.GLJournalEntry.entry_date >= start_date,
        models.GLJournalEntry.entry_date <= end_date
    ).order_by(models.GLJournalEntry.entry_date, models.GLJournalEntry.id).all()
    
    transaction_details = []
    running_balance = opening_balance
    
    for transaction in transactions:
        amount = transaction.debit_amount - transaction.credit_amount
        running_balance += amount
        
        transaction_details.append({
            'date': transaction.journal_entry.entry_date,
            'reference': transaction.journal_entry.reference,
            'description': transaction.description or transaction.journal_entry.description,
            'debit': transaction.debit_amount,
            'credit': transaction.credit_amount,
            'balance': running_balance
        })
    
    return {
        'opening_balance': opening_balance,
        'closing_balance': running_balance,
        'transactions': transaction_details,
        'total_debits': sum(t.debit_amount for t in transactions),
        'total_credits': sum(t.credit_amount for t in transactions)
    }

def generate_cash_flow_statement(
    db: Session, 
    company_id: int, 
    start_date: date, 
    end_date: date
) -> schemas.CashFlowData:
    """Generate Cash Flow Statement using indirect method"""
    
    company = db.query(models.Company).filter(models.Company.id == company_id).first()
    
    # Start with Net Income from Income Statement
    income_statement = generate_income_statement(db, company_id, start_date, end_date)
    net_income = income_statement.net_income
    
    operating_activities = []
    investing_activities = []
    financing_activities = []
    
    # Operating Activities - Start with Net Income
    operating_activities.append(schemas.FinancialStatementLine(
        account_code="",
        account_name="Net Income",
        amount=net_income,
        level=0
    ))
    
    # Add back non-cash expenses (depreciation, amortization)
    depreciation_accounts = db.query(models.GLAccount).filter(
        models.GLAccount.company_id == company_id,
        models.GLAccount.account_name.ilike('%depreciation%')
    ).all()
    
    total_depreciation = Decimal('0.00')
    for account in depreciation_accounts:
        depreciation = calculate_account_balance_for_period(db, account.id, start_date, end_date)
        if depreciation != 0:
            operating_activities.append(schemas.FinancialStatementLine(
                account_code=account.account_code,
                account_name=f"Add: {account.account_name}",
                amount=abs(depreciation),  # Depreciation is typically a credit, so we add it back
                level=1
            ))
            total_depreciation += abs(depreciation)
    
    # Changes in working capital (simplified - can be enhanced)
    # This is a simplified version - in practice, you'd calculate changes in specific accounts
    
    net_cash_from_operating = net_income + total_depreciation
    
    # Get cash account balances
    cash_accounts = db.query(models.GLAccount).filter(
        models.GLAccount.company_id == company_id,
        models.GLAccount.account_type == "Asset",
        or_(
            models.GLAccount.account_name.ilike('%cash%'),
            models.GLAccount.account_name.ilike('%bank%')
        )
    ).all()
    
    beginning_cash = Decimal('0.00')
    ending_cash = Decimal('0.00')
    
    for account in cash_accounts:
        beginning_cash += calculate_account_balance_as_of_date(db, account.id, start_date - timedelta(days=1))
        ending_cash += calculate_account_balance_as_of_date(db, account.id, end_date)
    
    # For now, assume no investing or financing activities (can be enhanced)
    net_cash_from_investing = Decimal('0.00')
    net_cash_from_financing = Decimal('0.00')
    
    net_change_in_cash = ending_cash - beginning_cash
    
    return schemas.CashFlowData(
        operating_activities=operating_activities,
        investing_activities=investing_activities,
        financing_activities=financing_activities,
        net_cash_from_operating=net_cash_from_operating,
        net_cash_from_investing=net_cash_from_investing,
        net_cash_from_financing=net_cash_from_financing,
        net_change_in_cash=net_change_in_cash,
        beginning_cash=beginning_cash,
        ending_cash=ending_cash,
        start_date=start_date,
        end_date=end_date,
        company_name=company.name
    )

def get_chart_of_accounts_report(
    db: Session, 
    company_id: int, 
    include_inactive: bool = False
) -> List[Dict[str, Any]]:
    """Generate Chart of Accounts report"""
    
    query = db.query(models.GLAccount).filter(
        models.GLAccount.company_id == company_id
    )
    
    if not include_inactive:
        query = query.filter(models.GLAccount.is_active == True)
    
    accounts = query.order_by(models.GLAccount.account_code).all()
    
    chart_data = []
    for account in accounts:
        chart_data.append({
            'account_code': account.account_code,
            'account_name': account.account_name,
            'account_type': account.account_type,
            'is_active': account.is_active,
            'description': account.description,
            'current_balance': calculate_account_balance_as_of_date(db, account.id, date.today())
        })
    
    return chart_data

# CRUD for Report Templates
def create_report_template(
    db: Session, 
    template: schemas.ReportTemplateCreate, 
    company_id: int, 
    user_id: int
) -> models.ReportTemplate:
    db_template = models.ReportTemplate(
        company_id=company_id,
        created_by_user_id=user_id,
        **template.model_dump()
    )
    db.add(db_template)
    db.commit()
    db.refresh(db_template)
    return db_template

def get_report_templates_by_company(
    db: Session, 
    company_id: int, 
    report_type: Optional[str] = None
) -> List[models.ReportTemplate]:
    query = db.query(models.ReportTemplate).filter(
        models.ReportTemplate.company_id == company_id,
        models.ReportTemplate.is_active == True
    )
    if report_type:
        query = query.filter(models.ReportTemplate.report_type == report_type)
    return query.all()

def update_report_template(
    db: Session, 
    template_id: int, 
    template_update: schemas.ReportTemplateCreate
) -> Optional[models.ReportTemplate]:
    db_template = db.query(models.ReportTemplate).filter(
        models.ReportTemplate.id == template_id
    ).first()
    if db_template:
        for field, value in template_update.model_dump().items():
            setattr(db_template, field, value)
        db.commit()
        db.refresh(db_template)
    return db_template

def delete_report_template(db: Session, template_id: int) -> bool:
    db_template = db.query(models.ReportTemplate).filter(
        models.ReportTemplate.id == template_id
    ).first()
    if db_template:
        db_template.is_active = False
        db.commit()
        return True
    return False

# CRUD for Bank Reconciliation
def create_bank_reconciliation(
    db: Session, 
    reconciliation: schemas.BankReconciliationCreate, 
    company_id: int, 
    user_id: int
) -> models.BankReconciliation:
    db_reconciliation = models.BankReconciliation(
        company_id=company_id,
        created_by_user_id=user_id,
        **reconciliation.model_dump()
    )
    db.add(db_reconciliation)
    db.commit()
    db.refresh(db_reconciliation)
    return db_reconciliation

def get_bank_reconciliations_by_company(
    db: Session, 
    company_id: int, 
    status: Optional[str] = None
) -> List[models.BankReconciliation]:
    query = db.query(models.BankReconciliation).filter(
        models.BankReconciliation.company_id == company_id
    )
    if status:
        query = query.filter(models.BankReconciliation.status == status)
    return query.order_by(models.BankReconciliation.reconciliation_date.desc()).all()

def update_bank_reconciliation_status(
    db: Session, 
    reconciliation_id: int, 
    status: str
) -> Optional[models.BankReconciliation]:
    db_reconciliation = db.query(models.BankReconciliation).filter(
        models.BankReconciliation.id == reconciliation_id
    ).first()
    if db_reconciliation:
        db_reconciliation.status = status
        db.commit()
        db.refresh(db_reconciliation)
    return db_reconciliation

def add_reconciliation_item(
    db: Session,
    reconciliation_id: int,
    item_type: str,
    description: str,
    amount: Decimal,
    gl_journal_entry_line_id: Optional[int] = None
) -> models.BankReconciliationItem:
    db_item = models.BankReconciliationItem(
        bank_reconciliation_id=reconciliation_id,
        gl_journal_entry_line_id=gl_journal_entry_line_id,
        item_type=item_type,
        description=description,
        amount=amount
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

def get_unreconciled_transactions(
    db: Session,
    company_id: int,
    gl_account_id: int,
    up_to_date: date
) -> List[models.GLJournalEntryLine]:
    """Get unreconciled transactions for bank reconciliation"""
    
    # Get all posted transactions that haven't been reconciled
    unreconciled = db.query(models.GLJournalEntryLine).join(models.GLJournalEntry).filter(
        models.GLJournalEntryLine.gl_account_id == gl_account_id,
        models.GLJournalEntry.status == "Posted",
        models.GLJournalEntry.entry_date <= up_to_date,
        ~models.GLJournalEntryLine.id.in_(
            db.query(models.BankReconciliationItem.gl_journal_entry_line_id).filter(
                models.BankReconciliationItem.gl_journal_entry_line_id.isnot(None),
                models.BankReconciliationItem.is_reconciled == True
            )
        )
    ).order_by(models.GLJournalEntry.entry_date).all()
    
    return unreconciled
