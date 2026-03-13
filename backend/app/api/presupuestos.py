"""
Endpoints — Presupuestos, Detalles y Abonos.
Fase 3.4 — Regla de Oro 3.3: saldo_pendiente actualizado por trigger en la BD.

Presupuestos:
  POST   /api/presupuestos                      (crea con detalles opcionales)
  GET    /api/presupuestos
  GET    /api/pacientes/{id}/presupuestos
  GET    /api/presupuestos/{id}
  PATCH  /api/presupuestos/{id}
  DELETE /api/presupuestos/{id}                 (borrado lógico: estado=cancelado)

Detalles:
  POST   /api/presupuestos/{id}/detalles
  PATCH  /api/presupuestos/{id}/detalles/{det_id}
  DELETE /api/presupuestos/{id}/detalles/{det_id}

Abonos:
  POST   /api/abonos                            (dispara trigger → actualiza saldo)
  GET    /api/presupuestos/{id}/abonos
  GET    /api/abonos/{id}
  DELETE /api/abonos/{id}                       (elimina; trigger revierte saldo)
"""
from datetime import date, datetime
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, select

from app.api.dependencies import get_current_especialista
from app.database import get_session
from app.models.especialista import Especialista
from app.models.finanzas import Abono, Cita, Presupuesto, PresupuestoDetalle
from app.models.paciente import Paciente
from app.schemas.presupuestos import (
    AbonoCreate, AbonoList, AbonoRead,
    PresupuestoCreate, PresupuestoDetalleCreate, PresupuestoDetalleRead,
    PresupuestoDetalleUpdate, PresupuestoList, PresupuestoRead, PresupuestoUpdate,
)

router = APIRouter(tags=["presupuestos"])


# =============================================================================
# PRESUPUESTOS
# =============================================================================

@router.post("/api/presupuestos", response_model=PresupuestoRead, status_code=status.HTTP_201_CREATED)
def create_presupuesto(
    data:        PresupuestoCreate,
    session:     Session        = Depends(get_session),
    especialista: Especialista  = Depends(get_current_especialista),
) -> PresupuestoRead:
    _verificar_paciente(session, data.paciente_id, especialista.id)

    presupuesto = Presupuesto(
        especialista_id=especialista.id,
        paciente_id=data.paciente_id,
        fecha=data.fecha or date.today(),
        validez_fecha=data.validez_fecha,
        notas=data.notas,
    )
    session.add(presupuesto)
    session.flush()   # Obtener el id antes de insertar detalles

    for det in data.detalles:
        detalle = PresupuestoDetalle(
            presupuesto_id=presupuesto.id,
            servicio_id=det.servicio_id,
            descripcion=det.descripcion,
            cantidad=det.cantidad,
            precio_unitario=det.precio_unitario,
        )
        session.add(detalle)

    session.commit()
    session.refresh(presupuesto)
    return _presupuesto_to_read(session, presupuesto)


@router.get("/api/presupuestos", response_model=PresupuestoList)
def list_presupuestos(
    paciente_id:   Optional[UUID] = Query(default=None),
    estado:        Optional[str]  = Query(default=None),
    skip:          int            = Query(default=0, ge=0),
    limit:         int            = Query(default=50, ge=1, le=200),
    session:       Session        = Depends(get_session),
    especialista:  Especialista   = Depends(get_current_especialista),
) -> PresupuestoList:
    stmt = select(Presupuesto).where(
        Presupuesto.especialista_id == especialista.id
    )
    if paciente_id:
        stmt = stmt.where(Presupuesto.paciente_id == paciente_id)
    if estado:
        stmt = stmt.where(Presupuesto.estado == estado)
    stmt = stmt.order_by(Presupuesto.fecha.desc())  # type: ignore[attr-defined]

    rows  = session.exec(stmt).all()
    total = len(rows)
    items = [_presupuesto_to_read(session, p) for p in rows[skip: skip + limit]]
    return PresupuestoList(total_registros=total, items=items)


@router.get("/api/pacientes/{paciente_id}/presupuestos", response_model=List[PresupuestoRead])
def list_presupuestos_paciente(
    paciente_id:  UUID,
    session:      Session        = Depends(get_session),
    especialista: Especialista   = Depends(get_current_especialista),
) -> List[PresupuestoRead]:
    _verificar_paciente(session, paciente_id, especialista.id)
    stmt = select(Presupuesto).where(
        Presupuesto.paciente_id == paciente_id,
        Presupuesto.especialista_id == especialista.id,
    ).order_by(Presupuesto.fecha.desc())  # type: ignore[attr-defined]
    return [_presupuesto_to_read(session, p) for p in session.exec(stmt).all()]


@router.get("/api/presupuestos/{presupuesto_id}", response_model=PresupuestoRead)
def get_presupuesto(
    presupuesto_id: UUID,
    session:        Session        = Depends(get_session),
    especialista:   Especialista   = Depends(get_current_especialista),
) -> PresupuestoRead:
    return _presupuesto_to_read(session, _get_presupuesto_or_404(session, presupuesto_id, especialista.id))


@router.patch("/api/presupuestos/{presupuesto_id}", response_model=PresupuestoRead)
def update_presupuesto(
    presupuesto_id: UUID,
    data:           PresupuestoUpdate,
    session:        Session        = Depends(get_session),
    especialista:   Especialista   = Depends(get_current_especialista),
) -> PresupuestoRead:
    presupuesto = _get_presupuesto_or_404(session, presupuesto_id, especialista.id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(presupuesto, field, value)
    presupuesto.updated_at = datetime.utcnow()
    session.add(presupuesto)
    session.commit()
    session.refresh(presupuesto)
    return _presupuesto_to_read(session, presupuesto)


@router.delete("/api/presupuestos/{presupuesto_id}", status_code=status.HTTP_204_NO_CONTENT)
def cancel_presupuesto(
    presupuesto_id: UUID,
    session:        Session        = Depends(get_session),
    especialista:   Especialista   = Depends(get_current_especialista),
) -> None:
    presupuesto = _get_presupuesto_or_404(session, presupuesto_id, especialista.id)
    presupuesto.estado     = "cancelado"
    presupuesto.updated_at = datetime.utcnow()
    session.add(presupuesto)
    session.commit()


# =============================================================================
# DETALLES DE PRESUPUESTO
# =============================================================================

@router.post(
    "/api/presupuestos/{presupuesto_id}/detalles",
    response_model=PresupuestoDetalleRead,
    status_code=status.HTTP_201_CREATED,
    summary="Agregar una línea al presupuesto",
)
def add_detalle(
    presupuesto_id: UUID,
    data:           PresupuestoDetalleCreate,
    session:        Session        = Depends(get_session),
    especialista:   Especialista   = Depends(get_current_especialista),
) -> PresupuestoDetalle:
    presupuesto = _get_presupuesto_or_404(session, presupuesto_id, especialista.id)
    detalle = PresupuestoDetalle(
        presupuesto_id=presupuesto.id,
        servicio_id=data.servicio_id,
        descripcion=data.descripcion,
        cantidad=data.cantidad,
        precio_unitario=data.precio_unitario,
    )
    session.add(detalle)
    session.commit()
    session.refresh(detalle)
    # Devolver subtotal calculado manualmente (columna GENERATED en la BD)
    return _detalle_to_read(detalle)


@router.patch(
    "/api/presupuestos/{presupuesto_id}/detalles/{detalle_id}",
    response_model=PresupuestoDetalleRead,
    summary="Actualizar una línea del presupuesto",
)
def update_detalle(
    presupuesto_id: UUID,
    detalle_id:     UUID,
    data:           PresupuestoDetalleUpdate,
    session:        Session        = Depends(get_session),
    especialista:   Especialista   = Depends(get_current_especialista),
) -> PresupuestoDetalle:
    _get_presupuesto_or_404(session, presupuesto_id, especialista.id)
    detalle = _get_detalle_or_404(session, detalle_id, presupuesto_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(detalle, field, value)
    session.add(detalle)
    session.commit()
    session.refresh(detalle)
    return _detalle_to_read(detalle)


@router.delete(
    "/api/presupuestos/{presupuesto_id}/detalles/{detalle_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar una línea del presupuesto",
)
def delete_detalle(
    presupuesto_id: UUID,
    detalle_id:     UUID,
    session:        Session        = Depends(get_session),
    especialista:   Especialista   = Depends(get_current_especialista),
) -> None:
    _get_presupuesto_or_404(session, presupuesto_id, especialista.id)
    detalle = _get_detalle_or_404(session, detalle_id, presupuesto_id)
    session.delete(detalle)
    session.commit()


# =============================================================================
# ABONOS  (Regla de Oro 3.3)
# =============================================================================

@router.post(
    "/api/abonos",
    response_model=AbonoRead,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar un abono — actualiza saldo_pendiente automáticamente (trigger)",
)
def create_abono(
    data:        AbonoCreate,
    session:     Session        = Depends(get_session),
    especialista: Especialista  = Depends(get_current_especialista),
) -> Abono:
    """
    Inserta un abono.

    **Regla de Oro 3.3:** El trigger `abonos_recalcular_saldo` en la BD
    actualiza automáticamente `presupuestos.saldo_pendiente` y el `estado`
    (en_pago / pagado).
    La cola de mensajes para notificación WhatsApp se preparará en Fase 4.
    """
    presupuesto = _get_presupuesto_or_404(session, data.presupuesto_id, especialista.id)

    if presupuesto.estado == "cancelado":
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="No se puede abonar a un presupuesto cancelado",
        )

    # Validar que el abono no supere el saldo pendiente
    if data.monto > presupuesto.saldo_pendiente + 0.001:   # tolerancia de redondeo
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"El monto ({data.monto}) supera el saldo pendiente ({presupuesto.saldo_pendiente})",
        )

    abono = Abono(
        especialista_id=especialista.id,
        presupuesto_id=data.presupuesto_id,
        monto=data.monto,
        fecha_abono=data.fecha_abono or date.today(),
        metodo_pago=data.metodo_pago,
        notas=data.notas,
    )
    session.add(abono)
    session.commit()
    session.refresh(abono)

    # ─── Fase 4: Encolar notificación WhatsApp (Regla de Oro 3.3 + 3.4) ───
    try:
        from app.models.comunicaciones import ColaMensaje
        from app.models.paciente import Paciente
        from app.config import settings

        # Refrescar presupuesto para obtener saldo actualizado (triggerado por la BD)
        session.refresh(presupuesto)

        paciente = session.get(Paciente, presupuesto.paciente_id)
        if paciente and paciente.telefono:
            destino = paciente.telefono.lstrip("+").replace(" ", "")
            notif = ColaMensaje(
                especialista_id=especialista.id,
                tipo="abono_confirmacion",
                destino=destino,
                payload={
                    "paciente_nombre":  f"{paciente.nombre} {paciente.apellido}",
                    "moneda":           settings.moneda_simbolo,
                    "monto":            f"{abono.monto:,.2f}",
                    "saldo_pendiente":  f"{presupuesto.saldo_pendiente:,.2f}",
                    "fecha":            str(abono.fecha_abono),
                    "recibo_url":       f"{settings.app_url}/recibo/{abono.id}",
                },
                abono_id=abono.id,
                max_reintentos=3,
            )
            session.add(notif)
            session.commit()
    except Exception as exc:
        # El abono ya fue guardado; el fallo de encolado no debe revertirlo
        import logging
        logging.getLogger(__name__).warning(
            "No se pudo encolar notificación de abono %s: %s", abono.id, exc
        )

    return abono



@router.get("/api/presupuestos/{presupuesto_id}/abonos", response_model=AbonoList)
def list_abonos(
    presupuesto_id: UUID,
    session:        Session        = Depends(get_session),
    especialista:   Especialista   = Depends(get_current_especialista),
) -> AbonoList:
    _get_presupuesto_or_404(session, presupuesto_id, especialista.id)
    stmt = select(Abono).where(
        Abono.presupuesto_id == presupuesto_id,
        Abono.especialista_id == especialista.id,
    ).order_by(Abono.fecha_abono.desc())  # type: ignore[attr-defined]
    items = list(session.exec(stmt).all())
    total_abonado = sum(a.monto for a in items)
    return AbonoList(total=total_abonado, items=items)


@router.get("/api/abonos/{abono_id}", response_model=AbonoRead)
def get_abono(
    abono_id:    UUID,
    session:     Session        = Depends(get_session),
    especialista: Especialista  = Depends(get_current_especialista),
) -> Abono:
    return _get_abono_or_404(session, abono_id, especialista.id)


@router.delete(
    "/api/abonos/{abono_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar un abono — el trigger revierte el saldo_pendiente",
)
def delete_abono(
    abono_id:    UUID,
    session:     Session        = Depends(get_session),
    especialista: Especialista  = Depends(get_current_especialista),
) -> None:
    abono = _get_abono_or_404(session, abono_id, especialista.id)
    session.delete(abono)
    session.commit()


# =============================================================================
# Helpers
# =============================================================================

def _get_presupuesto_or_404(session: Session, presupuesto_id: UUID, especialista_id: UUID) -> Presupuesto:
    p = session.exec(
        select(Presupuesto).where(
            Presupuesto.id == presupuesto_id,
            Presupuesto.especialista_id == especialista_id,
        )
    ).first()
    if not p:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Presupuesto no encontrado")
    return p


def _get_detalle_or_404(session: Session, detalle_id: UUID, presupuesto_id: UUID) -> PresupuestoDetalle:
    d = session.exec(
        select(PresupuestoDetalle).where(
            PresupuestoDetalle.id == detalle_id,
            PresupuestoDetalle.presupuesto_id == presupuesto_id,
        )
    ).first()
    if not d:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Detalle no encontrado")
    return d


def _get_abono_or_404(session: Session, abono_id: UUID, especialista_id: UUID) -> Abono:
    a = session.exec(
        select(Abono).where(Abono.id == abono_id, Abono.especialista_id == especialista_id)
    ).first()
    if not a:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Abono no encontrado")
    return a


def _verificar_paciente(session: Session, paciente_id: UUID, especialista_id: UUID) -> None:
    if not session.exec(
        select(Paciente).where(
            Paciente.id == paciente_id,
            Paciente.especialista_id == especialista_id,
        )
    ).first():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Paciente no encontrado")


def _presupuesto_to_read(session: Session, p: Presupuesto) -> PresupuestoRead:
    detalles = session.exec(
        select(PresupuestoDetalle).where(PresupuestoDetalle.presupuesto_id == p.id)
    ).all()
    return PresupuestoRead(
        id=p.id,
        especialista_id=p.especialista_id,
        paciente_id=p.paciente_id,
        fecha=p.fecha,
        total=p.total,
        saldo_pendiente=p.saldo_pendiente,
        estado=p.estado,
        validez_fecha=p.validez_fecha,
        notas=p.notas,
        detalles=[_detalle_to_read(d) for d in detalles],
        created_at=p.created_at,
        updated_at=p.updated_at,
    )


def _detalle_to_read(d: PresupuestoDetalle) -> PresupuestoDetalleRead:
    return PresupuestoDetalleRead(
        id=d.id,
        presupuesto_id=d.presupuesto_id,
        servicio_id=d.servicio_id,
        descripcion=d.descripcion,
        cantidad=d.cantidad,
        precio_unitario=d.precio_unitario,
        subtotal=round(d.cantidad * d.precio_unitario, 2),
    )
