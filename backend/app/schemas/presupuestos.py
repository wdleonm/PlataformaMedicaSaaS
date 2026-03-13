"""
Schemas Pydantic — Presupuestos, Detalles y Abonos.
Fase 3.4 — Regla de Oro 3.3.
"""
from datetime import date, datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, field_validator

ESTADOS_PRESUPUESTO = ("borrador", "aprobado", "en_pago", "pagado", "cancelado")
METODOS_PAGO = ("efectivo", "transferencia", "tarjeta_debito",
                "tarjeta_credito", "cheque", "otro")


# ---------------------------------------------------------------------------
# Detalle
# ---------------------------------------------------------------------------

class PresupuestoDetalleCreate(BaseModel):
    servicio_id:     Optional[UUID]  = None
    descripcion:     Optional[str]   = None
    cantidad:        float           = 1.0
    precio_unitario: float           = 0.0


class PresupuestoDetalleUpdate(BaseModel):
    servicio_id:     Optional[UUID]  = None
    descripcion:     Optional[str]   = None
    cantidad:        Optional[float] = None
    precio_unitario: Optional[float] = None


class PresupuestoDetalleRead(BaseModel):
    id:              UUID
    presupuesto_id:  UUID
    servicio_id:     Optional[UUID]
    descripcion:     Optional[str]
    cantidad:        float
    precio_unitario: float
    subtotal:        float           = 0.0   # calculado por la BD (GENERATED ALWAYS)

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Presupuesto
# ---------------------------------------------------------------------------

class PresupuestoCreate(BaseModel):
    paciente_id:   UUID
    fecha:         Optional[date]  = None
    validez_fecha: Optional[date]  = None
    notas:         Optional[str]   = None
    estado:        Optional[str]   = "aprobado"
    detalles:      List[PresupuestoDetalleCreate] = []


class PresupuestoUpdate(BaseModel):
    paciente_id:   Optional[UUID]  = None
    fecha:         Optional[date]  = None
    validez_fecha: Optional[date]  = None
    notas:         Optional[str]   = None
    estado:        Optional[str]   = None
    detalles:      Optional[List[PresupuestoDetalleCreate]] = None

    @field_validator("estado")
    @classmethod
    def estado_valido(cls, v: Optional[str]) -> Optional[str]:
        if v and v not in ESTADOS_PRESUPUESTO:
            raise ValueError(f"estado debe ser uno de: {', '.join(ESTADOS_PRESUPUESTO)}")
        return v


class PresupuestoRead(BaseModel):
    id:              UUID
    especialista_id: UUID
    paciente_id:     UUID
    fecha:           date
    total:           float
    saldo_pendiente: float
    estado:          str
    validez_fecha:   Optional[date]
    notas:           Optional[str]
    detalles:        List[PresupuestoDetalleRead] = []
    created_at:      datetime
    updated_at:      datetime

    model_config = {"from_attributes": True}


class PresupuestoList(BaseModel):
    total_registros: int
    items:           List[PresupuestoRead]


# ---------------------------------------------------------------------------
# Abono
# ---------------------------------------------------------------------------

class AbonoCreate(BaseModel):
    presupuesto_id: UUID
    monto:          float
    fecha_abono:    Optional[date] = None
    metodo_pago:    str            = "efectivo"
    notas:          Optional[str]  = None

    @field_validator("monto")
    @classmethod
    def monto_positivo(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("El monto del abono debe ser mayor que cero")
        return v

    @field_validator("metodo_pago")
    @classmethod
    def metodo_valido(cls, v: str) -> str:
        if v not in METODOS_PAGO:
            raise ValueError(f"metodo_pago debe ser uno de: {', '.join(METODOS_PAGO)}")
        return v


class AbonoRead(BaseModel):
    id:              UUID
    especialista_id: UUID
    presupuesto_id:  UUID
    monto:           float
    fecha_abono:     date
    metodo_pago:     str
    notas:           Optional[str]
    created_at:      datetime

    model_config = {"from_attributes": True}


class AbonoList(BaseModel):
    total:           float          # suma total abonada
    items:           List[AbonoRead]
