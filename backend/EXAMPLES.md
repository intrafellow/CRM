# 📚 Примеры использования API

## Содержание
- [Аутентификация](#аутентификация)
- [Работа с контактами](#работа-с-контактами)
- [Работа со сделками](#работа-со-сделками)
- [Управление пользователями](#управление-пользователями)

---

## Аутентификация

### Регистрация нового пользователя

```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "new.user@example.com",
    "password": "securepass123",
    "name": "Новый Пользователь",
    "role": "employee"
  }'
```

**Ответ:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "u_abc123",
    "email": "new.user@example.com",
    "name": "Новый Пользователь",
    "role": "employee",
    "verified": true,
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

### Вход в систему

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@crm.com",
    "password": "admin123"
  }'
```

**Сохраните токен из ответа!** Он понадобится для всех последующих запросов.

### Получение информации о текущем пользователе

```bash
curl -X GET http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Работа с контактами

### Создание контакта

```bash
curl -X POST http://localhost:8000/api/contacts \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "contact": "Иван Петрович Сидоров"
  }'
```

### Получение списка контактов

```bash
# Все контакты
curl -X GET http://localhost:8000/api/contacts \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# С пагинацией
curl -X GET "http://localhost:8000/api/contacts?skip=0&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Поиск по имени
curl -X GET "http://localhost:8000/api/contacts?search=Иван" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Фильтр по владельцу
curl -X GET "http://localhost:8000/api/contacts?owner_id=u_admin" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Получение контакта по ID

```bash
curl -X GET http://localhost:8000/api/contacts/c_abc123 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Обновление контакта

```bash
curl -X PUT http://localhost:8000/api/contacts/c_abc123 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "contact": "Иван Петрович Сидоров (обновлено)"
  }'
```

### Удаление контакта

```bash
curl -X DELETE http://localhost:8000/api/contacts/c_abc123 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Массовый импорт контактов

```bash
curl -X POST http://localhost:8000/api/contacts/import \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "contacts": [
      {"contact": "Иван Иванов"},
      {"contact": "Петр Петров"},
      {"contact": "Мария Сидорова"},
      {"Contact persons": "Алексей Смирнов"},
      {"Source Name": "Ольга Кузнецова"}
    ]
  }'
```

---

## Работа со сделками

### Создание сделки

```bash
curl -X POST http://localhost:8000/api/deals \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "Company": "ООО Рога и Копыта",
      "Status": "В работе",
      "Type": "B2B",
      "Sector": "IT",
      "Responsible": "admin@crm.com",
      "Comments": "Потенциальная крупная сделка",
      "Next connection": "2024-02-15",
      "Amount": 1000000
    }
  }'
```

### Получение списка сделок

```bash
# Все сделки
curl -X GET http://localhost:8000/api/deals \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# С пагинацией
curl -X GET "http://localhost:8000/api/deals?skip=0&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Фильтр по владельцу
curl -X GET "http://localhost:8000/api/deals?owner_id=u_ivan" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Получение сделки по ID

```bash
curl -X GET http://localhost:8000/api/deals/d_xyz789 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Обновление сделки

```bash
curl -X PUT http://localhost:8000/api/deals/d_xyz789 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "Company": "ООО Рога и Копыта",
      "Status": "Закрыта",
      "Type": "B2B",
      "Sector": "IT",
      "Responsible": "admin@crm.com",
      "Comments": "Сделка успешно завершена! Подписан договор на 1.5 млн",
      "Next connection": null,
      "Amount": 1500000
    }
  }'
```

### Удаление сделки

```bash
curl -X DELETE http://localhost:8000/api/deals/d_xyz789 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Массовый импорт сделок

```bash
curl -X POST http://localhost:8000/api/deals/import \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "deals": [
      {
        "Company": "ABC Corporation",
        "Status": "Новая",
        "Type": "B2B",
        "Sector": "Finance",
        "Responsible": "ivan.petrov@crm.com"
      },
      {
        "Company": "XYZ Limited",
        "Status": "В работе",
        "Type": "B2C",
        "Sector": "Retail",
        "Responsible": "maria.sidorova@crm.com",
        "Amount": 500000
      },
      {
        "Company": "Tech Solutions Inc",
        "Status": "Переговоры",
        "Type": "B2B",
        "Sector": "IT",
        "Responsible": "alex.kuznetsov@crm.com",
        "Comments": "Заинтересованы в долгосрочном сотрудничестве"
      }
    ]
  }'
```

---

## Управление пользователями

**⚠️ Все эндпоинты пользователей доступны только администраторам!**

### Получение списка всех пользователей

```bash
curl -X GET http://localhost:8000/api/users \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE"
```

### Получение пользователя по ID

```bash
curl -X GET http://localhost:8000/api/users/u_ivan \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE"
```

### Обновление пользователя

```bash
# Изменение роли
curl -X PUT http://localhost:8000/api/users/u_ivan \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "admin"
  }'

# Изменение статуса верификации
curl -X PUT http://localhost:8000/api/users/u_ivan \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "verified": true
  }'

# Изменение имени и email
curl -X PUT http://localhost:8000/api/users/u_ivan \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Иван Сергеевич Петров",
    "email": "i.petrov@crm.com"
  }'
```

### Удаление пользователя

```bash
curl -X DELETE http://localhost:8000/api/users/u_ivan \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE"
```

**Примечание:** Нельзя удалить самого себя!

---

## Права доступа

### Роли пользователей

1. **Admin (Администратор)**
   - Полный доступ ко всем ресурсам
   - Может редактировать и удалять любые контакты и сделки
   - Может управлять пользователями
   - Может видеть все данные в системе

2. **Employee (Сотрудник)**
   - Может создавать контакты и сделки
   - Может редактировать только свои ресурсы (где owner_id совпадает с его ID)
   - Может удалять только свои ресурсы
   - Может видеть все контакты и сделки, но редактировать только свои

### Примеры проверки прав

```bash
# Сотрудник пытается редактировать чужой контакт (403 Forbidden)
curl -X PUT http://localhost:8000/api/contacts/c_admin_contact \
  -H "Authorization: Bearer EMPLOYEE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"contact": "Новое имя"}'

# Администратор редактирует любой контакт (200 OK)
curl -X PUT http://localhost:8000/api/contacts/c_employee_contact \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"contact": "Новое имя"}'

# Сотрудник пытается получить список пользователей (403 Forbidden)
curl -X GET http://localhost:8000/api/users \
  -H "Authorization: Bearer EMPLOYEE_TOKEN"
```

---

## Коды ответов

| Код | Описание |
|-----|----------|
| 200 | Успешный запрос |
| 201 | Ресурс успешно создан |
| 204 | Успешное удаление (нет содержимого) |
| 400 | Некорректный запрос |
| 401 | Не авторизован (неверный или отсутствующий токен) |
| 403 | Доступ запрещен (недостаточно прав) |
| 404 | Ресурс не найден |
| 422 | Ошибка валидации данных |
| 500 | Внутренняя ошибка сервера |

---

## Примеры ошибок

### 401 Unauthorized
```json
{
  "detail": "Не удалось проверить учетные данные"
}
```

### 403 Forbidden
```json
{
  "detail": "Недостаточно прав для редактирования этого контакта"
}
```

### 404 Not Found
```json
{
  "detail": "Контакт не найден"
}
```

### 422 Validation Error
```json
{
  "detail": [
    {
      "loc": ["body", "email"],
      "msg": "value is not a valid email address",
      "type": "value_error.email"
    }
  ]
}
```

