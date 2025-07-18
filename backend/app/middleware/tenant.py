from fastapi import Request, HTTPException, status
from jose import jwt, JWTError
from app.config import settings
from app.models.core import UserType
import logging

logger = logging.getLogger(__name__)

def get_current_tenant_id(request: Request) -> int:
    """
    Extract tenant ID from the request's JWT token.
    
    Args:
        request: FastAPI Request object
        
    Returns:
        int: Company/tenant ID
        
    Raises:
        HTTPException: If no valid tenant ID can be extracted
    """
    # Extract authorization header
    authorization = request.headers.get("Authorization")
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header required"
        )
    
    # Extract token
    token = authorization.replace("Bearer ", "")
    
    try:
        # Decode JWT token
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        
        # Check for impersonation via header (platform admin feature)
        target_company_id = request.headers.get("X-Target-Company-ID")
        user_type = payload.get("user_type")
        
        # Handle platform admin impersonation
        if user_type == UserType.PLATFORM_ADMIN.value and target_company_id:
            try:
                company_id = int(target_company_id)
                logger.info(f"Platform admin impersonating company {company_id}")
                return company_id
            except (ValueError, TypeError):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid target company ID format"
                )
        
        # Get company ID from token
        company_id = payload.get("company_id")
        if company_id is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No company ID found in token"
            )
        
        return int(company_id)
        
    except JWTError as e:
        logger.error(f"JWT decode error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    except (ValueError, TypeError) as e:
        logger.error(f"Company ID conversion error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid company ID format"
        )
