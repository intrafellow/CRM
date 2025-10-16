from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from ..models.user import UserRole


class UserBase(BaseModel):
    """Базовая схема пользователя"""
    email: EmailStr
    name: str


class UserCreate(UserBase):
    """Схема для создания пользователя"""
    password: str = Field(..., min_length=6)
    role: Optional[UserRole] = UserRole.EMPLOYEE


class UserUpdate(BaseModel):
    """Схема для обновления пользователя"""
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    role: Optional[UserRole] = None
    verified: Optional[bool] = None


class User(UserBase):
    """Схема пользователя для ответа"""
    id: str
    role: UserRole
    verified: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class UserInDB(User):
    """Схема пользователя в БД (с хешем пароля)"""
    hashed_password: str


class Token(BaseModel):
    """Схема токена"""
    access_token: str
    token_type: str = "bearer"
    user: User


class TokenData(BaseModel):
    """Данные из токена"""
    user_id: Optional[str] = None

