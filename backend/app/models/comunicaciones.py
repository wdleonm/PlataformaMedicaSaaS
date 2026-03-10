"""
Modelo SQLModel — ColaMensaje.
Fase 4.2 — Regla de Oro 3.4: cola persistente de mensajes WhatsApp vía YCloud.
"""
from datetime import datetime
from typing import Any, Dict, Optional
from uuid import UUID, uuid4

from sqlmodel import SQLModel, Field
from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import JSONB


TIPOS_MENSAJE = (
    "abono_confirmacion",
    "recordatorio_cita",
    "presupuesto_aprobado",
    "cita_cancelada",
    "personalizado",
)

ESTADOS_MENSAJE = ("pendiente", "enviado", "leido", "fallido", "cancelado")


class ColaMensaje(SQLModel, table=True):
    """
    Cola persistente de mensajes WhatsApp.

    Ciclo de vida:
      pendiente → enviado → leido
                ↘ fallido (reintentos < max_reintentos → vuelve a pendiente con backoff)
      pendiente → cancelado (cancelación manual)

    Regla de Oro 3.4: no perder mensajes críticos.
    El campo proximo_intento implementa backoff exponencial entre reintentos.
    """

    __tablename__  = "cola_mensajes"
    __table_args__ = {"schema": "sys_clinical"}

    id:               UUID           = Field(default_factory=uuid4, primary_key=True)
    especialista_id:  UUID           = Field(foreign_key="sys_config.especialistas.id", index=True)
    tipo:             str            = Field(max_length=40)
    destino:          str            = Field(max_length=20,
                                            description="Número E.164 sin + (ej. 58414XXXXXXX)")
    payload:          Dict[str, Any] = Field(
                                          default_factory=dict,
                                          sa_column=Column(JSONB, nullable=False, default={}),
                                      )
    estado:           str            = Field(default="pendiente", max_length=15)
    reintentos:       int            = Field(default=0)
    max_reintentos:   int            = Field(default=3)
    ultimo_error:     Optional[str]  = Field(default=None)

    # Referencias trazables
    abono_id:         Optional[UUID] = Field(default=None, foreign_key="sys_clinical.abonos.id")
    cita_id:          Optional[UUID] = Field(default=None, foreign_key="sys_clinical.citas.id")

    # Timestamps
    created_at:       datetime       = Field(default_factory=datetime.utcnow)
    enviado_at:       Optional[datetime] = Field(default=None)
    leido_at:         Optional[datetime] = Field(default=None)
    proximo_intento:  datetime       = Field(default_factory=datetime.utcnow)
