"""
Modelo SQLModel — Catálogo Maestro de Insumos.
Este catálogo sirve de referencia global para que los especialistas clonen los 
ítems a su inventario (Insumo) sin afectar los de otros, y mantiene el precio de mercado base extraído vía Scraping.
"""
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID, uuid4

from sqlmodel import SQLModel, Field

class CatalogoInsumo(SQLModel, table=True):
    __tablename__ = "catalogo_insumos"
    __table_args__ = {"schema": "sys_config"}

    id:             UUID     = Field(default_factory=uuid4, primary_key=True)
    sku:            Optional[str] = Field(default=None, max_length=50, index=True)
    nombre:         str      = Field(max_length=200, index=True)
    categoria:      Optional[str] = Field(default=None, max_length=100)
    descripcion:    Optional[str] = Field(default=None)
    precio_usd:     float    = Field(default=0.0, ge=0)
    unidades:       int      = Field(default=1, ge=1)
    imagen_url:     Optional[str] = Field(default=None, max_length=500)
    enlace_origen:  Optional[str] = Field(default=None, max_length=500)
    
    activo:         bool     = Field(default=True)
    created_at:     datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at:     datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
