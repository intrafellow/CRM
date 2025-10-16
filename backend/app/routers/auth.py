from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr

from ..database import get_db
from ..models.user import User as UserModel
from ..schemas.user import User, UserCreate, Token
from ..services.auth import AuthService
from ..dependencies import get_current_active_user
import uuid

router = APIRouter(prefix="/api/auth", tags=["Аутентификация"])


class LoginRequest(BaseModel):
    """Схема для входа"""
    email: EmailStr
    password: str


@router.post("/register", response_model=Token, summary="Регистрация нового пользователя")
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
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
    
    # Создание токена
    access_token = AuthService.create_access_token(data={"sub": user.id})
    
    return Token(
        access_token=access_token,
        user=User.model_validate(user)
    )


@router.post("/login", response_model=Token, summary="Вход в систему")
async def login(credentials: LoginRequest, db: Session = Depends(get_db)):
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
    
    # Создание токена
    access_token = AuthService.create_access_token(data={"sub": user.id})
    
    return Token(
        access_token=access_token,
        user=User.model_validate(user)
    )


@router.get("/me", response_model=User, summary="Получить данные текущего пользователя")
async def get_me(current_user: UserModel = Depends(get_current_active_user)):
    """
    Получение данных текущего авторизованного пользователя.
    
    Требуется JWT токен в заголовке Authorization: Bearer <token>
    """
    return User.model_validate(current_user)


@router.post("/logout", summary="Выход из системы")
async def logout(current_user: UserModel = Depends(get_current_active_user)):
    """
    Выход из системы.
    
    На стороне клиента нужно удалить токен.
    """
    return {"message": "Успешный выход из системы"}

