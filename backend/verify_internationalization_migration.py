"""
Verify that the internationalization migration was applied successfully
"""

import asyncio
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Database URL from environment
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost/biwi")

def verify_migration():
    """Verify that all internationalization columns were added"""
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as conn:
        print("🔍 Verifying internationalization migration...")
        
        # Check companies table
        print("\n📊 Companies table columns:")
        result = conn.execute(text("""
            SELECT column_name, data_type, column_default, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'companies' 
            AND column_name IN ('date_format', 'time_format', 'decimal_separator', 'thousand_separator', 'currency_position')
            ORDER BY column_name;
        """))
        
        company_columns = result.fetchall()
        if company_columns:
            for col in company_columns:
                print(f"  ✅ {col[0]}: {col[1]} (default: {col[2]}, nullable: {col[3]})")
        else:
            print("  ❌ No internationalization columns found in companies table")
        
        # Check users table
        print("\n👥 Users table columns:")
        result = conn.execute(text("""
            SELECT column_name, data_type, column_default, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'users' 
            AND column_name IN ('date_format_override', 'locale', 'timezone')
            ORDER BY column_name;
        """))
        
        user_columns = result.fetchall()
        if user_columns:
            for col in user_columns:
                print(f"  ✅ {col[0]}: {col[1]} (default: {col[2]}, nullable: {col[3]})")
        else:
            print("  ❌ No internationalization columns found in users table")
        
        # Check currencies table
        print("\n💱 Currencies table columns:")
        result = conn.execute(text("""
            SELECT column_name, data_type, column_default, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'currencies' 
            AND column_name IN ('symbol', 'decimal_places', 'symbol_position')
            ORDER BY column_name;
        """))
        
        currency_columns = result.fetchall()
        if currency_columns:
            for col in currency_columns:
                print(f"  ✅ {col[0]}: {col[1]} (default: {col[2]}, nullable: {col[3]})")
        else:
            print("  ❌ No formatting columns found in currencies table")
        
        # Count total columns added
        total_expected = 8  # 5 company + 3 user columns (currency columns might have existed)
        total_found = len(company_columns) + len(user_columns)
        
        print(f"\n📈 Summary:")
        print(f"  Expected: {total_expected} new columns")
        print(f"  Found: {total_found} new columns")
        print(f"  Currency formatting columns: {len(currency_columns)}")
        
        if total_found >= 8:
            print("  🎉 Migration applied successfully!")
            return True
        else:
            print("  ⚠️  Some columns may be missing")
            return False

if __name__ == "__main__":
    try:
        success = verify_migration()
        if success:
            print("\n✨ Phase 9.5 Internationalization migration verified successfully!")
        else:
            print("\n⚠️  Please check the migration status")
    except Exception as e:
        print(f"\n❌ Error verifying migration: {e}")
        print("Make sure the database is accessible and the migration was applied.")
