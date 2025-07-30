from typing import List, Dict, Any, Optional
from datetime import datetime, date, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, desc, case

from app.database.database import get_db
from app.core.security import get_current_user
from app.models.core import User
from app.models.ar import Customer, ARTransaction
from app.models.ap import Supplier, APTransaction
from app.models.gl import GLAccount, GLJournalEntry, GLJournalEntryLine 
from app.models.inventory import InventoryItem, InventoryItemLocation, InventoryTransaction
from app.schemas.analytics import (
    ExecutiveDashboardResponse,
    KPIData,
    ChartData,
    AlertData,
    TimeRangeFilter
)

router = APIRouter()

@router.get("/executive-dashboard", response_model=ExecutiveDashboardResponse)
async def get_executive_dashboard(
    time_range: TimeRangeFilter = TimeRangeFilter.THIRTY_DAYS,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get executive dashboard analytics data"""
    
    try:
        # Calculate date range based on filter
        end_date = datetime.now().date()
        if time_range == TimeRangeFilter.SEVEN_DAYS:
            start_date = end_date - timedelta(days=7)
        elif time_range == TimeRangeFilter.THIRTY_DAYS:
            start_date = end_date - timedelta(days=30)
        elif time_range == TimeRangeFilter.NINETY_DAYS:
            start_date = end_date - timedelta(days=90)
        else:  # ONE_YEAR
            start_date = end_date - timedelta(days=365)
        
        company_id = current_user.company_id
        
        # Get KPI data
        kpis = await _get_kpi_data(db, company_id, start_date, end_date)
        
        # Get chart data  
        charts = await _get_chart_data(db, company_id, start_date, end_date)
        
        # Get alerts
        alerts = await _get_alert_data(db, company_id)
        
        return ExecutiveDashboardResponse(
            kpis=kpis,
            charts=charts,
            alerts=alerts,
            last_updated=datetime.now()
        )
    except Exception as e:
        # Log the error and return a fallback response
        print(f"Analytics error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analytics calculation failed: {str(e)}")

async def _get_kpi_data(db: Session, company_id: int, start_date: date, end_date: date) -> Dict[str, KPIData]:
    """Calculate KPI metrics from actual ERP data"""
    
    # Total Revenue (from AR transactions - invoices)
    revenue_query = db.query(func.sum(ARTransaction.total_amount)).filter(
        and_(
            ARTransaction.company_id == company_id,
            ARTransaction.transaction_date.between(start_date, end_date),
            ARTransaction.status.in_(["Posted", "Paid", "PartiallyPaid"])
        )
    )
    total_revenue = revenue_query.scalar() or 0
    
    # Calculate revenue change (compare to previous period)
    prev_start = start_date - (end_date - start_date)
    prev_revenue = db.query(func.sum(ARTransaction.total_amount)).filter(
        and_(
            ARTransaction.company_id == company_id,
            ARTransaction.transaction_date.between(prev_start, start_date),
            ARTransaction.status.in_(["Posted", "Paid", "PartiallyPaid"])
        )
    ).scalar() or 0
    
    revenue_change = _calculate_percentage_change(total_revenue, prev_revenue)
    
    # Net Profit (Revenue - Expenses from GL)
    # Get income accounts total
    income_total = db.query(func.sum(GLAccount.current_balance)).filter(
        and_(
            GLAccount.company_id == company_id,
            GLAccount.account_type == "Income",
            GLAccount.is_active == True
        )
    ).scalar() or 0
    
    # Get expense accounts total  
    expense_total = db.query(func.sum(GLAccount.current_balance)).filter(
        and_(
            GLAccount.company_id == company_id,
            GLAccount.account_type == "Expense",
            GLAccount.is_active == True
        )
    ).scalar() or 0
    
    net_profit = income_total - expense_total
    
    # Cash Flow (simplified - cash/bank accounts balance)
    cash_accounts = db.query(func.sum(GLAccount.current_balance)).filter(
        and_(
            GLAccount.company_id == company_id,
            GLAccount.account_type == "Asset",
            GLAccount.account_name.ilike("%cash%"),
            GLAccount.is_active == True
        )
    ).scalar() or 0
    
    bank_accounts = db.query(func.sum(GLAccount.current_balance)).filter(
        and_(
            GLAccount.company_id == company_id,
            GLAccount.account_type == "Asset", 
            GLAccount.account_name.ilike("%bank%"),
            GLAccount.is_active == True
        )
    ).scalar() or 0
    
    cash_flow = cash_accounts + bank_accounts
    
    # Active Customers
    active_customers = db.query(func.count(Customer.id)).filter(
        and_(
            Customer.company_id == company_id,
            Customer.is_active == True
        )
    ).scalar() or 0
    
    # Outstanding AR
    outstanding_ar = db.query(func.sum(ARTransaction.open_amount)).filter(
        and_(
            ARTransaction.company_id == company_id,
            ARTransaction.open_amount > 0,
            ARTransaction.status.in_(["Posted", "PartiallyPaid"])
        )
    ).scalar() or 0
    
    # Outstanding AP
    outstanding_ap = db.query(func.sum(APTransaction.open_amount)).filter(
        and_(
            APTransaction.company_id == company_id,
            APTransaction.open_amount > 0,
            APTransaction.status.in_(["Posted", "PartiallyPaid"])
        )
    ).scalar() or 0
    
    return {
        "totalRevenue": KPIData(
            value=f"${total_revenue:,.2f}",
            change=f"{revenue_change:+.1f}%"
        ),
        "netProfit": KPIData(
            value=f"${net_profit:,.2f}",
            change="+0.0%"  # TODO: Calculate change
        ),
        "cashFlow": KPIData(
            value=f"${cash_flow:,.2f}",
            change="+0.0%"  # TODO: Calculate change
        ),
        "activeCustomers": KPIData(
            value=str(active_customers),
            change="+0"  # TODO: Calculate change
        ),
        "outstandingAR": KPIData(
            value=f"${outstanding_ar:,.2f}",
            change="+0.0%"
        ),
        "outstandingAP": KPIData(
            value=f"${outstanding_ap:,.2f}",
            change="+0.0%"
        )
    }

async def _get_chart_data(db: Session, company_id: int, start_date: date, end_date: date) -> Dict[str, List[ChartData]]:
    """Generate chart data from ERP transactions"""
    
    # Revenue by month (last 12 months)
    revenue_by_month = []
    current_date = end_date
    for i in range(12):
        month_start = current_date.replace(day=1)
        if i == 0:
            month_end = current_date
        else:
            month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)
        
        revenue = db.query(func.sum(ARTransaction.total_amount)).filter(
            and_(
                ARTransaction.company_id == company_id,
                ARTransaction.transaction_date.between(month_start, month_end),
                ARTransaction.status.in_(["Posted", "Paid", "PartiallyPaid"])
            )
        ).scalar() or 0
        
        revenue_by_month.insert(0, ChartData(
            label=month_start.strftime("%b"),
            value=float(revenue)
        ))
        
        # Move to previous month
        current_date = month_start - timedelta(days=1)
    
    # Expense breakdown by account type
    expense_breakdown = []
    expense_accounts = db.query(
        GLAccount.account_name,
        GLAccount.current_balance
    ).filter(
        and_(
            GLAccount.company_id == company_id,
            GLAccount.account_type == "Expense",
            GLAccount.is_active == True,
            GLAccount.current_balance > 0
        )
    ).order_by(desc(GLAccount.current_balance)).limit(10).all()
    
    for account in expense_accounts:
        expense_breakdown.append(ChartData(
            label=account.account_name,
            value=float(account.current_balance)
        ))
    
    # Top customers by revenue
    top_customers = db.query(
        Customer.name,
        func.sum(ARTransaction.total_amount).label("total_revenue")
    ).join(ARTransaction).filter(
        and_(
            Customer.company_id == company_id,
            ARTransaction.transaction_date.between(start_date, end_date),
            ARTransaction.status.in_(["Posted", "Paid", "PartiallyPaid"])
        )
    ).group_by(Customer.id, Customer.name).order_by(desc("total_revenue")).limit(10).all()
    
    top_customers_data = []
    for customer in top_customers:
        top_customers_data.append(ChartData(
            label=customer.name,
            value=float(customer.total_revenue)
        ))
    
    return {
        "revenueByMonth": revenue_by_month,
        "expenseBreakdown": expense_breakdown,
        "topCustomers": top_customers_data,
        "salesFunnel": [  # Placeholder - would need more complex logic
            ChartData(label="Leads", value=100),
            ChartData(label="Prospects", value=75),
            ChartData(label="Qualified", value=50),
            ChartData(label="Customers", value=25)
        ]
    }

async def _get_alert_data(db: Session, company_id: int) -> List[AlertData]:
    """Generate system alerts based on business rules"""
    alerts = []
    
    # Check for overdue AR
    overdue_count = db.query(func.count(ARTransaction.id)).filter(
        and_(
            ARTransaction.company_id == company_id,
            ARTransaction.due_date < datetime.now().date(),
            ARTransaction.open_amount > 0
        )
    ).scalar() or 0
    
    if overdue_count > 0:
        alerts.append(AlertData(
            type="warning",
            message=f"{overdue_count} overdue invoices require attention"
        ))
    
    # Check for low inventory using item locations
    low_inventory_count = db.query(func.count(InventoryItemLocation.id)).filter(
        and_(
            InventoryItemLocation.company_id == company_id,
            InventoryItemLocation.quantity_on_hand < 10,  # Simple threshold
        )
    ).scalar() or 0
    
    if low_inventory_count > 0:
        alerts.append(AlertData(
            type="warning", 
            message=f"{low_inventory_count} items have low inventory levels"
        ))
    
    # Check for unposted transactions
    unposted_count = db.query(func.count(GLJournalEntry.id)).filter(
        and_(
            GLJournalEntry.company_id == company_id,
            GLJournalEntry.status == "Draft"
        )
    ).scalar() or 0
    
    if unposted_count > 0:
        alerts.append(AlertData(
            type="info",
            message=f"{unposted_count} journal entries are pending posting"
        ))
    
    return alerts

def _calculate_percentage_change(current: float, previous: float) -> float:
    """Calculate percentage change between two values"""
    if previous == 0:
        return 100.0 if current > 0 else 0.0
    return ((current - previous) / previous) * 100