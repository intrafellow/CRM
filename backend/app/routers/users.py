from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models.user import User as UserModel
from ..schemas.user import User, UserUpdate
from ..services.auth import AuthService
from pydantic import BaseModel, Field
from ..services.audit import write_audit
from ..models.audit import AuditLog
from sqlalchemy import func
from ..dependencies import get_current_admin

router = APIRouter(prefix="/api/users", tags=["Пользователи (только для админов)"])


@router.get("", response_model=List[User], summary="Получить список всех пользователей")
async def get_users(
    request: Request,
    skip: int = Query(0, ge=0, description="Количество пропускаемых записей"),
    limit: int = Query(100, ge=1, le=1000, description="Максимальное количество записей"),
    export: bool = Query(False, description="Отметить запрос как экспорт для аудита"),
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_admin)
):
    """
    Получение списка всех пользователей.
    
    **Только для администраторов!**
    
    - **skip**: Количество пропускаемых записей (для пагинации)
    - **limit**: Максимальное количество возвращаемых записей
    """
    users = db.query(UserModel).offset(skip).limit(limit).all()
    if export:
        try:
            write_audit(db, user_id=current_user.id, action="export", entity="user", meta={"count": len(users), "email": current_user.email})
        except Exception:
            pass
    return [User.model_validate(u) for u in users]


# ВАЖНО: располагать до динамического "/{user_id}", иначе перехватит динамический маршрут
@router.get("/audit-summary", summary="Сводка аудита по действиям пользователей (для экспорта)")
async def audit_summary(db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_admin)):
    # Собираем по каждому пользователю последние времена его действий
    users = db.query(UserModel.id).all()

    def max_when(action: str):
        rows = (
            db.query(AuditLog.user_id, func.max(AuditLog.created_at))
            .filter(AuditLog.action == action)
            .group_by(AuditLog.user_id)
            .all()
        )
        return {uid: ts.isoformat() if ts else None for uid, ts in rows}

    last_import = max_when("import")
    last_update = max_when("update")
    last_delete = max_when("delete")
    last_export = max_when("export")
    # Смена пароля — по entity=user и entity_id=uid
    rows_pw = (
        db.query(AuditLog.entity_id, func.max(AuditLog.created_at))
        .filter(AuditLog.entity == "user", AuditLog.action == "change_password")
        .group_by(AuditLog.entity_id)
        .all()
    )
    last_password_change = {uid: ts.isoformat() if ts else None for uid, ts in rows_pw}

    result = []
    for (uid,) in users:
        result.append({
            "user_id": uid,
            "last_import": last_import.get(uid),
            "last_update": last_update.get(uid),
            "last_delete": last_delete.get(uid),
            "last_export": last_export.get(uid),
            "last_password_change": last_password_change.get(uid),
        })
    return result


@router.get("/{user_id}", response_model=User, summary="Получить пользователя по ID")
async def get_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_admin)
):
    """
    Получение пользователя по ID.
    
    **Только для администраторов!**
    
    - **user_id**: Уникальный идентификатор пользователя
    """
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )
    
    return User.model_validate(user)


@router.put("/{user_id}", response_model=User, summary="Обновить пользователя")
async def update_user(
    user_id: str,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_admin)
):
    """
    Обновление данных пользователя.
    
    **Только для администраторов!**
    
    - **user_id**: ID пользователя для обновления
    - **email**: Новый email (опционально)
    - **name**: Новое имя (опционально)
    - **role**: Новая роль (опционально)
    - **verified**: Статус верификации (опционально)
    """
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )
    
    # Обновление полей
    if user_data.email is not None:
        # Проверка уникальности email
        existing = db.query(UserModel).filter(
            UserModel.email == user_data.email,
            UserModel.id != user_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Пользователь с таким email уже существует"
            )
        user.email = user_data.email
    
    if user_data.name is not None:
        user.name = user_data.name
    
    if user_data.role is not None:
        user.role = user_data.role
    
    if user_data.verified is not None:
        user.verified = user_data.verified
    
    db.commit()
    db.refresh(user)
    try:
        write_audit(db, user_id=current_user.id, action="update", entity="user", entity_id=user_id, meta={"email": current_user.email})
    except Exception:
        pass
    return User.model_validate(user)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Удалить пользователя")
async def delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_admin)
):
    """
    Удаление пользователя.
    
    **Только для администраторов!**
    
    - **user_id**: ID пользователя для удаления
    
    Нельзя удалить самого себя.
    """
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Нельзя удалить самого себя"
        )
    
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )
    
    db.delete(user)
    db.commit()
    try:
        write_audit(db, user_id=current_user.id, action="delete", entity="user", entity_id=user_id, meta={"email": current_user.email})
    except Exception:
        pass
    return None


class PasswordUpdate(BaseModel):
    new_password: str = Field(min_length=6)


@router.put("/{user_id}/password", status_code=status.HTTP_204_NO_CONTENT, summary="Сменить пароль пользователя")
async def change_password(
    user_id: str,
    payload: PasswordUpdate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_admin)
):
    """Смена пароля (только админ). Пароль хешируется bcrypt и сохраняется как hashed_password."""
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Пользователь не найден")
    user.hashed_password = AuthService.get_password_hash(payload.new_password)
    db.commit()
    try:
        write_audit(db, user_id=current_user.id, action="change_password", entity="user", entity_id=user_id, meta={"email": current_user.email})
    except Exception:
        pass
    return None


class AuditSummaryItem(BaseModel):
    user_id: str
    last_update: str | None = None
    last_password_change: str | None = None


@router.get("/audit-summary", summary="Сводка аудита по пользователям")
async def audit_summary(db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_admin)):
    # Последний update
    updates = (
        db.query(AuditLog.entity_id, func.max(AuditLog.created_at))
        .filter(AuditLog.entity == "user", AuditLog.action == "update")
        .group_by(AuditLog.entity_id)
        .all()
    )
    updates_map = {uid: ts.isoformat() if ts else None for uid, ts in updates}

    # Последняя смена пароля
    pw = (
        db.query(AuditLog.entity_id, func.max(AuditLog.created_at))
        .filter(AuditLog.entity == "user", AuditLog.action == "change_password")
        .group_by(AuditLog.entity_id)
        .all()
    )
    pw_map = {uid: ts.isoformat() if ts else None for uid, ts in pw}

    result = []
    for u in db.query(UserModel.id).all():
        uid = u[0]
        result.append({
            "user_id": uid,
            "last_update": updates_map.get(uid),
            "last_password_change": pw_map.get(uid),
        })
    return result

