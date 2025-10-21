from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime


class InvestorBase(BaseModel):
    data: dict[str, Any]


class InvestorCreate(InvestorBase):
    owner_id: Optional[str] = None


class InvestorUpdate(BaseModel):
    data: Optional[dict[str, Any]] = None


class InvestorItem(BaseModel):
    id: str
    owner_id: Optional[str] = None
    data: dict[str, Any]
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class InvestorsImport(BaseModel):
    items: list[dict]
    owner_id: Optional[str] = None








