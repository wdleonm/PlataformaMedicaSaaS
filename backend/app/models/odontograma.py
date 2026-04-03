"""
Modelos SQLModel — Odontograma.
Fase 2.2: OdontogramaHallazgo (catálogo, tabla maestra en sys_config).
Fase 2.3: OdontogramaRegistro (evolutivo, tabla transaccional en sys_clinical).

Convención FDI:
  Permanentes : 11-18, 21-28, 31-38, 41-48
  Temporales  : 51-55, 61-65, 71-75, 81-85
Caras         : O (Oclusal), M (Mesial), D (Distal), V (Vestibular), L (Lingual), R (Raíz)
"""
from datetime import date, datetime, timezone
from typing import Optional
from uuid import UUID, uuid4

from sqlmodel import SQLModel, Field


# ---------------------------------------------------------------------------
# Catálogo de hallazgos (tabla maestra — sys_config)
# ---------------------------------------------------------------------------

class OdontogramaHallazgo(SQLModel, table=True):
    """Catálogo global de hallazgos odontológicos (sin tenant)."""

    __tablename__ = "odontograma_hallazgos"
    __table_args__ = {"schema": "sys_config"}

    id:                  UUID              = Field(default_factory=uuid4, primary_key=True)
    codigo:              str               = Field(max_length=30, unique=True)
    nombre:              str               = Field(max_length=80)
    categoria:           str               = Field(max_length=20)        # patologia | restauracion | estado
    descripcion_visual:  Optional[str]     = Field(default=None, max_length=200)
    activo:              bool              = Field(default=True)
    orden:               int               = Field(default=0)
    created_at:          datetime          = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at:          datetime          = Field(default_factory=lambda: datetime.now(timezone.utc))


# ---------------------------------------------------------------------------
# Registro evolutivo de odontograma (tabla transaccional — sys_clinical)
# REGLA DE ORO 3.1: Solo INSERT — nunca actualizar filas existentes.
# ---------------------------------------------------------------------------

class OdontogramaRegistro(SQLModel, table=True):
    """
    Registro evolutivo del odontograma.
    Cada cambio de estado en un diente/cara genera una nueva fila.
    El estado en una fecha se obtiene tomando el registro más reciente
    por (paciente_id, numero_diente, cara_diente) con fecha_registro <= fecha.
    """

    __tablename__ = "odontograma_registros"
    __table_args__ = {"schema": "sys_clinical"}

    id:                  UUID              = Field(default_factory=uuid4, primary_key=True)
    especialista_id:     UUID              = Field(
                                                foreign_key="sys_config.especialistas.id",
                                                index=True,
                                            )
    paciente_id:         UUID              = Field(
                                                foreign_key="sys_clinical.pacientes.id",
                                                index=True,
                                            )
    numero_diente:       int               = Field(
                                                description="Número FDI del diente (ej. 11, 36, 47).",
                                            )
    cara_diente:         str               = Field(
                                                max_length=2,
                                                description="O=Oclusal M=Mesial D=Distal V=Vestibular L=Lingual R=Raíz",
                                            )
    hallazgo_id:         UUID              = Field(
                                                foreign_key="sys_config.odontograma_hallazgos.id",
                                            )
    fecha_registro:      date              = Field(default_factory=date.today)
    notas:               Optional[str]     = Field(default=None)
    historia_clinica_id: Optional[UUID]    = Field(
                                                default=None,
                                                foreign_key="sys_clinical.historias_clinicas.id",
                                            )
    created_at:          datetime          = Field(default_factory=lambda: datetime.now(timezone.utc))
