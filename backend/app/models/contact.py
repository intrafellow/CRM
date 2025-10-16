from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from ..database import Base


class Contact(Base):
    """Модель контакта"""
    __tablename__ = "contacts"

    id = Column(String, primary_key=True, index=True)
    contact = Column(String, nullable=False)  # Имя контакта
    owner_id = Column(String, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

