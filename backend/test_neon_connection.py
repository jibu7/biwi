#!/usr/bin/env python3
"""
Test script to verify Neon database connection
Run this after setting up your DATABASE_URL
"""

import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

def test_neon_connection():
    """Test connection to Neon database"""
    
    # Load environment variables
    load_dotenv('.env.production')
    
    database_url = os.getenv('DATABASE_URL')
    
    if not database_url:
        print("❌ DATABASE_URL not found in .env.production")
        return False
    
    if 'your_neon_connection_string_here' in database_url:
        print("❌ Please replace the placeholder DATABASE_URL with your actual Neon connection string")
        print("💡 Get it from the 'Connect' button in your Neon dashboard")
        return False
    
    try:
        print("🔌 Testing connection to Neon database...")
        
        # Create engine
        engine = create_engine(database_url)
        
        # Test connection
        with engine.connect() as conn:
            result = conn.execute(text("SELECT version()"))
            version = result.fetchone()[0]
            
        print("✅ Database connection successful!")
        print(f"📋 PostgreSQL version: {version}")
        print("🎉 Neon database is ready for your ChannelZap ERP!")
        return True
        
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        print("💡 Check your DATABASE_URL in .env.production")
        return False

if __name__ == "__main__":
    success = test_neon_connection()
    sys.exit(0 if success else 1)
