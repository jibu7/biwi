from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class PlatformUser(BaseModel):
    id: int
    email: str
    full_name: Optional[str]
    user_type: str
    is_active: bool
    last_login: Optional[datetime]
    created_at: datetime
    company_id: Optional[int]
    company_name: Optional[str]
    company_code: Optional[str]

    class Config:
        from_attributes = True
