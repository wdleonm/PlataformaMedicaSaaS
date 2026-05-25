"""
Rutas de autenticación: registro y login.
Fase 1: Implementación básica con JWT.
"""
from typing import Optional
import os
import shutil
from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, BackgroundTasks
from sqlmodel import Session, select
from sqlalchemy.orm import selectinload
from jose import jwt
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
from app.database import get_session
from app.config import settings
from app.models.especialista import Especialista, EspecialistaEspecialidad
from app.models.especialidad import Especialidad
from app.schemas.auth import (
    EspecialistaRegister,
    EspecialistaLogin,
    EspecialistaRead,
    Token,
    EspecialistaChangePassword,
    EspecialistaSecurityUpdate,
    EspecialistaUpdate
)
from app.api.dependencies import get_current_especialista
from app.core.email import send_new_registration_email

router = APIRouter(prefix="/api/auth", tags=["auth"])

# Contexto para hash de passwords
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica password contra hash."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Genera hash de password."""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Crea token JWT."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expire_minutes)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.jwt_secret, algorithm=settings.jwt_algorithm)
    return encoded_jwt


@router.post("/register", response_model=EspecialistaRead, status_code=status.HTTP_201_CREATED)
def register(
    data: EspecialistaRegister,
    background_tasks: BackgroundTasks,
    session: Session = Depends(get_session),
):
    """Registro de nuevo especialista. Asigna automáticamente Plan Profesional con 30 días de trial."""
    from datetime import date, timedelta
    from app.models.suscripcion import PlanSuscripcion

    # Verificar si el email ya existe
    statement = select(Especialista).where(Especialista.email == data.email)
    existing = session.exec(statement).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email ya registrado",
        )

    # Buscar el plan trial (Plan Profesional)
    plan_trial = session.exec(
        select(PlanSuscripcion).where(PlanSuscripcion.codigo == "profesional")
    ).first()

    # Crear especialista con el plan trial asignado
    especialista = Especialista(
        email=data.email,
        password_hash=get_password_hash(data.password),
        nombre=data.nombre,
        apellido=data.apellido,
        plan_suscripcion_id=plan_trial.id if plan_trial else None,
        suscripcion_activa=True,
        fecha_vencimiento_suscripcion=date.today() + timedelta(days=30),
    )
    session.add(especialista)
    session.commit()
    session.refresh(especialista)

    # Asociar especialidades si se proporcionaron
    if data.especialidad_ids:
        for especialidad_id in data.especialidad_ids:
            # Verificar que la especialidad existe
            stmt = select(Especialidad).where(Especialidad.id == especialidad_id)
            especialidad = session.exec(stmt).first()
            if especialidad:
                rel = EspecialistaEspecialidad(
                    especialista_id=especialista.id,
                    especialidad_id=especialidad_id,
                )
                session.add(rel)
        session.commit()

    # Recargar especialista con especialidades
    statement = select(Especialista).options(selectinload(Especialista.especialidades)).where(Especialista.id == especialista.id)
    especialista = session.exec(statement).first()
    
    # Enviar correo de notificación a los administradores
    background_tasks.add_task(
        send_new_registration_email,
        nombre=especialista.nombre,
        apellido=especialista.apellido,
        email=especialista.email,
        telefono=getattr(especialista, 'telefono', '') or ''
    )
    
    return especialista

@router.get("/especialidades")
def get_especialidades(session: Session = Depends(get_session)):
    """Listar especialidades disponibles para el registro público."""
    statement = select(Especialidad).where(Especialidad.activo == True).order_by(Especialidad.nombre)
    return session.exec(statement).all()


@router.post("/login", response_model=Token)
def login(
    data: EspecialistaLogin,
    session: Session = Depends(get_session),
):
    """Login de especialista; retorna JWT."""
    # Buscar especialista por email
    statement = select(Especialista).where(Especialista.email == data.email)
    especialista = session.exec(statement).first()
    
    if not especialista or not verify_password(data.password, especialista.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
        )

    if not especialista.activo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cuenta desactivada",
        )

    # Crear token JWT
    access_token = create_access_token(
        data={"sub": str(especialista.id), "email": especialista.email, "rol": "especialista"}
    )

    # Cargar especialidades explícitamente
    statement = select(Especialista).options(selectinload(Especialista.especialidades)).where(Especialista.id == especialista.id)
    especialista = session.exec(statement).first()
    
    return Token(
        access_token=access_token,
        especialista=especialista,
    )


@router.get("/debug-specialists")
def debug_specialists(session: Session = Depends(get_session)):
    """Ruta temporal para diagnosticar y re-crear o actualizar los especialistas de prueba."""
    from app.models.especialista import Especialista, EspecialistaEspecialidad
    from app.models.especialidad import Especialidad
    from uuid import UUID
    import traceback
    
    try:
        result = []
        
        # 1. Buscar si ya existen o crearlos
        emails_to_check = {
            "danielaaleonr@gmail.com": {
                "id": UUID("a908292f-22f3-4e66-975f-a0070ff4ad86"),
                "nombre": "Daniela",
                "apellido": "Leon"
            }
        }
        
        for email, info in emails_to_check.items():
            e = session.get(Especialista, info["id"])
            
            status_action = ""
            if not e:
                # Crear
                e = Especialista(
                    id=info["id"],
                    email=email,
                    password_hash=get_password_hash("123456."),
                    nombre=info["nombre"],
                    apellido=info["apellido"],
                    activo=True,
                    suscripcion_activa=True,
                    plan_suscripcion_id=UUID("70cb7e3f-adbb-42da-b76c-8949dcc71134") # Enterprise
                )
                # Rellenar datos reales del perfil
                if email == "danielaaleonr@gmail.com":
                    e.nombre = "Daniela A"
                    e.apellido = "León R"
                    e.clinica_nombre = "Odonto Fashion"
                    e.clinica_direccion = "IEQ Valencia"
                    e.slug_url = "danielaleon"
                    e.portal_visible = True
                session.add(e)
                status_action = "creado"
                
                # Asociar especialidad Odontología General (si existe)
                stmt_esp = select(Especialidad).where(Especialidad.codigo == "ODO_GEN")
                esp = session.exec(stmt_esp).first()
                if esp:
                    rel = EspecialistaEspecialidad(
                        especialista_id=e.id,
                        especialidad_id=esp.id
                    )
                    session.add(rel)
            else:
                # Actualizar contraseña, activo, email y perfil completo
                e.email = email
                e.password_hash = get_password_hash("123456.")
                e.activo = True
                e.suscripcion_activa = True
                if email == "danielaaleonr@gmail.com":
                    e.nombre = "Daniela A"
                    e.apellido = "León R"
                    e.clinica_nombre = "Odonto Fashion"
                    e.clinica_direccion = "IEQ Valencia"
                    e.slug_url = "danielaleon"
                    e.portal_visible = True
                session.add(e)
                status_action = "actualizado"
                
            session.commit()
            session.refresh(e)
            
            result.append({
                "id": str(e.id),
                "email": e.email,
                "nombre": e.nombre,
                "apellido": e.apellido,
                "activo": e.activo,
                "suscripcion_activa": e.suscripcion_activa,
                "action": status_action
            })
            
        all_esp = session.exec(select(Especialista)).all()
        all_list = [{"id": str(x.id), "email": x.email, "nombre": x.nombre, "activo": x.activo} for x in all_esp]
            
        return {
            "status": "success",
            "message": "Especialistas de prueba listos con contraseña '123456.'",
            "data": result,
            "all_specialists_in_db": all_list
        }
    except Exception as ex:
        import traceback
        return {
            "status": "error",
            "message": str(ex),
            "traceback": traceback.format_exc()
        }


@router.get("/seed-services")
def seed_services(session: Session = Depends(get_session)):
    """Carga los insumos, servicios y recetas del archivo JSON y los inserta en producción."""
    import json
    import os
    try:
        # Ruta al archivo JSON
        base_dir = os.path.dirname(os.path.dirname(__file__)) # /backend/app
        json_path = os.path.join(base_dir, "local_data_dump.json")
        
        if not os.path.exists(json_path):
            return {"status": "error", "message": f"Archivo no encontrado en: {json_path}"}
            
        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            
        from app.models.insumo_servicio import Insumo, Servicio, ServicioInsumo
        from uuid import UUID
        
        # 1. Insertar Insumos
        insumos_inserted = 0
        for ins in data["insumos"]:
            # Filtrar solo Daniela Leon
            if UUID(ins["especialista_id"]) != UUID("a908292f-22f3-4e66-975f-a0070ff4ad86"):
                continue
            # Verificar si existe
            stmt = select(Insumo).where(Insumo.id == UUID(ins["id"]))
            existing = session.exec(stmt).first()
            if not existing:
                new_ins = Insumo(
                    id=UUID(ins["id"]),
                    especialista_id=UUID(ins["especialista_id"]),
                    nombre=ins["nombre"],
                    codigo=ins["codigo"],
                    unidad=ins["unidad"],
                    costo_unitario=ins["costo_unitario"],
                    unidades_por_paquete=ins["unidades_por_paquete"],
                    stock_actual=ins["stock_actual"],
                    stock_minimo=ins["stock_minimo"],
                    activo=ins["activo"]
                )
                session.add(new_ins)
                insumos_inserted += 1
                
        session.commit()
        
        # 2. Insertar Servicios
        servicios_inserted = 0
        for ser in data["servicios"]:
            # Filtrar solo Daniela Leon
            if UUID(ser["especialista_id"]) != UUID("a908292f-22f3-4e66-975f-a0070ff4ad86"):
                continue
            stmt = select(Servicio).where(Servicio.id == UUID(ser["id"]))
            existing = session.exec(stmt).first()
            if not existing:
                new_ser = Servicio(
                    id=UUID(ser["id"]),
                    especialista_id=UUID(ser["especialista_id"]),
                    nombre=ser["nombre"],
                    codigo=ser["codigo"],
                    categoria=ser["categoria"],
                    descripcion=ser["descripcion"],
                    precio=ser["precio"],
                    merma_porcentaje=ser["merma_porcentaje"],
                    activo=ser["activo"],
                    visible_publico=ser["visible_publico"],
                    duracion_estimada_min=ser["duracion_estimada_min"]
                )
                session.add(new_ser)
                servicios_inserted += 1
                
        session.commit()
        
        # 3. Insertar ServicioInsumos
        si_inserted = 0
        daniela_service_ids = {UUID(s["id"]) for s in data["servicios"] if UUID(s["especialista_id"]) == UUID("a908292f-22f3-4e66-975f-a0070ff4ad86")}
        for si in data["servicio_insumos"]:
            # Filtrar solo recetas de servicios de Daniela Leon
            if UUID(si["servicio_id"]) not in daniela_service_ids:
                continue
            stmt = select(ServicioInsumo).where(
                ServicioInsumo.servicio_id == UUID(si["servicio_id"])
            ).where(
                ServicioInsumo.insumo_id == UUID(si["insumo_id"])
            )
            existing = session.exec(stmt).first()
            if not existing:
                new_si = ServicioInsumo(
                    servicio_id=UUID(si["servicio_id"]),
                    insumo_id=UUID(si["insumo_id"]),
                    cantidad_utilizada=si["cantidad_utilizada"]
                )
                session.add(new_si)
                si_inserted += 1
                
        session.commit()
        
        return {
            "status": "success",
            "message": "Datos de insumos y servicios sembrados con éxito",
            "details": {
                "insumos_nuevos": insumos_inserted,
                "servicios_nuevos": servicios_inserted,
                "servicio_insumos_nuevos": si_inserted
            }
        }
    except Exception as ex:
        return {"status": "error", "message": str(ex)}


@router.get("/me", response_model=EspecialistaRead)
def get_current_user(
    especialista: Especialista = Depends(get_current_especialista),
):
    """Obtener información del especialista actual (ruta protegida)."""
    return especialista


@router.post("/change-password")
def change_password(
    data: EspecialistaChangePassword,
    session: Session = Depends(get_session),
    especialista: Especialista = Depends(get_current_especialista),
):
    """Cambiar contraseña del especialista actual."""
    if not verify_password(data.current_password, especialista.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña actual es incorrecta",
        )
    
    especialista.password_hash = get_password_hash(data.new_password)
    especialista.fecha_ultimo_cambio_password = datetime.now(timezone.utc)
    especialista.forzar_cambio_password_proximo_acceso = False
    
    session.add(especialista)
    session.commit()
    
    return {"message": "Contraseña actualizada exitosamente"}


@router.patch("/me", response_model=EspecialistaRead)
def update_profile(
    data: EspecialistaUpdate,
    session: Session = Depends(get_session),
    especialista: Especialista = Depends(get_current_especialista),
):
    """Actualizar datos del perfil del especialista actual."""
    update_data = data.model_dump(exclude_unset=True)
    
    for key, value in update_data.items():
        setattr(especialista, key, value)
        
    especialista.updated_at = datetime.now(timezone.utc)
    session.add(especialista)
    session.commit()
    session.refresh(especialista)
    return especialista

@router.patch("/security-settings")
def update_security_settings(
    data: EspecialistaSecurityUpdate,
    session: Session = Depends(get_session),
    especialista: Especialista = Depends(get_current_especialista),
):
    """Actualizar preferencias de rotación de contraseña del especialista."""
    update_data = data.model_dump(exclude_unset=True)
    
    if "exigir_cambio_password" in update_data:
        especialista.exigir_cambio_password = update_data["exigir_cambio_password"]
        
    if "intervalo_cambio_password" in update_data:
        especialista.intervalo_cambio_password = update_data["intervalo_cambio_password"]
        
    # Limpiar intervalo si se desactiva
    if not especialista.exigir_cambio_password:
        especialista.intervalo_cambio_password = None
        
    session.add(especialista)
    session.commit()
    session.refresh(especialista)
    
    return especialista

@router.post("/logo", response_model=EspecialistaRead)
async def upload_logo(
    file: UploadFile = File(...),
    session: Session = Depends(get_session),
    especialista: Especialista = Depends(get_current_especialista),
):
    """Cargar logo de la clínica del especialista."""
    # Validar que sea imagen
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="El archivo debe ser una imagen")

    # Crear directorio si no existe
    logo_dir = os.path.join("uploads", "logos")
    if not os.path.exists(logo_dir):
        os.makedirs(logo_dir)

    # Generar nombre único
    ext = os.path.splitext(file.filename or "")[1]
    if not ext:
        ext = ".png" # default
    
    filename = f"logo_{especialista.id}_{uuid4().hex[:8]}{ext}"
    file_path = os.path.join(logo_dir, filename)

    # Guardar archivo
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al guardar logo: {str(e)}")

    # Actualizar URL (relativa para que funcione en cualquier host)
    especialista.clinica_logo_url = f"/uploads/logos/{filename}"
    especialista.updated_at = datetime.now(timezone.utc)
    
    session.add(especialista)
    session.commit()
    session.refresh(especialista)
    
    return especialista
