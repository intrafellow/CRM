from typing import Optional
from ..models.user import User, UserRole


class PermissionService:
    """Сервис проверки прав доступа"""
    
    @staticmethod
    def can_edit_resource(user: User, resource_owner_id: Optional[str]) -> bool:
        """
        Проверка прав на редактирование ресурса
        - Админ может редактировать всё
        - Сотрудник может редактировать только свои ресурсы
        """
        if user.role == UserRole.ADMIN:
            return True
        
        if resource_owner_id is None:
            return True  # Ресурсы без владельца может редактировать кто угодно
        
        return user.id == resource_owner_id
    
    @staticmethod
    def can_delete_resource(user: User, resource_owner_id: Optional[str]) -> bool:
        """
        Проверка прав на удаление ресурса
        - Админ может удалять всё
        - Сотрудник может удалять только свои ресурсы
        """
        return PermissionService.can_edit_resource(user, resource_owner_id)
    
    @staticmethod
    def is_admin(user: User) -> bool:
        """Проверка, является ли пользователь администратором"""
        return user.role == UserRole.ADMIN

