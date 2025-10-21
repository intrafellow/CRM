from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime


class AdvisorBase(BaseModel):
    data: dict[str, Any]


class AdvisorCreate(AdvisorBase):
    owner_id: Optional[str] = None


class AdvisorUpdate(BaseModel):
    data: Optional[dict[str, Any]] = None


class AdvisorItem(BaseModel):
    id: str
    owner_id: Optional[str] = None
    data: dict[str, Any]
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AdvisorsImport(BaseModel):
    items: list[dict]
    owner_id: Optional[str] = None








