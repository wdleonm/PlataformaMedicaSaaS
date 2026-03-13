"""
Endpoints de administración para gestión de Planes de Suscripción.
Fase 7: Configuración de la oferta comercial SaaS.
"""
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from app.database import get_session
from app.models.suscripcion import PlanSuscripcion
from app.schemas.admin import PlanSuscripcionRead
from app.api.dependencies import get_current_admin
from app.models.admin import Admin

router = APIRouter(prefix="/api/admin/planes", tags=["Admin Planes"])

@router.get("/", response_model=List[PlanSuscripcionRead])
def admin_listar_planes(
    session: Session = Depends(get_session),
    current_admin: Admin = Depends(get_current_admin),
):
    """Listar todos los planes de suscripción."""
    statement = select(PlanSuscripcion).order_by(PlanSuscripcion.precio_mensual)
    return session.exec(statement).all()

@router.post("/", response_model=PlanSuscripcionRead, status_code=status.HTTP_201_CREATED)
def admin_crear_plan(
    data: PlanSuscripcionRead, # Reusando read para simplificar o crear un Create schema
    session: Session = Depends(get_session),
    current_admin: Admin = Depends(get_current_admin),
):
    """Crear un nuevo plan de suscripción."""
    # Omitir ID si viene en el body para que se genere uno nuevo
    plan_data = data.model_dump(exclude={"id"})
    plan = PlanSuscripcion(**plan_data)
    session.add(plan)
    session.commit()
    session.refresh(plan)
    return plan
