"""
Endpoints de administración para catálogos y configuración global.
"""
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.database import get_session
from app.models.especialidad import Especialidad
from app.models.odontograma import OdontogramaHallazgo
from app.api.dependencies import get_current_admin
from app.models.admin import Admin
from app.models.config_global import ConfiguracionGlobal
from app.utils.bcv import fetch_bcv_rates
from app.schemas.admin_config import (
    EspecialidadCreate, EspecialidadUpdate, EspecialidadRead,
    OdontogramaHallazgoCreate, OdontogramaHallazgoUpdate, OdontogramaHallazgoRead,
    ConfigGlobalRead, ConfigGlobalUpdate
)

router = APIRouter(prefix="/api/admin/config", tags=["Admin Config"])

# --- Configuracion Global ---

@router.get("/global", response_model=ConfigGlobalRead)
def admin_obtener_config_global(
    session: Session = Depends(get_session),
    admin: Admin = Depends(get_current_admin)
):
    """Obtener la configuración global única del sistema."""
    config = session.exec(select(ConfiguracionGlobal)).first()
    if not config:
        # Fallback si por alguna razón no se insertó por script SQL
        config = ConfiguracionGlobal()
        session.add(config)
        session.commit()
        session.refresh(config)
    return config

@router.patch("/global", response_model=ConfigGlobalRead)
def admin_actualizar_config_global(
    data: ConfigGlobalUpdate,
    session: Session = Depends(get_session),
    admin: Admin = Depends(get_current_admin)
):
    """Actualizar parámetros globales (moneda, iva, tasas manuales)."""
    config = session.exec(select(ConfiguracionGlobal)).first()
    if not config:
        raise HTTPException(status_code=404, detail="Configuración no encontrada")
    
    values = data.model_dump(exclude_unset=True)
    for key, value in values.items():
        setattr(config, key, value)
    
    session.add(config)
    session.commit()
    session.refresh(config)
    return config

@router.post("/global/sync-bcv", response_model=ConfigGlobalRead)
async def admin_sincronizar_bcv(
    session: Session = Depends(get_session),
    admin: Admin = Depends(get_current_admin)
):
    """Forzar la sincronización de las tasas desde el BCV usando el servicio centralizado."""
    from app.services.bcv_service import BCVService
    
    exito = await BCVService.sincronizar_tasas(session)
    if not exito:
        raise HTTPException(
            status_code=503, 
            detail="No se pudo sincronizar con el BCV. Verifique la conexión o el estado de la página oficial."
        )
    
    # Recargar config para devolver el valor actualizado
    config = session.exec(select(ConfiguracionGlobal)).first()
    return config

# --- Especialidades ---

@router.get("/especialidades", response_model=List[EspecialidadRead])
def admin_listar_especialidades(
    session: Session = Depends(get_session),
    admin: Admin = Depends(get_current_admin)
):
    """Listar todas las especialidades."""
    statement = select(Especialidad).order_by(Especialidad.nombre)
    return session.exec(statement).all()

@router.post("/especialidades", response_model=EspecialidadRead)
def admin_crear_especialidad(
    data: EspecialidadCreate,
    session: Session = Depends(get_session),
    admin: Admin = Depends(get_current_admin)
):
    """Crear una nueva especialidad médica."""
    especialidad = Especialidad(**data.model_dump())
    session.add(especialidad)
    session.commit()
    session.refresh(especialidad)
    return especialidad

@router.put("/especialidades/{especialidad_id}", response_model=EspecialidadRead)
def admin_actualizar_especialidad(
    especialidad_id: UUID,
    data: EspecialidadUpdate,
    session: Session = Depends(get_session),
    admin: Admin = Depends(get_current_admin)
):
    """Actualizar una especialidad existente."""
    especialidad = session.get(Especialidad, especialidad_id)
    if not especialidad:
        raise HTTPException(status_code=404, detail="Especialidad no encontrada")
    
    values = data.model_dump(exclude_unset=True)
    for key, value in values.items():
        setattr(especialidad, key, value)
    
    session.add(especialidad)
    session.commit()
    session.refresh(especialidad)
    return especialidad

# --- Odontograma Hallazgos ---

@router.get("/hallazgos", response_model=List[OdontogramaHallazgoRead])
def admin_listar_hallazgos(
    session: Session = Depends(get_session),
    admin: Admin = Depends(get_current_admin)
):
    """Listar catálogo global de hallazgos del odontograma."""
    statement = select(OdontogramaHallazgo).order_by(OdontogramaHallazgo.orden)
    return session.exec(statement).all()

@router.post("/hallazgos", response_model=OdontogramaHallazgoRead)
def admin_crear_hallazgo(
    data: OdontogramaHallazgoCreate,
    session: Session = Depends(get_session),
    admin: Admin = Depends(get_current_admin)
):
    """Añadir nuevo hallazgo al catálogo global."""
    hallazgo = OdontogramaHallazgo(**data.model_dump())
    session.add(hallazgo)
    session.commit()
    session.refresh(hallazgo)
    return hallazgo

@router.put("/hallazgos/{hallazgo_id}", response_model=OdontogramaHallazgoRead)
def admin_actualizar_hallazgo(
    hallazgo_id: UUID,
    data: OdontogramaHallazgoUpdate,
    session: Session = Depends(get_session),
    admin: Admin = Depends(get_current_admin)
):
    """Actualizar un hallazgo del catálogo."""
    hallazgo = session.get(OdontogramaHallazgo, hallazgo_id)
    if not hallazgo:
        raise HTTPException(status_code=404, detail="Hallazgo no encontrado")
    
    values = data.model_dump(exclude_unset=True)
    for key, value in values.items():
        setattr(hallazgo, key, value)
    
    session.add(hallazgo)
    session.commit()
    session.refresh(hallazgo)
    return hallazgo
