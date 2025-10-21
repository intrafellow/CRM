# 🚀 Быстрый старт CRM Backend

## Шаг 1: Установка зависимостей

```bash
cd backend
pip install -r requirements.txt
```

## Шаг 2: Запуск сервера

```bash
python run.py
```

После запуска вы увидите:

```
============================================================
🚀 Запуск CRM API сервера
============================================================
🚀 Инициализация базы данных...
✓ Таблицы созданы
✓ Создан пользователь: Администратор (admin@crm.com)
✓ Создан пользователь: Иван Петров (ivan.petrov@crm.com)
✓ Создан пользователь: Мария Сидорова (maria.sidorova@crm.com)
✓ Создан пользователь: Алексей Кузнецов (alex.kuznetsov@crm.com)

✅ Инициализация тестовых пользователей завершена!

📝 Тестовые пользователи:
  👑 admin@crm.com / admin123 (Администратор)
  👤 ivan.petrov@crm.com / employee123 (Сотрудник)
  👤 maria.sidorova@crm.com / employee123 (Сотрудник)
  👤 alex.kuznetsov@crm.com / employee123 (Сотрудник)

============================================================
🌐 Сервер запускается на http://localhost:8000
📚 Swagger документация: http://localhost:8000/docs
📖 ReDoc документация: http://localhost:8000/redoc
============================================================
```

## Шаг 3: Откройте Swagger UI

Перейдите по адресу: **http://localhost:8000/docs**

## Шаг 4: Тестирование через Swagger

### 4.1 Авторизация

1. Найдите раздел **"Аутентификация"**
2. Откройте `POST /api/auth/login`
3. Нажмите **"Try it out"**
4. Введите:
   ```json
   {
     "email": "admin@crm.com",
     "password": "admin123"
   }
   ```
5. Нажмите **"Execute"**
6. Скопируйте `access_token` из ответа
7. Нажмите кнопку **"Authorize"** вверху страницы
8. Введите: `Bearer ВАШ_ТОКЕН`
9. Нажмите **"Authorize"**

### 4.2 Создание контакта

1. Найдите `POST /api/contacts`
2. Нажмите **"Try it out"**
3. Введите:
   ```json
   {
     "contact": "Иван Иванов"
   }
   ```
4. Нажмите **"Execute"**

### 4.3 Создание сделки

1. Найдите `POST /api/deals`
2. Нажмите **"Try it out"**
3. Введите:
   ```json
   {
     "data": {
       "Company": "ООО Рога и Копыта",
       "Status": "В работе",
       "Type": "B2B",
       "Sector": "IT",
       "Responsible": "admin@crm.com",
       "Comments": "Первая сделка"
     }
   }
   ```
4. Нажмите **"Execute"**

## Шаг 5: Тестирование через curl

Сохраните токен в переменную:
```bash
TOKEN="ваш_токен_здесь"
```

Создайте контакт:
```bash
curl -X POST http://localhost:8000/api/contacts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"contact": "Петр Петров"}'
```

Получите список контактов:
```bash
curl -X GET http://localhost:8000/api/contacts \
  -H "Authorization: Bearer $TOKEN"
```

## Шаг 6: Автоматическое тестирование

Запустите скрипт полного тестирования:

```bash
chmod +x test_api.sh
./test_api.sh
```

Скрипт автоматически:
- Зарегистрирует нового пользователя
- Войдет под админом
- Создаст контакты
- Создаст сделки
- Покажет все данные

## Шаг 7: Тестирование через Postman

1. Откройте Postman
2. File → Import
3. Выберите файл `CRM_API.postman_collection.json`
4. В коллекции запустите **"Login (Admin)"**
5. Токен автоматически сохранится
6. Используйте остальные запросы

---

## 🎉 Готово!

Теперь у вас работающий CRM Backend API с:
- ✅ Автоматической документацией Swagger
- ✅ Аутентификацией через JWT
- ✅ CRUD операциями для контактов и сделок
- ✅ Системой прав доступа
- ✅ Тестовыми пользователями

## 📚 Дополнительная информация

- **Полные примеры:** См. файл `EXAMPLES.md`
- **Документация API:** См. файл `README.md`
- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

## 🆘 Проблемы?

### База данных не создается
```bash
# Удалите старую БД и пересоздайте
rm crm.db
python -m app.init_data
```

### Порт 8000 занят
```bash
# Измените порт в run.py или запустите на другом порту
uvicorn app.main:app --port 8001
```

### Ошибки импорта модулей
```bash
# Переустановите зависимости
pip install --upgrade -r requirements.txt
```

