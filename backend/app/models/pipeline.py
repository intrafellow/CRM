from sqlalchemy import Column, String, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
from ..database import Base


class PipelineItem(Base):
    """Pipeline row (flexible JSON schema)"""
    __tablename__ = "pipeline_items"

    id = Column(String, primary_key=True, index=True)
    owner_id = Column(String, ForeignKey("users.id"), nullable=True)
    data = Column(JSON, nullable=False, default={})
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())








