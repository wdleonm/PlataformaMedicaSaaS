"""
Rutas de autenticación: registro y login.
Fase 1: Implementación básica con JWT.
"""
from typing import Optional
import os
import shutil
from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
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
    session: Session = Depends(get_session),
):
    """Registro de nuevo especialista."""
    # Verificar si el email ya existe
    statement = select(Especialista).where(Especialista.email == data.email)
    existing = session.exec(statement).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email ya registrado",
        )

    # Crear especialista
    especialista = Especialista(
        email=data.email,
        password_hash=get_password_hash(data.password),
        nombre=data.nombre,
        apellido=data.apellido,
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
    
    return especialista


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
