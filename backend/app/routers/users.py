from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models.user import User as UserModel
from ..schemas.user import User, UserUpdate
from ..dependencies import get_current_admin

router = APIRouter(prefix="/api/users", tags=["Пользователи (только для админов)"])


@router.get("", response_model=List[User], summary="Получить список всех пользователей")
async def get_users(
    skip: int = Query(0, ge=0, description="Количество пропускаемых записей"),
    limit: int = Query(100, ge=1, le=1000, description="Максимальное количество записей"),
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
    return [User.model_validate(u) for u in users]


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
    
    return None

