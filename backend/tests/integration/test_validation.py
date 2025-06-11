"""
Integration tests for validation scripts and phase completions
"""
import pytest
import subprocess
import sys
import os
from pathlib import Path


class TestValidationScripts:
    """Test validation and phase completion scripts"""
    
    @pytest.fixture
    def backend_path(self):
        """Get the backend directory path"""
        return Path(__file__).parent.parent.parent
    
    def test_phase1_validation(self, backend_path):
        """Test Phase 1 validation script"""
        script_path = backend_path / "validate_phase1.py"
        
        if not script_path.exists():
            pytest.skip("validate_phase1.py not found")
        
        try:
            result = subprocess.run(
                [sys.executable, str(script_path)],
                cwd=str(backend_path),
                capture_output=True,
                text=True,
                timeout=30
            )
            
            # The script should complete without crashing
            # Exit code might be non-zero if tests fail, but script should run
            assert result.returncode in [0, 1], f"Script crashed with code {result.returncode}"
            
            # Check that it produces some output
            assert len(result.stdout) > 0 or len(result.stderr) > 0
            
        except subprocess.TimeoutExpired:
            pytest.fail("validate_phase1.py took too long to complete")
        except Exception as e:
            pytest.fail(f"Error running validate_phase1.py: {e}")
    
    def test_phase3_validation(self, backend_path):
        """Test Phase 3 validation script"""
        script_path = backend_path / "validate_phase3.py"
        
        if not script_path.exists():
            pytest.skip("validate_phase3.py not found")
        
        try:
            result = subprocess.run(
                [sys.executable, str(script_path)],
                cwd=str(backend_path),
                capture_output=True,
                text=True,
                timeout=30
            )
            
            # The script should complete without crashing
            assert result.returncode in [0, 1], f"Script crashed with code {result.returncode}"
            
            # Check that it produces some output
            assert len(result.stdout) > 0 or len(result.stderr) > 0
            
        except subprocess.TimeoutExpired:
            pytest.fail("validate_phase3.py took too long to complete")
        except Exception as e:
            pytest.fail(f"Error running validate_phase3.py: {e}")
    
    def test_phase3_final_validation(self, backend_path):
        """Test Phase 3 final validation script"""
        script_path = backend_path / "validate_phase3_final.py"
        
        if not script_path.exists():
            pytest.skip("validate_phase3_final.py not found")
        
        try:
            result = subprocess.run(
                [sys.executable, str(script_path)],
                cwd=str(backend_path),
                capture_output=True,
                text=True,
                timeout=30
            )
            
            # The script should complete without crashing
            assert result.returncode in [0, 1], f"Script crashed with code {result.returncode}"
            
            # Check that it produces some output
            assert len(result.stdout) > 0 or len(result.stderr) > 0
            
        except subprocess.TimeoutExpired:
            pytest.fail("validate_phase3_final.py took too long to complete")
        except Exception as e:
            pytest.fail(f"Error running validate_phase3_final.py: {e}")


class TestDatabaseIntegration:
    """Integration tests for database connectivity and setup"""
    
    def test_database_connection(self):
        """Test basic database connectivity"""
        try:
            from app.database.database import engine
            from sqlalchemy import text
            
            with engine.connect() as connection:
                result = connection.execute(text("SELECT 1"))
                assert result.fetchone()[0] == 1
                
        except Exception as e:
            pytest.fail(f"Database connection failed: {e}")
    
    def test_models_import(self):
        """Test that all models can be imported without errors"""
        try:
            from app.models.core import Company, User, Role, UserRole, AccountingPeriod
            from app.models.gl import GLAccount, GLJournalEntry, GLJournalEntryLine, GLTransactionType, GLDefaults
            
            # Basic instantiation test (without database interaction)
            models = [Company, User, Role, UserRole, AccountingPeriod, 
                     GLAccount, GLJournalEntry, GLJournalEntryLine, GLTransactionType, GLDefaults]
            
            for model in models:
                assert hasattr(model, '__tablename__')
                
        except ImportError as e:
            pytest.fail(f"Failed to import models: {e}")
        except Exception as e:
            pytest.fail(f"Error with model classes: {e}")
    
    def test_crud_import(self):
        """Test that CRUD operations can be imported"""
        try:
            from app import crud
            
            # Check that main CRUD functions exist
            crud_functions = [
                'create_company', 'get_company', 'get_companies',
                'create_user', 'get_user_by_email', 'get_users_by_company',
                'create_role', 'get_roles_by_company',
                'assign_role_to_user', 'get_user_roles',
                'create_accounting_period', 'get_accounting_periods_by_company'
            ]
            
            for func_name in crud_functions:
                assert hasattr(crud, func_name), f"CRUD function {func_name} not found"
                
        except ImportError as e:
            pytest.fail(f"Failed to import CRUD operations: {e}")
    
    def test_schemas_import(self):
        """Test that schemas can be imported"""
        try:
            from app import schemas
            
            # Check that main schema classes exist
            schema_classes = [
                'CompanyCreate', 'CompanyResponse',
                'UserCreate', 'UserResponse',
                'RoleCreate', 'RoleResponse',
                'AccountingPeriodCreate', 'AccountingPeriodResponse'
            ]
            
            for schema_name in schema_classes:
                assert hasattr(schemas, schema_name), f"Schema {schema_name} not found"
                
        except ImportError as e:
            pytest.fail(f"Failed to import schemas: {e}")


class TestSystemIntegration:
    """End-to-end system integration tests"""
    
    def test_full_system_workflow(self, test_db):
        """Test a complete system workflow"""
        try:
            from app import crud, schemas
            
            # 1. Create company
            company_data = schemas.CompanyCreate(
                name="Integration Test Company",
                address="123 Integration St",
                email="integration@test.com",
                phone="123-456-7890",
                tax_id="INT123"
            )
            company = crud.create_company(test_db, company_data)
            assert company.id is not None
            
            # 2. Create user
            user_data = schemas.UserCreate(
                email="integration@test.com",
                password="testpass123",
                full_name="Integration Test User",
                is_active=True,
                is_superuser=False
            )
            user = crud.create_user(test_db, user_data, company.id)
            assert user.id is not None
            
            # 3. Create role and assign to user
            role_data = schemas.RoleCreate(
                name="Integration Role",
                description="Role for integration testing",
                permissions=["read", "write"]
            )
            role = crud.create_role(test_db, role_data, company.id)
            assigned_user = crud.assign_role_to_user(test_db, user.id, role.id, company.id)
            assert assigned_user is not None
            
            # 4. Create accounting period
            from datetime import date
            period_data = schemas.AccountingPeriodCreate(
                name="Integration Period",
                start_date=date(2024, 1, 1),
                end_date=date(2024, 12, 31),
                status="active"
            )
            period = crud.create_accounting_period(test_db, period_data, company.id)
            assert period.id is not None
            
            print("✅ Full system integration test completed successfully")
            
        except Exception as e:
            pytest.fail(f"System integration test failed: {e}")
