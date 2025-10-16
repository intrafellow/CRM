from sqlalchemy import Column, String, Boolean, DateTime, Enum as SQLEnum
from sqlalchemy.sql import func
import enum
from ..database import Base


class UserRole(str, enum.Enum):
    """Роли пользователей"""
    ADMIN = "admin"
    EMPLOYEE = "employee"


class User(Base):
    """Модель пользователя"""
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(SQLEnum(UserRole), default=UserRole.EMPLOYEE, nullable=False)
    verified = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

