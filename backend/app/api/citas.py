"""
Endpoints CRUD — Citas.
Fase 3.3.

Endpoints:
  POST   /api/citas
  GET    /api/citas                      (filtros: paciente, estado, fecha_desde, fecha_hasta)
  GET    /api/pacientes/{id}/citas       (citas de un paciente)
  GET    /api/citas/{id}
  PATCH  /api/citas/{id}                 (incluyendo completar con monto_cobrado)
  DELETE /api/citas/{id}                 (cancelación lógica: estado=cancelada)
"""
from datetime import datetime
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, select

from app.api.dependencies import get_current_especialista
from app.database import get_session
from app.models.especialista import Especialista
from app.models.finanzas import Cita
from app.models.insumo_servicio import Insumo, Servicio, ServicioInsumo
from app.models.paciente import Paciente
from app.schemas.citas import CitaCreate, CitaList, CitaRead, CitaUpdate

router = APIRouter(tags=["citas"])


@router.post("/api/citas", response_model=CitaRead, status_code=status.HTTP_201_CREATED)
def create_cita(
    data:        CitaCreate,
    session:     Session        = Depends(get_session),
    especialista: Especialista  = Depends(get_current_especialista),
) -> Cita:
    _verificar_paciente(session, data.paciente_id, especialista.id)
    if data.servicio_id:
        _verificar_servicio(session, data.servicio_id, especialista.id)

    cita = Cita(
        especialista_id=especialista.id,
        paciente_id=data.paciente_id,
        servicio_id=data.servicio_id,
        fecha_hora=data.fecha_hora,
        duracion_min=data.duracion_min,
        notas=data.notas,
    )
    session.add(cita)
    session.commit()
    session.refresh(cita)
    return cita


@router.get("/api/citas", response_model=CitaList)
def list_citas(
    paciente_id:  Optional[UUID]     = Query(default=None),
    estado:       Optional[str]      = Query(default=None),
    fecha_desde:  Optional[datetime] = Query(default=None),
    fecha_hasta:  Optional[datetime] = Query(default=None),
    skip:         int                = Query(default=0, ge=0),
    limit:        int                = Query(default=50, ge=1, le=200),
    session:      Session            = Depends(get_session),
    especialista: Especialista       = Depends(get_current_especialista),
) -> CitaList:
    stmt = select(Cita).where(Cita.especialista_id == especialista.id)
    if paciente_id:
        stmt = stmt.where(Cita.paciente_id == paciente_id)
    if estado:
        stmt = stmt.where(Cita.estado == estado)
    if fecha_desde:
        stmt = stmt.where(Cita.fecha_hora >= fecha_desde)
    if fecha_hasta:
        stmt = stmt.where(Cita.fecha_hora <= fecha_hasta)
    stmt = stmt.order_by(Cita.fecha_hora)  # type: ignore[attr-defined]

    rows  = session.exec(stmt).all()
    total = len(rows)
    items = list(rows[skip: skip + limit])
    return CitaList(total=total, items=items)


@router.get("/api/pacientes/{paciente_id}/citas", response_model=List[CitaRead])
def list_citas_paciente(
    paciente_id:  UUID,
    session:      Session        = Depends(get_session),
    especialista: Especialista   = Depends(get_current_especialista),
) -> List[Cita]:
    _verificar_paciente(session, paciente_id, especialista.id)
    stmt = select(Cita).where(
        Cita.paciente_id == paciente_id,
        Cita.especialista_id == especialista.id,
    ).order_by(Cita.fecha_hora.desc())  # type: ignore[attr-defined]
    return list(session.exec(stmt).all())


@router.get("/api/citas/{cita_id}", response_model=CitaRead)
def get_cita(
    cita_id:     UUID,
    session:     Session        = Depends(get_session),
    especialista: Especialista  = Depends(get_current_especialista),
) -> Cita:
    return _get_or_404(session, cita_id, especialista.id)


@router.patch("/api/citas/{cita_id}", response_model=CitaRead)
def update_cita(
    cita_id:     UUID,
    data:        CitaUpdate,
    session:     Session        = Depends(get_session),
    especialista: Especialista  = Depends(get_current_especialista),
) -> Cita:
    """
    Actualiza la cita. Al usar estado='completada' con monto_cobrado se puede
    calcular la utilidad automáticamente si el servicio tiene una receta de insumos.
    """
    cita = _get_or_404(session, cita_id, especialista.id)
    update_data = data.model_dump(exclude_unset=True)

    # Si se completa la cita y hay servicio asignado, calcular costo de insumos
    if (
        update_data.get("estado") == "completada"
        and cita.servicio_id
        and "costo_insumos" not in update_data
    ):
        costo = _calcular_costo_servicio(session, cita.servicio_id)
        update_data["costo_insumos"] = costo
        monto = update_data.get("monto_cobrado", cita.monto_cobrado)
        if monto is not None:
            update_data["utilidad_neta"] = round(monto - costo, 4)

    for field, value in update_data.items():
        setattr(cita, field, value)

    cita.updated_at = datetime.utcnow()
    session.add(cita)
    session.commit()
    session.refresh(cita)
    return cita


@router.delete("/api/citas/{cita_id}", status_code=status.HTTP_204_NO_CONTENT)
def cancel_cita(
    cita_id:     UUID,
    session:     Session        = Depends(get_session),
    especialista: Especialista  = Depends(get_current_especialista),
) -> None:
    """Cancela la cita (borrado lógico: estado=cancelada)."""
    cita = _get_or_404(session, cita_id, especialista.id)
    cita.estado     = "cancelada"
    cita.updated_at = datetime.utcnow()
    session.add(cita)
    session.commit()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_or_404(session: Session, cita_id: UUID, especialista_id: UUID) -> Cita:
    cita = session.exec(
        select(Cita).where(Cita.id == cita_id, Cita.especialista_id == especialista_id)
    ).first()
    if not cita:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cita no encontrada")
    return cita


def _verificar_paciente(session: Session, paciente_id: UUID, especialista_id: UUID) -> None:
    if not session.exec(
        select(Paciente).where(
            Paciente.id == paciente_id,
            Paciente.especialista_id == especialista_id,
        )
    ).first():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Paciente no encontrado")


def _verificar_servicio(session: Session, servicio_id: UUID, especialista_id: UUID) -> None:
    if not session.exec(
        select(Servicio).where(
            Servicio.id == servicio_id,
            Servicio.especialista_id == especialista_id,
        )
    ).first():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Servicio no encontrado")


def _calcular_costo_servicio(session: Session, servicio_id: UUID) -> float:
    """Calcula el costo total de insumos de un servicio según su receta."""
    items = session.exec(
        select(ServicioInsumo).where(ServicioInsumo.servicio_id == servicio_id)
    ).all()
    total = 0.0
    for si in items:
        insumo = session.get(Insumo, si.insumo_id)
        if insumo:
            total += si.cantidad_utilizada * insumo.costo_unitario
    return round(total, 4)
