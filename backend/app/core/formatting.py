from typing import Dict, Optional, Union
from datetime import date, datetime
from decimal import Decimal
from app.models import Company, User, Currency

class FormattingService:
    """Service for handling all formatting logic"""
    
    # Supported date formats mapping
    DATE_FORMAT_MAP = {
        "DD/MM/YYYY": "%d/%m/%Y",
        "MM/DD/YYYY": "%m/%d/%Y",
        "YYYY-MM-DD": "%Y-%m-%d",
        "DD.MM.YYYY": "%d.%m.%Y",
        "DD-MM-YYYY": "%d-%m-%Y",
        "YYYY/MM/DD": "%Y/%m/%d",
    }
    
    TIME_FORMAT_MAP = {
        "24h": "%H:%M",
        "12h": "%I:%M %p"
    }
    
    @staticmethod
    def get_user_formatting_config(user: User, company: Company) -> Dict:
        """Get complete formatting configuration for a user"""
        
        # Determine effective date format
        date_format = user.date_format_override or company.date_format
        
        # Get currency info
        currency = company.default_currency
        
        return {
            "date_format": date_format,
            "date_format_python": FormattingService.DATE_FORMAT_MAP.get(date_format, "%Y-%m-%d"),
            "time_format": company.time_format,
            "time_format_python": FormattingService.TIME_FORMAT_MAP.get(company.time_format, "%H:%M"),
            "decimal_separator": company.decimal_separator,
            "thousand_separator": company.thousand_separator,
            "currency_code": currency.code if currency else "USD",
            "currency_symbol": currency.symbol if currency else "$",
            "currency_position": currency.symbol_position if currency else company.currency_position,
            "currency_decimal_places": currency.decimal_places if currency else 2,
            "locale": user.locale,
            "timezone": user.timezone
        }
    
    @staticmethod
    def format_date(date_value: Union[date, datetime, str], format_config: Dict) -> str:
        """Format a date according to user preferences"""
        if isinstance(date_value, str):
            # Parse ISO format string to date
            date_value = datetime.fromisoformat(date_value.replace('Z', '+00:00'))
        
        if isinstance(date_value, datetime):
            date_value = date_value.date()
            
        return date_value.strftime(format_config["date_format_python"])
    
    @staticmethod
    def format_currency(amount: Union[float, Decimal, int], format_config: Dict) -> str:
        """Format currency amount according to preferences"""
        # Convert to Decimal for precision
        if not isinstance(amount, Decimal):
            amount = Decimal(str(amount))
        
        # Format with decimal places
        decimal_places = format_config["currency_decimal_places"]
        formatted_amount = f"{amount:.{decimal_places}f}"
        
        # Split integer and decimal parts
        parts = formatted_amount.split('.')
        
        # Add thousand separators
        integer_part = parts[0]
        integer_part = FormattingService._add_thousand_separators(
            integer_part, 
            format_config["thousand_separator"]
        )
        
        # Reconstruct with proper decimal separator
        if len(parts) > 1:
            formatted_number = integer_part + format_config["decimal_separator"] + parts[1]
        else:
            formatted_number = integer_part
        
        # Add currency symbol
        symbol = format_config["currency_symbol"]
        if format_config["currency_position"] == "prefix":
            return f"{symbol}{formatted_number}"
        else:
            return f"{formatted_number} {symbol}"
    
    @staticmethod
    def _add_thousand_separators(number_str: str, separator: str) -> str:
        """Add thousand separators to a number string"""
        # Handle negative numbers
        negative = number_str.startswith('-')
        if negative:
            number_str = number_str[1:]
        
        # Add separators
        result = ""
        for i, digit in enumerate(reversed(number_str)):
            if i > 0 and i % 3 == 0:
                result = separator + result
            result = digit + result
        
        return ('-' + result) if negative else result
    
    @staticmethod
    def parse_date(date_str: str, format_config: Dict) -> date:
        """Parse a date string according to user format"""
        python_format = format_config["date_format_python"]
        return datetime.strptime(date_str, python_format).date()
    
    @staticmethod
    def parse_currency(currency_str: str, format_config: Dict) -> Decimal:
        """Parse a currency string to Decimal"""
        # Remove currency symbol and spaces
        symbol = format_config["currency_symbol"]
        cleaned = currency_str.replace(symbol, "").strip()
        
        # Replace separators
        cleaned = cleaned.replace(format_config["thousand_separator"], "")
        cleaned = cleaned.replace(format_config["decimal_separator"], ".")
        
        return Decimal(cleaned)
