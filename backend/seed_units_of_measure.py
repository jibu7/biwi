#!/usr/bin/env python3
"""
Seed essential Units of Measure for BIWI ERP system.
This script creates basic, commonly used units of measure that should always be available.
"""

import os
import sys
from sqlalchemy import text, create_engine
from sqlalchemy.orm import sessionmaker

def get_database_url():
    """Get the database URL for docker setup."""
    return "postgresql://Biwi_user:Biwi_password@localhost:5432/Biwi_db"

def seed_units_of_measure():
    """Seed essential units of measure."""
    
    db_url = get_database_url()
    print(f"Connecting to database...")
    
    # Create engine and session
    engine = create_engine(db_url)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    with SessionLocal() as session:
        try:
            print("\n=== SEEDING UNITS OF MEASURE ===\n")
            
            # Get the company ID (should be 1 after cleanup)
            result = session.execute(text("SELECT id FROM companies LIMIT 1"))
            company_row = result.fetchone()
            if not company_row:
                print("❌ No company found. Please ensure you have at least one company in the database.")
                return
            
            company_id = company_row[0]
            print(f"Using company ID: {company_id}")
            
            # Define essential units of measure
            # These are commonly used units that should always be available
            essential_units = [
                # Basic counting units
                {"name": "Each", "abbreviation": "EA", "conversion_factor": 1.00, "category": "Count"},
                {"name": "Piece", "abbreviation": "PC", "conversion_factor": 1.00, "category": "Count"},
                {"name": "Item", "abbreviation": "ITEM", "conversion_factor": 1.00, "category": "Count"},
                {"name": "Unit", "abbreviation": "UNIT", "conversion_factor": 1.00, "category": "Count"},
                
                # Weight units (metric)
                {"name": "Kilogram", "abbreviation": "KG", "conversion_factor": 1.00, "category": "Weight"},
                {"name": "Gram", "abbreviation": "G", "conversion_factor": 0.001, "category": "Weight"},
                {"name": "Ton", "abbreviation": "TON", "conversion_factor": 1000.00, "category": "Weight"},
                
                # Weight units (imperial)
                {"name": "Pound", "abbreviation": "LB", "conversion_factor": 0.453592, "category": "Weight"},
                {"name": "Ounce", "abbreviation": "OZ", "conversion_factor": 0.0283495, "category": "Weight"},
                
                # Length units (metric)
                {"name": "Meter", "abbreviation": "M", "conversion_factor": 1.00, "category": "Length"},
                {"name": "Centimeter", "abbreviation": "CM", "conversion_factor": 0.01, "category": "Length"},
                {"name": "Millimeter", "abbreviation": "MM", "conversion_factor": 0.001, "category": "Length"},
                {"name": "Kilometer", "abbreviation": "KM", "conversion_factor": 1000.00, "category": "Length"},
                
                # Length units (imperial)
                {"name": "Foot", "abbreviation": "FT", "conversion_factor": 0.3048, "category": "Length"},
                {"name": "Inch", "abbreviation": "IN", "conversion_factor": 0.0254, "category": "Length"},
                {"name": "Yard", "abbreviation": "YD", "conversion_factor": 0.9144, "category": "Length"},
                
                # Volume units (metric)
                {"name": "Liter", "abbreviation": "L", "conversion_factor": 1.00, "category": "Volume"},
                {"name": "Milliliter", "abbreviation": "ML", "conversion_factor": 0.001, "category": "Volume"},
                {"name": "Cubic Meter", "abbreviation": "M3", "conversion_factor": 1000.00, "category": "Volume"},
                
                # Volume units (imperial)
                {"name": "Gallon", "abbreviation": "GAL", "conversion_factor": 3.78541, "category": "Volume"},
                {"name": "Quart", "abbreviation": "QT", "conversion_factor": 0.946353, "category": "Volume"},
                {"name": "Pint", "abbreviation": "PT", "conversion_factor": 0.473176, "category": "Volume"},
                
                # Area units
                {"name": "Square Meter", "abbreviation": "M2", "conversion_factor": 1.00, "category": "Area"},
                {"name": "Square Foot", "abbreviation": "FT2", "conversion_factor": 0.092903, "category": "Area"},
                
                # Time units
                {"name": "Hour", "abbreviation": "HR", "conversion_factor": 1.00, "category": "Time"},
                {"name": "Minute", "abbreviation": "MIN", "conversion_factor": 0.0166667, "category": "Time"},
                {"name": "Day", "abbreviation": "DAY", "conversion_factor": 24.00, "category": "Time"},
                
                # Packaging units
                {"name": "Box", "abbreviation": "BOX", "conversion_factor": 1.00, "category": "Package"},
                {"name": "Case", "abbreviation": "CASE", "conversion_factor": 1.00, "category": "Package"},
                {"name": "Carton", "abbreviation": "CTN", "conversion_factor": 1.00, "category": "Package"},
                {"name": "Pallet", "abbreviation": "PLT", "conversion_factor": 1.00, "category": "Package"},
                {"name": "Dozen", "abbreviation": "DOZ", "conversion_factor": 12.00, "category": "Package"},
                {"name": "Pair", "abbreviation": "PAIR", "conversion_factor": 2.00, "category": "Package"},
                
                # Service units
                {"name": "Service", "abbreviation": "SVC", "conversion_factor": 1.00, "category": "Service"},
                {"name": "License", "abbreviation": "LIC", "conversion_factor": 1.00, "category": "Service"},
            ]
            
            # Check existing units to avoid duplicates
            existing_result = session.execute(text("""
                SELECT name, abbreviation FROM unit_of_measures WHERE company_id = :company_id
            """), {"company_id": company_id})
            existing_units = {(row[0], row[1]) for row in existing_result.fetchall()}
            
            # Insert units that don't exist
            units_added = 0
            for unit in essential_units:
                unit_key = (unit["name"], unit["abbreviation"])
                if unit_key not in existing_units:
                    session.execute(text("""
                        INSERT INTO unit_of_measures (company_id, name, abbreviation, conversion_factor_to_base, is_active)
                        VALUES (:company_id, :name, :abbreviation, :conversion_factor, true)
                    """), {
                        "company_id": company_id,
                        "name": unit["name"],
                        "abbreviation": unit["abbreviation"],
                        "conversion_factor": unit["conversion_factor"]
                    })
                    print(f"✓ Added {unit['name']} ({unit['abbreviation']}) - {unit['category']}")
                    units_added += 1
                else:
                    print(f"⚠ Skipped {unit['name']} ({unit['abbreviation']}) - already exists")
            
            # Commit all changes
            session.commit()
            
            print(f"\n=== SEEDING COMPLETED ===")
            print(f"✓ {units_added} units of measure added")
            print(f"✓ {len(existing_units)} units already existed")
            print(f"✓ Total units available: {len(existing_units) + units_added}")
            print("\nYour inventory system now has essential units of measure!")
            
        except Exception as e:
            session.rollback()
            print(f"\n❌ ERROR during seeding: {e}")
            print("Database rollback completed.")
            sys.exit(1)
            
    print("\nDatabase connection closed.")

if __name__ == "__main__":
    print("=== BIWI Units of Measure Seeding Tool ===\n")
    print("This will add essential units of measure to your database.")
    print("Existing units will not be duplicated.\n")
    
    response = input("Proceed with seeding? (y/N): ")
    if response.lower() in ['y', 'yes']:
        print("\n🔄 Starting seeding process...")
        seed_units_of_measure()
    else:
        print("❌ Seeding cancelled.")
        sys.exit(0)
