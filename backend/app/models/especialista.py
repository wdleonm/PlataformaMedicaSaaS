"""
Modelos: Especialista y relación N:N con Especialidades.
RLS activo en especialistas (a nivel de tabla en PostgreSQL).
"""
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from uuid import UUID, uuid4
from typing import List, TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.especialidad import Especialidad


class EspecialistaEspecialidad(SQLModel, table=True):
    """Tabla intermedia N:N entre Especialistas y Especialidades."""

    __tablename__ = "especialista_especialidades"

    especialista_id: UUID = Field(foreign_key="especialistas.id", primary_key=True)
    especialidad_id: UUID = Field(foreign_key="especialidades.id", primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class EspecialistaBase(SQLModel):
    """Schema base para Especialista (sin password)."""

    email: str = Field(max_length=255, unique=True, index=True)
    nombre: str = Field(max_length=120)
    apellido: str = Field(max_length=120)
    activo: bool = Field(default=True)


class Especialista(EspecialistaBase, table=True):
    """Usuario del sistema; cada fila es un tenant. RLS por id."""

    __tablename__ = "especialistas"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    password_hash: str = Field(max_length=255)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relación N:N con Especialidades (solo desde este lado para evitar ciclos)
    especialidades: List["Especialidad"] = Relationship(
        link_model=EspecialistaEspecialidad,
    )
