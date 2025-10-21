from fastapi import APIRouter, Depends, HTTPException, status, Response
from datetime import datetime
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr

from ..database import get_db
from ..models.user import User as UserModel
from ..schemas.user import User, UserCreate, Token
from ..services.auth import AuthService
from ..services.ratelimit import limiter
from ..dependencies import get_current_active_user
import uuid

router = APIRouter(prefix="/api/auth", tags=["Аутентификация"])


class LoginRequest(BaseModel):
    """Схема для входа"""
    email: EmailStr
    password: str


@router.post("/register", response_model=Token, summary="Регистрация нового пользователя")
async def register(user_data: UserCreate, db: Session = Depends(get_db), response: Response = None):
    """
    Регистрация нового пользователя в системе.
    
    - **email**: Email пользователя (должен быть уникальным)
    - **password**: Пароль (минимум 6 символов)
    - **name**: Имя пользователя
    - **role**: Роль (admin или employee), по умолчанию employee
    """
    # Проверка существования пользователя
    existing_user = db.query(UserModel).filter(UserModel.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь с таким email уже существует"
        )
    
    # Создание нового пользователя
    user = UserModel(
        id=f"u_{uuid.uuid4().hex[:12]}",
        email=user_data.email,
        name=user_data.name,
        hashed_password=AuthService.get_password_hash(user_data.password),
        role=user_data.role,
        verified=True  # Автоматическая верификация для упрощения
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Обновим last_login
    user.last_login = datetime.utcnow()
    db.commit()
    # Создание токена
    access_token = AuthService.create_access_token(data={"sub": user.id})
    # Cookie (HttpOnly)
    if response is not None:
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            secure=False,  # включить True за прокси/https
            samesite="lax",
            path="/",
        )
    
    return Token(
        access_token=access_token,
        user=User.model_validate(user)
    )


@router.post("/login", response_model=Token, summary="Вход в систему")
async def login(credentials: LoginRequest, db: Session = Depends(get_db), response: Response = None):
    # rate-limit по IP/email (MVP)
    try:
        import os
        ip_key = f"login:ip:{os.getenv('CLIENT_IP','unknown')}"
        if not limiter.allow(ip_key, limit=5, window_seconds=60):
            raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Too many login attempts")
        email_key = f"login:email:{credentials.email}"
        if not limiter.allow(email_key, limit=20, window_seconds=3600):
            raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Too many login attempts (hour)")
    except Exception:
        pass
    """
    Вход в систему с email и паролем.
    
    - **email**: Email пользователя
    - **password**: Пароль
    
    Возвращает JWT токен для дальнейшей аутентификации.
    """
    # Поиск пользователя
    user = db.query(UserModel).filter(UserModel.email == credentials.email).first()
    
    if not user or not AuthService.verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный email или пароль",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Обновим last_login (best-effort)
    try:
        from datetime import datetime
        user.last_login = datetime.utcnow()
        db.commit()
    except Exception:
        pass
    # Создание токена
    access_token = AuthService.create_access_token(data={"sub": user.id})
    # Cookie (HttpOnly)
    if response is not None:
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            secure=False,
            samesite="lax",
            path="/",
        )
    
    return Token(
        access_token=access_token,
        user=User.model_validate(user)
    )


@router.get("/me", response_model=User, summary="Получить данные текущего пользователя")
async def get_me(current_user: UserModel = Depends(get_current_active_user), db: Session = Depends(get_db)):
    """
    Получение данных текущего авторизованного пользователя.
    
    Требуется JWT токен в заголовке Authorization: Bearer <token>
    """
    # Обновим last_login при обращении к профилю (первый запрос после логина)
    try:
        from datetime import datetime
        current_user.last_login = datetime.utcnow()
        db.commit()
    except Exception:
        pass
    return User.model_validate(current_user)


@router.post("/logout", summary="Выход из системы")
async def logout(current_user: UserModel = Depends(get_current_active_user), response: Response = None):
    """
    Выход из системы.
    
    На стороне клиента нужно удалить токен.
    """
    if response is not None:
        response.set_cookie(key="access_token", value="", httponly=True, secure=False, samesite="lax", path="/", max_age=0)
    return {"message": "Успешный выход из системы"}

