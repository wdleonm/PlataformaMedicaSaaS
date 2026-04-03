from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID
from datetime import datetime, date

class PublicServiceRead(BaseModel):
    id: UUID
    nombre: str
    precio: float
    duracion_estimada_min: int

class FinancialConfigRead(BaseModel):
    moneda_principal: str
    moneda_simbolo: str
    tasa_usd: float
    tasa_eur: float

class PublicSpecialistRead(BaseModel):
    id: UUID
    nombre: str
    apellido: str
    descripcion_perfil: Optional[str]
    horario_atencion: Optional[dict]
    especialidades: List[str]
    servicios: List[PublicServiceRead]
    fin_config: FinancialConfigRead
    clinica_nombre: Optional[str] = None
    clinica_logo_url: Optional[str] = None
    clinica_direccion: Optional[str] = None
    redes_sociales: Optional[dict] = None
    mostrar_precios_portal: bool = False

class PublicReservaCreate(BaseModel):
    # Datos del paciente (auto-registro)
    nombre: str
    apellido: str
    documento: str
    email: str
    telefono: str
    
    # Datos de la cita
    servicio_id: UUID
    fecha_hora: datetime
    notas: Optional[str] = None
