from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime


class PipelineBase(BaseModel):
    data: dict[str, Any]


class PipelineCreate(PipelineBase):
    owner_id: Optional[str] = None


class PipelineUpdate(BaseModel):
    data: Optional[dict[str, Any]] = None


class PipelineItem(BaseModel):
    id: str
    owner_id: Optional[str] = None
    data: dict[str, Any]
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class PipelineImport(BaseModel):
    items: list[dict]
    owner_id: Optional[str] = None








