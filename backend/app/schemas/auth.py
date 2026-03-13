"""
Schemas Pydantic para autenticación (Fase 1).
"""
from pydantic import BaseModel, EmailStr
from uuid import UUID
from typing import List, Optional


class EspecialidadRead(BaseModel):
    """Schema para leer especialidad."""
    id: UUID
    nombre: str
    codigo: str
    activo: bool

    class Config:
        from_attributes = True


class EspecialistaRegister(BaseModel):
    """Schema para registro de especialista."""
    email: str
    password: str
    nombre: str
    apellido: str
    especialidad_ids: List[UUID] = []


class EspecialistaLogin(BaseModel):
    """Schema para login."""
    email: str
    password: str


class EspecialistaChangePassword(BaseModel):
    """Schema para cambio de contraseña del especialista."""
    current_password: str
    new_password: str


class EspecialistaSecurityUpdate(BaseModel):
    """Schema para actualizar configuración de seguridad del especialista."""
    exigir_cambio_password: Optional[bool] = None
    intervalo_cambio_password: Optional[int] = None


class EspecialistaRead(BaseModel):
    """Schema para leer especialista (sin password)."""
    id: UUID
    email: str
    nombre: str
    apellido: str
    activo: bool
    exigir_cambio_password: bool = False
    intervalo_cambio_password: Optional[int] = None
    slug_url: Optional[str] = None
    especialidades: List[EspecialidadRead] = []

    class Config:
        from_attributes = True


class Token(BaseModel):
    """Schema para respuesta de token JWT."""
    access_token: str
    token_type: str = "bearer"
    especialista: EspecialistaRead
