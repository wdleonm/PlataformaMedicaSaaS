"""
Schemas Pydantic — Insumos y Servicios.
Fase 3.1 + 3.2.
"""
from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, field_validator


# ---------------------------------------------------------------------------
# Insumos
# ---------------------------------------------------------------------------

class InsumoCreate(BaseModel):
    nombre:         str
    codigo:         Optional[str]   = None
    unidad:         str             = "unidad"
    costo_unitario: float           = 0.0
    stock_actual:   float           = 0.0
    stock_minimo:   float           = 0.0

    @field_validator("costo_unitario", "stock_actual", "stock_minimo")
    @classmethod
    def no_negativo(cls, v: float) -> float:
        if v < 0:
            raise ValueError("El valor no puede ser negativo")
        return v


class InsumoUpdate(BaseModel):
    nombre:         Optional[str]   = None
    codigo:         Optional[str]   = None
    unidad:         Optional[str]   = None
    costo_unitario: Optional[float] = None
    stock_actual:   Optional[float] = None
    stock_minimo:   Optional[float] = None
    activo:         Optional[bool]  = None


class InsumoRead(BaseModel):
    id:              UUID
    especialista_id: UUID
    nombre:          str
    codigo:          Optional[str]
    unidad:          str
    costo_unitario:  float
    stock_actual:    float
    stock_minimo:    float
    activo:          bool
    stock_bajo:      bool           = False    # calculado en el endpoint
    created_at:      datetime
    updated_at:      datetime

    model_config = {"from_attributes": True}


class InsumoList(BaseModel):
    total: int
    items: List[InsumoRead]


# ---------------------------------------------------------------------------
# Servicios
# ---------------------------------------------------------------------------

class ServicioCreate(BaseModel):
    nombre:  str
    codigo:  Optional[str]  = None
    precio:  float          = 0.0

    @field_validator("precio")
    @classmethod
    def no_negativo(cls, v: float) -> float:
        if v < 0:
            raise ValueError("El precio no puede ser negativo")
        return v


class ServicioUpdate(BaseModel):
    nombre:  Optional[str]   = None
    codigo:  Optional[str]   = None
    precio:  Optional[float] = None
    activo:  Optional[bool]  = None


class ServicioInsumoRead(BaseModel):
    insumo_id:          UUID
    insumo_nombre:      str
    insumo_unidad:      str
    cantidad_utilizada: float
    costo_linea:        float    # cantidad_utilizada × costo_unitario

    model_config = {"from_attributes": True}


class ServicioRead(BaseModel):
    id:              UUID
    especialista_id: UUID
    nombre:          str
    codigo:          Optional[str]
    precio:          float
    activo:          bool
    costo_insumos:   float = 0.0     # calculado en el endpoint
    utilidad_neta:   float = 0.0
    insumos:         List[ServicioInsumoRead] = []
    created_at:      datetime
    updated_at:      datetime

    model_config = {"from_attributes": True}


class ServicioList(BaseModel):
    total: int
    items: List[ServicioRead]


# ---------------------------------------------------------------------------
# Receta de insumos
# ---------------------------------------------------------------------------

class RecetaInsumoItem(BaseModel):
    insumo_id:          UUID
    cantidad_utilizada: float

    @field_validator("cantidad_utilizada")
    @classmethod
    def positivo(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("La cantidad utilizada debe ser mayor que cero")
        return v


class RecetaUpdate(BaseModel):
    """Reemplaza toda la receta de un servicio con la lista provista."""
    insumos: List[RecetaInsumoItem]
