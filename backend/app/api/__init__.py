"""
Объединение всех API маршрутов
"""
from fastapi import APIRouter
from .projects import router as projects_router
from .devices import router as devices_router
from .templates import router as templates_router
from .rules import router as rules_router

api_router = APIRouter()
api_router.include_router(projects_router)
api_router.include_router(devices_router)
api_router.include_router(templates_router)
api_router.include_router(rules_router)
