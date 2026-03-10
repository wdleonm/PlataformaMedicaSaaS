"""
Endpoints — Cola de Mensajes y YCloud.
Fase 4.

Endpoints:
  GET    /api/mensajes                       → listar cola del especialista
  GET    /api/mensajes/{id}                  → detalle
  POST   /api/mensajes                       → encolar manualmente
  DELETE /api/mensajes/{id}                  → cancelar (estado=cancelado)
  POST   /api/mensajes/enviar-directo        → envío de prueba (solo admins / desarrollo)
  POST   /api/webhooks/ycloud                → webhook de YCloud (sin auth JWT)
  POST   /api/mensajes/procesar-ahora        → dispara el worker manualmente (desarrollo)
"""
import logging
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, Request, status
from sqlmodel import Session, select

from app.api.dependencies import get_current_especialista
from app.database import get_session
from app.models.comunicaciones import ColaMensaje, ESTADOS_MENSAJE
from app.models.especialista import Especialista
from app.schemas.comunicaciones import (
    ColaMensajeCreate,
    ColaMensajeList,
    ColaMensajeRead,
    EnviarMensajeDirectoRequest,
)
from app.services.ycloud import YCloudService, YCloudWebhook
from app.workers.mensajes_worker import procesar_cola

logger = logging.getLogger(__name__)
router = APIRouter(tags=["comunicaciones"])


# ---------------------------------------------------------------------------
# Cola de mensajes — CRUD
# ---------------------------------------------------------------------------

@router.get(
    "/api/mensajes",
    response_model=ColaMensajeList,
    summary="Listar cola de mensajes del especialista",
)
def list_mensajes(
    estado:       Optional[str]  = Query(default=None, description="Filtrar por estado"),
    tipo:         Optional[str]  = Query(default=None, description="Filtrar por tipo"),
    skip:         int            = Query(default=0, ge=0),
    limit:        int            = Query(default=50, ge=1, le=200),
    session:      Session        = Depends(get_session),
    especialista: Especialista   = Depends(get_current_especialista),
) -> ColaMensajeList:
    stmt = select(ColaMensaje).where(
        ColaMensaje.especialista_id == especialista.id
    )
    if estado:
        if estado not in ESTADOS_MENSAJE:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"estado debe ser uno de: {', '.join(ESTADOS_MENSAJE)}",
            )
        stmt = stmt.where(ColaMensaje.estado == estado)
    if tipo:
        stmt = stmt.where(ColaMensaje.tipo == tipo)

    stmt = stmt.order_by(ColaMensaje.created_at.desc())  # type: ignore[attr-defined]

    rows  = session.exec(stmt).all()
    total = len(rows)
    items = list(rows[skip: skip + limit])
    return ColaMensajeList(total=total, items=items)


@router.get("/api/mensajes/{mensaje_id}", response_model=ColaMensajeRead)
def get_mensaje(
    mensaje_id:   UUID,
    session:      Session        = Depends(get_session),
    especialista: Especialista   = Depends(get_current_especialista),
) -> ColaMensaje:
    return _get_or_404(session, mensaje_id, especialista.id)


@router.post(
    "/api/mensajes",
    response_model=ColaMensajeRead,
    status_code=status.HTTP_201_CREATED,
    summary="Encolar un mensaje manualmente",
)
def create_mensaje(
    data:         ColaMensajeCreate,
    session:      Session        = Depends(get_session),
    especialista: Especialista   = Depends(get_current_especialista),
) -> ColaMensaje:
    mensaje = ColaMensaje(
        especialista_id=especialista.id,
        tipo=data.tipo,
        destino=data.destino,
        payload=data.payload,
        max_reintentos=data.max_reintentos,
        abono_id=data.abono_id,
        cita_id=data.cita_id,
    )
    session.add(mensaje)
    session.commit()
    session.refresh(mensaje)
    return mensaje


@router.delete(
    "/api/mensajes/{mensaje_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Cancelar un mensaje pendiente",
)
def cancel_mensaje(
    mensaje_id:   UUID,
    session:      Session        = Depends(get_session),
    especialista: Especialista   = Depends(get_current_especialista),
) -> None:
    mensaje = _get_or_404(session, mensaje_id, especialista.id)
    if mensaje.estado not in ("pendiente", "fallido"):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Solo se pueden cancelar mensajes en estado pendiente o fallido (actual: {mensaje.estado})",
        )
    mensaje.estado = "cancelado"
    session.add(mensaje)
    session.commit()


# ---------------------------------------------------------------------------
# Envío directo de prueba (Fase 4.1)
# ---------------------------------------------------------------------------

@router.post(
    "/api/mensajes/enviar-directo",
    summary="Enviar un mensaje directo vía YCloud (prueba)",
)
async def enviar_directo(
    data:         EnviarMensajeDirectoRequest,
    especialista: Especialista = Depends(get_current_especialista),
) -> dict:
    """
    Envía un mensaje de texto libre por WhatsApp directamente, sin pasar por la cola.
    Útil para probar la integración con YCloud.
    """
    ok, error = await YCloudService.enviar_mensaje(
        destino=data.destino,
        mensaje=data.mensaje,
    )
    if ok:
        return {"status": "enviado", "destino": data.destino}
    raise HTTPException(
        status_code=status.HTTP_502_BAD_GATEWAY,
        detail=f"Error al enviar por YCloud: {error}",
    )


# ---------------------------------------------------------------------------
# Webhook de YCloud (sin autenticación JWT — YCloud llama este endpoint)
# ---------------------------------------------------------------------------

@router.post(
    "/api/webhooks/ycloud",
    include_in_schema=False,   # Ocultar del Swagger; es un endpoint interno
    summary="Webhook de YCloud para actualización de estados",
)
async def ycloud_webhook(
    request: Request,
    session: Session = Depends(get_session),
) -> dict:
    """
    Recibe notificaciones de estado enviadas por YCloud:
      - sent: mensaje enviado al servidor de WhatsApp
      - delivered: mensaje entregado al dispositivo
      - read: mensaje leído por el destinatario
      - failed: fallo de envío

    YCloud envía POST con Content-Type: application/json.
    """
    try:
        data = await request.json()
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Payload inválido")

    info = YCloudWebhook.procesar_status(data)
    if not info or not info.get("ycloud_message_id"):
        # No es un evento de estado — puede ser otro tipo de evento (ej. mensaje entrante)
        return {"status": "ignorado"}

    # Actualizar estado del mensaje en la cola si podemos correlacionarlo.
    # YCloud no devuelve nuestro UUID directamente en el webhook estándar;
    # en una integración completa se guardaría el ycloud_message_id al enviar.
    # Por ahora solo logueamos el evento.
    ycloud_status = info.get("status", "")
    logger.info("Webhook YCloud: id=%s status=%s", info["ycloud_message_id"], ycloud_status)

    if ycloud_status == "read":
        # Buscar por ycloud_message_id en payload (si se guardó al enviar)
        pass   # TODO: actualizar leido_at cuando se persista el ycloud_message_id

    return {"status": "ok"}


# ---------------------------------------------------------------------------
# Disparar worker manualmente (solo en desarrollo)
# ---------------------------------------------------------------------------

@router.post(
    "/api/mensajes/procesar-ahora",
    summary="Disparar el procesamiento de la cola manualmente (desarrollo)",
)
async def procesar_ahora(
    background_tasks: BackgroundTasks,
    especialista:     Especialista = Depends(get_current_especialista),
) -> dict:
    """
    Fuerza una ejecución inmediata del worker de mensajes.
    Útil durante el desarrollo para no esperar el intervalo del scheduler.
    """
    background_tasks.add_task(procesar_cola)
    return {"status": "worker iniciado en background"}


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

def _get_or_404(session: Session, mensaje_id: UUID, especialista_id: UUID) -> ColaMensaje:
    msg = session.exec(
        select(ColaMensaje).where(
            ColaMensaje.id == mensaje_id,
            ColaMensaje.especialista_id == especialista_id,
        )
    ).first()
    if not msg:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mensaje no encontrado")
    return msg
