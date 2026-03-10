"""
Endpoints — Odontograma.
Fase 2.3 — Regla de Oro 3.1: Solo INSERT de registros evolutivos.

Endpoints:
  GET  /api/pacientes/{paciente_id}/odontograma          → estado actual
  GET  /api/pacientes/{paciente_id}/odontograma?fecha=   → estado en fecha dada
  POST /api/odontograma/registros                         → nuevo registro
  GET  /api/odontograma/hallazgos                         → catálogo de hallazgos
"""
from datetime import date
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, select

from app.api.dependencies import get_current_especialista
from app.database import get_session
from app.models.especialista import Especialista
from app.models.odontograma import OdontogramaHallazgo, OdontogramaRegistro
from app.models.paciente import Paciente
from app.schemas.odontograma import (
    EstadoDiente,
    OdontogramaEstadoRead,
    OdontogramaHallazgoRead,
    OdontogramaRegistroCreate,
    OdontogramaRegistroRead,
)

router = APIRouter(tags=["odontograma"])


# ---------------------------------------------------------------------------
# Catálogo de hallazgos
# ---------------------------------------------------------------------------

@router.get(
    "/api/odontograma/hallazgos",
    response_model=List[OdontogramaHallazgoRead],
    summary="Listar catálogo de hallazgos odontológicos",
)
def list_hallazgos(
    categoria: Optional[str] = Query(
        default=None,
        description="Filtrar por categoría: patologia | restauracion | estado",
    ),
    session: Session = Depends(get_session),
    _: Especialista = Depends(get_current_especialista),
) -> List[OdontogramaHallazgo]:
    stmt = select(OdontogramaHallazgo).where(OdontogramaHallazgo.activo == True)
    if categoria:
        stmt = stmt.where(OdontogramaHallazgo.categoria == categoria.lower())
    stmt = stmt.order_by(OdontogramaHallazgo.orden)
    return list(session.exec(stmt).all())


# ---------------------------------------------------------------------------
# Estado del odontograma por fecha (reconstrucción evolutiva)
# ---------------------------------------------------------------------------

@router.get(
    "/api/pacientes/{paciente_id}/odontograma",
    response_model=OdontogramaEstadoRead,
    summary="Estado del odontograma del paciente en una fecha dada",
)
def get_odontograma_estado(
    paciente_id: UUID,
    fecha: Optional[date] = Query(
        default=None,
        description="Fecha de corte (YYYY-MM-DD). Si se omite, usa hoy.",
    ),
    session: Session = Depends(get_session),
    especialista: Especialista = Depends(get_current_especialista),
) -> OdontogramaEstadoRead:
    """
    Reconstruye el estado del odontograma del paciente hasta la fecha indicada.

    Algoritmo: para cada (numero_diente, cara_diente) toma el registro más
    reciente con fecha_registro <= fecha_corte.

    Regla de Oro 3.1: nunca se modifica un registro; solo se insertan nuevos.
    """
    fecha_corte = fecha or date.today()

    # Verificar que el paciente pertenece al especialista
    paciente = session.exec(
        select(Paciente).where(
            Paciente.id == paciente_id,
            Paciente.especialista_id == especialista.id,
        )
    ).first()
    if not paciente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Paciente no encontrado",
        )

    # Todos los registros del paciente hasta la fecha de corte
    stmt = (
        select(OdontogramaRegistro)
        .where(
            OdontogramaRegistro.paciente_id == paciente_id,
            OdontogramaRegistro.especialista_id == especialista.id,
            OdontogramaRegistro.fecha_registro <= fecha_corte,
        )
        .order_by(
            OdontogramaRegistro.numero_diente,
            OdontogramaRegistro.cara_diente,
            OdontogramaRegistro.fecha_registro.desc(),      # type: ignore[attr-defined]
            OdontogramaRegistro.created_at.desc(),          # type: ignore[attr-defined]
        )
    )
    registros = session.exec(stmt).all()

    # Tomar el último registro por (numero_diente, cara_diente)
    vistos: set[tuple[int, str]] = set()
    dientes: List[EstadoDiente] = []

    # Cargar hallazgos en memoria para evitar N+1
    hallazgos_ids = {r.hallazgo_id for r in registros}
    hallazgos_map: dict[UUID, OdontogramaHallazgo] = {}
    if hallazgos_ids:
        hal_rows = session.exec(
            select(OdontogramaHallazgo).where(
                OdontogramaHallazgo.id.in_(hallazgos_ids)  # type: ignore[attr-defined]
            )
        ).all()
        hallazgos_map = {h.id: h for h in hal_rows}

    for reg in registros:
        clave = (reg.numero_diente, reg.cara_diente)
        if clave in vistos:
            continue
        vistos.add(clave)
        hallazgo = hallazgos_map.get(reg.hallazgo_id)
        dientes.append(
            EstadoDiente(
                numero_diente=reg.numero_diente,
                cara_diente=reg.cara_diente,
                hallazgo_id=reg.hallazgo_id,
                hallazgo_codigo=hallazgo.codigo if hallazgo else "",
                hallazgo_nombre=hallazgo.nombre if hallazgo else "",
                fecha_registro=reg.fecha_registro,
                notas=reg.notas,
                registro_id=reg.id,
            )
        )

    return OdontogramaEstadoRead(
        paciente_id=paciente_id,
        fecha_corte=fecha_corte,
        dientes=dientes,
    )


# ---------------------------------------------------------------------------
# Historial completo de registros de un diente/cara específico
# ---------------------------------------------------------------------------

@router.get(
    "/api/pacientes/{paciente_id}/odontograma/historial",
    response_model=List[OdontogramaRegistroRead],
    summary="Historial de registros de un diente (o todos) para un paciente",
)
def get_odontograma_historial(
    paciente_id: UUID,
    numero_diente: Optional[int] = Query(default=None, description="Filtrar por número de diente FDI"),
    cara_diente: Optional[str] = Query(default=None, description="Filtrar por cara (O/M/D/V/L/R)"),
    session: Session = Depends(get_session),
    especialista: Especialista = Depends(get_current_especialista),
) -> List[OdontogramaRegistro]:
    # Verificar paciente
    paciente = session.exec(
        select(Paciente).where(
            Paciente.id == paciente_id,
            Paciente.especialista_id == especialista.id,
        )
    ).first()
    if not paciente:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Paciente no encontrado")

    stmt = select(OdontogramaRegistro).where(
        OdontogramaRegistro.paciente_id == paciente_id,
        OdontogramaRegistro.especialista_id == especialista.id,
    )
    if numero_diente is not None:
        stmt = stmt.where(OdontogramaRegistro.numero_diente == numero_diente)
    if cara_diente is not None:
        stmt = stmt.where(OdontogramaRegistro.cara_diente == cara_diente.upper())

    stmt = stmt.order_by(
        OdontogramaRegistro.numero_diente,
        OdontogramaRegistro.cara_diente,
        OdontogramaRegistro.fecha_registro.desc(),  # type: ignore[attr-defined]
    )
    return list(session.exec(stmt).all())


# ---------------------------------------------------------------------------
# Crear nuevo registro (SOLO INSERT — Regla de Oro 3.1)
# ---------------------------------------------------------------------------

@router.post(
    "/api/odontograma/registros",
    response_model=OdontogramaRegistroRead,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar nuevo estado de un diente/cara (Solo INSERT)",
)
def create_odontograma_registro(
    data: OdontogramaRegistroCreate,
    session: Session = Depends(get_session),
    especialista: Especialista = Depends(get_current_especialista),
) -> OdontogramaRegistro:
    """
    Inserta un nuevo registro de odontograma.

    **Regla de Oro 3.1:** Este endpoint NUNCA modifica registros existentes.
    Cada llamada crea una nueva fila para mantener el histórico completo.
    """
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

    # Verificar que el hallazgo existe y está activo
    hallazgo = session.exec(
        select(OdontogramaHallazgo).where(
            OdontogramaHallazgo.id == data.hallazgo_id,
            OdontogramaHallazgo.activo == True,
        )
    ).first()
    if not hallazgo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hallazgo no encontrado o inactivo",
        )

    registro = OdontogramaRegistro(
        especialista_id=especialista.id,
        paciente_id=data.paciente_id,
        numero_diente=data.numero_diente,
        cara_diente=data.cara_diente,
        hallazgo_id=data.hallazgo_id,
        fecha_registro=data.fecha_registro or date.today(),
        notas=data.notas,
        historia_clinica_id=data.historia_clinica_id,
    )
    session.add(registro)
    session.commit()
    session.refresh(registro)
    return registro
