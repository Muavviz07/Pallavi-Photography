from fastapi import APIRouter
from app.api.routes import auth, health, galleries, client_galleries, admin

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(galleries.router, prefix="/galleries", tags=["galleries"])
api_router.include_router(client_galleries.router, prefix="/client-galleries", tags=["client-galleries"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])

