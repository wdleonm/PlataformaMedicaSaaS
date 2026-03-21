from sqlmodel import SQLModel, Field
from datetime import datetime, timezone
from uuid import UUID, uuid4
from typing import Optional

class HCSeccion(SQLModel, table=True):
    """Catálogo de secciones disponibles para la Historia Clínica."""
    
    __tablename__ = "hc_secciones"
    __table_args__ = {"schema": "sys_config"}
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    codigo: str = Field(max_length=50, unique=True, index=True)
    nombre: str = Field(max_length=100)
    descripcion: Optional[str] = Field(default=None)
    componente_frontend: str = Field(max_length=100)
    activo: bool = Field(default=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class EspecialidadHCSeccion(SQLModel, table=True):
    """Tabla pivot para asociar especialidades con las secciones de su Historia Clínica."""
    
    __tablename__ = "especialidad_hc_secciones"
    __table_args__ = {"schema": "sys_config"}
    
    especialidad_id: UUID = Field(foreign_key="sys_config.especialidades.id", primary_key=True)
    hc_seccion_id: UUID = Field(foreign_key="sys_config.hc_secciones.id", primary_key=True)
    orden: int = Field(default=0)
    obligatoria: bool = Field(default=False)
