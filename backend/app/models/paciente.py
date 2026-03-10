"""
Modelo: Paciente.
Fase 2.1 - Pacientes con RLS por especialista_id.
"""
from datetime import date, datetime
from typing import Optional
from uuid import UUID, uuid4

from sqlmodel import SQLModel, Field


class PacienteBase(SQLModel):
    """Campos comunes para Paciente."""

    nombre: str = Field(max_length=120)
    apellido: str = Field(max_length=120)
    documento: Optional[str] = Field(default=None, max_length=50)
    telefono: Optional[str] = Field(default=None, max_length=50)
    email: Optional[str] = Field(default=None, max_length=255)
    fecha_nacimiento: Optional[date] = None
    activo: bool = Field(default=True)


class Paciente(PacienteBase, table=True):
    """Tabla de pacientes asociados a un especialista (tenant)."""

    __tablename__ = "pacientes"
    __table_args__ = {"schema": "sys_clinical"}

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    especialista_id: UUID = Field(foreign_key="sys_config.especialistas.id", index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

