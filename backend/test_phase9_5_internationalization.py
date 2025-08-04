"""
Test file for Phase 9.5 Internationalization features
"""

from decimal import Decimal
from datetime import date, datetime
from app.core.formatting import FormattingService


class MockCurrency:
    def __init__(self, code="USD", symbol="$", decimal_places=2, symbol_position="prefix"):
        self.code = code
        self.symbol = symbol
        self.decimal_places = decimal_places
        self.symbol_position = symbol_position


class MockCompany:
    def __init__(self):
        self.date_format = "DD/MM/YYYY"
        self.time_format = "24h"
        self.decimal_separator = "."
        self.thousand_separator = ","
        self.currency_position = "prefix"
        self.default_currency = MockCurrency()


class MockUser:
    def __init__(self):
        self.date_format_override = None
        self.locale = "en-US"
        self.timezone = "UTC"


def test_formatting_service_config():
    """Test the formatting configuration generation"""
    user = MockUser()
    company = MockCompany()
    
    config = FormattingService.get_user_formatting_config(user, company)
    
    assert config["date_format"] == "DD/MM/YYYY"
    assert config["date_format_python"] == "%d/%m/%Y"
    assert config["currency_code"] == "USD"
    assert config["currency_symbol"] == "$"
    assert config["locale"] == "en-US"
    assert config["timezone"] == "UTC"


def test_currency_formatting():
    """Test currency formatting"""
    config = {
        "currency_decimal_places": 2,
        "thousand_separator": ",",
        "decimal_separator": ".",
        "currency_symbol": "$",
        "currency_position": "prefix"
    }
    
    # Test basic amount
    result = FormattingService.format_currency(1234.56, config)
    assert result == "$1,234.56"
    
    # Test large amount
    result = FormattingService.format_currency(1234567.89, config)
    assert result == "$1,234,567.89"
    
    # Test suffix position
    config["currency_position"] = "suffix"
    result = FormattingService.format_currency(1234.56, config)
    assert result == "1,234.56 $"


def test_date_formatting():
    """Test date formatting"""
    config = {
        "date_format_python": "%d/%m/%Y"
    }
    
    test_date = date(2025, 8, 4)
    result = FormattingService.format_date(test_date, config)
    assert result == "04/08/2025"


def test_european_formatting():
    """Test European-style formatting"""
    user = MockUser()
    user.locale = "de-DE"
    
    company = MockCompany()
    company.decimal_separator = ","
    company.thousand_separator = "."
    company.default_currency = MockCurrency("EUR", "€", 2, "suffix")
    
    config = FormattingService.get_user_formatting_config(user, company)
    
    # Test currency formatting with European style
    config["currency_position"] = "suffix"  # Override from currency
    config["decimal_separator"] = ","
    config["thousand_separator"] = "."
    config["currency_symbol"] = "€"
    
    result = FormattingService.format_currency(1234.56, config)
    expected = "1.234,56 €"
    assert result == expected


def test_user_override():
    """Test user date format override"""
    user = MockUser()
    user.date_format_override = "YYYY-MM-DD"
    
    company = MockCompany()
    company.date_format = "DD/MM/YYYY"
    
    config = FormattingService.get_user_formatting_config(user, company)
    
    assert config["date_format"] == "YYYY-MM-DD"
    assert config["date_format_python"] == "%Y-%m-%d"


if __name__ == "__main__":
    # Run tests manually
    print("Running Phase 9.5 Internationalization Tests...")
    
    test_formatting_service_config()
    print("✓ Formatting service config test passed")
    
    test_currency_formatting()
    print("✓ Currency formatting test passed")
    
    test_date_formatting()
    print("✓ Date formatting test passed")
    
    test_european_formatting()
    print("✓ European formatting test passed")
    
    test_user_override()
    print("✓ User override test passed")
    
    print("\nAll tests passed! Phase 9.5 implementation is ready.")
