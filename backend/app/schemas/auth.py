"""
Schemas Pydantic para autenticación (Fase 1).
"""
from pydantic import BaseModel, EmailStr
from uuid import UUID
from typing import List


class EspecialidadRead(BaseModel):
    """Schema para leer especialidad."""
    id: UUID
    nombre: str
    codigo: str
    activo: bool


class EspecialistaRegister(BaseModel):
    """Schema para registro de especialista."""
    email: EmailStr
    password: str
    nombre: str
    apellido: str
    especialidad_ids: List[UUID] = []


class EspecialistaLogin(BaseModel):
    """Schema para login."""
    email: EmailStr
    password: str


class EspecialistaRead(BaseModel):
    """Schema para leer especialista (sin password)."""
    id: UUID
    email: str
    nombre: str
    apellido: str
    activo: bool
    especialidades: List[EspecialidadRead] = []

    class Config:
        from_attributes = True


class Token(BaseModel):
    """Schema para respuesta de token JWT."""
    access_token: str
    token_type: str = "bearer"
    especialista: EspecialistaRead
