"""
Schemas Pydantic — Odontograma.
Fase 2.2 + 2.3: Hallazgos y Registros evolutivos.
"""
from datetime import date, datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, field_validator


# ---------------------------------------------------------------------------
# Hallazgos (catálogo — solo lectura desde API)
# ---------------------------------------------------------------------------

class OdontogramaHallazgoRead(BaseModel):
    id:                 UUID
    codigo:             str
    nombre:             str
    categoria:          str
    descripcion_visual: Optional[str]
    activo:             bool
    orden:              int

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Registro de odontograma
# ---------------------------------------------------------------------------

CARAS_VALIDAS = {"O", "M", "D", "V", "L", "R"}

DIENTES_VALIDOS = set(
    list(range(11, 19)) + list(range(21, 29)) +
    list(range(31, 39)) + list(range(41, 49)) +
    list(range(51, 56)) + list(range(61, 66)) +
    list(range(71, 76)) + list(range(81, 86))
)


class OdontogramaRegistroCreate(BaseModel):
    """Payload para registrar un nuevo estado en el odontograma.

    Regla de Oro 3.1: el backend solo hace INSERT; nunca UPDATE de registros previos.
    """

    paciente_id:         UUID
    numero_diente:       int
    cara_diente:         str
    hallazgo_id:         UUID
    fecha_registro:      Optional[date]  = None   # default: hoy
    notas:               Optional[str]   = None
    historia_clinica_id: Optional[UUID]  = None

    @field_validator("cara_diente")
    @classmethod
    def validar_cara(cls, v: str) -> str:
        v = v.upper()
        if v not in CARAS_VALIDAS:
            raise ValueError(f"cara_diente debe ser una de: {', '.join(sorted(CARAS_VALIDAS))}")
        return v

    @field_validator("numero_diente")
    @classmethod
    def validar_diente(cls, v: int) -> int:
        if v not in DIENTES_VALIDOS:
            raise ValueError(
                "numero_diente debe ser un número FDI válido "
                "(11-18, 21-28, 31-38, 41-48 | temporales: 51-55, 61-65, 71-75, 81-85)"
            )
        return v


class OdontogramaRegistroRead(BaseModel):
    id:                  UUID
    especialista_id:     UUID
    paciente_id:         UUID
    numero_diente:       int
    cara_diente:         str
    hallazgo_id:         UUID
    hallazgo:            Optional[OdontogramaHallazgoRead] = None
    fecha_registro:      date
    notas:               Optional[str]
    historia_clinica_id: Optional[UUID]
    created_at:          datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Vista del estado del odontograma en una fecha dada
# ---------------------------------------------------------------------------

class EstadoDiente(BaseModel):
    """Estado de una cara de un diente en una fecha determinada."""
    numero_diente:   int
    cara_diente:     str
    hallazgo_id:     UUID
    hallazgo_codigo: str
    hallazgo_nombre: str
    fecha_registro:  date
    notas:           Optional[str]
    registro_id:     UUID


class OdontogramaEstadoRead(BaseModel):
    """Respuesta de GET /pacientes/{id}/odontograma — estado reconstruido por fecha."""
    paciente_id: UUID
    fecha_corte: date
    dientes:     List[EstadoDiente]
