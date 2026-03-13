"""
Modelos: PlanSuscripcion y LogSuscripcion.
Fase 7: Gestión de planes y auditoría de suscripciones.
"""
from sqlmodel import SQLModel, Field, JSON
from datetime import datetime, date
from uuid import UUID, uuid4
from typing import Optional
from sqlalchemy import Column

class PlanSuscripcion(SQLModel, table=True):
    """Catálogo de planes de suscripción."""

    __tablename__ = "planes_suscripcion"
    __table_args__ = {"schema": "sys_config"}

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    codigo: str = Field(max_length=30, unique=True, index=True)
    nombre: str = Field(max_length=100)
    precio_mensual: float = Field(default=0)
    max_pacientes: Optional[int] = Field(default=None)
    max_citas_mes: Optional[int] = Field(default=None)
    incluye_whatsapp: bool = Field(default=False)
    incluye_multiusuario: bool = Field(default=False)
    soporte_prioritario: bool = Field(default=False)
    activo: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class LogSuscripcion(SQLModel, table=True):
    """Auditoría de cambios en suscripciones."""

    __tablename__ = "log_suscripciones"
    __table_args__ = {"schema": "sys_config"}

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    especialista_id: UUID = Field(foreign_key="sys_config.especialistas.id")
    admin_id: Optional[UUID] = Field(default=None, foreign_key="sys_config.administradores.id")
    cambio: dict = Field(sa_column=Column(JSON))
    motivo: Optional[str] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
