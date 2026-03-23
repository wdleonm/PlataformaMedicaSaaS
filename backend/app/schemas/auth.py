"""
Schemas Pydantic para autenticación (Fase 1).
Fase 5: Añadido soporte para cambio de contraseña forzado.
"""
from pydantic import BaseModel, EmailStr, ConfigDict
from uuid import UUID
from typing import List, Optional


class EspecialidadRead(BaseModel):
    """Schema para leer especialidad."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    nombre: str
    codigo: str
    activo: bool


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
    """Schema para leer especialista (sin password). Incluye flag de cambio forzado."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: str
    nombre: str
    apellido: str
    activo: bool
    exigir_cambio_password: bool = False
    intervalo_cambio_password: Optional[int] = None
    forzar_cambio_password_proximo_acceso: bool = False
    slug_url: Optional[str] = None
    descripcion_perfil: Optional[str] = None
    redes_sociales: Optional[dict] = None
    horario_atencion: Optional[dict] = None
    clinica_nombre: Optional[str] = None
    clinica_logo_url: Optional[str] = None
    clinica_direccion: Optional[str] = None
    especialidades: List[EspecialidadRead] = []


class EspecialistaUpdate(BaseModel):
    """Schema para actualizar datos del perfil del especialista."""
    nombre: Optional[str] = None
    apellido: Optional[str] = None
    descripcion_perfil: Optional[str] = None
    redes_sociales: Optional[dict] = None
    horario_atencion: Optional[dict] = None
    clinica_nombre: Optional[str] = None
    clinica_logo_url: Optional[str] = None
    clinica_direccion: Optional[str] = None
    portal_visible: Optional[bool] = None


class Token(BaseModel):
    """Schema para respuesta de token JWT."""
    access_token: str
    token_type: str = "bearer"
    especialista: EspecialistaRead
