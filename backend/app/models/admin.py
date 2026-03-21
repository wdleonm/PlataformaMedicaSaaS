"""
Modelo: Administrador (Dueño del sistema).
Fase 7: Privilegios de administrador para gestión SaaS.
"""
from sqlmodel import SQLModel, Field
from datetime import datetime, timezone
from uuid import UUID, uuid4

class Admin(SQLModel, table=True):
    """Usuario con privilegios administrativos globales (Dueño del SaaS)."""

    __tablename__ = "administradores"
    __table_args__ = {"schema": "sys_config"}

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    email: str = Field(max_length=255, unique=True, index=True)
    password_hash: str = Field(max_length=255)
    nombre: str = Field(max_length=120)
    apellido: str = Field(max_length=120)
    rol: str = Field(default="master", max_length=20) # master | solo_lectura
    activo: bool = Field(default=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
