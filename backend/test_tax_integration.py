#!/usr/bin/env python3
"""
Integration test for tax configuration functionality
"""
from decimal import Decimal
from pydantic import ValidationError
import json

def test_schema_validation():
    """Test that our new schemas work correctly"""
    print("Testing schema validation...")
    
    try:
        from app.schemas.gl import (
            GLTransactionTypeCreate, 
            GLTransactionTypeUpdate, 
            GLJournalEntryCreateWithTax,
            GLJournalEntryLineCreate,
            TaxCalculationMethod
        )
        
        # Test GLTransactionTypeCreate with tax configuration
        valid_transaction_type = {
            "name": "Sales with VAT",
            "description": "Standard sales transaction with VAT",
            "default_debit_account_id": 1,
            "default_credit_account_id": 2,
            "default_tax_control_account_id": 3,
            "is_tax_applicable": True,
            "tax_rate": 18.00,
            "tax_calculation_method": "exclusive",
            "tax_type_id": 1,
            "is_active": True
        }
        
        tx_type = GLTransactionTypeCreate(**valid_transaction_type)
        print(f"✅ GLTransactionTypeCreate validated: {tx_type.name}")
        
        # Test GLJournalEntryLineCreate with tax fields
        valid_line = {
            "gl_account_id": 1,
            "description": "Sales",
            "debit_amount": 100.00,
            "credit_amount": 0.00,
            "is_tax_line": False,
            "tax_base_amount": None
        }
        
        line = GLJournalEntryLineCreate(**valid_line)
        print(f"✅ GLJournalEntryLineCreate validated: {line.description}")
        
        # Test tax line
        tax_line = {
            "gl_account_id": 3,
            "description": "VAT",
            "debit_amount": 18.00,
            "credit_amount": 0.00,
            "is_tax_line": True,
            "tax_base_amount": 100.00
        }
        
        tax_line_obj = GLJournalEntryLineCreate(**tax_line)
        print(f"✅ Tax line validated: {tax_line_obj.description}")
        
        # Test GLJournalEntryCreateWithTax
        journal_entry = {
            "entry_date": "2025-07-31",
            "reference": "INV-001",
            "description": "Sales invoice with VAT",
            "transaction_type_id": 1,
            "lines": [valid_line, tax_line],
            "auto_calculate_tax": True
        }
        
        entry = GLJournalEntryCreateWithTax(**journal_entry)
        print(f"✅ GLJournalEntryCreateWithTax validated: {entry.description}")
        
        return True
        
    except Exception as e:
        print(f"❌ Schema validation error: {e}")
        return False

def test_tax_calculation_enum():
    """Test that tax calculation method enum works"""
    print("\nTesting tax calculation method enum...")
    
    try:
        from app.schemas.gl import TaxCalculationMethod
        
        # Test enum values
        assert TaxCalculationMethod.none == "none"
        assert TaxCalculationMethod.inclusive == "inclusive"
        assert TaxCalculationMethod.exclusive == "exclusive"
        
        print("✅ TaxCalculationMethod enum values are correct")
        
        return True
        
    except Exception as e:
        print(f"❌ Enum test error: {e}")
        return False

def test_tax_calculator_functionality():
    """Test the actual tax calculation logic"""
    print("\nTesting tax calculator functionality...")
    
    try:
        from app.services.tax_calculator import TaxCalculator
        from app.models.gl import TaxCalculationMethod
        
        # Test exclusive tax calculation
        result = TaxCalculator.calculate_tax(
            amount=Decimal('100.00'),
            tax_rate=Decimal('18.00'),
            method=TaxCalculationMethod.EXCLUSIVE
        )
        
        assert result['net_amount'] == Decimal('100.00')
        assert result['tax_amount'] == Decimal('18.00')
        assert result['total_amount'] == Decimal('118.00')
        
        print("✅ Exclusive tax calculation works correctly")
        
        # Test inclusive tax calculation
        result = TaxCalculator.calculate_tax(
            amount=Decimal('118.00'),
            tax_rate=Decimal('18.00'),
            method=TaxCalculationMethod.INCLUSIVE
        )
        
        assert result['net_amount'] == Decimal('100.00')
        assert result['tax_amount'] == Decimal('18.00')
        assert result['total_amount'] == Decimal('118.00')
        
        print("✅ Inclusive tax calculation works correctly")
        
        return True
        
    except Exception as e:
        print(f"❌ Tax calculator error: {e}")
        return False

if __name__ == "__main__":
    print("Running integration tests for tax configuration...\n")
    
    schema_ok = test_schema_validation()
    enum_ok = test_tax_calculation_enum()
    calc_ok = test_tax_calculator_functionality()
    
    if schema_ok and enum_ok and calc_ok:
        print("\n🎉 All integration tests passed!")
        print("Tax configuration implementation is working correctly.")
    else:
        print("\n❌ Some tests failed. Please check the errors above.")
