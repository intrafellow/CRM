#!/bin/bash

# Скрипт для тестирования API через curl

BASE_URL="http://localhost:8000"
TOKEN=""

echo "============================================"
echo "🧪 Тестирование CRM API"
echo "============================================"

# Цвета для вывода
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo -e "${BLUE}1. Регистрация нового пользователя${NC}"
curl -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }' | jq '.'

echo ""
echo -e "${BLUE}2. Вход в систему (admin)${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@crm.com",
    "password": "admin123"
  }')

echo "$LOGIN_RESPONSE" | jq '.'

# Извлечение токена
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.access_token')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ Ошибка получения токена"
  exit 1
fi

echo ""
echo -e "${GREEN}✓ Токен получен: ${TOKEN:0:20}...${NC}"

echo ""
echo -e "${BLUE}3. Получение профиля${NC}"
curl -s -X GET "$BASE_URL/api/auth/me" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

echo ""
echo -e "${BLUE}4. Создание контакта${NC}"
CONTACT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/contacts" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "contact": "Иван Иванов"
  }')

echo "$CONTACT_RESPONSE" | jq '.'
CONTACT_ID=$(echo "$CONTACT_RESPONSE" | jq -r '.id')

echo ""
echo -e "${BLUE}5. Список контактов${NC}"
curl -s -X GET "$BASE_URL/api/contacts" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

echo ""
echo -e "${BLUE}6. Создание сделки${NC}"
DEAL_RESPONSE=$(curl -s -X POST "$BASE_URL/api/deals" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "Company": "ООО Рога и Копыта",
      "Status": "В работе",
      "Type": "B2B",
      "Sector": "IT",
      "Responsible": "admin@crm.com",
      "Comments": "Первая сделка"
    }
  }')

echo "$DEAL_RESPONSE" | jq '.'
DEAL_ID=$(echo "$DEAL_RESPONSE" | jq -r '.id')

echo ""
echo -e "${BLUE}7. Список сделок${NC}"
curl -s -X GET "$BASE_URL/api/deals" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

echo ""
echo -e "${BLUE}8. Обновление сделки${NC}"
curl -s -X PUT "$BASE_URL/api/deals/$DEAL_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "Company": "ООО Рога и Копыта",
      "Status": "Закрыта",
      "Type": "B2B",
      "Sector": "IT",
      "Responsible": "admin@crm.com",
      "Comments": "Сделка успешно завершена!"
    }
  }' | jq '.'

echo ""
echo -e "${BLUE}9. Список всех пользователей (только admin)${NC}"
curl -s -X GET "$BASE_URL/api/users" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

echo ""
echo -e "${GREEN}✅ Тестирование завершено!${NC}"
echo "============================================"

