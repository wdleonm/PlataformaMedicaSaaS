"""
Endpoints CRUD para Pacientes (Fase 2.1).
"""
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, select

from app.api.dependencies import get_current_especialista
from app.database import get_session
from app.models.paciente import Paciente
from app.models.especialista import Especialista
from app.schemas.pacientes import (
    PacienteCreate,
    PacienteUpdate,
    PacienteRead,
    PacienteList,
)

router = APIRouter(prefix="/api/pacientes", tags=["pacientes"])


@router.post("", response_model=PacienteRead, status_code=status.HTTP_201_CREATED)
def create_paciente(
    data: PacienteCreate,
    session: Session = Depends(get_session),
    especialista: Especialista = Depends(get_current_especialista),
) -> Paciente:
    """
    Crear un nuevo paciente asociado al especialista autenticado.
    """
    paciente = Paciente(
        nombre=data.nombre,
        apellido=data.apellido,
        documento=data.documento,
        telefono=data.telefono,
        email=str(data.email) if data.email is not None else None,
        fecha_nacimiento=data.fecha_nacimiento,
        activo=data.activo,
        especialista_id=especialista.id,
    )
    session.add(paciente)
    session.commit()
    session.refresh(paciente)
    return paciente


@router.get("", response_model=PacienteList)
def list_pacientes(
    q: Optional[str] = Query(default=None, description="Buscar por nombre, apellido o documento"),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    session: Session = Depends(get_session),
    especialista: Especialista = Depends(get_current_especialista),
) -> PacienteList:
    """
    Listar pacientes del especialista actual con paginación y búsqueda simple.
    """
    base_stmt = select(Paciente).where(Paciente.especialista_id == especialista.id)

    if q:
        like_q = f"%{q}%"
        base_stmt = base_stmt.where(
            (Paciente.nombre.ilike(like_q))
            | (Paciente.apellido.ilike(like_q))
            | (Paciente.documento.ilike(like_q))
        )

    total = session.exec(base_stmt).count()
    stmt = base_stmt.offset(skip).limit(limit)
    items = session.exec(stmt).all()

    return PacienteList(total=total, items=items)


@router.get("/{paciente_id}", response_model=PacienteRead)
def get_paciente(
    paciente_id: UUID,
    session: Session = Depends(get_session),
    especialista: Especialista = Depends(get_current_especialista),
) -> Paciente:
    """
    Obtener un paciente por id (solo del especialista actual).
    """
    stmt = select(Paciente).where(
        Paciente.id == paciente_id,
        Paciente.especialista_id == especialista.id,
    )
    paciente = session.exec(stmt).first()
    if not paciente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Paciente no encontrado",
        )
    return paciente


@router.patch("/{paciente_id}", response_model=PacienteRead)
def update_paciente(
    paciente_id: UUID,
    data: PacienteUpdate,
    session: Session = Depends(get_session),
    especialista: Especialista = Depends(get_current_especialista),
) -> Paciente:
    """
    Actualizar parcialmente un paciente.
    """
    stmt = select(Paciente).where(
        Paciente.id == paciente_id,
        Paciente.especialista_id == especialista.id,
    )
    paciente = session.exec(stmt).first()
    if not paciente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Paciente no encontrado",
        )

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field == "email" and value is not None:
            setattr(paciente, field, str(value))
        else:
            setattr(paciente, field, value)

    session.add(paciente)
    session.commit()
    session.refresh(paciente)
    return paciente


@router.delete("/{paciente_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_paciente(
    paciente_id: UUID,
    session: Session = Depends(get_session),
    especialista: Especialista = Depends(get_current_especialista),
) -> None:
    """
    Borrado lógico de paciente (marca activo = false).
    """
    stmt = select(Paciente).where(
        Paciente.id == paciente_id,
        Paciente.especialista_id == especialista.id,
    )
    paciente = session.exec(stmt).first()
    if not paciente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Paciente no encontrado",
        )

    paciente.activo = False
    session.add(paciente)
    session.commit()

    return None

