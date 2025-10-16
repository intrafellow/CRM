from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime


class DealBase(BaseModel):
    """Базовая схема сделки"""
    data: dict[str, Any]


class DealCreate(DealBase):
    """Схема для создания сделки"""
    owner_id: Optional[str] = None


class DealUpdate(BaseModel):
    """Схема для обновления сделки"""
    data: Optional[dict[str, Any]] = None


class Deal(BaseModel):
    """Схема сделки для ответа"""
    id: str
    owner_id: Optional[str] = None
    data: dict[str, Any]
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class DealImport(BaseModel):
    """Схема для массового импорта сделок"""
    deals: list[dict]
    owner_id: Optional[str] = None

