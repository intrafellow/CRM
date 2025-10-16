from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid

from ..database import get_db
from ..models.contact import Contact as ContactModel
from ..models.user import User as UserModel
from ..schemas.contact import Contact, ContactCreate, ContactUpdate, ContactImport
from ..dependencies import get_current_active_user
from ..services.permissions import PermissionService

router = APIRouter(prefix="/api/contacts", tags=["Контакты"])


@router.get("", response_model=List[Contact], summary="Получить список контактов")
async def get_contacts(
    skip: int = Query(0, ge=0, description="Количество пропускаемых записей"),
    limit: int = Query(100, ge=1, le=1000, description="Максимальное количество записей"),
    owner_id: Optional[str] = Query(None, description="Фильтр по владельцу"),
    search: Optional[str] = Query(None, description="Поиск по имени контакта"),
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    """
    Получение списка контактов с фильтрацией и пагинацией.
    
    - **skip**: Количество пропускаемых записей (для пагинации)
    - **limit**: Максимальное количество возвращаемых записей
    - **owner_id**: Фильтр по ID владельца контакта
    - **search**: Поиск по имени контакта (частичное совпадение)
    """
    query = db.query(ContactModel)
    
    # Фильтр по владельцу
    if owner_id:
        query = query.filter(ContactModel.owner_id == owner_id)
    
    # Поиск по имени
    if search:
        query = query.filter(ContactModel.contact.ilike(f"%{search}%"))
    
    contacts = query.offset(skip).limit(limit).all()
    return [Contact.model_validate(c) for c in contacts]


@router.get("/{contact_id}", response_model=Contact, summary="Получить контакт по ID")
async def get_contact(
    contact_id: str,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    """
    Получение контакта по ID.
    
    - **contact_id**: Уникальный идентификатор контакта
    """
    contact = db.query(ContactModel).filter(ContactModel.id == contact_id).first()
    
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Контакт не найден"
        )
    
    return Contact.model_validate(contact)


@router.post("", response_model=Contact, status_code=status.HTTP_201_CREATED, summary="Создать новый контакт")
async def create_contact(
    contact_data: ContactCreate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    """
    Создание нового контакта.
    
    - **contact**: Имя контакта (обязательно)
    - **owner_id**: ID владельца (опционально, по умолчанию текущий пользователь)
    """
    # Если owner_id не указан, используем текущего пользователя
    owner_id = contact_data.owner_id or current_user.id
    
    contact = ContactModel(
        id=f"c_{uuid.uuid4().hex[:12]}",
        contact=contact_data.contact,
        owner_id=owner_id
    )
    
    db.add(contact)
    db.commit()
    db.refresh(contact)
    
    return Contact.model_validate(contact)


@router.put("/{contact_id}", response_model=Contact, summary="Обновить контакт")
async def update_contact(
    contact_id: str,
    contact_data: ContactUpdate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    """
    Обновление существующего контакта.
    
    - **contact_id**: ID контакта для обновления
    - **contact**: Новое имя контакта (опционально)
    
    Можно обновлять только свои контакты (или любые, если вы администратор).
    """
    contact = db.query(ContactModel).filter(ContactModel.id == contact_id).first()
    
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Контакт не найден"
        )
    
    # Проверка прав доступа
    if not PermissionService.can_edit_resource(current_user, contact.owner_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для редактирования этого контакта"
        )
    
    # Обновление полей
    if contact_data.contact is not None:
        contact.contact = contact_data.contact
    
    db.commit()
    db.refresh(contact)
    
    return Contact.model_validate(contact)


@router.delete("/{contact_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Удалить контакт")
async def delete_contact(
    contact_id: str,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    """
    Удаление контакта.
    
    - **contact_id**: ID контакта для удаления
    
    Можно удалять только свои контакты (или любые, если вы администратор).
    """
    contact = db.query(ContactModel).filter(ContactModel.id == contact_id).first()
    
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Контакт не найден"
        )
    
    # Проверка прав доступа
    if not PermissionService.can_delete_resource(current_user, contact.owner_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для удаления этого контакта"
        )
    
    db.delete(contact)
    db.commit()
    
    return None


@router.post("/import", response_model=List[Contact], summary="Массовый импорт контактов")
async def import_contacts(
    import_data: ContactImport,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    """
    Массовый импорт контактов из CSV/Excel.
    
    - **contacts**: Список контактов для импорта
    - **owner_id**: ID владельца для всех контактов (опционально, по умолчанию текущий пользователь)
    
    Формат каждого контакта: {"contact": "Имя контакта"}
    """
    owner_id = import_data.owner_id or current_user.id
    created_contacts = []
    
    for contact_data in import_data.contacts:
        # Извлекаем имя контакта из различных возможных полей
        contact_name = (
            contact_data.get("contact") or
            contact_data.get("Contact persons") or
            contact_data.get("Contacted person") or
            contact_data.get("Source Name") or
            ""
        ).strip()
        
        if not contact_name:
            continue
        
        contact = ContactModel(
            id=f"c_{uuid.uuid4().hex[:12]}",
            contact=contact_name,
            owner_id=owner_id
        )
        
        db.add(contact)
        created_contacts.append(contact)
    
    db.commit()
    
    for contact in created_contacts:
        db.refresh(contact)
    
    return [Contact.model_validate(c) for c in created_contacts]

