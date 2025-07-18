from typing import Any, List, Optional
from sqlalchemy.orm import Session
from app.models.core import User, Company, UserType
from app.core.security import get_password_hash

class PlatformService:
    @staticmethod
    def create_platform_admin(
        db: Session, 
        email: str, 
        password: str, 
        full_name: Optional[str] = None,
        is_active: bool = True
    ) -> User:
        """Create a new platform admin user."""
        user = User(
            email=email,
            full_name=full_name,
            hashed_password=get_password_hash(password),
            is_active=is_active,
            user_type=UserType.PLATFORM_ADMIN,
            # No company_id for platform admins
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
