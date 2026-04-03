"""
Modelos SQLModel — Insumos y Servicios.
Fase 3.1: Insumos (inventario por tenant).
Fase 3.2: Servicios + ServicioInsumo (receta — Regla de Oro 3.2).
"""
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID, uuid4

from sqlmodel import SQLModel, Field


# ---------------------------------------------------------------------------
# 3.1  Insumo
# ---------------------------------------------------------------------------

class Insumo(SQLModel, table=True):
    """Inventario de insumos/materiales por especialista (tenant)."""

    __tablename__ = "insumos"
    __table_args__ = {"schema": "sys_config"}

    id:              UUID           = Field(default_factory=uuid4, primary_key=True)
    especialista_id: UUID           = Field(foreign_key="sys_config.especialistas.id", index=True)
    nombre:          str            = Field(max_length=150)
    codigo:          Optional[str]  = Field(default=None, max_length=40)
    unidad:          str            = Field(default="unidad", max_length=30)
    costo_unitario:  float          = Field(default=0.0, ge=0)
    unidades_por_paquete: int       = Field(default=1, ge=1)
    stock_actual:    float          = Field(default=0.0, ge=0)
    stock_minimo:    float          = Field(default=0.0, ge=0)
    activo:          bool           = Field(default=True)
    created_at:      datetime       = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at:      datetime       = Field(default_factory=lambda: datetime.now(timezone.utc))


# ---------------------------------------------------------------------------
# 3.2a  Servicio
# ---------------------------------------------------------------------------

class Servicio(SQLModel, table=True):
    """Catálogo de servicios ofrecidos por el especialista."""

    __tablename__ = "servicios"
    __table_args__ = {"schema": "sys_config"}

    id:              UUID           = Field(default_factory=uuid4, primary_key=True)
    especialista_id: UUID           = Field(foreign_key="sys_config.especialistas.id", index=True)
    nombre:          str            = Field(max_length=150)
    codigo:          Optional[str]  = Field(default=None, max_length=40)
    precio:          float          = Field(default=0.0, ge=0)
    merma_porcentaje: float         = Field(default=0.0, ge=0, le=100)  # Fase 9.1: % de costos indirectos/merma
    activo:          bool           = Field(default=True)
    visible_publico: bool           = Field(default=True)
    duracion_estimada_min: int      = Field(default=30)
    created_at:      datetime       = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at:      datetime       = Field(default_factory=lambda: datetime.now(timezone.utc))


# ---------------------------------------------------------------------------
# 3.2b  ServicioInsumo  ("receta" — Regla de Oro 3.2)
# ---------------------------------------------------------------------------

class ServicioInsumo(SQLModel, table=True):
    """
    Receta de insumos por servicio.
    Costo_servicio = Σ (cantidad_utilizada × insumo.costo_unitario)
    Utilidad_Neta  = monto_cobrado − Costo_servicio
    """

    __tablename__  = "servicio_insumos"
    __table_args__ = {"schema": "sys_config"}

    servicio_id:        UUID  = Field(foreign_key="sys_config.servicios.id", primary_key=True)
    insumo_id:          UUID  = Field(foreign_key="sys_config.insumos.id",   primary_key=True)
    cantidad_utilizada: float = Field(default=1.0, gt=0)


# ---------------------------------------------------------------------------
# 3.3  Inventario Movimiento (Kardex)
# ---------------------------------------------------------------------------

class InventarioMovimiento(SQLModel, table=True):
    """
    Registro histórico de movimientos de inventario (Kardex).
    Tipos comunes: 'entrada', 'salida', 'ajuste'
    """
    __tablename__ = "inventario_movimientos"
    __table_args__ = {"schema": "sys_config"}

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    especialista_id: UUID = Field(foreign_key="sys_config.especialistas.id", index=True)
    insumo_id: UUID = Field(foreign_key="sys_config.insumos.id", index=True)
    tipo: str = Field(max_length=20)  # "entrada", "salida", "ajuste"
    cantidad: float
    costo_unitario_historico: float = Field(default=0.0)
    motivo_o_referencia: Optional[str] = Field(default=None)
    fecha: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
