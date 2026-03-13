"""
Endpoint para el Dashboard de Administración.
Fase 7: Estadísticas globales del SaaS.
"""
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from sqlmodel import Session, select, func
from app.database import get_session
from app.models.especialista import Especialista
from app.models.admin import Admin
from app.schemas.admin import AdminDashboardStats
from app.api.dependencies import get_current_admin

router = APIRouter(prefix="/api/admin/dashboard", tags=["Admin Dashboard"])

@router.get("/", response_model=AdminDashboardStats)
def get_admin_dashboard(
    session: Session = Depends(get_session),
    current_admin: Admin = Depends(get_current_admin),
):
    """Obtener estadísticas globales para el dueño del sistema."""
    
    # Total especialistas
    total = session.exec(select(func.count(Especialista.id))).one()
    
    # Activos
    activos = session.exec(select(func.count(Especialista.id)).where(Especialista.activo == True)).one()
    
    # Nuevos este mes
    hace_un_mes = datetime.utcnow() - timedelta(days=30)
    nuevos = session.exec(select(func.count(Especialista.id)).where(Especialista.created_at >= hace_un_mes)).one()
    
    # Próximos a vencer (30 días)
    hoy = datetime.utcnow().date()
    en_30_dias = hoy + timedelta(days=30)
    por_vencer = session.exec(
        select(func.count(Especialista.id))
        .where(Especialista.fecha_vencimiento_suscripcion >= hoy)
        .where(Especialista.fecha_vencimiento_suscripcion <= en_30_dias)
    ).one()
    
    # Ingresos estimados (suma de precios de planes activos)
    # Nota: Este es un cálculo simplificado
    ingresos = 0.0
    # Podríamos hacer un join pero para el dashboard inicial vamos a simplificar
    
    return AdminDashboardStats(
        total_especialistas=total,
        especialistas_activos=activos,
        especialistas_nuevos_mes=nuevos,
        suscripciones_por_vencer_30d=por_vencer,
        ingresos_estimados_mes=ingresos
    )
