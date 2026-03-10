"""
Worker de mensajes — Fase 4.
Procesa la cola_mensajes: envía por YCloud, aplica backoff exponencial y actualiza estados.
Además, encola recordatorios de cita para las próximas 24 horas (Fase 4.4).

Implementado con APScheduler (in-process scheduler) para no requerir Celery/Redis en esta fase.
En producción se puede migrar a Celery Beat sin cambiar la lógica de negocio.

Arranque: se registra en el lifespan de FastAPI (main.py).
"""
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlmodel import Session, select

from app.database import engine
from app.models.comunicaciones import ColaMensaje
from app.models.finanzas import Cita
from app.models.insumo_servicio import Servicio
from app.models.paciente import Paciente
from app.models.especialista import Especialista
from app.services.ycloud import YCloudService

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Scheduler global (singleton)
# ---------------------------------------------------------------------------
scheduler = AsyncIOScheduler(timezone="UTC")


def start_scheduler() -> None:
    """Iniciar el scheduler con los jobs registrados."""
    # Job 1: Procesar cola de mensajes pendientes cada 2 minutos
    scheduler.add_job(
        procesar_cola,
        "interval",
        minutes=2,
        id="procesar_cola_mensajes",
        replace_existing=True,
    )
    # Job 2: Encolar recordatorios de cita cada hora
    scheduler.add_job(
        encolar_recordatorios_cita,
        "interval",
        hours=1,
        id="recordatorios_citas",
        replace_existing=True,
    )
    scheduler.start()
    logger.info("Worker de mensajes iniciado (procesar_cola cada 2 min, recordatorios cada 1 h)")


def stop_scheduler() -> None:
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("Worker de mensajes detenido")


# ---------------------------------------------------------------------------
# Job 1: Procesar cola de mensajes
# ---------------------------------------------------------------------------

async def procesar_cola() -> None:
    """
    Toma hasta 50 mensajes pendientes cuyo proximo_intento <= ahora,
    los envía por YCloud y actualiza su estado.

    Backoff exponencial al fallar: próximo intento = ahora + 2^reintentos minutos
    (1 min → 2 min → 4 min → 8 min… hasta max_reintentos).
    """
    ahora = datetime.now(timezone.utc)

    with Session(engine) as session:
        stmt = (
            select(ColaMensaje)
            .where(
                ColaMensaje.estado.in_(["pendiente", "fallido"]),  # type: ignore[attr-defined]
                ColaMensaje.reintentos < ColaMensaje.max_reintentos,
                ColaMensaje.proximo_intento <= ahora,
            )
            .limit(50)
        )
        mensajes = session.exec(stmt).all()

        if not mensajes:
            return

        logger.info("Worker: procesando %d mensajes de la cola", len(mensajes))

        for msg in mensajes:
            texto = YCloudService.construir_mensaje(msg.tipo, msg.payload)
            ok, error = await YCloudService.enviar_mensaje(
                destino=msg.destino,
                mensaje=texto,
            )

            if ok:
                msg.estado     = "enviado"
                msg.enviado_at = datetime.now(timezone.utc)
                msg.ultimo_error = None
                logger.info("Worker: mensaje %s enviado OK a %s", msg.id, msg.destino)
            else:
                msg.reintentos  += 1
                msg.ultimo_error = error
                if msg.reintentos >= msg.max_reintentos:
                    msg.estado = "fallido"
                    logger.warning(
                        "Worker: mensaje %s marcado como FALLIDO tras %d intentos. Error: %s",
                        msg.id, msg.reintentos, error,
                    )
                else:
                    # Backoff exponencial: 2^reintentos minutos
                    delay_min = 2 ** msg.reintentos
                    msg.proximo_intento = datetime.now(timezone.utc) + timedelta(minutes=delay_min)
                    msg.estado = "fallido"   # seguirá siendo reintentado (reintentos < max)
                    logger.info(
                        "Worker: mensaje %s falló (intento %d/%d) — próximo en %d min",
                        msg.id, msg.reintentos, msg.max_reintentos, delay_min,
                    )

            session.add(msg)

        session.commit()


# ---------------------------------------------------------------------------
# Job 2: Encolar recordatorios de cita (Fase 4.4)
# ---------------------------------------------------------------------------

async def encolar_recordatorios_cita() -> None:
    """
    Busca citas en las próximas 24 horas con estado 'programada' o 'confirmada'
    que aún no tienen un recordatorio encolado, y los encola.

    Para evitar duplicados se verifica que no exista ya un mensaje tipo
    'recordatorio_cita' con el mismo cita_id y estado != 'cancelado'.
    """
    ahora   = datetime.now(timezone.utc)
    en_24h  = ahora + timedelta(hours=24)

    with Session(engine) as session:
        # Citas próximas
        stmt_citas = select(Cita).where(
            Cita.fecha_hora >= ahora,
            Cita.fecha_hora <= en_24h,
            Cita.estado.in_(["programada", "confirmada"]),  # type: ignore[attr-defined]
        )
        citas = session.exec(stmt_citas).all()

        encoladas = 0
        for cita in citas:
            # Verificar que no haya recordatorio ya encolado para esta cita
            existe = session.exec(
                select(ColaMensaje).where(
                    ColaMensaje.cita_id == cita.id,
                    ColaMensaje.tipo    == "recordatorio_cita",
                    ColaMensaje.estado.notin_(["cancelado"]),  # type: ignore[attr-defined]
                )
            ).first()
            if existe:
                continue

            # Obtener datos del paciente y especialista
            paciente     = session.get(Paciente, cita.paciente_id)
            especialista = session.get(Especialista, cita.especialista_id)
            servicio: Optional[Servicio] = (
                session.get(Servicio, cita.servicio_id) if cita.servicio_id else None
            )

            if not paciente or not especialista:
                continue

            # Solo encolar si el paciente tiene teléfono registrado
            if not paciente.telefono:
                logger.debug(
                    "Worker: cita %s sin teléfono de paciente — recordatorio omitido", cita.id
                )
                continue

            fecha_hora_local = cita.fecha_hora.strftime("%d/%m/%Y %H:%M")

            recordatorio = ColaMensaje(
                especialista_id=cita.especialista_id,
                tipo="recordatorio_cita",
                destino=paciente.telefono.lstrip("+").replace(" ", ""),
                payload={
                    "paciente_nombre":     f"{paciente.nombre} {paciente.apellido}",
                    "especialista_nombre": f"{especialista.nombre} {especialista.apellido}",
                    "servicio_nombre":     servicio.nombre if servicio else "Consulta",
                    "fecha_hora":          fecha_hora_local,
                },
                cita_id=cita.id,
                max_reintentos=3,
            )
            session.add(recordatorio)
            encoladas += 1

        if encoladas:
            session.commit()
            logger.info("Worker: %d recordatorio(s) de cita encolado(s)", encoladas)


# ---------------------------------------------------------------------------
# Función utilitaria: encolar un mensaje de forma síncrona
# (llamada desde los endpoints de abonos y presupuestos)
# ---------------------------------------------------------------------------

def encolar_mensaje_sync(session: Session, mensaje: ColaMensaje) -> ColaMensaje:
    """
    Inserta un ColaMensaje en la cola desde un contexto síncrono (endpoint FastAPI).
    El worker asincrónico lo procesará en el siguiente ciclo.
    """
    session.add(mensaje)
    # No se hace commit aquí: el llamador es responsable de hacer commit
    # para que el INSERT del mensaje sea atómico con la operación principal.
    return mensaje
