#!/usr/bin/env python3
import sys
import os

# Add the app directory to Python path
sys.path.insert(0, '/app')

from sqlalchemy import create_engine, text

# Database URL
DATABASE_URL = "postgresql://Biwi_user:Biwi_password@db:5432/Biwi_db"

def fix_enum_issue():
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as conn:
        try:
            # Drop constraint
            conn.execute(text('ALTER TABLE users DROP CONSTRAINT IF EXISTS ck_company_required_for_non_platform_users'))
            print('✓ Dropped constraint')
            
            # Convert enum to varchar
            conn.execute(text('ALTER TABLE users ALTER COLUMN user_type TYPE VARCHAR USING user_type::text'))
            print('✓ Converted enum to varchar')
            
            # Recreate constraint (platform_admin can have NULL company_id)
            conn.execute(text("""
                ALTER TABLE users ADD CONSTRAINT ck_company_required_for_non_platform_users 
                CHECK (user_type = 'platform_admin' OR company_id IS NOT NULL)
            """))
            print('✓ Recreated constraint')
            
            # Drop the enum type
            try:
                conn.execute(text('DROP TYPE IF EXISTS usertype CASCADE'))
                print('✓ Dropped enum type')
            except Exception as e:
                print(f'⚠ Could not drop enum type: {e}')
            
            # Check result
            result = conn.execute(text("SELECT user_type, company_id, email FROM users WHERE email = 'platform@vinea.com'"))
            for row in result:
                print(f'✓ Platform user: {row.email} | type: {row.user_type} | company_id: {row.company_id}')
            
            conn.commit()
            print('✅ Database enum conversion completed successfully!')
            
        except Exception as e:
            print(f'❌ Error: {e}')
            conn.rollback()
            raise

if __name__ == '__main__':
    fix_enum_issue()
