from .auth import router as auth_router
from .contacts import router as contacts_router
from .deals import router as deals_router
from .users import router as users_router

__all__ = ["auth_router", "contacts_router", "deals_router", "users_router"]

