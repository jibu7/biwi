#!/usr/bin/env python3
"""
Multi-Tenant Migration Validation and Testing Report
====================================================

This script runs all validation and testing scripts and generates a comprehensive report.
"""
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

import subprocess
import os
from datetime import datetime

def run_command(command, description):
    """Run a command and capture its output"""
    print(f"\n{'='*60}")
    print(f"Running: {description}")
    print(f"Command: {command}")
    print(f"{'='*60}")
    
    try:
        result = subprocess.run(
            command, 
            shell=True, 
            capture_output=True, 
            text=True, 
            timeout=60
        )
        
        print("STDOUT:")
        print(result.stdout)
        
        if result.stderr:
            print("STDERR:")
            print(result.stderr)
        
        print(f"Exit code: {result.returncode}")
        return result.returncode == 0
    except subprocess.TimeoutExpired:
        print("Command timed out!")
        return False
    except Exception as e:
        print(f"Error running command: {e}")
        return False

def generate_report():
    """Generate comprehensive migration validation report"""
    
    print("Multi-Tenant Migration Validation and Testing Report")
    print("=" * 60)
    print(f"Generated on: {datetime.now()}")
    print(f"Database: {os.environ.get('DATABASE_URL', 'Not set')}")
    
    # Set environment variable for database connection
    env = os.environ.copy()
    env['DATABASE_URL'] = "postgresql://Biwi_user:Biwi_password@localhost:5432/Biwi_db"
    
    base_cmd = "cd /home/ubuntu24/proj/biwi/backend && export DATABASE_URL='postgresql://Biwi_user:Biwi_password@localhost:5432/Biwi_db' && poetry run python"
    
    # List of validation tests to run
    tests = [
        ("scripts/validate_migration_robust.py", "Migration Schema Validation"),
        ("scripts/test_multitenant_functionality.py", "Multi-Tenant Functionality Testing"),
    ]
    
    results = {}
    
    for script, description in tests:
        command = f"{base_cmd} {script}"
        results[description] = run_command(command, description)
    
    # Generate summary
    print(f"\n{'='*60}")
    print("VALIDATION SUMMARY")
    print(f"{'='*60}")
    
    passed = 0
    total = len(results)
    
    for test_name, passed_test in results.items():
        status = "✓ PASSED" if passed_test else "✗ FAILED"
        print(f"{status} - {test_name}")
        if passed_test:
            passed += 1
    
    print(f"\nOverall: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All validation tests PASSED! Multi-tenant migration is successful!")
        return True
    else:
        print(f"\n⚠️  {total - passed} test(s) FAILED. Please review the output above.")
        return False

if __name__ == "__main__":
    success = generate_report()
    sys.exit(0 if success else 1)
