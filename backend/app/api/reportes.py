from datetime import date, datetime, timedelta, timezone
from typing import List, Dict, Any
from uuid import UUID
from fastapi import APIRouter, Depends
from sqlmodel import Session, select, func
from app.database import get_session
from app.api.dependencies import get_current_especialista
from app.models.especialista import Especialista
from app.models.finanzas import Cita, GastoFijo
from app.models.insumo_servicio import Servicio

router = APIRouter(prefix="/api/reportes", tags=["Reportes"])

@router.get("/rentabilidad-mensual")
def get_rentabilidad_mensual(
    session: Session = Depends(get_session),
    especialista: Especialista = Depends(get_current_especialista),
):
    """
    Reporte de rentabilidad mensual mejorado.
    Analiza ingresos, costos de insumos, merma, GASTOS FIJOS y utilidad neta real.
    """
    eid = especialista.id
    hoy = date.today()
    inicio_mes = hoy.replace(day=1)
    
    # 1. Totales del mes actual (Servicios)
    stmt_mes = select(
        func.coalesce(func.sum(Cita.monto_cobrado), 0).label("ingresos"),
        func.coalesce(func.sum(Cita.costo_insumos), 0).label("costos_insumos"),
        func.coalesce(func.sum(Cita.costo_merma), 0).label("costos_merma"),
        func.coalesce(func.sum(Cita.utilidad_neta), 0).label("utilidad_bruta_servicios")
    ).where(
        Cita.especialista_id == eid,
        Cita.estado == "completada",
        Cita.fecha_hora >= inicio_mes
    )
    res_mes = session.exec(stmt_mes).first()

    # 2. Gastos Fijos del mes
    stmt_gastos = select(func.coalesce(func.sum(GastoFijo.monto), 0)).where(
        GastoFijo.especialista_id == eid,
        GastoFijo.periodo_mes == hoy.month,
        GastoFijo.periodo_anio == hoy.year
    )
    total_gastos_fijos = session.exec(stmt_gastos).first()
    
    # 3. Desglose por servicio este mes
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

    utilidad_bruta = float(res_mes.utilidad_bruta_servicios)
    utilidad_real = utilidad_bruta - float(total_gastos_fijos)

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
            "utilidad_bruta_servicios": utilidad_bruta,
            "gastos_fijos": float(total_gastos_fijos),
            "utilidad_neta_real": utilidad_real
        },
        "servicios": breakdown
    }
