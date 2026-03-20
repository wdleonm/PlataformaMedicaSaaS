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
from app.models.config_global import ConfiguracionGlobal
from app.services.ycloud import YCloudService
from app.services.email import EmailService

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
    # Job 3: Sincronizar tasas BCV (Específicamente en la tarde cuando el BCV actualiza)
    # Intento 1: 17:35 (5:35pm)
    scheduler.add_job(
        sincronizar_tasas_bcv,
        "cron",
        hour=17,
        minute=35,
        id="sincronizar_bcv_tarde_1",
        replace_existing=True,
    )
    # Intento 2: 18:05 (6:05pm) por si hubo retrasos en la web del BCV
    scheduler.add_job(
        sincronizar_tasas_bcv,
        "cron",
        hour=18,
        minute=5,
        id="sincronizar_bcv_tarde_2",
        replace_existing=True,
    )
    # Intento 3: 09:00 (9:00am) para asegurar que iniciamos el día con la tasa correcta
    scheduler.add_job(
        sincronizar_tasas_bcv,
        "cron",
        hour=9,
        minute=0,
        id="sincronizar_bcv_mañana",
        replace_existing=True,
    )
    scheduler.start()
    logger.info("Worker: iniciado (mensajes 2min, recordatorios 1h, sync_bcv cron 9am/5:35pm/6:05pm)")


async def sincronizar_tasas_bcv() -> None:
    """
    Sincroniza las tasas USD y EUR desde el BCV.
    Usa el servicio centralizado para historial y limpieza.
    """
    from app.services.bcv_service import BCVService
    from app.models.config_global import ConfiguracionGlobal

    with Session(engine) as session:
        config = session.exec(select(ConfiguracionGlobal)).first()
        if not config or not config.bcv_modo_automatico:
            return

        logger.info("Worker: Iniciando sincronización de tasas BCV...")
        # Lógica centralizada en el servicio
        exito = await BCVService.sincronizar_tasas(session)
        
        if exito:
            logger.info("Worker: Tasas BCV sincronizadas exitosamente.")
        else:
            logger.warning("Worker: No se pudieron sincronizar las tasas del BCV.")


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
        # Cargar configuración global para obtener API Keys sobreescritas
        config = session.exec(select(ConfiguracionGlobal)).first()
        ycloud_key = config.ycloud_api_key if config else None
        ycloud_num = config.ycloud_whatsapp_number if config else None

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
            ok, error = False, "Método no soportado"
            
            if msg.metodo == "email":
                # Lógica para Email (Fase 9.5)
                asunto, cuerpo = EmailService.construir_correo(msg.tipo, msg.payload)
                ok, error = await EmailService.enviar_mensaje(
                    destino=msg.destino,
                    cuerpo=cuerpo,
                    asunto=asunto
                )
            else:
                # Lógica predeterminada: WhatsApp (YCloud)
                texto = YCloudService.construir_mensaje(msg.tipo, msg.payload)
                ok, error = await YCloudService.enviar_mensaje(
                    destino=msg.destino,
                    mensaje=texto,
                    api_key=ycloud_key,
                    from_number=ycloud_num,
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
            # Obtener datos del paciente y especialista
            paciente     = session.get(Paciente, cita.paciente_id)
            especialista = session.get(Especialista, cita.especialista_id)
            servicio: Optional[Servicio] = (
                session.get(Servicio, cita.servicio_id) if cita.servicio_id else None
            )

            if not paciente or not especialista:
                continue

            fecha_hora_local = cita.fecha_hora.strftime("%d/%m/%Y %H:%M")

            # 1. Encolar WhatsApp si tiene teléfono
            if paciente.telefono:
                destino_wa = paciente.telefono.lstrip("+").replace(" ", "")
                # Verificar si ya existe recordatorio de WhatsApp
                existe_wa = session.exec(
                    select(ColaMensaje).where(
                        ColaMensaje.cita_id == cita.id,
                        ColaMensaje.tipo    == "recordatorio_cita",
                        ColaMensaje.metodo  == "whatsapp",
                        ColaMensaje.estado.notin_(["cancelado"]),  # type: ignore[attr-defined]
                    )
                ).first()
                if not existe_wa:
                    recordatorio_wa = ColaMensaje(
                        especialista_id=cita.especialista_id,
                        tipo="recordatorio_cita",
                        metodo="whatsapp",
                        destino=destino_wa,
                        payload={
                            "paciente_nombre":     f"{paciente.nombre} {paciente.apellido}",
                            "especialista_nombre": f"{especialista.nombre} {especialista.apellido}",
                            "servicio_nombre":     servicio.nombre if servicio else "Consulta",
                            "fecha_hora":          fecha_hora_local,
                        },
                        cita_id=cita.id,
                        max_reintentos=3,
                    )
                    session.add(recordatorio_wa)
                    encoladas += 1

            # 2. Encolar Email si tiene correo
            if paciente.email:
                # Verificar si ya existe recordatorio de Email
                existe_em = session.exec(
                    select(ColaMensaje).where(
                        ColaMensaje.cita_id == cita.id,
                        ColaMensaje.tipo    == "recordatorio_cita",
                        ColaMensaje.metodo  == "email",
                        ColaMensaje.estado.notin_(["cancelado"]),  # type: ignore[attr-defined]
                    )
                ).first()
                if not existe_em:
                    recordatorio_em = ColaMensaje(
                        especialista_id=cita.especialista_id,
                        tipo="recordatorio_cita",
                        metodo="email",
                        destino=paciente.email,
                        payload={
                            "paciente_nombre":     f"{paciente.nombre} {paciente.apellido}",
                            "especialista_nombre": f"{especialista.nombre} {especialista.apellido}",
                            "servicio_nombre":     servicio.nombre if servicio else "Consulta",
                            "fecha_hora":          fecha_hora_local,
                            "moneda":              settings.moneda_simbolo,
                        },
                        cita_id=cita.id,
                        max_reintentos=3,
                    )
                    session.add(recordatorio_em)
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
