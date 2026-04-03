from datetime import date, datetime, timedelta, timezone
from typing import List, Dict, Any
from uuid import UUID
from fastapi import APIRouter, Depends
from sqlmodel import Session, select, func
from app.database import get_session
from app.api.dependencies import get_current_especialista
from app.models.especialista import Especialista
from app.models.finanzas import Cita
from app.models.insumo_servicio import Servicio

router = APIRouter(prefix="/api/reportes", tags=["Reportes"])

@router.get("/rentabilidad-mensual")
def get_rentabilidad_mensual(
    session: Session = Depends(get_session),
    especialista: Especialista = Depends(get_current_especialista),
):
    """
    Reporte de rentabilidad mensual (Fase 9.1).
    Analiza ingresos, costos de insumos, merma y utilidad neta.
    """
    eid = especialista.id
    hoy = date.today()
    inicio_mes = hoy.replace(day=1)
    
    # 1. Totales del mes actual
    stmt_mes = select(
        func.coalesce(func.sum(Cita.monto_cobrado), 0).label("ingresos"),
        func.coalesce(func.sum(Cita.costo_insumos), 0).label("costos_insumos"),
        func.coalesce(func.sum(Cita.costo_merma), 0).label("costos_merma"),
        func.coalesce(func.sum(Cita.utilidad_neta), 0).label("utilidad_neta")
    ).where(
        Cita.especialista_id == eid,
        Cita.estado == "completada",
        Cita.fecha_hora >= inicio_mes
    )
    res_mes = session.exec(stmt_mes).first()
    
    # 2. Desglose por servicio este mes
    stmt_servicios = select(
        Servicio.nombre,
        func.count(Cita.id).label("cantidad"),
        func.sum(Cita.monto_cobrado).label("ingresos"),
        func.sum(Cita.costo_insumos).label("costos_insumos"),
        func.sum(Cita.costo_merma).label("costos_merma"),
        func.sum(Cita.utilidad_neta).label("utilidad_neta")
    ).join(Cita, Servicio.id == Cita.servicio_id).where(
        Cita.especialista_id == eid,
        Cita.estado == "completada",
        Cita.fecha_hora >= inicio_mes
    ).group_by(Servicio.nombre).order_by(func.sum(Cita.utilidad_neta).desc())
    
    breakdown = []
    rows = session.exec(stmt_servicios).all()
    for row in rows:
        breakdown.append({
            "servicio": row[0],
            "cantidad": row[1],
            "ingresos": float(row[2] or 0),
            "costos_insumos": float(row[3] or 0),
            "costos_merma": float(row[4] or 0),
            "utilidad_neta": float(row[5] or 0)
        })

    return {
        "periodo": {
            "mes": hoy.strftime("%B %Y"),
            "inicio": inicio_mes,
            "fin": hoy
        },
        "totales": {
            "ingresos": float(res_mes.ingresos),
            "costos_insumos": float(res_mes.costos_insumos),
            "costos_merma": float(res_mes.costos_merma),
            "utilidad_neta": float(res_mes.utilidad_neta)
        },
        "servicios": breakdown
    }
