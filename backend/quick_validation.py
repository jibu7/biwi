#!/usr/bin/env python3
"""
Quick validation test for new tax configuration models and enums
"""

def test_enum_import():
    """Test that our new enum can be imported correctly"""
    try:
        from app.models.gl import TaxCalculationMethod
        print("✅ TaxCalculationMethod enum imported successfully")
        
        # Test enum values
        assert TaxCalculationMethod.NONE == "none"
        assert TaxCalculationMethod.INCLUSIVE == "inclusive"
        assert TaxCalculationMethod.EXCLUSIVE == "exclusive"
        print("✅ All enum values are correct")
        
        return True
    except Exception as e:
        print(f"❌ Error importing TaxCalculationMethod: {e}")
        return False

def test_schema_import():
    """Test that schemas can be imported correctly"""
    try:
        from app.schemas.gl import TaxCalculationMethod as SchemaTaxMethod
        from app.schemas.gl import GLTransactionTypeCreate, GLTransactionTypeUpdate, GLTransactionTypeRead
        print("✅ Tax configuration schemas imported successfully")
        
        # Test enum values in schema
        assert SchemaTaxMethod.none == "none"
        assert SchemaTaxMethod.inclusive == "inclusive"
        assert SchemaTaxMethod.exclusive == "exclusive"
        print("✅ Schema enum values are correct")
        
        return True
    except Exception as e:
        print(f"❌ Error importing schemas: {e}")
        return False

def test_tax_calculator_import():
    """Test that tax calculator can be imported"""
    try:
        from app.services.tax_calculator import TaxCalculator
        print("✅ TaxCalculator imported successfully")
        
        # Test that methods exist
        assert hasattr(TaxCalculator, 'calculate_tax')
        assert hasattr(TaxCalculator, 'validate_tax_configuration')
        print("✅ TaxCalculator methods exist")
        
        return True
    except Exception as e:
        print(f"❌ Error importing TaxCalculator: {e}")
        return False

if __name__ == "__main__":
    print("Running quick validation tests...\n")
    
    enum_ok = test_enum_import()
    schema_ok = test_schema_import()
    calculator_ok = test_tax_calculator_import()
    
    if enum_ok and schema_ok and calculator_ok:
        print("\n🎉 All quick validation tests passed!")
        print("Tax configuration implementation appears to be working correctly.")
    else:
        print("\n❌ Some tests failed. Please check the errors above.")
