import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.core import Base, User, UserType
from app.core.security import get_password_hash

def create_platform_admin(db_url: str, email: str, password: str, full_name: str = None):
    """Create a platform admin user."""
    engine = create_engine(db_url)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user:
            print(f"User with email {email} already exists.")
            # If user exists but is not a platform admin, update it
            if existing_user.user_type != 'platform_admin':
                existing_user.user_type = 'platform_admin'
                db.commit()
                print(f"User {email} has been updated to platform admin.")
            return
        
        # Create new platform admin
        user = User(
            email=email,
            full_name=full_name,
            hashed_password=get_password_hash(password),
            is_active=True,
            user_type='platform_admin'
        )
        db.add(user)
        db.commit()
        print(f"Platform admin {email} created successfully.")
    
    except Exception as e:
        db.rollback()
        print(f"Error creating platform admin: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    # Use PostgreSQL in Docker environment
    db_url = os.environ.get("DATABASE_URL", "postgresql://postgres:postgres@db:5432/biwi")
    
    if len(sys.argv) < 3:
        print("Usage: python create_platform_admin.py <email> <password> [full_name]")
        sys.exit(1)
    
    email = sys.argv[1]
    password = sys.argv[2]
    full_name = sys.argv[3] if len(sys.argv) > 3 else None
    
    create_platform_admin(db_url, email, password, full_name)
