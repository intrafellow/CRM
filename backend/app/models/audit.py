from sqlalchemy import Column, String, DateTime, JSON
from sqlalchemy.sql import func
from ..database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, nullable=True)
    action = Column(String, nullable=False)          # e.g. import, delete, change_password
    entity = Column(String, nullable=False)          # e.g. pipeline, companies, advisors, investors, user
    entity_id = Column(String, nullable=True)
    ip = Column(String, nullable=True)
    ua = Column(String, nullable=True)
    meta = Column(JSON, nullable=True)               # free-form details
    created_at = Column(DateTime(timezone=True), server_default=func.now())








