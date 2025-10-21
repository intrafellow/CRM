from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime


class CompanyBase(BaseModel):
    data: dict[str, Any]


class CompanyCreate(CompanyBase):
    owner_id: Optional[str] = None


class CompanyUpdate(BaseModel):
    data: Optional[dict[str, Any]] = None


class CompanyToReach(BaseModel):
    id: str
    owner_id: Optional[str] = None
    data: dict[str, Any]
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CompaniesImport(BaseModel):
    items: list[dict]
    owner_id: Optional[str] = None








