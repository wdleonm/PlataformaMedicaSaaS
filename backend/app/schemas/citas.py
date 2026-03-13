"""
Schemas Pydantic — Citas.
Fase 3.3.
"""
from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, field_validator

ESTADOS_CITA = ("programada", "confirmada", "en_curso", "completada", "cancelada", "no_asistio")


class CitaCreate(BaseModel):
    paciente_id:   UUID
    servicio_id:   Optional[UUID]    = None
    fecha_hora:    datetime
    duracion_min:  Optional[int]     = None
    presupuesto_id: Optional[UUID]    = None
    notas:         Optional[str]     = None

    @field_validator("duracion_min")
    @classmethod
    def positivo(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and v <= 0:
            raise ValueError("La duración debe ser mayor que cero")
        return v


class CitaUpdate(BaseModel):
    servicio_id:    Optional[UUID]    = None
    fecha_hora:     Optional[datetime]= None
    duracion_min:   Optional[int]     = None
    estado:         Optional[str]     = None
    monto_cobrado:  Optional[float]   = None
    costo_insumos:  Optional[float]   = None
    utilidad_neta:  Optional[float]   = None
    presupuesto_id: Optional[UUID]    = None
    notas:          Optional[str]     = None

    @field_validator("estado")
    @classmethod
    def estado_valido(cls, v: Optional[str]) -> Optional[str]:
        if v and v not in ESTADOS_CITA:
            raise ValueError(f"estado debe ser uno de: {', '.join(ESTADOS_CITA)}")
        return v


class CitaRead(BaseModel):
    id:              UUID
    especialista_id: UUID
    paciente_id:     UUID
    servicio_id:     Optional[UUID]
    fecha_hora:      datetime
    duracion_min:    Optional[int]
    estado:          str
    monto_cobrado:   Optional[float]
    costo_insumos:   Optional[float]
    utilidad_neta:   Optional[float]
    presupuesto_id:  Optional[UUID]
    abono_id:        Optional[UUID]
    notas:           Optional[str]
    created_at:      datetime
    updated_at:      datetime

    model_config = {"from_attributes": True}


class CitaList(BaseModel):
    total: int
    items: List[CitaRead]
