#!/usr/bin/env python3
"""
Test script to debug the sales order conversion issue
"""

import sys
import os
sys.path.append('/app')

from sqlalchemy.orm import Session
from app.database.database import SessionLocal
from app.crud import oe as crud_oe
import traceback

def test_conversion():
    db = SessionLocal()
    try:
        print("Testing sales order conversion...")
        
        # Test the conversion
        result = crud_oe.convert_so_to_ar_invoice(
            db=db,
            so_id=1,
            company_id=1,  # Assuming company ID 1
            user_id=1      # Assuming user ID 1
        )
        
        print(f"Conversion successful! AR Invoice ID: {result.id}")
        
    except Exception as e:
        print(f"Conversion failed with error: {e}")
        print("Full traceback:")
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_conversion()