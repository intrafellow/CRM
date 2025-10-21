from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Настройки приложения"""
    
    # Основные настройки
    app_name: str = "CRM API"
    app_version: str = "1.0.0"
    debug: bool = True
    env: str = "dev"  # dev|prod
    
    # База данных
    database_url: str = "sqlite:///./crm.db"
    
    # JWT
    secret_key: str = "your-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 дней
    
    # CORS
    cors_origins: list = ["http://localhost:5173","http://127.0.0.1:5173"]
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()

