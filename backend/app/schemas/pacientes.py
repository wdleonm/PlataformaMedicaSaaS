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
    sexo: Optional[str] = None
    direccion: Optional[str] = None
    lugar_nacimiento: Optional[str] = None
    estado_civil: Optional[str] = None
    ocupacion: Optional[str] = None
    contacto_emergencia_nombre: Optional[str] = None
    contacto_emergencia_telefono: Optional[str] = None
    contacto_emergencia_parentesco: Optional[str] = None
    
    # Alertas Médicas
    alergias: Optional[str] = None
    patologias_cronicas: Optional[str] = None
    medicacion_frecuente: Optional[str] = None
    
    activo: bool = True


class PacienteCreate(PacienteBaseSchema):
    """Schema para crear paciente."""
    telefono: str
    email: EmailStr


class PacienteUpdate(BaseModel):
    """Schema para actualizar paciente (parcial)."""

    nombre: Optional[str] = None
    apellido: Optional[str] = None
    documento: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[EmailStr] = None
    fecha_nacimiento: Optional[date] = None
    sexo: Optional[str] = None
    direccion: Optional[str] = None
    lugar_nacimiento: Optional[str] = None
    estado_civil: Optional[str] = None
    ocupacion: Optional[str] = None
    contacto_emergencia_nombre: Optional[str] = None
    contacto_emergencia_telefono: Optional[str] = None
    contacto_emergencia_parentesco: Optional[str] = None
    
    # Alertas Médicas
    alergias: Optional[str] = None
    patologias_cronicas: Optional[str] = None
    medicacion_frecuente: Optional[str] = None
    
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

