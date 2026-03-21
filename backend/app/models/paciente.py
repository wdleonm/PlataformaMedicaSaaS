"""
Modelo: Paciente.
Fase 2.1 - Pacientes con RLS por especialista_id.
"""
from datetime import date, datetime, timezone
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
    sexo: Optional[str] = Field(default=None, max_length=2)  # M / F
    direccion: Optional[str] = Field(default=None)
    lugar_nacimiento: Optional[str] = Field(default=None, max_length=100)
    estado_civil: Optional[str] = Field(default=None, max_length=50)
    ocupacion: Optional[str] = Field(default=None, max_length=100)
    
    # Contacto de Emergencia
    contacto_emergencia_nombre: Optional[str] = Field(default=None, max_length=120)
    contacto_emergencia_telefono: Optional[str] = Field(default=None, max_length=50)
    contacto_emergencia_parentesco: Optional[str] = Field(default=None, max_length=50)
    
    # Alertas Médicas
    alergias: Optional[str] = Field(default=None)
    patologias_cronicas: Optional[str] = Field(default=None)
    medicacion_frecuente: Optional[str] = Field(default=None)
    
    activo: bool = Field(default=True)


class Paciente(PacienteBase, table=True):
    """Tabla de pacientes asociados a un especialista (tenant)."""

    __tablename__ = "pacientes"
    __table_args__ = {"schema": "sys_clinical"}

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    especialista_id: UUID = Field(foreign_key="sys_config.especialistas.id", index=True)
    origen_registro: str = Field(default="interno", max_length=20) # 'interno' o 'portal_publico'
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

