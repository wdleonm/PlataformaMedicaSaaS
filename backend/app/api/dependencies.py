"""
Dependencies para FastAPI (autenticación, tenant context).
Fase 1: Implementación básica.
"""
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlmodel import Session, select
from sqlalchemy import text
from sqlalchemy.orm import selectinload
from app.database import get_session
from app.config import settings
from app.models.especialista import Especialista


security = HTTPBearer()


def get_current_especialista(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    session: Session = Depends(get_session),
) -> Especialista:
    """
    Dependency que valida JWT y retorna el especialista actual.
    También ejecuta SET LOCAL para activar RLS en la sesión actual.
    """
    token = credentials.credentials
    
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
        )
        especialista_id: str = payload.get("sub")
        if especialista_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido",
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
    
    return especialista
