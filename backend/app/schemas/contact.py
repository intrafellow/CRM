from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ContactBase(BaseModel):
    """Базовая схема контакта"""
    contact: str


class ContactCreate(ContactBase):
    """Схема для создания контакта"""
    owner_id: Optional[str] = None


class ContactUpdate(ContactBase):
    """Схема для обновления контакта"""
    contact: Optional[str] = None


class Contact(ContactBase):
    """Схема контакта для ответа"""
    id: str
    owner_id: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ContactImport(BaseModel):
    """Схема для массового импорта контактов"""
    contacts: list[dict]
    owner_id: Optional[str] = None

