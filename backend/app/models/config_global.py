from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4
from sqlmodel import SQLModel, Field

class ConfiguracionGlobal(SQLModel, table=True):
    """Configuración maestra para el SaaS (Monedas, Tasas, IVA)."""
    
    __tablename__ = "configuracion_global"
    __table_args__ = {"schema": "sys_config"}

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    
    moneda_nombre:  str = Field(default="Bolívar")
    moneda_simbolo: str = Field(default="Bs.")
    
    tasa_usd: float = Field(default=1.0)
    tasa_eur: float = Field(default=1.0)
    
    iva_porcentaje: float = Field(default=16.0)
    
    bcv_modo_automatico:       bool = Field(default=True)
    bcv_ultima_sincronizacion: Optional[datetime] = Field(default=None)
    
    ycloud_api_key: Optional[str] = Field(default=None)
    ycloud_whatsapp_number: Optional[str] = Field(default=None)
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class BCVTasaHistorial(SQLModel, table=True):
    """Histórico de tasas del BCV para auditoría y respaldo."""

    __tablename__ = "bcv_tasas_historial"
    __table_args__ = {"schema": "sys_config"}

    id:        UUID     = Field(default_factory=uuid4, primary_key=True)
    fecha:     datetime = Field(default_factory=datetime.utcnow, index=True)
    tasa_usd:  float
    tasa_eur:  float
    fuente:    str      = Field(default="BCV")
