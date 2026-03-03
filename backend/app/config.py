"""
Configuración desde variables de entorno (Pydantic Settings).
Fase 1: Configuración completa.
"""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Settings de la aplicación."""

    # Database
    database_url: str = "postgresql://plataforma_user:change_me@postgres:5432/plataforma_medica"
    
    # JWT
    jwt_secret: str = "change_me_secret_key_min_32_chars"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60
    
    # Redis (opcional)
    redis_url: str | None = None
    
    # YCloud (Fase 4)
    ycloud_api_key: str | None = None
    ycloud_api_url: str = "https://api.ycloud.com/v2"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
