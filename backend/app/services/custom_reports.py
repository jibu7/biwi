# app/services/custom_reports.py
from sqlalchemy.orm import Session
from sqlalchemy import text, and_, or_
from typing import Dict, List, Any
import pandas as pd
from app.schemas.reporting import CustomReportBuilder

class CustomReportService:
    def __init__(self, db: Session, company_id: int):
        self.db = db
        self.company_id = company_id
    
    def build_custom_report(self, builder: CustomReportBuilder) -> Dict[str, Any]:
        """
        Build custom report based on configuration
        """
        # Map data sources to tables
        source_mapping = {
            "gl_transactions": self._query_gl_transactions,
            "ar_transactions": self._query_ar_transactions,
            "ap_transactions": self._query_ap_transactions,
            "inventory": self._query_inventory,
            "customers": self._query_customers,
            "suppliers": self._query_suppliers
        }
        
        if builder.data_source not in source_mapping:
            raise ValueError(f"Invalid data source: {builder.data_source}")
        
        # Get base data
        data = source_mapping[builder.data_source](builder.filters)
        
        # Convert to DataFrame for easier manipulation
        df = pd.DataFrame(data)
        
        if df.empty:
            return {
                "name": builder.name,
                "data": [],
                "summary": {}
            }
        
        # Apply grouping
        if builder.grouping:
            df = df.groupby(builder.grouping, as_index=False).agg(
                builder.aggregations or 'sum'
            )
        
        # Apply sorting
        if builder.sorting:
            df = df.sort_values(
                by=list(builder.sorting.keys()),
                ascending=[v == 'asc' for v in builder.sorting.values()]
            )
        
        # Select columns
        if builder.columns:
            column_names = [col['name'] for col in builder.columns]
            df = df[column_names]
        
        # Calculate summary statistics
        summary = {}
        for col in df.select_dtypes(include=['number']).columns:
            summary[col] = {
                "sum": float(df[col].sum()),
                "avg": float(df[col].mean()),
                "min": float(df[col].min()),
                "max": float(df[col].max()),
                "count": len(df)
            }
        
        return {
            "name": builder.name,
            "data": df.to_dict('records'),
            "summary": summary,
            "row_count": len(df),
            "columns": list(df.columns)
        }
    
    def _query_gl_transactions(self, filters: Dict) -> List[Dict]:
        """Query GL transactions with filters"""
        query = """
            SELECT 
                je.entry_date,
                je.reference,
                je.description,
                ga.account_code,
                ga.account_name,
                jel.description as line_description,
                jel.debit_amount,
                jel.credit_amount
            FROM gl_journal_entries je
            JOIN gl_journal_entry_lines jel ON je.id = jel.journal_entry_id
            JOIN gl_accounts ga ON jel.gl_account_id = ga.id
            WHERE je.company_id = :company_id
                AND je.status = 'Posted'
        """
        
        params = {"company_id": self.company_id}
        
        if 'start_date' in filters:
            query += " AND je.entry_date >= :start_date"
            params['start_date'] = filters['start_date']
        
        if 'end_date' in filters:
            query += " AND je.entry_date <= :end_date"
            params['end_date'] = filters['end_date']
        
        if 'account_id' in filters:
            query += " AND ga.id = :account_id"
            params['account_id'] = filters['account_id']
        
        result = self.db.execute(text(query), params)
        return [dict(row) for row in result]
    
    def _query_ar_transactions(self, filters: Dict) -> List[Dict]:
        """Query AR transactions with filters"""
        query = """
            SELECT 
                art.transaction_date,
                art.document_number,
                art.reference,
                c.customer_code,
                c.name as customer_name,
                att.name as transaction_type,
                art.total_amount,
                art.open_amount,
                art.status
            FROM ar_transactions art
            JOIN customers c ON art.customer_id = c.id
            JOIN ar_transaction_types att ON art.ar_transaction_type_id = att.id
            WHERE art.company_id = :company_id
        """
        
        params = {"company_id": self.company_id}
        
        if 'customer_id' in filters:
            query += " AND c.id = :customer_id"
            params['customer_id'] = filters['customer_id']
        
        if 'status' in filters:
            query += " AND art.status = :status"
            params['status'] = filters['status']
        
        result = self.db.execute(text(query), params)
        return [dict(row) for row in result]
    
    def _query_ap_transactions(self, filters: Dict) -> List[Dict]:
        """Query AP transactions with filters"""
        # Similar to AR transactions but for AP
        pass
    
    def _query_inventory(self, filters: Dict) -> List[Dict]:
        """Query inventory data with filters"""
        query = """
            SELECT 
                ii.item_code,
                ii.description,
                w.name as warehouse_name,
                iil.quantity_on_hand,
                ii.average_cost,
                (iil.quantity_on_hand * ii.average_cost) as total_value
            FROM inventory_items ii
            JOIN inventory_item_locations iil ON ii.id = iil.item_id
            JOIN warehouses w ON iil.warehouse_id = w.id
            WHERE ii.company_id = :company_id
        """
        
        params = {"company_id": self.company_id}
        
        if 'warehouse_id' in filters:
            query += " AND w.id = :warehouse_id"
            params['warehouse_id'] = filters['warehouse_id']
        
        result = self.db.execute(text(query), params)
        return [dict(row) for row in result]
    
    def _query_customers(self, filters: Dict) -> List[Dict]:
        """Query customer data with filters"""
        query = """
            SELECT 
                customer_code,
                name,
                current_balance,
                credit_limit,
                payment_terms
            FROM customers
            WHERE company_id = :company_id
        """
        
        params = {"company_id": self.company_id}
        result = self.db.execute(text(query), params)
        return [dict(row) for row in result]
    
    def _query_suppliers(self, filters: Dict) -> List[Dict]:
        """Query supplier data with filters"""
        # Similar to customers
        pass
