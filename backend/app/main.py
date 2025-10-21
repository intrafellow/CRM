from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from contextlib import asynccontextmanager

from .config import settings
from .database import init_db
from .routers import (
    auth_router,
    contacts_router,
    deals_router,
    users_router,
    pipeline_router,
    companies_router,
    advisors_router,
    investors_router,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Инициализация при запуске приложения"""
    # Создание таблиц в БД
    init_db()
    yield


# Создание приложения FastAPI
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="""
    ## CRM API для управления контактами и сделками
    
    ### Возможности:
    * 🔐 **Аутентификация** - JWT токены для безопасного доступа
    * 👥 **Контакты** - Управление контактами с импортом из CSV
    * 💼 **Сделки** - Гибкая структура данных для сделок
    * 👤 **Пользователи** - Управление пользователями (для админов)
    * 🔒 **Права доступа** - Роли admin и employee с разными правами
    
    ### Аутентификация:
    1. Зарегистрируйтесь через `/api/auth/register` или войдите через `/api/auth/login`
    2. Получите JWT токен в ответе
    3. Используйте токен в заголовке: `Authorization: Bearer <ваш_токен>`
    
    ### Права доступа:
    - **Admin**: Полный доступ ко всем ресурсам
    - **Employee**: Может редактировать только свои ресурсы
    """,
    lifespan=lifespan,
    docs_url=None if settings.env == "prod" else "/docs",
    redoc_url=None if settings.env == "prod" else "/redoc",
)

# Настройка CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://178.216.103.117"] if settings.env == "prod" else settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if settings.env == "prod":
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=["178.216.103.117", "localhost", "127.0.0.1"])  # позже заменить на домен

# Security headers
@app.middleware("http")
async def security_headers(request, call_next):
    response = await call_next(request)
    response.headers.setdefault("X-Frame-Options", "DENY")
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
    # CSP минимальная; позже ужесточим под конкретные источники
    response.headers.setdefault("Content-Security-Policy", "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'")
    return response

# Подключение роутеров
app.include_router(auth_router)
app.include_router(contacts_router, include_in_schema=False)
app.include_router(deals_router, include_in_schema=False)
app.include_router(users_router)
app.include_router(pipeline_router)
app.include_router(companies_router)
app.include_router(advisors_router)
app.include_router(investors_router)


@app.get("/", tags=["Общее"])
async def root():
    """Корневой endpoint - информация об API"""
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "docs": "/docs",
        "redoc": "/redoc",
        "status": "running"
    }


@app.get("/health", tags=["Общее"])
async def health_check():
    """Проверка работоспособности API"""
    return {
        "status": "healthy",
        "version": settings.app_version
    }

