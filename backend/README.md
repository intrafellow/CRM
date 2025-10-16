# CRM Backend API

Backend для CRM системы на FastAPI с автоматической генерацией Swagger документации.

## Быстрый старт

### 1. Установка зависимостей

```bash
cd backend
pip install -r requirements.txt
```

### 2. Запуск сервера

**Простой способ (с автоинициализацией):**
```bash
python run.py
```

**Альтернативный способ:**
```bash
# Инициализация БД и тестовых пользователей
python -m app.init_data

# Запуск сервера
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Документация API

После запуска сервера доступны:
- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc
- **OpenAPI Schema:** http://localhost:8000/openapi.json

## Тестирование

### Через Postman

Импортируйте коллекцию `CRM_API.postman_collection.json` в Postman:
1. Откройте Postman
2. File → Import → Выберите файл `CRM_API.postman_collection.json`
3. Запустите "Login (Admin)" для получения токена
4. Токен автоматически сохранится в переменную `{{token}}`

### Через curl

Запустите скрипт автоматического тестирования:
```bash
chmod +x test_api.sh
./test_api.sh
```

Или тестируйте вручную (см. примеры ниже).

## Тестовые пользователи

После запуска автоматически создаются:

| Email | Пароль | Роль | Описание |
|-------|--------|------|----------|
| `admin@crm.com` | `admin123` | Admin | Администратор (полный доступ) |
| `ivan.petrov@crm.com` | `employee123` | Employee | Сотрудник |
| `maria.sidorova@crm.com` | `employee123` | Employee | Сотрудник |
| `alex.kuznetsov@crm.com` | `employee123` | Employee | Сотрудник |

## API Endpoints

### Аутентификация
- `POST /api/auth/register` - Регистрация нового пользователя
- `POST /api/auth/login` - Вход в систему
- `GET /api/auth/me` - Получить данные текущего пользователя
- `POST /api/auth/logout` - Выход из системы

### Контакты
- `GET /api/contacts` - Список всех контактов
- `GET /api/contacts/{id}` - Получить контакт по ID
- `POST /api/contacts` - Создать новый контакт
- `PUT /api/contacts/{id}` - Обновить контакт
- `DELETE /api/contacts/{id}` - Удалить контакт
- `POST /api/contacts/import` - Массовая загрузка контактов

### Сделки
- `GET /api/deals` - Список всех сделок
- `GET /api/deals/{id}` - Получить сделку по ID
- `POST /api/deals` - Создать новую сделку
- `PUT /api/deals/{id}` - Обновить сделку
- `DELETE /api/deals/{id}` - Удалить сделку
- `POST /api/deals/import` - Массовая загрузка сделок

### Пользователи (только для админов)
- `GET /api/users` - Список всех пользователей
- `GET /api/users/{id}` - Получить пользователя по ID
- `PUT /api/users/{id}` - Обновить пользователя
- `DELETE /api/users/{id}` - Удалить пользователя

## Тестирование через curl

```bash
# Регистрация
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'

# Вход
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Получить профиль (с токеном)
curl -X GET http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Создать контакт
curl -X POST http://localhost:8000/api/contacts \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"contact":"John Doe"}'
```

## Структура проекта

```
backend/
├── app/
│   ├── main.py              # Точка входа приложения
│   ├── config.py            # Конфигурация
│   ├── database.py          # Подключение к БД
│   ├── dependencies.py      # Зависимости для роутеров
│   ├── models/              # SQLAlchemy модели
│   ├── schemas/             # Pydantic схемы
│   ├── routers/             # API роутеры
│   └── services/            # Бизнес-логика
└── requirements.txt
```

