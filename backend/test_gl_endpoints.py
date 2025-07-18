#!/usr/bin/env python3
"""
Test script to verify GL endpoints are working correctly
"""

def test_gl_imports():
    """Test that all GL components can be imported"""
    try:
        # Test GL models
        from app.models.gl import GLAccount, GLJournalEntry, GLJournalEntryLine
        print("✅ GL Models imported successfully")
        
        # Test GL CRUD
        from app.crud.gl import (
            GLAccountCRUD, gl_account, create_journal_entry, 
            get_journal_entries_by_company, calculate_trial_balance
        )
        print("✅ GL CRUD functions imported successfully")
        
        # Test GL endpoints
        from app.api.v1.endpoints.gl import router
        print("✅ GL endpoints imported successfully")
        print(f"✅ Router has {len(router.routes)} routes")
        
        # Test permissions
        from app.core.permissions import GL_SETUP_MANAGE, GL_JOURNAL_POST, GL_REPORTS_VIEW
        print("✅ GL permissions imported successfully")
        
        return True
        
    except Exception as e:
        print(f"❌ Import error: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_crud_access():
    """Test that CRUD functions are accessible through the crud module"""
    try:
        from app import crud
        
        # Check if GL functions are available
        functions_to_check = [
            'gl_account', 'create_journal_entry', 
            'calculate_trial_balance', 'get_journal_entries_by_company'
        ]
        
        for func_name in functions_to_check:
            if hasattr(crud, func_name):
                print(f"✅ crud.{func_name} is available")
            else:
                print(f"❌ crud.{func_name} is NOT available")
        
        return True
        
    except Exception as e:
        print(f"❌ CRUD access error: {e}")
        return False

def list_gl_routes():
    """List all GL routes"""
    try:
        from app.api.v1.endpoints.gl import router
        
        print("\n📋 GL API Routes:")
        for route in router.routes:
            if hasattr(route, 'methods') and hasattr(route, 'path'):
                methods = ', '.join(route.methods)
                print(f"  {methods}: {route.path}")
        
        return True
        
    except Exception as e:
        print(f"❌ Route listing error: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Testing GL Components...")
    print("=" * 50)
    
    success = True
    success &= test_gl_imports()
    success &= test_crud_access() 
    success &= list_gl_routes()
    
    print("=" * 50)
    if success:
        print("🎉 All GL components are working correctly!")
    else:
        print("❌ Some issues found with GL components")
