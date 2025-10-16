from sqlalchemy import Column, String, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
from ..database import Base


class Deal(Base):
    """Модель сделки (гибкая структура с JSON)"""
    __tablename__ = "deals"

    id = Column(String, primary_key=True, index=True)
    owner_id = Column(String, ForeignKey("users.id"), nullable=True)
    
    # Динамические поля сделки хранятся в JSON
    # Это позволяет гибко работать с любыми полями из CSV
    data = Column(JSON, nullable=False, default={})
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

