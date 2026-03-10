"""
Conexión a PostgreSQL con SQLModel.
Fase 1: Implementación completa con soporte para RLS.
"""
from sqlmodel import SQLModel, create_engine, Session
from app.config import settings

# Engine de SQLModel
engine = create_engine(
    settings.database_url,
    echo=False,  # Cambiar a True para debug SQL
    pool_pre_ping=True,  # Verifica conexiones antes de usarlas
    pool_size=5,
    max_overflow=10,
    connect_args={
        "options": "-c search_path=sys_config,sys_clinical,public"
    }
)


def get_session():
    """Dependency para obtener sesión de DB."""
    session = Session(engine)
    try:
        yield session
    finally:
        session.close()


def init_db() -> None:
    """Crear todas las tablas (solo para desarrollo; usar Alembic en producción)."""
    SQLModel.metadata.create_all(engine)
