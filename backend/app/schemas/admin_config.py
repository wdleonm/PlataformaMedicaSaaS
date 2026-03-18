from typing import Optional
from uuid import UUID
from pydantic import BaseModel
from datetime import datetime

# --- Especialidades ---
class EspecialidadCreate(BaseModel):
    nombre: str
    codigo: str
    activo: bool = True

class EspecialidadUpdate(BaseModel):
    nombre: Optional[str] = None
    codigo: Optional[str] = None
    activo: Optional[bool] = None

class EspecialidadRead(BaseModel):
    id: UUID
    nombre: str
    codigo: str
    activo: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- Odontograma Hallazgos ---
class OdontogramaHallazgoCreate(BaseModel):
    codigo: str
    nombre: str
    categoria: str # patologia | restauracion | estado
    descripcion_visual: Optional[str] = None
    activo: bool = True
    orden: int = 0

class OdontogramaHallazgoUpdate(BaseModel):
    codigo: Optional[str] = None
    nombre: Optional[str] = None
    categoria: Optional[str] = None
    descripcion_visual: Optional[str] = None
    activo: Optional[bool] = None
    orden: Optional[int] = None

class OdontogramaHallazgoRead(BaseModel):
    id: UUID
    codigo: str
    nombre: str
    categoria: str
    descripcion_visual: Optional[str]
    activo: bool
    orden: int
    created_at: datetime
    updated_at: datetime

# --- Configuracion Global ---
class ConfigGlobalRead(BaseModel):
    id: UUID
    moneda_nombre: str
    moneda_simbolo: str
    tasa_usd: float
    tasa_eur: float
    iva_porcentaje: float
    bcv_modo_automatico: bool
    bcv_ultima_sincronizacion: Optional[datetime]
    updated_at: datetime

    class Config:
        from_attributes = True

class ConfigGlobalUpdate(BaseModel):
    moneda_nombre: Optional[str] = None
    moneda_simbolo: Optional[str] = None
    tasa_usd: Optional[float] = None
    tasa_eur: Optional[float] = None
    iva_porcentaje: Optional[float] = None
    bcv_modo_automatico: Optional[bool] = None
    ycloud_api_key: Optional[str] = None
