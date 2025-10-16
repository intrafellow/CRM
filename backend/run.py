#!/usr/bin/env python3
"""
Скрипт для запуска сервера с автоматической инициализацией
"""
import uvicorn
from app.init_data import main as init_data

if __name__ == "__main__":
    print("=" * 60)
    print("🚀 Запуск CRM API сервера")
    print("=" * 60)
    
    # Инициализация БД и тестовых данных
    try:
        init_data()
    except Exception as e:
        print(f"⚠️  Ошибка инициализации: {e}")
    
    print("\n" + "=" * 60)
    print("🌐 Сервер запускается на http://localhost:8000")
    print("📚 Swagger документация: http://localhost:8000/docs")
    print("📖 ReDoc документация: http://localhost:8000/redoc")
    print("=" * 60 + "\n")
    
    # Запуск сервера
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )

