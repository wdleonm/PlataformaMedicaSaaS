"""
Endpoints CRUD — Historias Clínicas.
Fase 2.4: Gestión de historias/episodios clínicos por paciente.

Endpoints:
  POST   /api/historias-clinicas                  → crear
  GET    /api/historias-clinicas                   → listar (del especialista)
  GET    /api/pacientes/{paciente_id}/historias    → listar por paciente
  GET    /api/historias-clinicas/{id}              → detalle
  PATCH  /api/historias-clinicas/{id}              → actualizar parcialmente
  DELETE /api/historias-clinicas/{id}              → borrado lógico
"""
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, select

from app.api.dependencies import get_current_especialista
from app.database import get_session
from app.models.especialista import Especialista
from app.models.historia_clinica import HistoriaClinica
from app.models.paciente import Paciente
from app.schemas.historias_clinicas import (
    HistoriaClinicaCreate,
    HistoriaClinicaList,
    HistoriaClinicaRead,
    HistoriaClinicaUpdate,
)

router = APIRouter(tags=["historias_clinicas"])


# ---------------------------------------------------------------------------
# Crear historia clínica
# ---------------------------------------------------------------------------

@router.post(
    "/api/historias-clinicas",
    response_model=HistoriaClinicaRead,
    status_code=status.HTTP_201_CREATED,
    summary="Crear un nuevo episodio/historia clínica",
)
def create_historia(
    data: HistoriaClinicaCreate,
    session: Session = Depends(get_session),
    especialista: Especialista = Depends(get_current_especialista),
) -> HistoriaClinica:
    # Verificar que el paciente pertenece al especialista
    paciente = session.exec(
        select(Paciente).where(
            Paciente.id == data.paciente_id,
            Paciente.especialista_id == especialista.id,
        )
    ).first()
    if not paciente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Paciente no encontrado o no pertenece al especialista",
        )

    from datetime import date
    historia = HistoriaClinica(
        especialista_id=especialista.id,
        paciente_id=data.paciente_id,
        fecha_apertura=data.fecha_apertura or date.today(),
        motivo_consulta=data.motivo_consulta,
        diagnostico=data.diagnostico,
        plan_tratamiento=data.plan_tratamiento,
        notas=data.notas,
    )
    session.add(historia)
    session.commit()
    session.refresh(historia)
    return historia


# ---------------------------------------------------------------------------
# Listar historias del especialista
# ---------------------------------------------------------------------------

@router.get(
    "/api/historias-clinicas",
    response_model=HistoriaClinicaList,
    summary="Listar todas las historias clínicas del especialista",
)
def list_historias(
    paciente_id: Optional[UUID] = Query(default=None, description="Filtrar por paciente"),
    solo_activas: bool = Query(default=True, description="Solo historias activas"),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    session: Session = Depends(get_session),
    especialista: Especialista = Depends(get_current_especialista),
) -> HistoriaClinicaList:
    stmt = select(HistoriaClinica).where(
        HistoriaClinica.especialista_id == especialista.id
    )
    if paciente_id:
        stmt = stmt.where(HistoriaClinica.paciente_id == paciente_id)
    if solo_activas:
        stmt = stmt.where(HistoriaClinica.activo == True)
    stmt = stmt.order_by(HistoriaClinica.fecha_apertura.desc())  # type: ignore[attr-defined]

    total = len(session.exec(stmt).all())
    items = list(session.exec(stmt.offset(skip).limit(limit)).all())
    return HistoriaClinicaList(total=total, items=items)


# ---------------------------------------------------------------------------
# Historias de un paciente específico
# ---------------------------------------------------------------------------

@router.get(
    "/api/pacientes/{paciente_id}/historias",
    response_model=List[HistoriaClinicaRead],
    summary="Listar historias clínicas de un paciente",
)
def list_historias_by_paciente(
    paciente_id: UUID,
    session: Session = Depends(get_session),
    especialista: Especialista = Depends(get_current_especialista),
) -> List[HistoriaClinica]:
    # Verificar que el paciente pertenece al especialista
    paciente = session.exec(
        select(Paciente).where(
            Paciente.id == paciente_id,
            Paciente.especialista_id == especialista.id,
        )
    ).first()
    if not paciente:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Paciente no encontrado")

    stmt = (
        select(HistoriaClinica)
        .where(
            HistoriaClinica.paciente_id == paciente_id,
            HistoriaClinica.especialista_id == especialista.id,
        )
        .order_by(HistoriaClinica.fecha_apertura.desc())  # type: ignore[attr-defined]
    )
    return list(session.exec(stmt).all())


# ---------------------------------------------------------------------------
# Detalle
# ---------------------------------------------------------------------------

@router.get(
    "/api/historias-clinicas/{historia_id}",
    response_model=HistoriaClinicaRead,
    summary="Obtener una historia clínica por id",
)
def get_historia(
    historia_id: UUID,
    session: Session = Depends(get_session),
    especialista: Especialista = Depends(get_current_especialista),
) -> HistoriaClinica:
    historia = _get_or_404(session, historia_id, especialista.id)
    return historia


# ---------------------------------------------------------------------------
# Actualización parcial
# ---------------------------------------------------------------------------

@router.patch(
    "/api/historias-clinicas/{historia_id}",
    response_model=HistoriaClinicaRead,
    summary="Actualizar parcialmente una historia clínica",
)
def update_historia(
    historia_id: UUID,
    data: HistoriaClinicaUpdate,
    session: Session = Depends(get_session),
    especialista: Especialista = Depends(get_current_especialista),
) -> HistoriaClinica:
    historia = _get_or_404(session, historia_id, especialista.id)

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(historia, field, value)

    from datetime import datetime
    historia.updated_at = datetime.utcnow()
    session.add(historia)
    session.commit()
    session.refresh(historia)
    return historia


# ---------------------------------------------------------------------------
# Borrado lógico
# ---------------------------------------------------------------------------

@router.delete(
    "/api/historias-clinicas/{historia_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Borrado lógico de una historia clínica",
)
def delete_historia(
    historia_id: UUID,
    session: Session = Depends(get_session),
    especialista: Especialista = Depends(get_current_especialista),
) -> None:
    historia = _get_or_404(session, historia_id, especialista.id)
    historia.activo = False
    from datetime import datetime
    historia.updated_at = datetime.utcnow()
    session.add(historia)
    session.commit()


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

def _get_or_404(session: Session, historia_id: UUID, especialista_id: UUID) -> HistoriaClinica:
    historia = session.exec(
        select(HistoriaClinica).where(
            HistoriaClinica.id == historia_id,
            HistoriaClinica.especialista_id == especialista_id,
        )
    ).first()
    if not historia:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Historia clínica no encontrada",
        )
    return historia
