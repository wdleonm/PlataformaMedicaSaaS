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
        .where(func.date(Paciente.created_at) >= inicio_mes)
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
        .where(func.date(Cita.fecha_hora) >= inicio_semana)
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
        .where(func.date(Cita.fecha_hora) >= inicio_mes)
        .where(Cita.estado == "completada")
    ).first() or 0.0

    # Costos: Suma de costo_insumos de citas completadas este mes
    costos_mes = session.exec(
        select(func.coalesce(func.sum(Cita.costo_insumos), 0))
        .where(Cita.especialista_id == eid)
        .where(func.date(Cita.fecha_hora) >= inicio_mes)
        .where(Cita.estado == "completada")
    ).first() or 0.0

    # Utilidad Neta: Suma de utilidad_neta de citas completadas este mes
    utilidad_mes = session.exec(
        select(func.coalesce(func.sum(Cita.utilidad_neta), 0))
        .where(Cita.especialista_id == eid)
        .where(func.date(Cita.fecha_hora) >= inicio_mes)
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

    return {
        # KPIs principales
        "pacientes_activos": pacientes_activos,
        "pacientes_nuevos_mes": pacientes_mes,
        "citas_hoy": citas_hoy,
        "citas_completadas_hoy": citas_completadas_hoy,
        "citas_semana": citas_semana,
        "insumos_criticos": insumos_criticos,
        "ingresos_mes": float(ingresos_mes),
        "costos_mes": float(costos_mes),
        "utilidad_mes": float(utilidad_mes),
        "saldo_pendiente_total": float(saldo_pendiente_total),
        "historias_totales": historias_count,
        # Listas
        "proximas_citas": proximas_citas,
        "ultimos_pacientes": ultimos_pacientes,
    }
