import pytest
from app.core.formatting import FormattingService
from datetime import date, datetime
from decimal import Decimal

def test_format_date():
    """Test date formatting with different formats"""
    config = {
        "date_format": "DD/MM/YYYY",
        "date_format_python": "%d/%m/%Y"
    }
    
    test_date = date(2024, 12, 31)
    result = FormattingService.format_date(test_date, config)
    assert result == "31/12/2024"

def test_format_date_us_format():
    """Test US date format"""
    config = {
        "date_format": "MM/DD/YYYY",
        "date_format_python": "%m/%d/%Y"
    }
    
    test_date = date(2024, 12, 31)
    result = FormattingService.format_date(test_date, config)
    assert result == "12/31/2024"

def test_format_date_iso_format():
    """Test ISO date format"""
    config = {
        "date_format": "YYYY-MM-DD",
        "date_format_python": "%Y-%m-%d"
    }
    
    test_date = date(2024, 12, 31)
    result = FormattingService.format_date(test_date, config)
    assert result == "2024-12-31"

def test_format_datetime():
    """Test datetime formatting with time"""
    config = {
        "date_format": "DD/MM/YYYY",
        "date_format_python": "%d/%m/%Y",
        "time_format": "24h"
    }
    
    test_datetime = datetime(2024, 12, 31, 14, 30, 0)
    result = FormattingService.format_datetime(test_datetime, config)
    assert result == "31/12/2024 14:30"

def test_format_datetime_12h():
    """Test datetime formatting with 12-hour time"""
    config = {
        "date_format": "MM/DD/YYYY",
        "date_format_python": "%m/%d/%Y",
        "time_format": "12h"
    }
    
    test_datetime = datetime(2024, 12, 31, 14, 30, 0)
    result = FormattingService.format_datetime(test_datetime, config)
    assert result == "12/31/2024 2:30 PM"

def test_format_currency_prefix():
    """Test currency formatting with prefix symbol"""
    config = {
        "decimal_separator": ".",
        "thousand_separator": ",",
        "currency_symbol": "$",
        "currency_position": "prefix",
        "currency_decimal_places": 2
    }
    
    result = FormattingService.format_currency(1234567.89, config)
    assert result == "$1,234,567.89"

def test_format_currency_suffix():
    """Test currency formatting with suffix symbol"""
    config = {
        "decimal_separator": ",",
        "thousand_separator": ".",
        "currency_symbol": "€",
        "currency_position": "suffix",
        "currency_decimal_places": 2
    }
    
    result = FormattingService.format_currency(1234567.89, config)
    assert result == "1.234.567,89 €"

def test_format_currency_no_decimals():
    """Test currency formatting with no decimal places"""
    config = {
        "decimal_separator": ".",
        "thousand_separator": ",",
        "currency_symbol": "¥",
        "currency_position": "prefix",
        "currency_decimal_places": 0
    }
    
    result = FormattingService.format_currency(1234567.89, config)
    assert result == "¥1,234,568"

def test_format_number():
    """Test number formatting without currency"""
    config = {
        "decimal_separator": ",",
        "thousand_separator": "."
    }
    
    result = FormattingService.format_number(1234567.89, config, decimal_places=2)
    assert result == "1.234.567,89"

def test_parse_currency_prefix():
    """Test parsing currency with prefix symbol"""
    config = {
        "decimal_separator": ".",
        "thousand_separator": ",",
        "currency_symbol": "$",
        "currency_position": "prefix"
    }
    
    result = FormattingService.parse_currency("$1,234,567.89", config)
    assert result == Decimal("1234567.89")

def test_parse_currency_suffix():
    """Test parsing currency with suffix symbol"""
    config = {
        "decimal_separator": ",",
        "thousand_separator": ".",
        "currency_symbol": "€",
        "currency_position": "suffix"
    }
    
    result = FormattingService.parse_currency("1.234.567,89 €", config)
    assert result == Decimal("1234567.89")

def test_parse_currency_no_separators():
    """Test parsing simple currency value"""
    config = {
        "decimal_separator": ".",
        "thousand_separator": ",",
        "currency_symbol": "$",
        "currency_position": "prefix"
    }
    
    result = FormattingService.parse_currency("$1234.56", config)
    assert result == Decimal("1234.56")

def test_parse_date():
    """Test parsing date string"""
    config = {
        "date_format": "DD/MM/YYYY",
        "date_format_python": "%d/%m/%Y"
    }
    
    result = FormattingService.parse_date("31/12/2024", config)
    assert result == date(2024, 12, 31)

def test_parse_date_invalid():
    """Test parsing invalid date string"""
    config = {
        "date_format": "DD/MM/YYYY",
        "date_format_python": "%d/%m/%Y"
    }
    
    result = FormattingService.parse_date("invalid-date", config)
    assert result is None

def test_get_user_formatting_config():
    """Test getting user formatting configuration with fallbacks"""
    user_prefs = {
        "date_format_override": "MM/DD/YYYY",
        "locale": "en-US",
        "timezone": "America/New_York"
    }
    
    company_defaults = {
        "date_format": "DD/MM/YYYY",
        "time_format": "24h",
        "decimal_separator": ".",
        "thousand_separator": ",",
        "currency_position": "prefix"
    }
    
    currency = {
        "code": "USD",
        "symbol": "$",
        "decimal_places": 2
    }
    
    result = FormattingService.get_user_formatting_config(
        user_prefs, company_defaults, currency
    )
    
    # User override should take precedence
    assert result["dateFormat"] == "MM/DD/YYYY"
    assert result["locale"] == "en-US"
    assert result["timezone"] == "America/New_York"
    
    # Company defaults should fill in missing values
    assert result["timeFormat"] == "24h"
    assert result["decimalSeparator"] == "."
    assert result["currencySymbol"] == "$"

def test_validate_formatting_config():
    """Test validation of formatting configuration"""
    valid_config = {
        "date_format": "DD/MM/YYYY",
        "time_format": "24h",
        "decimal_separator": ".",
        "thousand_separator": ",",
        "currency_position": "prefix"
    }
    
    assert FormattingService.validate_config(valid_config) is True
    
    # Test invalid time format
    invalid_config = valid_config.copy()
    invalid_config["time_format"] = "invalid"
    assert FormattingService.validate_config(invalid_config) is False
    
    # Test same separators
    invalid_config = valid_config.copy()
    invalid_config["decimal_separator"] = ","
    invalid_config["thousand_separator"] = ","
    assert FormattingService.validate_config(invalid_config) is False
