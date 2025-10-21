from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid

from ..database import get_db
from ..models.pipeline import PipelineItem as PipelineModel
from ..models.user import User as UserModel
from ..schemas.pipeline import PipelineItem, PipelineCreate, PipelineUpdate, PipelineImport
from ..dependencies import get_current_active_user
from ..services.ratelimit import limiter
from ..services.audit import write_audit


EXPECTED_HEADERS = [
    'Company','Date','Sector','Seniot','Junior team','Source','Source Name','Type','Size, RUB mn','Status','Next connection','Comments'
]

router = APIRouter(prefix="/api/pipeline", tags=["Pipeline"])


MAX_LIST = 5000


@router.get("", response_model=List[PipelineItem])
async def list_items(
    skip: int = Query(0, ge=0),
    limit: Optional[int] = Query(1000, ge=1, le=MAX_LIST),
    export: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    q = db.query(PipelineModel)
    if limit is None:
        items = q.offset(skip).all()
    else:
        items = q.offset(skip).limit(min(limit, MAX_LIST)).all()
    if export:
        try:
            write_audit(db, user_id=current_user.id, action="export", entity="pipeline", meta={"count": len(items)})
        except Exception:
            pass
    return [PipelineItem.model_validate(x) for x in items]


@router.post("", response_model=PipelineItem, status_code=status.HTTP_201_CREATED)
async def create_item(payload: PipelineCreate, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_active_user)):
    item = PipelineModel(id=f"p_{uuid.uuid4().hex[:12]}", owner_id=payload.owner_id or current_user.id, data=payload.data)
    db.add(item)
    db.commit()
    db.refresh(item)
    return PipelineItem.model_validate(item)


@router.delete("/clear", status_code=status.HTTP_204_NO_CONTENT)
async def clear(db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_active_user)):
    db.query(PipelineModel).delete()
    db.commit()
    return None


MAX_ITEMS = 20000


@router.post("/import", response_model=List[PipelineItem])
async def import_items(payload: PipelineImport, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_active_user)):
    if not payload.items:
        raise HTTPException(status_code=400, detail="Empty file")
    if len(payload.items) > MAX_ITEMS:
        raise HTTPException(status_code=413, detail=f"Too many rows: {len(payload.items)} > {MAX_ITEMS}")
    # rate-limit import на пользователя
    key = f"import:pipeline:{current_user.id}"
    if not limiter.allow(key, limit=3, window_seconds=60):
        raise HTTPException(status_code=429, detail="Too many imports, slow down")
    # Validate headers
    first = payload.items[0]
    headers = list(first.keys())
    if any(h not in headers for h in EXPECTED_HEADERS):
        raise HTTPException(status_code=400, detail="Incorrect file for Pipeline")
    created = []
    for row in payload.items:
        # skip empty rows (all values empty/whitespace)
        if not any(str(v).strip() for v in row.values()):
            continue
        m = PipelineModel(id=f"p_{uuid.uuid4().hex[:12]}", owner_id=payload.owner_id or current_user.id, data=row)
        db.add(m)
        created.append(m)
    db.commit()
    try:
        write_audit(db, user_id=current_user.id, action="import", entity="pipeline", meta={"email": current_user.email})
    except Exception:
        pass
    return [PipelineItem.model_validate(x) for x in created]


@router.put("/{item_id}", response_model=PipelineItem)
async def update_item(item_id: str, payload: PipelineUpdate, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_active_user)):
    item = db.query(PipelineModel).get(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    if payload.data is not None:
        item.data = payload.data
    db.commit()
    db.refresh(item)
    try:
        write_audit(db, user_id=current_user.id, action="update", entity="pipeline", entity_id=item_id, meta={"email": current_user.email})
    except Exception:
        pass
    return PipelineItem.model_validate(item)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(item_id: str, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_active_user)):
    item = db.query(PipelineModel).get(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(item)
    db.commit()
    try:
        write_audit(db, user_id=current_user.id, action="delete", entity="pipeline", entity_id=item_id, meta={"email": current_user.email})
    except Exception:
        pass
    return None


