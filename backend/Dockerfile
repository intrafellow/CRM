# Используем официальный Python образ
FROM python:3.11-slim

# Устанавливаем рабочую директорию
WORKDIR /app

# Устанавливаем системные зависимости
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Копируем requirements.txt и устанавливаем зависимости
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Копируем код приложения
COPY . .

# Создаем пользователя для безопасности
RUN useradd --create-home --shell /bin/bash app && \
    chown -R app:app /app
USER app

# Открываем порт
EXPOSE 8000

# Создаем скрипт запуска с инициализацией
RUN echo '#!/bin/bash\n\
echo "🚀 Инициализация CRM Backend..."\n\
python -c "from app.init_data import main; main()"\n\
echo "🌐 Запуск сервера..."\n\
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4' > /app/start.sh

RUN chmod +x /app/start.sh

# Команда запуска
CMD ["/app/start.sh"]
