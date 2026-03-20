from datetime import date, datetime, timedelta
from fastapi import APIRouter, Depends
from sqlmodel import Session, select, func
from app.database import get_session
from app.api.dependencies import get_current_especialista
from app.models.especialista import Especialista
from app.models.paciente import Paciente
from app.models.finanzas import Cita, Presupuesto, Abono
from app.models.insumo_servicio import Insumo
from app.models.historia_clinica import HistoriaClinica

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/stats")
def get_dashboard_stats(
    session: Session = Depends(get_session),
    especialista: Especialista = Depends(get_current_especialista),
):
    """
    Estadísticas completas y reales para el dashboard del especialista.
    """
    eid = especialista.id
    hoy = date.today()
    inicio_semana = hoy - timedelta(days=hoy.weekday())  # lunes
    inicio_mes = hoy.replace(day=1)

    # ── 1. Pacientes ──────────────────────────────────────────────────────────
    pacientes_activos = session.exec(
        select(func.count(Paciente.id))
        .where(Paciente.especialista_id == eid)
        .where(Paciente.activo == True)
    ).first() or 0

    pacientes_mes = session.exec(
        select(func.count(Paciente.id))
        .where(Paciente.especialista_id == eid)
        .where(Paciente.created_at >= inicio_mes)
    ).first() or 0

    # ── 2. Citas ──────────────────────────────────────────────────────────────
    citas_hoy = session.exec(
        select(func.count(Cita.id))
        .where(Cita.especialista_id == eid)
        .where(func.date(Cita.fecha_hora) == hoy)
        .where(Cita.estado != "cancelada")
    ).first() or 0

    citas_semana = session.exec(
        select(func.count(Cita.id))
        .where(Cita.especialista_id == eid)
        .where(Cita.fecha_hora >= inicio_semana)
        .where(Cita.estado != "cancelada")
    ).first() or 0

    citas_completadas_hoy = session.exec(
        select(func.count(Cita.id))
        .where(Cita.especialista_id == eid)
        .where(func.date(Cita.fecha_hora) == hoy)
        .where(Cita.estado == "completada")
    ).first() or 0

    # ── 3. Finanzas del mes ───────────────────────────────────────────────────
    # Ingresos: Suma de monto_cobrado de citas completadas este mes
    ingresos_mes = session.exec(
        select(func.coalesce(func.sum(Cita.monto_cobrado), 0))
        .where(Cita.especialista_id == eid)
        .where(Cita.fecha_hora >= inicio_mes)
        .where(Cita.estado == "completada")
    ).first() or 0.0

    # Costos: Suma de costo_insumos de citas completadas este mes
    costos_mes = session.exec(
        select(func.coalesce(func.sum(Cita.costo_insumos), 0))
        .where(Cita.especialista_id == eid)
        .where(Cita.fecha_hora >= inicio_mes)
        .where(Cita.estado == "completada")
    ).first() or 0.0

    # Utilidad Neta: Suma de utilidad_neta de citas completadas este mes
    utilidad_mes = session.exec(
        select(func.coalesce(func.sum(Cita.utilidad_neta), 0))
        .where(Cita.especialista_id == eid)
        .where(Cita.fecha_hora >= inicio_mes)
        .where(Cita.estado == "completada")
    ).first() or 0.0

    saldo_pendiente_total = session.exec(
        select(func.coalesce(func.sum(Presupuesto.saldo_pendiente), 0))
        .where(Presupuesto.especialista_id == eid)
        .where(Presupuesto.saldo_pendiente > 0)
    ).first() or 0.0

    # ── 4. Insumos críticos ───────────────────────────────────────────────────
    insumos_criticos = session.exec(
        select(func.count(Insumo.id))
        .where(Insumo.especialista_id == eid)
        .where(Insumo.stock_actual <= Insumo.stock_minimo)
        .where(Insumo.activo == True)
    ).first() or 0

    # ── 5. Próximas citas (hoy, ordenadas por hora) ───────────────────────────
    proximas_citas_rows = session.exec(
        select(Cita, Paciente)
        .join(Paciente, Cita.paciente_id == Paciente.id)
        .where(Cita.especialista_id == eid)
        .where(func.date(Cita.fecha_hora) == hoy)
        .where(Cita.estado.in_(["programada", "confirmada", "en_curso"]))
        .order_by(Cita.fecha_hora)
        .limit(5)
    ).all()

    proximas_citas = [
        {
            "id": str(cita.id),
            "paciente_nombre": f"{pac.nombre} {pac.apellido}",
            "hora": cita.fecha_hora.strftime("%H:%M"),
            "estado": cita.estado,
            "duracion_min": cita.duracion_min,
            "notas": cita.notas,
        }
        for cita, pac in proximas_citas_rows
    ]

    # ── 6. Últimos pacientes registrados ─────────────────────────────────────
    ultimos_pacientes_rows = session.exec(
        select(Paciente)
        .where(Paciente.especialista_id == eid)
        .where(Paciente.activo == True)
        .order_by(Paciente.created_at.desc())
        .limit(5)
    ).all()

    ultimos_pacientes = [
        {
            "id": str(p.id),
            "nombre": f"{p.nombre} {p.apellido}",
            "documento": p.documento,
            "created_at": p.created_at.strftime("%d/%m/%Y"),
        }
        for p in ultimos_pacientes_rows
    ]

    # ── 7. Historias clínicas recientes ───────────────────────────────────────
    historias_count = session.exec(
        select(func.count(HistoriaClinica.id))
        .where(HistoriaClinica.especialista_id == eid)
        .where(HistoriaClinica.activo == True)
    ).first() or 0

    # ── 8. Tendencias (Mes Anterior) ──────────────────────────────────────────
    # inicio_mes_anterior = (inicio_mes - timedelta(days=1)).replace(day=1)
    # fin_mes_anterior = inicio_mes - timedelta(days=1)

    # pacientes_mes_anterior = session.exec(
    #     select(func.count(Paciente.id))
    #     .where(Paciente.especialista_id == eid)
    #     .where(func.date(Paciente.created_at) >= inicio_mes_anterior)
    #     .where(func.date(Paciente.created_at) <= fin_mes_anterior)
    # ).first() or 0

    # utilidad_mes_anterior = session.exec(
    #     select(func.coalesce(func.sum(Cita.utilidad_neta), 0))
    #     .where(Cita.especialista_id == eid)
    #     .where(func.date(Cita.fecha_hora) >= inicio_mes_anterior)
    #     .where(func.date(Cita.fecha_hora) <= fin_mes_anterior)
    #     .where(Cita.estado == "completada")
    # ).first() or 0.0

    # citas_mes_anterior = session.exec(
    #     select(func.count(Cita.id))
    #     .where(Cita.especialista_id == eid)
    #     .where(func.date(Cita.fecha_hora) >= inicio_mes_anterior)
    #     .where(func.date(Cita.fecha_hora) <= fin_mes_anterior)
    #     .where(Cita.estado != "cancelada")
    # ).first() or 0

    def get_pct_change(current, previous):
        if previous == 0:
            return 100 if current > 0 else 0
        return round(((current - previous) / previous) * 100, 1)

    return {
        # KPIs principales
        "pacientes_activos": pacientes_activos,
        "pacientes_nuevos_mes": pacientes_mes,
        "pacientes_tendencia": 0, # get_pct_change(pacientes_mes, pacientes_mes_anterior),
        "citas_hoy": citas_hoy,
        "citas_completadas_hoy": citas_completadas_hoy,
        "citas_semana": citas_semana,
        "citas_tendencia": 0, # get_pct_change(citas_semana, citas_mes_anterior / 4), # Aprox semanal
        "insumos_criticos": insumos_criticos,
        "ingresos_mes": float(ingresos_mes),
        "costos_mes": float(costos_mes),
        "utilidad_mes": float(utilidad_mes),
        "utilidad_tendencia": 0, # get_pct_change(utilidad_mes, utilidad_mes_anterior),
        "saldo_pendiente_total": float(saldo_pendiente_total),
        "historias_totales": historias_count,
        # Listas
        "proximas_citas": proximas_citas,
        "ultimos_pacientes": ultimos_pacientes,
    }


@router.get("/config")
def get_financial_config(
    session: Session = Depends(get_session),
    especialista: Especialista = Depends(get_current_especialista),
):
    """
    Retorna la configuración financiera global (tasas, moneda) para uso del especialista.
    """
    from app.models.config_global import ConfiguracionGlobal
    config = session.exec(select(ConfiguracionGlobal)).first()
    if not config:
        return {
            "moneda_principal": "USD",
            "moneda_simbolo": "$",
            "tasa_usd": 1.0,
            "tasa_eur": 1.0,
        }
    
    # Alerta de desincronización (si han pasado más de 24 horas)
    retrasada = False
    if config.bcv_ultima_sincronizacion:
        retrasada = (datetime.utcnow() - config.bcv_ultima_sincronizacion) > timedelta(hours=24)
    
    return {
        "moneda_principal": config.moneda_principal,
        "moneda_simbolo": config.moneda_simbolo,
        "tasa_usd": config.tasa_usd,
        "tasa_eur": config.tasa_eur,
        "ultima_sincronizacion": config.bcv_ultima_sincronizacion,
        "sincronizacion_retrasada": retrasada
    }
