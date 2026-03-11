"""
PSS Builder - Security Systems Architecture Constructor
Главное приложение FastAPI
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.api import api_router
from app.models.template import DEFAULT_TEMPLATES
from app.models.rule import DEFAULT_RULES
from app.version import APP_VERSION

app = FastAPI(
    title="PSS Builder",
    description="Конструктор архитектур систем безопасности",
    version=APP_VERSION,
)

# CORS для подключения React фронтенда
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключаем все маршруты API
app.include_router(api_router)


@app.get("/")
async def root():
    """Главная страница API"""
    return {
        "message": "PSS Builder API",
        "version": APP_VERSION,
        "description": "Конструктор архитектур систем безопасности",
        "endpoints": {
            "projects": "/api/projects",
            "templates": "/api/templates",
            "rules": "/api/rules",
            "equipment": "/api/equipment-catalog",
            "equipment_normalized": "/api/equipment-catalog/normalized",
            "docs": "/docs",
        },
    }


@app.get("/api/info")
async def api_info():
    """Информация о системе"""
    return {
        "name": "PSS Builder",
        "version": APP_VERSION,
        "templates_count": len(DEFAULT_TEMPLATES),
        "rules_count": len(DEFAULT_RULES),
    }


@app.get("/health")
async def health_check():
    """Проверка здоровья приложения"""
    return {"status": "healthy", "service": "PSS Builder API"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
