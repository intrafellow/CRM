from .auth import router as auth_router
from .contacts import router as contacts_router
from .deals import router as deals_router
from .users import router as users_router
from .pipeline import router as pipeline_router
from .companies import router as companies_router
from .advisors import router as advisors_router
from .investors import router as investors_router

__all__ = [
    "auth_router",
    "contacts_router",
    "deals_router",
    "users_router",
    "pipeline_router",
    "companies_router",
    "advisors_router",
    "investors_router",
]

