from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.db.database import get_db as db_dependency
from app.models.models import User
from app.utils.auth import verify_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# Export get_db from database
get_db = db_dependency

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """Get current authenticated user from JWT token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = verify_token(token)
    if payload is None:
        raise credentials_exception
    
    email: str = payload.get("sub")
    if email is None:
        raise credentials_exception
    
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    
    return user

def get_current_admin(current_user: User = Depends(get_current_user)) -> User:
    """Verify current user is an admin."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

def get_current_trader(current_user: User = Depends(get_current_user)) -> User:
    """Verify current user is a trader."""
    if current_user.role != "trader":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Trader access required"
        )
    return current_user

def get_current_client(current_user: User = Depends(get_current_user)) -> User:
    """Verify current user is a client."""
    if current_user.role != "client":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Client access required"
        )
    return current_user
