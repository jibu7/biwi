#!/usr/bin/env python3
"""
Run All Tests Script for Multi-Tenant Testing
==============================================

This script runs all available tests in the Docker environment.
"""
import sys
import os
import subprocess
import logging
from pathlib import Path
from datetime import datetime
import json

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class TestRunner:
    def __init__(self):
        self.test_results = []
        self.start_time = datetime.now()
    
    def run_docker_test(self, service, command, test_name, timeout=180):
        """Run a test command inside a Docker container"""
        logger.info(f"🧪 Running: {test_name}")
        
        full_command = f"docker exec Biwi_{service} {command}"
        
        try:
            result = subprocess.run(
                full_command,
                shell=True,
                capture_output=True,
                text=True,
                timeout=timeout
            )
            
            success = result.returncode == 0
            status = "✅ PASS" if success else "❌ FAIL"
            
            self.test_results.append({
                'name': test_name,
                'success': success,
                'output': result.stdout,
                'error': result.stderr,
                'return_code': result.returncode
            })
            
            logger.info(f"{status} - {test_name}")
            
            if not success:
                logger.error(f"Error output: {result.stderr}")
            
            return success
            
        except subprocess.TimeoutExpired:
            logger.error(f"❌ TIMEOUT - {test_name}")
            self.test_results.append({
                'name': test_name,
                'success': False,
                'output': '',
                'error': 'Test timed out',
                'return_code': -1
            })
            return False
            
        except Exception as e:
            logger.error(f"❌ EXCEPTION - {test_name}: {str(e)}")
            self.test_results.append({
                'name': test_name,
                'success': False,
                'output': '',
                'error': str(e),
                'return_code': -1
            })
            return False
    
    def run_infrastructure_tests(self):
        """Run infrastructure and connectivity tests"""
        logger.info("🔧 Running Infrastructure Tests")
        logger.info("-" * 40)
        
        tests = [
            ("backend", "python -c \"from app.database.database import get_db; next(get_db()); print('✅ Database connection successful')\"", "Database Connection Test"),
            ("backend", "python -c \"import requests; r = requests.get('http://localhost:8000/health'); print(f'✅ Backend Health: {r.status_code}')\"", "Backend Health Check"),
            ("backend", "python -c \"from app.config import settings; print(f'✅ Config loaded: {settings.DATABASE_URL[:20]}...')\"", "Configuration Test"),
        ]
        
        results = []
        for service, command, name in tests:
            results.append(self.run_docker_test(service, command, name, 30))
        
        return all(results)
    
    def run_database_tests(self):
        """Run database and migration tests"""
        logger.info("🗄️ Running Database Tests")
        logger.info("-" * 40)
        
        tests = [
            ("backend", "python test_neon_connection.py", "Neon Database Connection"),
            ("backend", "python -c \"from app.database.database import engine; from sqlalchemy import text; with engine.connect() as conn: conn.execute(text('SELECT 1')); print('✅ SQL execution successful')\"", "SQL Execution Test"),
        ]
        
        results = []
        for service, command, name in tests:
            results.append(self.run_docker_test(service, command, name, 60))
        
        return all(results)
    
    def run_multitenant_tests(self):
        """Run multi-tenant specific tests"""
        logger.info("🏢 Running Multi-Tenant Tests")
        logger.info("-" * 40)
        
        tests = [
            ("backend", "python test_multitenant.py", "Multi-Tenant Core Functionality"),
            ("backend", "python test_gl_tenant_isolation.py", "GL Tenant Isolation"),
            ("backend", "python scripts/test_multitenant_functionality.py", "Multi-Tenant Business Logic"),
            ("backend", "python scripts/validate_migration.py", "Migration Validation"),
        ]
        
        results = []
        for service, command, name in tests:
            results.append(self.run_docker_test(service, command, name, 120))
        
        return all(results)
    
    def run_business_logic_tests(self):
        """Run business logic and workflow tests"""
        logger.info("💼 Running Business Logic Tests")
        logger.info("-" * 40)
        
        tests = [
            ("backend", "python test_inventory_lifecycle.py", "Inventory Lifecycle"),
            ("backend", "python test_inventory_simple.py", "Basic Inventory Operations"),
            ("backend", "python test_gl_endpoints.py", "General Ledger Endpoints"),
            ("backend", "python test_approval.py", "Approval Workflows"),
            ("backend", "python test_phase5_simple.py", "Phase 5 Simple Tests"),
        ]
        
        results = []
        for service, command, name in tests:
            results.append(self.run_docker_test(service, command, name, 150))
        
        return all(results)
    
    def run_integration_tests(self):
        """Run end-to-end integration tests"""
        logger.info("🔄 Running Integration Tests")
        logger.info("-" * 40)
        
        tests = [
            ("backend", "python test_phase5_e2e.py", "End-to-End Phase 5 Tests"),
            ("backend", "python validate_phase5.py", "Phase 5 Validation"),
            ("backend", "python scripts/docker_e2e_runner.py", "Docker E2E Test Suite"),
            ("backend", "python scripts/run_complete_validation.py", "Complete Validation Suite"),
        ]
        
        results = []
        for service, command, name in tests:
            results.append(self.run_docker_test(service, command, name, 300))
        
        return all(results)
    
    def run_platform_tests(self):
        """Run platform and admin tests"""
        logger.info("🔧 Running Platform Tests")
        logger.info("-" * 40)
        
        tests = [
            ("backend", "python test_platform_implementation.py", "Platform Implementation"),
            ("backend", "python test_platform_improvements.py", "Platform Improvements"),
            ("backend", "python verify_platform.py", "Platform Verification"),
        ]
        
        results = []
        for service, command, name in tests:
            results.append(self.run_docker_test(service, command, name, 120))
        
        return all(results)
    
    def generate_report(self):
        """Generate a comprehensive test report"""
        end_time = datetime.now()
        duration = end_time - self.start_time
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        failed_tests = total_tests - passed_tests
        
        logger.info("=" * 60)
        logger.info("📊 COMPREHENSIVE TEST REPORT")
        logger.info("=" * 60)
        logger.info(f"Test Duration: {duration}")
        logger.info(f"Total Tests: {total_tests}")
        logger.info(f"✅ Passed: {passed_tests}")
        logger.info(f"❌ Failed: {failed_tests}")
        logger.info(f"Success Rate: {(passed_tests/total_tests*100):.1f}%" if total_tests > 0 else "0%")
        logger.info("=" * 60)
        
        if failed_tests > 0:
            logger.info("❌ FAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    logger.info(f"  - {result['name']}: {result['error']}")
            logger.info("=" * 60)
        
        # Save detailed report to file
        report_data = {
            'timestamp': end_time.isoformat(),
            'duration_seconds': duration.total_seconds(),
            'summary': {
                'total': total_tests,
                'passed': passed_tests,
                'failed': failed_tests,
                'success_rate': (passed_tests/total_tests*100) if total_tests > 0 else 0
            },
            'results': self.test_results
        }
        
        try:
            with open('/tmp/test_report.json', 'w') as f:
                json.dump(report_data, f, indent=2)
            logger.info("📄 Detailed report saved to /tmp/test_report.json")
        except Exception as e:
            logger.warning(f"Could not save detailed report: {e}")
        
        return failed_tests == 0

def main():
    """Main test execution function"""
    logger.info("🚀 Starting Comprehensive Multi-Tenant Test Suite")
    logger.info("=" * 60)
    
    runner = TestRunner()
    
    try:
        # Run test suites in order
        test_suites = [
            ("Infrastructure", runner.run_infrastructure_tests),
            ("Database", runner.run_database_tests),
            ("Multi-Tenant", runner.run_multitenant_tests),
            ("Business Logic", runner.run_business_logic_tests),
            ("Platform", runner.run_platform_tests),
            ("Integration", runner.run_integration_tests),
        ]
        
        suite_results = []
        
        for suite_name, suite_func in test_suites:
            logger.info(f"\n🎯 Starting {suite_name} Test Suite")
            try:
                result = suite_func()
                suite_results.append(result)
                status = "✅ PASSED" if result else "❌ FAILED"
                logger.info(f"{status} - {suite_name} Test Suite")
            except Exception as e:
                logger.error(f"❌ EXCEPTION in {suite_name}: {str(e)}")
                suite_results.append(False)
        
        # Generate final report
        overall_success = runner.generate_report()
        
        if overall_success:
            logger.info("🎉 ALL TESTS PASSED! Multi-tenant system is ready for production.")
        else:
            logger.error("❌ SOME TESTS FAILED! Please review the failures above.")
        
        return overall_success
        
    except Exception as e:
        logger.error(f"❌ Test suite failed with exception: {str(e)}")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
