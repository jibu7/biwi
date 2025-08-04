#!/usr/bin/env python3
"""
Test script to verify BOM implementation
"""

import sys
import os
sys.path.append('/home/ubuntu24/proj/biwi/backend')

def test_imports():
    """Test that all BOM components can be imported"""
    try:
        # Test model imports
        from app.models.bom import BOMHeader, BOMComponent, ManufacturingOrder, MaterialRequisition, ProductionEntry, BOMDefaults
        print("✓ BOM models imported successfully")
        
        # Test schema imports
        from app.schemas.bom import (
            BOMHeaderCreate, BOMHeaderRead, BOMHeaderUpdate,
            ManufacturingOrderCreate, ManufacturingOrderRead,
            MRPRequest, MRPResult, BOMDefaultsRead
        )
        print("✓ BOM schemas imported successfully")
        
        # Test CRUD imports
        from app.crud.bom import (
            create_bom_header, calculate_bom_cost, 
            run_mrp, issue_materials, complete_production, explode_bom
        )
        print("✓ BOM CRUD functions imported successfully")
        
        # Test service imports
        from app.services.bom_service import BOMService
        print("✓ BOM service imported successfully")
        
        # Test API imports
        from app.api.v1.endpoints.bom import router
        print("✓ BOM API router imported successfully")
        
        # Test permissions
        from app.core.permissions import (
            BOM_SETUP_MANAGE, BOM_MANUFACTURING_CREATE, 
            BOM_MANUFACTURING_PROCESS, BOM_REPORTS_VIEW, BOM_MRP_RUN
        )
        print("✓ BOM permissions imported successfully")
        
        return True
        
    except ImportError as e:
        print(f"✗ Import error: {e}")
        return False
    except Exception as e:
        print(f"✗ Error: {e}")
        return False

def test_api_router_included():
    """Test that BOM router is included in main API"""
    try:
        from app.api.v1.api import api_router
        
        # Check if BOM routes are included
        routes = [route.path for route in api_router.routes]
        bom_routes = [route for route in routes if '/bom' in route]
        
        if bom_routes:
            print("✓ BOM routes found in API router")
            print(f"  Found {len(bom_routes)} BOM routes")
            return True
        else:
            print("✗ No BOM routes found in API router")
            return False
            
    except Exception as e:
        print(f"✗ Error checking API router: {e}")
        return False

def main():
    """Main test function"""
    print("Testing BOM Implementation...")
    print("=" * 50)
    
    tests_passed = 0
    total_tests = 2
    
    # Test imports
    print("\n1. Testing imports...")
    if test_imports():
        tests_passed += 1
    
    # Test API router
    print("\n2. Testing API router...")
    if test_api_router_included():
        tests_passed += 1
    
    print("\n" + "=" * 50)
    print(f"Tests passed: {tests_passed}/{total_tests}")
    
    if tests_passed == total_tests:
        print("✓ All BOM implementation tests passed!")
        return True
    else:
        print("✗ Some BOM implementation tests failed!")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
