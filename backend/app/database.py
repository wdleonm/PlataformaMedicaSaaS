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
)


def get_session() -> Session:
    """
    Dependency para obtener sesión de DB.
    El middleware debe ejecutar SET LOCAL app.especialista_id antes de usar esta sesión.
    """
    with Session(engine) as session:
        yield session


def init_db() -> None:
    """Crear todas las tablas (solo para desarrollo; usar Alembic en producción)."""
    SQLModel.metadata.create_all(engine)
