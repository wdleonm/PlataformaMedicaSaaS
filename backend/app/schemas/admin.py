"""
Schemas Pydantic — Administración SaaS.
Fase 7: Gestión de especialistas, planes y suscripciones.
"""
from datetime import date, datetime
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, EmailStr

# --- Planes de Suscripción ---
class PlanSuscripcionRead(BaseModel):
    id: UUID
    codigo: str
    nombre: str
    precio_mensual: float
    max_pacientes: Optional[int]
    max_citas_mes: Optional[int]
    incluye_whatsapp: bool
    incluye_multiusuario: bool
    soporte_prioritario: bool
    activo: bool

    class Config:
        from_attributes = True

class PlanSuscripcionUpdate(BaseModel):
    codigo: Optional[str] = None
    nombre: Optional[str] = None
    precio_mensual: Optional[float] = None
    max_pacientes: Optional[int] = None
    max_citas_mes: Optional[int] = None
    incluye_whatsapp: Optional[bool] = None
    incluye_multiusuario: Optional[bool] = None
    soporte_prioritario: Optional[bool] = None
    activo: Optional[bool] = None

# --- Admin Auth ---
class AdminLogin(BaseModel):
    email: str
    password: str

class AdminChangePassword(BaseModel):
    current_password: str
    new_password: str

class AdminRead(BaseModel):
    id: UUID
    email: str
    nombre: str
    apellido: str
    activo: bool

    class Config:
        from_attributes = True

class AdminToken(BaseModel):
    access_token: str
    token_type: str = "bearer"
    admin: AdminRead

# --- Gestión de Especialistas (Vista Admin) ---
class EspecialistaAdminRead(BaseModel):
    id: UUID
    email: str
    nombre: str
    apellido: str
    activo: bool
    suscripcion_activa: bool
    fecha_vencimiento_suscripcion: Optional[date]
    plan_suscripcion_id: Optional[UUID]
    especialidad_principal_id: Optional[UUID] = None
    created_at: datetime
    # Enriquecer con el plan si es necesario
    plan: Optional[PlanSuscripcionRead] = None

    class Config:
        from_attributes = True

class EspecialistaAdminUpdate(BaseModel):
    activo: Optional[bool] = None
    suscripcion_activa: Optional[bool] = None
    fecha_vencimiento_suscripcion: Optional[date] = None
    plan_suscripcion_id: Optional[UUID] = None
    especialidad_principal_id: Optional[UUID] = None
    notas_admin: Optional[str] = None

class EspecialistaAdminCreate(BaseModel):
    nombre: str
    apellido: str
    email: EmailStr
    password: str
    especialidad_principal_id: Optional[UUID] = None
    plan_suscripcion_id: Optional[UUID] = None
    fecha_vencimiento_suscripcion: Optional[date] = None

# --- Dashboard Admin ---
class AdminDashboardStats(BaseModel):
    total_especialistas: int
    especialistas_activos: int
    especialistas_nuevos_mes: int
    suscripciones_por_vencer_30d: int
    ingresos_estimados_mes: float
