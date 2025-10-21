import uuid
from sqlalchemy.orm import Session
from ..models.audit import AuditLog


def write_audit(db: Session, *, user_id: str | None, action: str, entity: str, entity_id: str | None = None, ip: str | None = None, ua: str | None = None, meta: dict | None = None):
    log = AuditLog(
        id=f"al_{uuid.uuid4().hex[:12]}",
        user_id=user_id,
        action=action,
        entity=entity,
        entity_id=entity_id,
        ip=ip,
        ua=ua,
        meta=meta or {},
    )
    db.add(log)
    db.commit()








