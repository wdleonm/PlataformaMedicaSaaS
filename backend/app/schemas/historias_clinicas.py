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
    especialidad_id:  Optional[UUID]  = None
    fecha_apertura:   Optional[date]  = None
    motivo_consulta:  Optional[str]   = None
    enfermedad_actual: Optional[str]  = None
    antecedentes_familiares: Optional[dict] = None
    antecedentes_personales: Optional[dict] = None
    examen_clinico: Optional[dict] = None
    estudios_complementarios: Optional[dict] = None
    diagnostico:      Optional[str]   = None
    plan_tratamiento: Optional[str]   = None
    notas:            Optional[str]   = None


class HistoriaClinicaUpdate(BaseModel):
    """Actualización parcial — todos los campos son opcionales."""
    especialidad_id:  Optional[UUID]  = None
    fecha_apertura:   Optional[date]  = None
    motivo_consulta:  Optional[str]   = None
    enfermedad_actual: Optional[str]  = None
    antecedentes_familiares: Optional[dict] = None
    antecedentes_personales: Optional[dict] = None
    examen_clinico: Optional[dict] = None
    estudios_complementarios: Optional[dict] = None
    diagnostico:      Optional[str]   = None
    plan_tratamiento: Optional[str]   = None
    notas:            Optional[str]   = None
    activo:           Optional[bool]  = None


class HistoriaClinicaAdjuntoRead(BaseModel):
    id: UUID
    historia_id: UUID
    nombre_archivo: str
    ruta_archivo: str
    tipo_mime: str
    tamano: int
    created_at: datetime

    model_config = {"from_attributes": True}


class HistoriaClinicaRead(BaseModel):
    id:               UUID
    especialista_id:  UUID
    especialidad_id:  Optional[UUID]
    paciente_id:      UUID
    fecha_apertura:   date
    motivo_consulta:  Optional[str]
    enfermedad_actual: Optional[str]
    antecedentes_familiares: Optional[dict]
    antecedentes_personales: Optional[dict]
    examen_clinico: Optional[dict]
    estudios_complementarios: Optional[dict]
    diagnostico:      Optional[str]
    plan_tratamiento: Optional[str]
    notas:            Optional[str]
    activo:           bool
    created_at:       datetime
    updated_at:       datetime
    adjuntos_count:   int = 0
    adjuntos:         List[HistoriaClinicaAdjuntoRead] = []

    model_config = {"from_attributes": True}


class HistoriaClinicaList(BaseModel):
    total: int
    items: List[HistoriaClinicaRead]
