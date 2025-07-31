from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, Optional, Tuple
from app.models.gl import TaxCalculationMethod

class TaxCalculator:
    """Service for calculating tax amounts based on different methods"""
    
    @staticmethod
    def calculate_tax(
        amount: Decimal,
        tax_rate: Decimal,
        method: TaxCalculationMethod
    ) -> Dict[str, Decimal]:
        """
        Calculate tax based on the method
        Returns: {
            'net_amount': Decimal,
            'tax_amount': Decimal,
            'total_amount': Decimal
        }
        """
        if method == TaxCalculationMethod.NONE or not tax_rate:
            return {
                'net_amount': amount,
                'tax_amount': Decimal('0.00'),
                'total_amount': amount
            }
        
        tax_rate_decimal = tax_rate / Decimal('100')
        
        if method == TaxCalculationMethod.EXCLUSIVE:
            # Tax is added to the amount
            net_amount = amount
            tax_amount = (net_amount * tax_rate_decimal).quantize(
                Decimal('0.01'), rounding=ROUND_HALF_UP
            )
            total_amount = net_amount + tax_amount
            
        elif method == TaxCalculationMethod.INCLUSIVE:
            # Tax is included in the amount
            total_amount = amount
            net_amount = (total_amount / (Decimal('1') + tax_rate_decimal)).quantize(
                Decimal('0.01'), rounding=ROUND_HALF_UP
            )
            tax_amount = total_amount - net_amount
            
        else:
            raise ValueError(f"Invalid tax calculation method: {method}")
        
        return {
            'net_amount': net_amount,
            'tax_amount': tax_amount,
            'total_amount': total_amount
        }
    
    @staticmethod
    def validate_tax_configuration(
        transaction_type,
        raise_on_error: bool = True
    ) -> Tuple[bool, Optional[str]]:
        """
        Validate that tax configuration is complete
        Returns: (is_valid, error_message)
        """
        if not transaction_type.is_tax_applicable:
            return True, None
            
        errors = []
        
        if not transaction_type.default_tax_control_account_id:
            errors.append("Tax control account is required when tax is applicable")
            
        if not transaction_type.tax_rate or transaction_type.tax_rate <= 0:
            errors.append("Valid tax rate is required when tax is applicable")
            
        if transaction_type.tax_calculation_method == TaxCalculationMethod.NONE:
            errors.append("Tax calculation method must be specified when tax is applicable")
            
        if errors:
            error_message = "; ".join(errors)
            if raise_on_error:
                raise ValueError(error_message)
            return False, error_message
            
        return True, None
