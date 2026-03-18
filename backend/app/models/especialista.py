"""
Modelos: Especialista y relación N:N con Especialidades.
RLS activo en especialistas (a nivel de tabla en PostgreSQL).
"""
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime, date
from uuid import UUID, uuid4
from typing import List, Optional, TYPE_CHECKING
from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import JSONB

if TYPE_CHECKING:
    from app.models.especialidad import Especialidad


class EspecialistaEspecialidad(SQLModel, table=True):
    """Tabla intermedia N:N entre Especialistas y Especialidades."""

    __tablename__ = "especialista_especialidades"
    __table_args__ = {"schema": "sys_config"}

    especialista_id: UUID = Field(foreign_key="sys_config.especialistas.id", primary_key=True)
    especialidad_id: UUID = Field(foreign_key="sys_config.especialidades.id", primary_key=True)
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
    __table_args__ = {"schema": "sys_config"}

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    password_hash: str = Field(max_length=255)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relación N:N con Especialidades (solo desde este lado para evitar ciclos)
    especialidades: List["Especialidad"] = Relationship(
        link_model=EspecialistaEspecialidad,
    )

    # Fase 7: Suscripción
    plan_suscripcion_id: Optional[UUID] = Field(default=None, foreign_key="sys_config.planes_suscripcion.id")
    suscripcion_activa: bool = Field(default=True)
    fecha_vencimiento_suscripcion: Optional[date] = Field(default=None)
    # Fase 9: Portal Público
    slug_url: Optional[str] = Field(default=None, max_length=100, unique=True)
    portal_visible: bool = Field(default=False)
    descripcion_perfil: Optional[str] = Field(default=None)
    horario_atencion: Optional[dict] = Field(default=None, sa_column=Column(JSONB))
    redes_sociales: Optional[dict] = Field(default=None, sa_column=Column(JSONB))
    clinica_nombre: Optional[str] = Field(default=None, max_length=200)
    clinica_logo_url: Optional[str] = Field(default=None, max_length=500)
    clinica_direccion: Optional[str] = Field(default=None)

    # Seguridad: Rotación de contraseñas
    exigir_cambio_password: bool = Field(default=False)
    intervalo_cambio_password: Optional[int] = Field(default=None)  # días (60, 90, 120, etc)
    fecha_ultimo_cambio_password: datetime = Field(default_factory=datetime.utcnow)
