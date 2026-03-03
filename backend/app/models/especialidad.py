"""
Modelo: Especialidad (tabla maestra compartida, sin RLS).
Relación N:N con Especialista se gestiona desde el modelo Especialista
para evitar ciclos de importación y problemas con link_model.
"""
from sqlmodel import SQLModel, Field
from datetime import datetime
from uuid import UUID, uuid4


class Especialidad(SQLModel, table=True):
    """Catálogo de especialidades médicas (compartido entre tenants)."""

    __tablename__ = "especialidades"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    nombre: str = Field(max_length=120, index=True)
    codigo: str = Field(max_length=20, unique=True, index=True)
    activo: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
