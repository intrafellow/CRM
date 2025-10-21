# 📂 Структура проекта Backend

```
backend/
├── 📄 README.md                          # Основная документация
├── 📄 QUICKSTART.md                      # Быстрый старт
├── 📄 EXAMPLES.md                        # Примеры использования API
├── 📄 PROJECT_STRUCTURE.md               # Этот файл
├── 📄 requirements.txt                   # Зависимости Python
├── 📄 .gitignore                         # Игнорируемые файлы
├── 📄 CRM_API.postman_collection.json    # Коллекция Postman
├── 📄 test_api.sh                        # Скрипт автотестирования
├── 📄 run.py                             # Скрипт запуска сервера
│
└── app/                                  # Основной код приложения
    ├── 📄 __init__.py
    ├── 📄 main.py                        # Точка входа FastAPI
    ├── 📄 config.py                      # Настройки приложения
    ├── 📄 database.py                    # Настройка БД и сессий
    ├── 📄 dependencies.py                # Зависимости (аутентификация)
    ├── 📄 init_data.py                   # Инициализация тестовых данных
    │
    ├── models/                           # SQLAlchemy модели (БД)
    │   ├── 📄 __init__.py
    │   ├── 📄 user.py                    # Модель пользователя
    │   ├── 📄 contact.py                 # Модель контакта
    │   └── 📄 deal.py                    # Модель сделки
    │
    ├── schemas/                          # Pydantic схемы (валидация)
    │   ├── 📄 __init__.py
    │   ├── 📄 user.py                    # Схемы пользователя
    │   ├── 📄 contact.py                 # Схемы контакта
    │   └── 📄 deal.py                    # Схемы сделки
    │
    ├── routers/                          # API endpoints
    │   ├── 📄 __init__.py
    │   ├── 📄 auth.py                    # Аутентификация
    │   ├── 📄 contacts.py                # CRUD контактов
    │   ├── 📄 deals.py                   # CRUD сделок
    │   └── 📄 users.py                   # Управление пользователями
    │
    └── services/                         # Бизнес-логика
        ├── 📄 __init__.py
        ├── 📄 auth.py                    # Сервис аутентификации
        └── 📄 permissions.py             # Сервис прав доступа
```

---

## 📋 Описание модулей

### Основные файлы

#### `main.py`
- Создание приложения FastAPI
- Подключение роутеров
- Настройка CORS
- Swagger документация
- Lifecycle events (инициализация БД)

#### `config.py`
- Настройки приложения
- Параметры JWT
- Настройки БД
- CORS origins
- Использует Pydantic Settings

#### `database.py`
- Создание engine SQLAlchemy
- Настройка сессий
- Dependency для получения БД сессии
- Функция инициализации таблиц

#### `dependencies.py`
- `get_current_user()` - получение пользователя из JWT
- `get_current_active_user()` - проверка верификации
- `get_current_admin()` - проверка прав админа
- Security schemes для Swagger

#### `init_data.py`
- Создание таблиц БД
- Инициализация тестовых пользователей
- Может запускаться отдельно

---

### Models (Модели БД)

#### `models/user.py`
**Поля:**
- `id` - Уникальный идентификатор
- `email` - Email (уникальный)
- `name` - Имя пользователя
- `hashed_password` - Хеш пароля
- `role` - Роль (admin/employee)
- `verified` - Статус верификации
- `created_at` - Дата создания
- `updated_at` - Дата обновления

#### `models/contact.py`
**Поля:**
- `id` - Уникальный идентификатор
- `contact` - Имя контакта
- `owner_id` - ID владельца (FK на users)
- `created_at` - Дата создания
- `updated_at` - Дата обновления

#### `models/deal.py`
**Поля:**
- `id` - Уникальный идентификатор
- `owner_id` - ID владельца (FK на users)
- `data` - JSON с данными сделки (гибкая структура)
- `created_at` - Дата создания
- `updated_at` - Дата обновления

**Примечание:** Сделки хранят данные в JSON для максимальной гибкости.

---

### Schemas (Pydantic схемы)

#### `schemas/user.py`
- `UserBase` - Базовые поля
- `UserCreate` - Создание (+ password)
- `UserUpdate` - Обновление (опциональные поля)
- `User` - Ответ API
- `UserInDB` - Модель с хешем пароля
- `Token` - JWT токен + user
- `TokenData` - Данные из токена

#### `schemas/contact.py`
- `ContactBase` - Базовые поля
- `ContactCreate` - Создание
- `ContactUpdate` - Обновление
- `Contact` - Ответ API
- `ContactImport` - Массовый импорт

#### `schemas/deal.py`
- `DealBase` - Базовые поля
- `DealCreate` - Создание
- `DealUpdate` - Обновление
- `Deal` - Ответ API
- `DealImport` - Массовый импорт

---

### Routers (API endpoints)

#### `routers/auth.py`
**Endpoints:**
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход
- `GET /api/auth/me` - Текущий пользователь
- `POST /api/auth/logout` - Выход

#### `routers/contacts.py`
**Endpoints:**
- `GET /api/contacts` - Список (с фильтрами)
- `GET /api/contacts/{id}` - Получить по ID
- `POST /api/contacts` - Создать
- `PUT /api/contacts/{id}` - Обновить
- `DELETE /api/contacts/{id}` - Удалить
- `POST /api/contacts/import` - Массовый импорт

**Фильтры:**
- `skip` - Пагинация (offset)
- `limit` - Количество записей
- `owner_id` - Фильтр по владельцу
- `search` - Поиск по имени

#### `routers/deals.py`
**Endpoints:**
- `GET /api/deals` - Список (с фильтрами)
- `GET /api/deals/{id}` - Получить по ID
- `POST /api/deals` - Создать
- `PUT /api/deals/{id}` - Обновить
- `DELETE /api/deals/{id}` - Удалить
- `POST /api/deals/import` - Массовый импорт

**Фильтры:**
- `skip` - Пагинация (offset)
- `limit` - Количество записей
- `owner_id` - Фильтр по владельцу

#### `routers/users.py`
**Endpoints (только для админов):**
- `GET /api/users` - Список пользователей
- `GET /api/users/{id}` - Получить по ID
- `PUT /api/users/{id}` - Обновить
- `DELETE /api/users/{id}` - Удалить

---

### Services (Бизнес-логика)

#### `services/auth.py`
**Методы:**
- `verify_password()` - Проверка пароля
- `get_password_hash()` - Хеширование пароля
- `create_access_token()` - Создание JWT
- `decode_token()` - Декодирование JWT

**Технологии:**
- `passlib` - Хеширование bcrypt
- `python-jose` - JWT токены

#### `services/permissions.py`
**Методы:**
- `can_edit_resource()` - Проверка прав на редактирование
- `can_delete_resource()` - Проверка прав на удаление
- `is_admin()` - Проверка роли админа

**Логика:**
- Админ может всё
- Сотрудник может редактировать только свои ресурсы

---

## 🔐 Безопасность

### JWT Токены
- Алгоритм: HS256
- Срок действия: 7 дней (настраивается)
- Хранение: Bearer токен в заголовке Authorization

### Пароли
- Хеширование: bcrypt
- Минимальная длина: 6 символов
- Хранятся только хеши

### Права доступа
- Роли: admin, employee
- Проверка на уровне роутеров
- Проверка владельца ресурса

---

## 🗄️ База данных

### SQLite (по умолчанию)
- Файл: `crm.db`
- Автоматическое создание при запуске
- Подходит для разработки и тестирования

### PostgreSQL (для продакшена)
В `.env` измените:
```env
DATABASE_URL=postgresql://user:password@localhost/crm_db
```

### Миграции
Для продакшена рекомендуется использовать Alembic:
```bash
alembic init alembic
alembic revision --autogenerate -m "Initial migration"
alembic upgrade head
```

---

## 🧪 Тестирование

### Swagger UI
- URL: http://localhost:8000/docs
- Интерактивное тестирование
- Авторизация через кнопку Authorize

### Postman
- Импорт: `CRM_API.postman_collection.json`
- Автоматическое сохранение токена
- Готовые примеры запросов

### curl
- Скрипт: `test_api.sh`
- Автоматическое тестирование всех endpoints
- Примеры в `EXAMPLES.md`

---

## 📦 Зависимости

### Основные
- **FastAPI** - Web framework
- **Uvicorn** - ASGI server
- **SQLAlchemy** - ORM
- **Pydantic** - Валидация данных

### Аутентификация
- **python-jose** - JWT токены
- **passlib** - Хеширование паролей

### Дополнительные
- **python-multipart** - Загрузка файлов
- **python-dateutil** - Работа с датами
- **pydantic-settings** - Настройки приложения

---

## 🚀 Деплой

### Локальный запуск
```bash
python run.py
```

### Production (Uvicorn)
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Docker (рекомендуется)
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Переменные окружения
Создайте `.env` файл:
```env
DATABASE_URL=postgresql://user:password@db:5432/crm
SECRET_KEY=ваш-супер-секретный-ключ
CORS_ORIGINS=["https://yourdomain.com"]
```

---

## 📈 Масштабирование

### Горизонтальное
- Несколько экземпляров приложения
- Load balancer (Nginx, Traefik)
- Shared database

### Вертикальное
- Увеличение workers: `--workers 8`
- Больше RAM для БД
- Оптимизация запросов

### Кеширование
- Redis для сессий
- Кеширование часто запрашиваемых данных
- ETags для HTTP кеширования

---

## 🔧 Расширения

### Добавление нового endpoint

1. **Создайте модель** в `app/models/`
2. **Создайте схемы** в `app/schemas/`
3. **Создайте роутер** в `app/routers/`
4. **Подключите роутер** в `app/main.py`

### Пример:
```python
# app/routers/new_endpoint.py
from fastapi import APIRouter

router = APIRouter(prefix="/api/new", tags=["New"])

@router.get("")
async def get_items():
    return {"items": []}

# app/main.py
from app.routers import new_endpoint
app.include_router(new_endpoint.router)
```

---

## 🐛 Отладка

### Логирование
```python
import logging
logger = logging.getLogger(__name__)
logger.info("Debug message")
```

### Debug режим
В `.env`:
```env
DEBUG=True
```

### SQL логи
В `database.py`:
```python
engine = create_engine(
    settings.database_url,
    echo=True  # Показывает все SQL запросы
)
```

---

## 📝 Лицензия и авторство

Проект создан для внутреннего использования CRM системы.

