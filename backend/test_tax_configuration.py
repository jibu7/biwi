#!/usr/bin/env python3
"""
Test script for tax calculation functionality
"""
import sys
import os

# Add the project root to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from decimal import Decimal
from app.models.gl import TaxCalculationMethod
from app.services.tax_calculator import TaxCalculator

def test_tax_calculator():
    """Test the tax calculation functionality"""
    print("Testing Tax Calculator...")
    
    # Test case 1: No tax
    result = TaxCalculator.calculate_tax(
        amount=Decimal('100.00'),
        tax_rate=Decimal('0.00'),
        method=TaxCalculationMethod.NONE
    )
    print(f"No tax test: {result}")
    assert result['net_amount'] == Decimal('100.00')
    assert result['tax_amount'] == Decimal('0.00')
    assert result['total_amount'] == Decimal('100.00')
    
    # Test case 2: Exclusive tax (18%)
    result = TaxCalculator.calculate_tax(
        amount=Decimal('100.00'),
        tax_rate=Decimal('18.00'),
        method=TaxCalculationMethod.EXCLUSIVE
    )
    print(f"Exclusive tax test: {result}")
    assert result['net_amount'] == Decimal('100.00')
    assert result['tax_amount'] == Decimal('18.00')
    assert result['total_amount'] == Decimal('118.00')
    
    # Test case 3: Inclusive tax (18%)
    result = TaxCalculator.calculate_tax(
        amount=Decimal('118.00'),
        tax_rate=Decimal('18.00'),
        method=TaxCalculationMethod.INCLUSIVE
    )
    print(f"Inclusive tax test: {result}")
    assert result['net_amount'] == Decimal('100.00')
    assert result['tax_amount'] == Decimal('18.00')
    assert result['total_amount'] == Decimal('118.00')
    
    print("✅ All tax calculation tests passed!")

def test_tax_validation():
    """Test tax configuration validation"""
    print("\nTesting Tax Validation...")
    
    # Mock transaction type for testing
    class MockTransactionType:
        def __init__(self, **kwargs):
            self.is_tax_applicable = kwargs.get('is_tax_applicable', False)
            self.default_tax_control_account_id = kwargs.get('default_tax_control_account_id')
            self.tax_rate = kwargs.get('tax_rate')
            self.tax_calculation_method = kwargs.get('tax_calculation_method', TaxCalculationMethod.NONE)
    
    # Test case 1: Non-tax applicable transaction
    mock_tx = MockTransactionType(is_tax_applicable=False)
    is_valid, error = TaxCalculator.validate_tax_configuration(mock_tx, raise_on_error=False)
    print(f"Non-tax transaction validation: {is_valid}, {error}")
    assert is_valid is True
    assert error is None
    
    # Test case 2: Tax applicable but incomplete configuration
    mock_tx = MockTransactionType(
        is_tax_applicable=True,
        tax_calculation_method=TaxCalculationMethod.NONE
    )
    is_valid, error = TaxCalculator.validate_tax_configuration(mock_tx, raise_on_error=False)
    print(f"Incomplete tax config validation: {is_valid}, {error}")
    assert is_valid is False
    assert "Tax control account is required" in error
    
    # Test case 3: Complete tax configuration
    mock_tx = MockTransactionType(
        is_tax_applicable=True,
        default_tax_control_account_id=1,
        tax_rate=Decimal('18.00'),
        tax_calculation_method=TaxCalculationMethod.EXCLUSIVE
    )
    is_valid, error = TaxCalculator.validate_tax_configuration(mock_tx, raise_on_error=False)
    print(f"Complete tax config validation: {is_valid}, {error}")
    assert is_valid is True
    assert error is None
    
    print("✅ All tax validation tests passed!")

if __name__ == "__main__":
    test_tax_calculator()
    test_tax_validation()
    print("\n🎉 All tests completed successfully!")
