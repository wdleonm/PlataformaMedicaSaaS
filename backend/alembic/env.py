"""
Alembic env - configuración para migraciones.
Fase 1: Configuración completa.
"""
from logging.config import fileConfig
from sqlalchemy import engine_from_config
from sqlalchemy import pool
from alembic import context
import sys
from pathlib import Path

# Añadir el directorio raíz al path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.database import engine
from app.config import settings
from app.models import *  # Importar todos los modelos
from sqlmodel import SQLModel

# this is the Alembic Config object
config = context.config

# Interpretar el archivo de configuración para logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Establecer sqlalchemy.url desde settings
config.set_main_option("sqlalchemy.url", settings.database_url)

# Metadata de SQLModel
target_metadata = SQLModel.metadata


def run_migrations_offline() -> None:
    """Ejecutar migraciones en modo 'offline'."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Ejecutar migraciones en modo 'online'."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
