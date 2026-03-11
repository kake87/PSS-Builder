"""
Configuration file for PSS Builder
"""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # API Settings
    api_title: str = "PSS Builder"
    api_version: str = "0.1.0"
    api_description: str = "Конструктор архитектур систем безопасности"
    
    # Server
    host: str = "127.0.0.1"
    port: int = 8000
    
    # CORS
    cors_origins: list = ["*"]
    cors_credentials: bool = True
    cors_methods: list = ["*"]
    cors_headers: list = ["*"]
    
    # Database (future)
    database_url: str = "sqlite:///./test.db"
    
    # Features
    enable_ai_mode: bool = False
    enable_export: bool = True
    enable_import: bool = True
    
    class Config:
        env_file = ".env"


settings = Settings()
