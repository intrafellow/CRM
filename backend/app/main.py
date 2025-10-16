from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .config import settings
from .database import init_db
from .routers import auth_router, contacts_router, deals_router, users_router


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
    docs_url="/docs",
    redoc_url="/redoc",
)

# Настройка CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключение роутеров
app.include_router(auth_router)
app.include_router(contacts_router)
app.include_router(deals_router)
app.include_router(users_router)


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

