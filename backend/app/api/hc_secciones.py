from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.database import get_session
from app.models.hc_seccion import HCSeccion, EspecialidadHCSeccion
from app.models.especialista import Especialista
from app.api.dependencies import get_current_especialista

router = APIRouter(prefix="/api/hc-secciones", tags=["HC Secciones"])

@router.get("/", response_model=List[HCSeccion])
def listar_secciones_catalogo(
    session: Session = Depends(get_session),
    current_user: Especialista = Depends(get_current_especialista),
):
    """
    Retorna todo el catálogo de secciones de la historia clínica (sys_config).
    """
    statement = select(HCSeccion).where(HCSeccion.activo == True).order_by(HCSeccion.codigo)
    secciones = session.exec(statement).all()
    return secciones

@router.get("/especialidad/{especialidad_id}", response_model=List[dict])
def listar_secciones_por_especialidad(
    especialidad_id: UUID,
    session: Session = Depends(get_session),
    current_user: Especialista = Depends(get_current_especialista),
):
    """
    Retorna las secciones configuradas para una especialidad específica, 
    ordenadas según su configuración `orden`.
    """
    # Join con EspecialidadHCSeccion
    statement = (
        select(HCSeccion, EspecialidadHCSeccion)
        .join(EspecialidadHCSeccion, HCSeccion.id == EspecialidadHCSeccion.hc_seccion_id)
        .where(EspecialidadHCSeccion.especialidad_id == especialidad_id)
        .where(HCSeccion.activo == True)
        .order_by(EspecialidadHCSeccion.orden)
    )
    
    resultados = session.exec(statement).all()
    
    # Mapear a una lista simple enriquecida
    secciones_enriquecidas = []
    for seccion, extra in resultados:
        secciones_enriquecidas.append({
            "id": seccion.id,
            "codigo": seccion.codigo,
            "nombre": seccion.nombre,
            "descripcion": seccion.descripcion,
            "componente_frontend": seccion.componente_frontend,
            "orden": extra.orden,
            "obligatoria": extra.obligatoria
        })
        
    return secciones_enriquecidas
