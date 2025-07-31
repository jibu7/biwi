import pytest
from decimal import Decimal
from unittest.mock import MagicMock
from app.services.tax_calculator import TaxCalculator
from app.models.gl import TaxCalculationMethod

class TestTaxCalculator:
    def test_exclusive_tax_calculation(self):
        result = TaxCalculator.calculate_tax(
            amount=Decimal('100.00'),
            tax_rate=Decimal('18.00'),
            method=TaxCalculationMethod.EXCLUSIVE
        )
        
        assert result['net_amount'] == Decimal('100.00')
        assert result['tax_amount'] == Decimal('18.00')
        assert result['total_amount'] == Decimal('118.00')
    
    def test_inclusive_tax_calculation(self):
        result = TaxCalculator.calculate_tax(
            amount=Decimal('118.00'),
            tax_rate=Decimal('18.00'),
            method=TaxCalculationMethod.INCLUSIVE
        )
        
        assert result['net_amount'] == Decimal('100.00')
        assert result['tax_amount'] == Decimal('18.00')
        assert result['total_amount'] == Decimal('118.00')
    
    def test_no_tax_calculation(self):
        result = TaxCalculator.calculate_tax(
            amount=Decimal('100.00'),
            tax_rate=Decimal('0.00'),
            method=TaxCalculationMethod.NONE
        )
        
        assert result['net_amount'] == Decimal('100.00')
        assert result['tax_amount'] == Decimal('0.00')
        assert result['total_amount'] == Decimal('100.00')
    
    def test_zero_tax_rate_with_exclusive_method(self):
        """Test that zero tax rate works correctly regardless of method"""
        result = TaxCalculator.calculate_tax(
            amount=Decimal('100.00'),
            tax_rate=Decimal('0.00'),
            method=TaxCalculationMethod.EXCLUSIVE
        )
        
        assert result['net_amount'] == Decimal('100.00')
        assert result['tax_amount'] == Decimal('0.00')
        assert result['total_amount'] == Decimal('100.00')
    
    def test_rounding_precision(self):
        """Test that tax calculations are rounded to 2 decimal places"""
        result = TaxCalculator.calculate_tax(
            amount=Decimal('100.00'),
            tax_rate=Decimal('7.25'),  # Results in 7.25 tax
            method=TaxCalculationMethod.EXCLUSIVE
        )
        
        assert result['net_amount'] == Decimal('100.00')
        assert result['tax_amount'] == Decimal('7.25')
        assert result['total_amount'] == Decimal('107.25')
    
    def test_complex_rounding_exclusive(self):
        """Test rounding with a tax rate that produces many decimal places"""
        result = TaxCalculator.calculate_tax(
            amount=Decimal('33.33'),
            tax_rate=Decimal('13.5'),  # 33.33 * 0.135 = 4.49955
            method=TaxCalculationMethod.EXCLUSIVE
        )
        
        assert result['net_amount'] == Decimal('33.33')
        assert result['tax_amount'] == Decimal('4.50')  # Rounded from 4.49955
        assert result['total_amount'] == Decimal('37.83')
    
    def test_complex_rounding_inclusive(self):
        """Test rounding with inclusive tax calculation"""
        result = TaxCalculator.calculate_tax(
            amount=Decimal('115.00'),
            tax_rate=Decimal('15.00'),
            method=TaxCalculationMethod.INCLUSIVE
        )
        
        # 115 / 1.15 = 100.00
        assert result['net_amount'] == Decimal('100.00')
        assert result['tax_amount'] == Decimal('15.00')
        assert result['total_amount'] == Decimal('115.00')
    
    def test_invalid_tax_method(self):
        """Test that invalid tax calculation method raises ValueError"""
        with pytest.raises(ValueError) as exc_info:
            TaxCalculator.calculate_tax(
                amount=Decimal('100.00'),
                tax_rate=Decimal('10.00'),
                method="invalid_method"  # This should raise an error
            )
        
        assert "Invalid tax calculation method" in str(exc_info.value)

class TestTaxValidation:
    def test_validate_tax_configuration_valid(self):
        """Test validation with a valid tax configuration"""
        # Mock transaction type with valid tax configuration
        transaction_type = MagicMock()
        transaction_type.is_tax_applicable = True
        transaction_type.default_tax_control_account_id = 123
        transaction_type.tax_rate = Decimal('15.00')
        transaction_type.tax_calculation_method = TaxCalculationMethod.EXCLUSIVE
        
        is_valid, error_message = TaxCalculator.validate_tax_configuration(
            transaction_type, raise_on_error=False
        )
        
        assert is_valid is True
        assert error_message is None
    
    def test_validate_tax_configuration_not_applicable(self):
        """Test validation when tax is not applicable"""
        transaction_type = MagicMock()
        transaction_type.is_tax_applicable = False
        
        is_valid, error_message = TaxCalculator.validate_tax_configuration(
            transaction_type, raise_on_error=False
        )
        
        assert is_valid is True
        assert error_message is None
    
    def test_validate_tax_configuration_missing_control_account(self):
        """Test validation with missing tax control account"""
        transaction_type = MagicMock()
        transaction_type.is_tax_applicable = True
        transaction_type.default_tax_control_account_id = None
        transaction_type.tax_rate = Decimal('15.00')
        transaction_type.tax_calculation_method = TaxCalculationMethod.EXCLUSIVE
        
        is_valid, error_message = TaxCalculator.validate_tax_configuration(
            transaction_type, raise_on_error=False
        )
        
        assert is_valid is False
        assert "Tax control account is required" in error_message
    
    def test_validate_tax_configuration_invalid_tax_rate(self):
        """Test validation with invalid tax rate"""
        transaction_type = MagicMock()
        transaction_type.is_tax_applicable = True
        transaction_type.default_tax_control_account_id = 123
        transaction_type.tax_rate = Decimal('0.00')
        transaction_type.tax_calculation_method = TaxCalculationMethod.EXCLUSIVE
        
        is_valid, error_message = TaxCalculator.validate_tax_configuration(
            transaction_type, raise_on_error=False
        )
        
        assert is_valid is False
        assert "Valid tax rate is required" in error_message
    
    def test_validate_tax_configuration_none_method(self):
        """Test validation with NONE tax calculation method when tax is applicable"""
        transaction_type = MagicMock()
        transaction_type.is_tax_applicable = True
        transaction_type.default_tax_control_account_id = 123
        transaction_type.tax_rate = Decimal('15.00')
        transaction_type.tax_calculation_method = TaxCalculationMethod.NONE
        
        is_valid, error_message = TaxCalculator.validate_tax_configuration(
            transaction_type, raise_on_error=False
        )
        
        assert is_valid is False
        assert "Tax calculation method must be specified" in error_message
    
    def test_validate_tax_configuration_multiple_errors(self):
        """Test validation with multiple errors"""
        transaction_type = MagicMock()
        transaction_type.is_tax_applicable = True
        transaction_type.default_tax_control_account_id = None
        transaction_type.tax_rate = None
        transaction_type.tax_calculation_method = TaxCalculationMethod.NONE
        
        is_valid, error_message = TaxCalculator.validate_tax_configuration(
            transaction_type, raise_on_error=False
        )
        
        assert is_valid is False
        assert "Tax control account is required" in error_message
        assert "Valid tax rate is required" in error_message
        assert "Tax calculation method must be specified" in error_message
    
    def test_validate_tax_configuration_raises_error(self):
        """Test validation that raises error when raise_on_error=True"""
        transaction_type = MagicMock()
        transaction_type.is_tax_applicable = True
        transaction_type.default_tax_control_account_id = None
        transaction_type.tax_rate = Decimal('15.00')
        transaction_type.tax_calculation_method = TaxCalculationMethod.EXCLUSIVE
        
        with pytest.raises(ValueError) as exc_info:
            TaxCalculator.validate_tax_configuration(
                transaction_type, raise_on_error=True
            )
        
        assert "Tax control account is required" in str(exc_info.value)
