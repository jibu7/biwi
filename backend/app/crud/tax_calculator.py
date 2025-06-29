from typing import List, Dict
from decimal import Decimal
from sqlalchemy.orm import Session
from app import models, schemas


class TaxCalculator:
    @staticmethod
    def calculate_tax_for_line(
        db: Session,
        amount: Decimal,
        tax_type_id: int,
        company_id: int
    ) -> Dict[str, Decimal]:
        """Calculate tax for a single line item"""
        tax_type = db.query(models.TaxType).filter(
            models.TaxType.id == tax_type_id,
            models.TaxType.company_id == company_id
        ).first()
        
        if not tax_type:
            return {"tax_amount": Decimal("0"), "total_amount": amount}
        
        tax_amount = amount * (tax_type.rate_percentage / 100)
        total_amount = amount + tax_amount
        
        return {
            "tax_amount": tax_amount,
            "total_amount": total_amount,
            "tax_rate": tax_type.rate_percentage
        }
    
    @staticmethod
    def calculate_taxes_for_document(
        db: Session,
        lines: List[schemas.DocumentLineWithTax],
        company_id: int
    ) -> Dict[str, any]:
        """Calculate taxes for an entire document"""
        tax_summary = {}
        subtotal = Decimal("0")
        total_tax = Decimal("0")
        
        for line in lines:
            line_amount = line.quantity * line.unit_price * (1 - line.discount_percentage / 100)
            subtotal += line_amount
            
            if line.tax_type_id:
                tax_calc = TaxCalculator.calculate_tax_for_line(
                    db, line_amount, line.tax_type_id, company_id
                )
                tax_amount = tax_calc["tax_amount"]
                total_tax += tax_amount
                
                # Summarize by tax type
                if line.tax_type_id not in tax_summary:
                    tax_summary[line.tax_type_id] = {
                        "taxable_amount": Decimal("0"),
                        "tax_amount": Decimal("0")
                    }
                
                tax_summary[line.tax_type_id]["taxable_amount"] += line_amount
                tax_summary[line.tax_type_id]["tax_amount"] += tax_amount
        
        return {
            "subtotal": subtotal,
            "tax_summary": tax_summary,
            "total_tax": total_tax,
            "grand_total": subtotal + total_tax
        }
