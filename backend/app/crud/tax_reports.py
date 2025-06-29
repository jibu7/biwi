from datetime import date
from typing import List, Dict
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import func
from app import models


class TaxReportService:
    @staticmethod
    def get_tax_summary_report(
        db: Session,
        company_id: int,
        start_date: date,
        end_date: date
    ) -> Dict[str, any]:
        """Generate tax summary report showing input/output taxes"""
        
        # Get all tax types
        tax_types = db.query(models.TaxType).filter(
            models.TaxType.company_id == company_id,
            models.TaxType.is_active == True
        ).all()
        
        tax_summary = {
            "sales_taxes": {},
            "purchase_taxes": {},
            "totals": {
                "total_sales_tax": Decimal("0"),
                "total_purchase_tax": Decimal("0"),
                "net_tax_payable": Decimal("0")
            }
        }
        
        for tax_type in tax_types:
            # Sales taxes (from AR transactions)
            if tax_type.tax_nature == "Sales":
                ar_taxes = db.query(
                    func.sum(models.ARTransactionTaxLine.base_currency_tax_amount)
                ).join(
                    models.ARTransaction
                ).filter(
                    models.ARTransactionTaxLine.tax_type_id == tax_type.id,
                    models.ARTransaction.company_id == company_id,
                    models.ARTransaction.transaction_date.between(start_date, end_date),
                    models.ARTransaction.status.in_(["Posted", "Paid", "PartiallyPaid"])
                ).scalar() or Decimal("0")
                
                tax_summary["sales_taxes"][tax_type.name] = {
                    "tax_amount": ar_taxes,
                    "rate": tax_type.rate_percentage
                }
                tax_summary["totals"]["total_sales_tax"] += ar_taxes
            
            # Purchase taxes (from AP transactions)
            elif tax_type.tax_nature == "Purchases":
                ap_taxes = db.query(
                    func.sum(models.APTransactionTaxLine.base_currency_tax_amount)
                ).join(
                    models.APTransaction
                ).filter(
                    models.APTransactionTaxLine.tax_type_id == tax_type.id,
                    models.APTransaction.company_id == company_id,
                    models.APTransaction.transaction_date.between(start_date, end_date),
                    models.APTransaction.status.in_(["Posted", "Paid", "PartiallyPaid"])
                ).scalar() or Decimal("0")
                
                tax_summary["purchase_taxes"][tax_type.name] = {
                    "tax_amount": ap_taxes,
                    "rate": tax_type.rate_percentage
                }
                tax_summary["totals"]["total_purchase_tax"] += ap_taxes
        
        # Calculate net tax payable (Sales tax - Purchase tax)
        tax_summary["totals"]["net_tax_payable"] = (
            tax_summary["totals"]["total_sales_tax"] - 
            tax_summary["totals"]["total_purchase_tax"]
        )
        
        return tax_summary
    
    @staticmethod
    def get_detailed_tax_report(
        db: Session,
        company_id: int,
        start_date: date,
        end_date: date,
        tax_type_id: int = None
    ) -> Dict[str, any]:
        """Generate detailed tax report showing all transactions with tax"""
        
        # Build base query for AR transactions
        ar_query = db.query(
            models.ARTransaction.document_number,
            models.ARTransaction.transaction_date,
            models.Customer.name.label("customer_name"),
            models.TaxType.name.label("tax_type_name"),
            models.ARTransactionTaxLine.taxable_amount,
            models.ARTransactionTaxLine.tax_amount,
            models.ARTransactionTaxLine.base_currency_tax_amount
        ).join(
            models.ARTransactionTaxLine
        ).join(
            models.TaxType
        ).join(
            models.Customer
        ).filter(
            models.ARTransaction.company_id == company_id,
            models.ARTransaction.transaction_date.between(start_date, end_date),
            models.ARTransaction.status.in_(["Posted", "Paid", "PartiallyPaid"])
        )
        
        # Build base query for AP transactions
        ap_query = db.query(
            models.APTransaction.document_number,
            models.APTransaction.transaction_date,
            models.Supplier.name.label("supplier_name"),
            models.TaxType.name.label("tax_type_name"),
            models.APTransactionTaxLine.taxable_amount,
            models.APTransactionTaxLine.tax_amount,
            models.APTransactionTaxLine.base_currency_tax_amount
        ).join(
            models.APTransactionTaxLine
        ).join(
            models.TaxType
        ).join(
            models.Supplier
        ).filter(
            models.APTransaction.company_id == company_id,
            models.APTransaction.transaction_date.between(start_date, end_date),
            models.APTransaction.status.in_(["Posted", "Paid", "PartiallyPaid"])
        )
        
        # Filter by tax type if specified
        if tax_type_id:
            ar_query = ar_query.filter(models.ARTransactionTaxLine.tax_type_id == tax_type_id)
            ap_query = ap_query.filter(models.APTransactionTaxLine.tax_type_id == tax_type_id)
        
        # Execute queries
        ar_results = ar_query.all()
        ap_results = ap_query.all()
        
        # Format results
        detailed_report = {
            "sales_transactions": [],
            "purchase_transactions": [],
            "summary": {
                "total_sales_tax": Decimal("0"),
                "total_purchase_tax": Decimal("0"),
                "net_tax": Decimal("0")
            }
        }
        
        # Process AR transactions
        for row in ar_results:
            detailed_report["sales_transactions"].append({
                "document_number": row.document_number,
                "transaction_date": row.transaction_date,
                "customer_name": row.customer_name,
                "tax_type": row.tax_type_name,
                "taxable_amount": row.taxable_amount,
                "tax_amount": row.tax_amount,
                "base_currency_tax_amount": row.base_currency_tax_amount
            })
            detailed_report["summary"]["total_sales_tax"] += row.base_currency_tax_amount
        
        # Process AP transactions
        for row in ap_results:
            detailed_report["purchase_transactions"].append({
                "document_number": row.document_number,
                "transaction_date": row.transaction_date,
                "supplier_name": row.supplier_name,
                "tax_type": row.tax_type_name,
                "taxable_amount": row.taxable_amount,
                "tax_amount": row.tax_amount,
                "base_currency_tax_amount": row.base_currency_tax_amount
            })
            detailed_report["summary"]["total_purchase_tax"] += row.base_currency_tax_amount
        
        # Calculate net tax
        detailed_report["summary"]["net_tax"] = (
            detailed_report["summary"]["total_sales_tax"] - 
            detailed_report["summary"]["total_purchase_tax"]
        )
        
        return detailed_report
    
    @staticmethod
    def get_tax_return_data(
        db: Session,
        company_id: int,
        start_date: date,
        end_date: date
    ) -> Dict[str, any]:
        """Generate tax return data for filing with tax authorities"""
        
        # Get company's base currency
        base_currency = db.query(models.Currency).filter(
            models.Currency.company_id == company_id,
            models.Currency.is_base_currency == True
        ).first()
        
        # Get tax summary
        tax_summary = TaxReportService.get_tax_summary_report(
            db, company_id, start_date, end_date
        )
        
        # Format for tax return
        tax_return = {
            "reporting_period": {
                "start_date": start_date,
                "end_date": end_date
            },
            "currency": base_currency.code if base_currency else "USD",
            "tax_return_summary": {
                "output_tax": tax_summary["totals"]["total_sales_tax"],
                "input_tax": tax_summary["totals"]["total_purchase_tax"],
                "net_tax_payable": tax_summary["totals"]["net_tax_payable"]
            },
            "breakdown_by_tax_type": {}
        }
        
        # Add breakdown by tax type
        for tax_name, tax_data in tax_summary["sales_taxes"].items():
            if tax_name not in tax_return["breakdown_by_tax_type"]:
                tax_return["breakdown_by_tax_type"][tax_name] = {
                    "output_tax": Decimal("0"),
                    "input_tax": Decimal("0"),
                    "rate": tax_data["rate"]
                }
            tax_return["breakdown_by_tax_type"][tax_name]["output_tax"] = tax_data["tax_amount"]
        
        for tax_name, tax_data in tax_summary["purchase_taxes"].items():
            if tax_name not in tax_return["breakdown_by_tax_type"]:
                tax_return["breakdown_by_tax_type"][tax_name] = {
                    "output_tax": Decimal("0"),
                    "input_tax": Decimal("0"),
                    "rate": tax_data["rate"]
                }
            tax_return["breakdown_by_tax_type"][tax_name]["input_tax"] = tax_data["tax_amount"]
        
        return tax_return
    
    @staticmethod
    def get_multi_currency_tax_report(
        db: Session,
        company_id: int,
        start_date: date,
        end_date: date
    ) -> Dict[str, any]:
        """Generate tax report showing taxes in multiple currencies"""
        
        # Get all currencies used in the period
        currencies_query = db.query(models.Currency).join(
            models.ARTransaction, models.Currency.id == models.ARTransaction.currency_id
        ).filter(
            models.ARTransaction.company_id == company_id,
            models.ARTransaction.transaction_date.between(start_date, end_date)
        ).union(
            db.query(models.Currency).join(
                models.APTransaction, models.Currency.id == models.APTransaction.currency_id
            ).filter(
                models.APTransaction.company_id == company_id,
                models.APTransaction.transaction_date.between(start_date, end_date)
            )
        ).distinct()
        
        currencies = currencies_query.all()
        
        currency_report = {
            "base_currency_summary": TaxReportService.get_tax_summary_report(
                db, company_id, start_date, end_date
            ),
            "by_currency": {}
        }
        
        for currency in currencies:
            # Get AR taxes in this currency
            ar_taxes_foreign = db.query(
                models.TaxType.name,
                func.sum(models.ARTransactionTaxLine.tax_amount).label("foreign_tax"),
                func.sum(models.ARTransactionTaxLine.base_currency_tax_amount).label("base_tax")
            ).join(
                models.ARTransaction
            ).join(
                models.TaxType
            ).filter(
                models.ARTransaction.company_id == company_id,
                models.ARTransaction.currency_id == currency.id,
                models.ARTransaction.transaction_date.between(start_date, end_date),
                models.ARTransaction.status.in_(["Posted", "Paid", "PartiallyPaid"])
            ).group_by(models.TaxType.name).all()
            
            # Get AP taxes in this currency
            ap_taxes_foreign = db.query(
                models.TaxType.name,
                func.sum(models.APTransactionTaxLine.tax_amount).label("foreign_tax"),
                func.sum(models.APTransactionTaxLine.base_currency_tax_amount).label("base_tax")
            ).join(
                models.APTransaction
            ).join(
                models.TaxType
            ).filter(
                models.APTransaction.company_id == company_id,
                models.APTransaction.currency_id == currency.id,
                models.APTransaction.transaction_date.between(start_date, end_date),
                models.APTransaction.status.in_(["Posted", "Paid", "PartiallyPaid"])
            ).group_by(models.TaxType.name).all()
            
            currency_report["by_currency"][currency.code] = {
                "currency_name": currency.name,
                "sales_taxes": {row.name: {"foreign_amount": row.foreign_tax, "base_amount": row.base_tax} for row in ar_taxes_foreign},
                "purchase_taxes": {row.name: {"foreign_amount": row.foreign_tax, "base_amount": row.base_tax} for row in ap_taxes_foreign}
            }
        
        return currency_report
