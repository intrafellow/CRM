from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid

from ..database import get_db
from ..models.deal import Deal as DealModel
from ..models.user import User as UserModel
from ..schemas.deal import Deal, DealCreate, DealUpdate, DealImport
from ..dependencies import get_current_active_user
from ..services.permissions import PermissionService
from ..config import settings

router = APIRouter(prefix="/api/deals", tags=["Сделки"])


@router.get("", response_model=List[Deal], summary="Получить список сделок")
async def get_deals(
    skip: int = Query(0, ge=0, description="Количество пропускаемых записей"),
    limit: Optional[int] = Query(None, ge=1, description="Максимальное количество записей (если не указано — вернуть все)"),
    owner_id: Optional[str] = Query(None, description="Фильтр по владельцу"),
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    """
    Получение списка сделок с фильтрацией и пагинацией.
    
    - **skip**: Количество пропускаемых записей (для пагинации)
    - **limit**: Максимальное количество возвращаемых записей
    - **owner_id**: Фильтр по ID владельца сделки
    """
    query = db.query(DealModel)
    
    # Фильтр по владельцу
    if owner_id:
        query = query.filter(DealModel.owner_id == owner_id)
    
    if limit is not None:
        deals = query.offset(skip).limit(limit).all()
    else:
        deals = query.offset(skip).all()
    return [Deal.model_validate(d) for d in deals]


@router.get("/{deal_id}", response_model=Deal, summary="Получить сделку по ID")
async def get_deal(
    deal_id: str,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    """
    Получение сделки по ID.
    
    - **deal_id**: Уникальный идентификатор сделки
    """
    deal = db.query(DealModel).filter(DealModel.id == deal_id).first()
    
    if not deal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Сделка не найдена"
        )
    
    return Deal.model_validate(deal)


@router.post("", response_model=Deal, status_code=status.HTTP_201_CREATED, summary="Создать новую сделку")
async def create_deal(
    deal_data: DealCreate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    """
    Создание новой сделки.
    
    - **data**: Данные сделки в формате JSON (гибкая структура)
    - **owner_id**: ID владельца (опционально, по умолчанию текущий пользователь)
    
    Примеры полей в data:
    - Company: Название компании
    - Status: Статус сделки
    - Type: Тип сделки
    - Sector: Сектор
    - Responsible: Ответственный
    - Comments: Комментарии
    """
    # Если owner_id не указан, используем текущего пользователя
    owner_id = deal_data.owner_id or current_user.id
    
    deal = DealModel(
        id=f"d_{uuid.uuid4().hex[:12]}",
        owner_id=owner_id,
        data=deal_data.data
    )
    
    db.add(deal)
    db.commit()
    db.refresh(deal)
    
    return Deal.model_validate(deal)


@router.put("/{deal_id}", response_model=Deal, summary="Обновить сделку")
async def update_deal(
    deal_id: str,
    deal_data: DealUpdate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    """
    Обновление существующей сделки.
    
    - **deal_id**: ID сделки для обновления
    - **data**: Новые данные сделки (опционально)
    
    Можно обновлять только свои сделки (или любые, если вы администратор).
    """
    deal = db.query(DealModel).filter(DealModel.id == deal_id).first()
    
    if not deal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Сделка не найдена"
        )
    
    # Проверка прав доступа
    if not PermissionService.can_edit_resource(current_user, deal.owner_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для редактирования этой сделки"
        )
    
    # Обновление полей
    if deal_data.data is not None:
        deal.data = deal_data.data
    
    db.commit()
    db.refresh(deal)
    
    return Deal.model_validate(deal)


@router.delete("/clear", status_code=status.HTTP_204_NO_CONTENT, summary="Очистить все сделки (MVP)")
async def clear_deals(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    """
    Массовое удаление всех сделок (MVP).
    Доступно всем аутентифицированным пользователям.
    """
    if settings.env == "prod":
        raise HTTPException(status_code=403, detail="Disabled in production")
    db.query(DealModel).delete()
    db.commit()
    return None

@router.delete("/{deal_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Удалить сделку")
async def delete_deal(
    deal_id: str,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    """
    Удаление сделки.
    
    - **deal_id**: ID сделки для удаления
    
    Можно удалять только свои сделки (или любые, если вы администратор).
    """
    deal = db.query(DealModel).filter(DealModel.id == deal_id).first()
    
    if not deal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Сделка не найдена"
        )
    
    # Проверка прав доступа
    if not PermissionService.can_delete_resource(current_user, deal.owner_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для удаления этой сделки"
        )
    
    db.delete(deal)
    db.commit()
    
    return None
@router.post("/import", response_model=List[Deal], summary="Массовый импорт сделок")
async def import_deals(
    import_data: DealImport,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    """
    Массовый импорт сделок из CSV/Excel.
    
    - **deals**: Список сделок для импорта
    - **owner_id**: ID владельца для всех сделок (опционально, по умолчанию текущий пользователь)
    
    Каждая сделка должна быть объектом с произвольными полями.
    Все поля сохраняются в JSON поле `data`.
    """
    owner_id = import_data.owner_id or current_user.id
    created_deals = []
    
    for deal_data in import_data.deals:
        # Убираем только служебные поля и пустые имена колонок; нормализуем значения
        clean_data = {}
        has_nonempty_value = False
        for k, v in deal_data.items():
            if k in ("id", "owner_id", "created_at", "updated_at"):
                continue
            if not isinstance(k, str) or not k.strip():
                continue
            # Нормализация значения
            normalized_empty = False
            if v is None:
                normalized_empty = True
            elif isinstance(v, str):
                if v.strip() == "":
                    normalized_empty = True
                else:
                    v = v.strip()
            elif isinstance(v, (list, dict)):
                # Не сохраняем структурные значения из парсинга
                normalized_empty = True
            # Проверяем непустоту
            if not normalized_empty:
                has_nonempty_value = True
                clean_data[k] = v
            else:
                # пропускаем пустые значения вовсе
                pass
        # Если нет ни одного непустого значения — пропускаем строку (включая строки вида ,,,,,, или с пробелами)
        if not clean_data or not has_nonempty_value:
            continue
        
        deal = DealModel(
            id=deal_data.get("id") or f"d_{uuid.uuid4().hex[:12]}",
            owner_id=owner_id,
            data=clean_data
        )
        
        db.add(deal)
        created_deals.append(deal)
    
    db.commit()
    
    for deal in created_deals:
        db.refresh(deal)
    
    return [Deal.model_validate(d) for d in created_deals]

