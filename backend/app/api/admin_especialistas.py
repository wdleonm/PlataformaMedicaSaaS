"""
Endpoints de administración para gestión de Especialistas.
Fase 7: Gestión de usuarios SaaS, planes y suscripciones.
"""
from typing import List, Optional
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
from app.api.auth import get_password_hash, verify_password
from app.models.especialidad import Especialidad
from app.models.paciente import Paciente
from app.models.finanzas import Cita, Presupuesto, Abono
from app.models.insumo_servicio import Servicio, Insumo
from app.models.historia_clinica import HistoriaClinica

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

@router.get("/{especialista_id}/check-dependencies")
def check_especialista_dependencies(
    especialista_id: UUID,
    session: Session = Depends(get_session),
    current_admin: Admin = Depends(get_current_admin),
):
    """Verifica si el especialista tiene datos vinculados que impidan su eliminación."""
    especialista = session.get(Especialista, especialista_id)
    if not especialista:
        raise HTTPException(status_code=404, detail="Especialista no encontrado")

    # Contar pacientes
    pacientes_count = session.exec(select(Paciente).where(Paciente.especialista_id == especialista_id)).all()
    
    # Contar servicios "reales" (que no sean los de prueba S-0001/0002)
    servicios_reales = session.exec(
        select(Servicio)
        .where(Servicio.especialista_id == especialista_id)
        .where(Servicio.codigo.notin_(["S-0001", "S-0002"]))
    ).all()
    
    # Contar insumos "reales" (que no sean I-0001/0002)
    insumos_reales = session.exec(
        select(Insumo)
        .where(Insumo.especialista_id == especialista_id)
        .where(Insumo.codigo.notin_(["I-0001", "I-0002"]))
    ).all()

    # Contar citas y presupuestos (son dependencias críticas)
    citas_count = session.exec(select(Cita).where(Cita.especialista_id == especialista_id)).all()
    presupuestos_count = session.exec(select(Presupuesto).where(Presupuesto.especialista_id == especialista_id)).all()

    # Identificar si es "borrable automáticamente" (solo tiene data de prueba)
    es_borrable_directo = (len(pacientes_count) == 0 and len(servicios_reales) == 0 and len(insumos_reales) == 0)

    return {
        "pacientes": len(pacientes_count),
        "servicios": len(servicios_reales),
        "insumos": len(insumos_reales),
        "citas": len(citas_count),
        "presupuestos": len(presupuestos_count),
        "es_borrable_directo": es_borrable_directo,
        "puede_borrar_cascada": True,
        "pin_configurado": current_admin.pin_seguridad_hash is not None
    }

@router.delete("/{especialista_id}")
def admin_eliminar_especialista(
    especialista_id: UUID,
    cascade: bool = False,
    admin_pin: Optional[str] = None,
    session: Session = Depends(get_session),
    current_admin: Admin = Depends(get_current_admin),
):
    """
    Elimina un especialista. Si es en cascada, requiere validación de PIN de seguridad.
    """
    especialista = session.get(Especialista, especialista_id)
    if not especialista:
        raise HTTPException(status_code=404, detail="Especialista no encontrado")

    if cascade:
        # Validación de Seguridad Master
        if current_admin.rol != "master":
             raise HTTPException(
                status_code=403, 
                detail="Solo un Administrador Master puede solicitar eliminación en cascada."
            )
            
        if not current_admin.pin_seguridad_hash:
            raise HTTPException(
                status_code=400, 
                detail="No has configurado un PIN de seguridad. Configúralo en tu perfil antes de realizar esta acción."
            )
        
        if not admin_pin or not verify_password(admin_pin, current_admin.pin_seguridad_hash):
            raise HTTPException(
                status_code=401, 
                detail="PIN de seguridad incorrecto."
            )
    else:
        # Verificar si tiene datos (reutilizando lógica del check)
        pacientes = session.exec(select(Paciente).where(Paciente.especialista_id == especialista_id)).first()
        if pacientes:
            raise HTTPException(
                status_code=400, 
                detail="El especialista tiene pacientes vinculados. Para borrarlo debe usar el PIN de seguridad y eliminación en cascada."
            )

    try:
        # Usar SQL directo para asegurar que borre a pesar del RLS
        # El orden es crucial para evitar violaciones de integridad referencial (FK)

        # 1. Pagos y Detalles (Nivel más bajo)
        session.exec(text(f"DELETE FROM sys_clinical.abonos WHERE especialista_id = '{especialista_id}'"))
        session.exec(text(f"DELETE FROM sys_clinical.presupuesto_detalles WHERE presupuesto_id IN (SELECT id FROM sys_clinical.presupuestos WHERE especialista_id = '{especialista_id}')"))
        
        # 2. Citas y Presupuestos
        session.exec(text(f"DELETE FROM sys_clinical.citas WHERE especialista_id = '{especialista_id}'"))
        session.exec(text(f"DELETE FROM sys_clinical.presupuestos WHERE especialista_id = '{especialista_id}'"))
        
        # 3. Historias Clínicas (Adjuntos primero, luego la historia)
        session.exec(text(f"DELETE FROM sys_clinical.historias_clinicas_adjuntos WHERE historia_id IN (SELECT id FROM sys_clinical.historias_clinicas WHERE especialista_id = '{especialista_id}')"))
        session.exec(text(f"DELETE FROM sys_clinical.historias_clinicas WHERE especialista_id = '{especialista_id}'"))
        
        # 4. Pacientes
        session.exec(text(f"DELETE FROM sys_clinical.pacientes WHERE especialista_id = '{especialista_id}'"))
        
        # 5. Servicios e Insumos (Relación receta primero, luego los catálogos)
        session.exec(text(f"DELETE FROM sys_config.servicio_insumos WHERE servicio_id IN (SELECT id FROM sys_config.servicios WHERE especialista_id = '{especialista_id}')"))
        session.exec(text(f"DELETE FROM sys_config.servicios WHERE especialista_id = '{especialista_id}'"))
        session.exec(text(f"DELETE FROM sys_config.insumos WHERE especialista_id = '{especialista_id}'"))
        
        # 6. Relaciones de Especialidad y Transaccionales de Configuración
        session.exec(text(f"DELETE FROM sys_config.especialista_especialidades WHERE especialista_id = '{especialista_id}'"))
        session.exec(text(f"DELETE FROM sys_config.log_suscripciones WHERE especialista_id = '{especialista_id}'"))
        
        # 7. Finalmente el Especialista
        session.delete(especialista)
        session.commit()
        return {"detail": "Especialista y todos sus datos relacionados eliminados correctamente"}
    except Exception as e:
        session.rollback()
        print(f"DEBUG DELETE ERROR: {str(e)}") # Útil para logs de backend
        raise HTTPException(status_code=500, detail=f"Error durante la eliminación: {str(e)}")

@router.post("/config/set-pin")
def admin_configurar_pin(
    pin: str,
    session: Session = Depends(get_session),
    current_admin: Admin = Depends(get_current_admin),
):
    """Permite al administrador configurar o cambiar su PIN de seguridad."""
    if len(pin) < 4:
        raise HTTPException(status_code=400, detail="El PIN debe tener al menos 4 caracteres.")
    
    current_admin.pin_seguridad_hash = get_password_hash(pin)
    session.add(current_admin)
    session.commit()
    return {"message": "PIN de seguridad configurado correctamente."}
