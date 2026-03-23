"""
Endpoints de administración para gestión de Especialistas.
Fase 7: Gestión de usuarios SaaS, planes y suscripciones.
"""
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from sqlalchemy import text
from app.database import get_session
from app.models.especialista import Especialista, EspecialistaEspecialidad
from app.models.suscripcion import PlanSuscripcion, LogSuscripcion
from app.schemas.admin import EspecialistaAdminRead, EspecialistaAdminUpdate, EspecialistaAdminCreate
from app.api.dependencies import get_current_admin
from app.models.admin import Admin
from app.api.auth import get_password_hash
from app.models.especialidad import Especialidad

router = APIRouter(prefix="/api/admin/especialistas", tags=["Admin Especialistas"])

@router.get("/", response_model=List[EspecialistaAdminRead])
def admin_listar_especialistas(
    session: Session = Depends(get_session),
    current_admin: Admin = Depends(get_current_admin),
):
    """Listar todos los especialistas con datos de suscripción."""
    statement = select(Especialista).order_by(Especialista.created_at.desc())
    especialistas = session.exec(statement).all()
    
    # Enriquecer con el plan si existe
    resultado = []
    for esp in especialistas:
        esp_data = EspecialistaAdminRead.model_validate(esp)
        if esp.plan_suscripcion_id:
            plan = session.get(PlanSuscripcion, esp.plan_suscripcion_id)
            esp_data.plan = plan
        
        # Buscar especialidad principal
        spec_rel = session.exec(
            select(EspecialistaEspecialidad)
            .where(EspecialistaEspecialidad.especialista_id == esp.id)
            .limit(1)
        ).first()
        if spec_rel:
            esp_data.especialidad_principal_id = spec_rel.especialidad_id
            
        resultado.append(esp_data)
        
    return resultado


@router.post("/", response_model=EspecialistaAdminRead, status_code=status.HTTP_201_CREATED)
def admin_crear_especialista(
    data: EspecialistaAdminCreate,
    session: Session = Depends(get_session),
    current_admin: Admin = Depends(get_current_admin),
):
    """Crear un nuevo especialista desde el admin."""
    # Verificar si el email ya existe
    existing = session.exec(select(Especialista).where(Especialista.email == data.email)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email ya registrado")

    especialista = Especialista(
        nombre=data.nombre,
        apellido=data.apellido,
        email=data.email,
        password_hash=get_password_hash(data.password),
        plan_suscripcion_id=data.plan_suscripcion_id,
        fecha_vencimiento_suscripcion=data.fecha_vencimiento_suscripcion,
        suscripcion_activa=True,
        exigir_cambio_password=data.exigir_cambio_password,
        intervalo_cambio_password=data.intervalo_cambio_password if data.exigir_cambio_password else None,
        forzar_cambio_password_proximo_acceso=data.forzar_cambio_password_proximo_acceso
    )
    session.add(especialista)
    session.flush()

    if data.especialidad_principal_id:
        rel = EspecialistaEspecialidad(
            especialista_id=especialista.id,
            especialidad_id=data.especialidad_principal_id
        )
        session.add(rel)

    session.commit()
    session.refresh(especialista)

    res = EspecialistaAdminRead.model_validate(especialista)
    if especialista.plan_suscripcion_id:
        res.plan = session.get(PlanSuscripcion, especialista.plan_suscripcion_id)
        
    spec_rel = session.exec(select(EspecialistaEspecialidad).where(EspecialistaEspecialidad.especialista_id == especialista.id).limit(1)).first()
    if spec_rel:
        res.especialidad_principal_id = spec_rel.especialidad_id
        
    return res

@router.patch("/{especialista_id}", response_model=EspecialistaAdminRead)
def admin_actualizar_especialista(
    especialista_id: UUID,
    data: EspecialistaAdminUpdate,
    session: Session = Depends(get_session),
    current_admin: Admin = Depends(get_current_admin),
):
    """Actualizar estado o suscripción de un especialista."""
    especialista = session.get(Especialista, especialista_id)
    if not especialista:
        raise HTTPException(status_code=404, detail="Especialista no encontrado")

    update_data = data.model_dump(exclude_unset=True)
    
    # Si cambia el plan, registrar en el log
    if "plan_suscripcion_id" in update_data and update_data["plan_suscripcion_id"] != especialista.plan_suscripcion_id:
        log = LogSuscripcion(
            especialista_id=especialista.id,
            admin_id=current_admin.id,
            cambio={"de": str(especialista.plan_suscripcion_id), "a": str(update_data["plan_suscripcion_id"])},
            motivo=data.notas_admin or "Cambio de plan por administrador"
        )
        session.add(log)

    # notas_admin no es un campo del modelo Especialista
    update_data.pop("notas_admin", None)

    # Manejar cambio de password
    if "password" in update_data:
        new_password = update_data.pop("password")
        if new_password:
            especialista.password_hash = get_password_hash(new_password)
            # Si el admin le pone una clave manual, es buena idea registrarlo o setear que cambie en proximo acceso si el admin lo pide
            # (ya se pasaria via forzar_cambio_password_proximo_acceso si se desea)

    # Manejar cambio de especialidad
    if "especialidad_principal_id" in update_data:
        new_spec_id = update_data.pop("especialidad_principal_id")
        # Eliminar anteriores (para simplificar a 1 principal)
        session.exec(text(f"DELETE FROM sys_config.especialista_especialidades WHERE especialista_id = '{especialista.id}'"))
        if new_spec_id:
            rel = EspecialistaEspecialidad(especialista_id=especialista.id, especialidad_id=new_spec_id)
            session.add(rel)

    for key, value in update_data.items():
        setattr(especialista, key, value)
    
    # Limpiar intervalo si se desactiva
    if not especialista.exigir_cambio_password:
        especialista.intervalo_cambio_password = None
        
    session.add(especialista)
    session.commit()
    session.refresh(especialista)
    
    res = EspecialistaAdminRead.model_validate(especialista)
    if especialista.plan_suscripcion_id:
        res.plan = session.get(PlanSuscripcion, especialista.plan_suscripcion_id)
        
    spec_rel = session.exec(select(EspecialistaEspecialidad).where(EspecialistaEspecialidad.especialista_id == especialista.id).limit(1)).first()
    if spec_rel:
        res.especialidad_principal_id = spec_rel.especialidad_id
        
    return res
