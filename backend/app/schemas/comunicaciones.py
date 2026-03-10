"""
Schemas Pydantic — Cola de Mensajes.
Fase 4.
"""
from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, field_validator

from app.models.comunicaciones import ESTADOS_MENSAJE, TIPOS_MENSAJE


class ColaMensajeCreate(BaseModel):
    """Crear un mensaje manualmente en la cola (uso interno o desde la API)."""
    tipo:           str
    destino:        str
    payload:        Dict[str, Any]  = {}
    max_reintentos: int             = 3
    abono_id:       Optional[UUID]  = None
    cita_id:        Optional[UUID]  = None

    @field_validator("tipo")
    @classmethod
    def tipo_valido(cls, v: str) -> str:
        if v not in TIPOS_MENSAJE:
            raise ValueError(f"tipo debe ser uno de: {', '.join(TIPOS_MENSAJE)}")
        return v

    @field_validator("destino")
    @classmethod
    def destino_valido(cls, v: str) -> str:
        v = v.strip().lstrip("+")
        if not v.isdigit() or len(v) < 7:
            raise ValueError("destino debe ser un número E.164 sin + (solo dígitos, mín. 7)")
        return v


class ColaMensajeRead(BaseModel):
    id:               UUID
    especialista_id:  UUID
    tipo:             str
    destino:          str
    payload:          Dict[str, Any]
    estado:           str
    reintentos:       int
    max_reintentos:   int
    ultimo_error:     Optional[str]
    abono_id:         Optional[UUID]
    cita_id:          Optional[UUID]
    created_at:       datetime
    enviado_at:       Optional[datetime]
    leido_at:         Optional[datetime]
    proximo_intento:  datetime

    model_config = {"from_attributes": True}


class ColaMensajeList(BaseModel):
    total: int
    items: List[ColaMensajeRead]


class EnviarMensajeDirectoRequest(BaseModel):
    """Enviar un mensaje directo (sin pasar por la cola) — solo para pruebas."""
    destino:  str
    mensaje:  str

    @field_validator("destino")
    @classmethod
    def destino_valido(cls, v: str) -> str:
        v = v.strip().lstrip("+")
        if not v.isdigit() or len(v) < 7:
            raise ValueError("destino debe ser un número E.164 sin + (solo dígitos)")
        return v
