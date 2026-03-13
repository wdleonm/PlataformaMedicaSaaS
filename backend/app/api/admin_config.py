"""
Endpoints de administración para catálogos y configuración global.
"""
from typing import List
from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from app.database import get_session
from app.models.especialidad import Especialidad
from app.api.dependencies import get_current_admin
from app.models.admin import Admin

router = APIRouter(prefix="/api/admin/config", tags=["Admin Config"])

@router.get("/especialidades")
def admin_listar_todas_especialidades(
    session: Session = Depends(get_session),
):
    """Listar todas las especialidades activas."""
    statement = select(Especialidad).where(Especialidad.activo == True).order_by(Especialidad.nombre)
    return session.exec(statement).all()
