"""
Скрипт для инициализации тестовых пользователей
"""
from sqlalchemy.orm import Session
from .database import SessionLocal, engine, Base
from .models.user import User, UserRole
from .services.auth import AuthService


def init_test_users(db: Session):
    """Создание тестовых пользователей"""
    
    test_users = [
        {
            "id": "u_admin",
            "email": "admin@crm.com",
            "name": "Администратор",
            "password": "admin123",
            "role": UserRole.ADMIN,
            "verified": True
        },
        {
            "id": "u_ivan",
            "email": "ivan.petrov@crm.com",
            "name": "Иван Петров",
            "password": "employee123",
            "role": UserRole.EMPLOYEE,
            "verified": True
        },
        {
            "id": "u_maria",
            "email": "maria.sidorova@crm.com",
            "name": "Мария Сидорова",
            "password": "employee123",
            "role": UserRole.EMPLOYEE,
            "verified": True
        },
        {
            "id": "u_alex",
            "email": "alex.kuznetsov@crm.com",
            "name": "Алексей Кузнецов",
            "password": "employee123",
            "role": UserRole.EMPLOYEE,
            "verified": True
        }
    ]
    
    for user_data in test_users:
        # Проверяем, существует ли пользователь
        existing = db.query(User).filter(User.email == user_data["email"]).first()
        if existing:
            print(f"✓ Пользователь {user_data['name']} уже существует")
            continue
        
        # Создаем нового пользователя
        user = User(
            id=user_data["id"],
            email=user_data["email"],
            name=user_data["name"],
            hashed_password=AuthService.get_password_hash(user_data["password"]),
            role=user_data["role"],
            verified=user_data["verified"]
        )
        
        db.add(user)
        print(f"✓ Создан пользователь: {user_data['name']} ({user_data['email']})")
    
    db.commit()
    print("\n✅ Инициализация тестовых пользователей завершена!")


def main():
    """Главная функция инициализации"""
    print("🚀 Инициализация базы данных...")
    
    # Создание таблиц
    Base.metadata.create_all(bind=engine)
    print("✓ Таблицы созданы")
    
    # Создание тестовых пользователей
    db = SessionLocal()
    try:
        init_test_users(db)
    finally:
        db.close()
    
    print("\n📝 Тестовые пользователи:")
    print("  👑 admin@crm.com / admin123 (Администратор)")
    print("  👤 ivan.petrov@crm.com / employee123 (Сотрудник)")
    print("  👤 maria.sidorova@crm.com / employee123 (Сотрудник)")
    print("  👤 alex.kuznetsov@crm.com / employee123 (Сотрудник)")


if __name__ == "__main__":
    main()

