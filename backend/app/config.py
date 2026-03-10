"""
Configuración desde variables de entorno (Pydantic Settings).
Fase 1: Configuración completa.
Fase 4: YCloud WhatsApp añadido.
"""
from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Settings de la aplicación."""

    # Database fallback (por si no carga el .env)
    database_url: str = "postgresql://postgres:123456@localhost:5432/analytics"

    # JWT
    jwt_secret: str = "change_me_secret_key_min_32_chars"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60

    # Redis (opcional)
    redis_url: Optional[str] = None

    # YCloud (Fase 4)
    ycloud_api_key: Optional[str] = None
    ycloud_api_url: str = "https://api.ycloud.com/v2"
    # Número de origen registrado en tu cuenta YCloud / Meta Business (formato E.164 sin +)
    # Ejemplo Venezuela: 58414XXXXXXX
    ycloud_whatsapp_number: str = ""

    # Moneda para mensajes (usado en plantillas de WhatsApp)
    moneda_simbolo: str = "Bs."

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
