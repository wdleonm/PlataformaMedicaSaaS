"""
Schemas Pydantic para Pacientes (Fase 2.1).
"""
from datetime import date, datetime
from typing import Optional, List
from uuid import UUID

from pydantic import BaseModel, EmailStr


class PacienteBaseSchema(BaseModel):
    """Campos base para creación/edición de pacientes."""

    nombre: str
    apellido: str
    documento: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[EmailStr] = None
    fecha_nacimiento: Optional[date] = None
    activo: bool = True


class PacienteCreate(PacienteBaseSchema):
    """Schema para crear paciente."""

    pass


class PacienteUpdate(BaseModel):
    """Schema para actualizar paciente (parcial)."""

    nombre: Optional[str] = None
    apellido: Optional[str] = None
    documento: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[EmailStr] = None
    fecha_nacimiento: Optional[date] = None
    activo: Optional[bool] = None


class PacienteRead(PacienteBaseSchema):
    """Schema para leer paciente."""

    id: UUID
    especialista_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PacienteList(BaseModel):
    """Respuesta paginada opcional."""

    total: int
    items: List[PacienteRead]

