"""
Schemas Pydantic — Historias Clínicas.
Fase 2.4: Episodios clínicos por paciente.
"""
from datetime import date, datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel


class HistoriaClinicaCreate(BaseModel):
    paciente_id:      UUID
    fecha_apertura:   Optional[date]  = None
    motivo_consulta:  Optional[str]   = None
    diagnostico:      Optional[str]   = None
    plan_tratamiento: Optional[str]   = None
    notas:            Optional[str]   = None


class HistoriaClinicaUpdate(BaseModel):
    """Actualización parcial — todos los campos son opcionales."""
    fecha_apertura:   Optional[date]  = None
    motivo_consulta:  Optional[str]   = None
    diagnostico:      Optional[str]   = None
    plan_tratamiento: Optional[str]   = None
    notas:            Optional[str]   = None
    activo:           Optional[bool]  = None


class HistoriaClinicaRead(BaseModel):
    id:               UUID
    especialista_id:  UUID
    paciente_id:      UUID
    fecha_apertura:   date
    motivo_consulta:  Optional[str]
    diagnostico:      Optional[str]
    plan_tratamiento: Optional[str]
    notas:            Optional[str]
    activo:           bool
    created_at:       datetime
    updated_at:       datetime

    model_config = {"from_attributes": True}


class HistoriaClinicaList(BaseModel):
    total: int
    items: List[HistoriaClinicaRead]
