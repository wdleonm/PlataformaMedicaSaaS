"""
Modelo: Especialidad (tabla maestra compartida, sin RLS).
"""
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from uuid import UUID, uuid4
from typing import List, TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.especialista import Especialista


class Especialidad(SQLModel, table=True):
    """Catálogo de especialidades médicas (compartido entre tenants)."""

    __tablename__ = "especialidades"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    nombre: str = Field(max_length=120, index=True)
    codigo: str = Field(max_length=20, unique=True, index=True)
    activo: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relación N:N con Especialistas
    especialistas: List["Especialista"] = Relationship(
        back_populates="especialidades",
        link_model="EspecialistaEspecialidad",
    )
