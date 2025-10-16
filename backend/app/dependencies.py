from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional

from .database import get_db
from .models.user import User
from .services.auth import AuthService

# Security схема для JWT
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Получение текущего пользователя из JWT токена"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Не удалось проверить учетные данные",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    token = credentials.credentials
    token_data = AuthService.decode_token(token)
    
    if token_data is None or token_data.user_id is None:
        raise credentials_exception
    
    user = db.query(User).filter(User.id == token_data.user_id).first()
    
    if user is None:
        raise credentials_exception
    
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """Получение активного (верифицированного) пользователя"""
    if not current_user.verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Пользователь не верифицирован"
        )
    return current_user


async def get_current_admin(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """Получение пользователя с правами администратора"""
    from .models.user import UserRole
    
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав доступа"
        )
    return current_user


# Опциональная аутентификация (для публичных эндпоинтов)
async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False)),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Получение текущего пользователя (опционально)"""
    if credentials is None:
        return None
    
    token_data = AuthService.decode_token(credentials.credentials)
    if token_data is None or token_data.user_id is None:
        return None
    
    user = db.query(User).filter(User.id == token_data.user_id).first()
    return user

