from pydantic import BaseModel
from typing import Optional

class Token(BaseModel):
    access_token: str
    token_type: str
    is_platform_admin: Optional[bool] = False

class TokenPayload(BaseModel):
    sub: Optional[int] = None  # user ID
    user_type: Optional[str] = None
    company_id: Optional[int] = None
    exp: Optional[int] = None
