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


def _sync_paciente_alerts(session: Session, paciente: Paciente, antecedentes_personales: dict):
    """
    Sincroniza los antecedentes personales de la historia clínica con el perfil global del paciente.
    """
    if not antecedentes_personales:
        return

    # Extraer información relevante
    especifique = antecedentes_personales.get("especifique", "")
    medicamentos = antecedentes_personales.get("medicamentos", "")
    patologias_seleccionadas = antecedentes_personales.get("patologias", [])

    # --- 1. Sincronizar Alergias ---
    # Si marcó el botón "Alergias" o lo escribió en el texto
    has_alergia_btn = "Alergias" in patologias_seleccionadas
    has_alergia_txt = "alergi" in especifique.lower()
    
    if has_alergia_btn or has_alergia_txt:
        # Si ya había algo, lo mantenemos y añadimos lo nuevo si no está
        current_alergias = paciente.alergias or ""
        if especifique and has_alergia_txt and especifique not in current_alergias:
            paciente.alergias = f"{current_alergias}, {especifique}".strip(", ") if current_alergias else especifique
        elif has_alergia_btn and not current_alergias:
            paciente.alergias = "Alergias (ver antecedentes)"

    # --- 2. Sincronizar Patologías Crónicas ---
    # Combinar patologías seleccionadas (excluyendo Alergias que ya procesamos) con el campo de texto
    pat_btns = [p for p in patologias_seleccionadas if p != "Alergias"]
    pat_str_btns = ", ".join(pat_btns)
    
    # Si especifique NO es sobre alergias, va a patologías
    pat_txt = especifique if not has_alergia_txt else ""
    
    # Unir todo
    parts = []
    if pat_str_btns: parts.append(pat_str_btns)
    if pat_txt: parts.append(pat_txt)
    
    nueva_patologia = " | ".join(parts)
    if nueva_patologia:
        paciente.patologias_cronicas = nueva_patologia

    # --- 3. Sincronizar Medicación ---
    if medicamentos:
        paciente.medicacion_frecuente = medicamentos
    
    from datetime import datetime
    paciente.updated_at = datetime.now(timezone.utc)
    
    session.add(paciente)



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

    # Validar especialidad_id o asignar la primera del especialista
    especialidad_id = data.especialidad_id
    if not especialidad_id:
        if not especialista.especialidades:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El especialista no tiene ninguna especialidad asignada",
            )
        especialidad_id = especialista.especialidades[0].id
    else:
        # Validar que el especialista tenga asignada esa especialidad
        if especialidad_id not in [esp.id for esp in especialista.especialidades]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="El especialista no tiene asignada esta especialidad",
            )

    historia = HistoriaClinica(
        especialista_id=especialista.id,
        especialidad_id=especialidad_id,
        paciente_id=data.paciente_id,
        fecha_apertura=data.fecha_apertura or date.today(),
        motivo_consulta=data.motivo_consulta,
        enfermedad_actual=data.enfermedad_actual,
        antecedentes_familiares=data.antecedentes_familiares,
        antecedentes_personales=data.antecedentes_personales,
        examen_clinico=data.examen_clinico,
        estudios_complementarios=data.estudios_complementarios,
        diagnostico=data.diagnostico,
        plan_tratamiento=data.plan_tratamiento,
        notas=data.notas,
    )
    session.add(historia)
    
    # Sincronizar alertas al paciente
    _sync_paciente_alerts(session, paciente, data.antecedentes_personales)
    
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
) -> List[HistoriaClinicaRead]:
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
    items = list(session.exec(stmt).all())
    from sqlmodel import func
    from app.models.historia_clinica import HistoriaClinicaAdjunto
    
    ret = []
    for h in items:
        # Forma correcta de contar con SQLModel
        stmt_count = select(func.count()).select_from(HistoriaClinicaAdjunto).where(HistoriaClinicaAdjunto.historia_id == h.id)
        count = session.exec(stmt_count).one() or 0
        
        # Obtener los adjuntos reales
        stmt_adjuntos = select(HistoriaClinicaAdjunto).where(HistoriaClinicaAdjunto.historia_id == h.id)
        adjuntos_obj = list(session.exec(stmt_adjuntos).all())
        
        # Convertir a esquema Pydantic para añadir el contador y los objetos (SQLModel prohíbe campos extra en el modelo de tabla)
        h_read = HistoriaClinicaRead.model_validate(h)
        h_read.adjuntos_count = count
        h_read.adjuntos = adjuntos_obj
        ret.append(h_read)
        
    return ret


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
    historia.updated_at = datetime.now(timezone.utc)
    session.add(historia)
    
    # Sincronizar si se actualizaron los antecedentes personales
    if data.antecedentes_personales is not None:
        paciente = session.exec(
            select(Paciente).where(Paciente.id == historia.paciente_id)
        ).first()
        if paciente:
            _sync_paciente_alerts(session, paciente, data.antecedentes_personales)

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
    historia.updated_at = datetime.now(timezone.utc)
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
