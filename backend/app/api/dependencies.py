"""
Dependencies para FastAPI (autenticación, tenant context).
Fase 1: Implementación básica.
"""
from typing import List, Optional
from datetime import datetime, timedelta, timezone
from fastapi import Depends, HTTPException, status, Request, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlmodel import Session, select
from sqlalchemy import text
from sqlalchemy.orm import selectinload
from app.database import get_session
from app.config import settings
from app.models.especialista import Especialista
from app.models.admin import Admin


security = HTTPBearer(auto_error=False)


def get_current_especialista(
    request: Request,
    token_query: Optional[str] = Query(None, alias="token"),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    session: Session = Depends(get_session),
) -> Especialista:
    """
    Dependency que valida JWT y retorna el especialista actual.
    También ejecuta SET LOCAL para activar RLS en la sesión actual.
    """
    token = None
    if credentials:
        token = credentials.credentials
    elif token_query:
        token = token_query
    
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token no proporcionado",
        )
    
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
        )
        especialista_id: str = payload.get("sub")
        rol: str = payload.get("rol", "especialista")
        
        if especialista_id is None or rol != "especialista":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido o rol no autorizado",
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
        )

    # Ejecutar SET LOCAL para activar RLS en esta sesión
    # Usar la conexión de la sesión actual
    session.exec(text(f"SET LOCAL app.especialista_id = '{especialista_id}'"))

    # Obtener especialista con especialidades (RLS filtrará automáticamente)
    statement = select(Especialista).options(selectinload(Especialista.especialidades)).where(Especialista.id == especialista_id)
    especialista = session.exec(statement).first()
    
    if especialista is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Especialista no encontrado",
        )
    
    # Fase 7.4: Bloqueo por suscripción
    if not especialista.suscripcion_activa:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Su suscripcion está inactiva o vencida. Contacte al administrador del sistema.",
        )
    
    # NUEVA REGLA: Cambio de contraseña obligatorio
    debe_cambiar = especialista.forzar_cambio_password_proximo_acceso
    
    if not debe_cambiar and especialista.exigir_cambio_password:
        ahora = datetime.now(timezone.utc)
        intervalo = especialista.intervalo_cambio_password or 90
        vencimiento = especialista.fecha_ultimo_cambio_password + timedelta(days=intervalo)
        if ahora > vencimiento:
            debe_cambiar = True
            
    if debe_cambiar:
        # Permitir solo si la ruta es el cambio de contraseña propio
        if not request.url.path.endswith("/api/auth/change-password") and not request.url.path.endswith("/api/auth/me"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Debes actualizar tu contraseña para continuar. Por favor vaya a Configuración > Seguridad.",
            )
    
    return especialista


def get_current_admin(
    token_query: Optional[str] = Query(None, alias="token"),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    session: Session = Depends(get_session),
) -> Admin:
    """
    Dependency que valida JWT y retorna el administrador actual.
    El JWT debe tener rol = 'admin'.
    """
    token = None
    if credentials:
        token = credentials.credentials
    elif token_query:
        token = token_query
        
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token no proporcionado",
        )
    
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
        )
        admin_id: str = payload.get("sub")
        rol: str = payload.get("rol")
        
        if admin_id is None or rol != "admin":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido o no es administrador",
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
        )

    admin = session.get(Admin, admin_id)
    if admin is None or not admin.activo:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Administrador no encontrado o inactivo",
        )
    
    return admin
