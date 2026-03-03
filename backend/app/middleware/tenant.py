"""
Middleware para inyectar especialista_id y configurar RLS.
Fase 1: Implementación básica con JWT.
"""
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy import text
from app.database import engine


class TenantMiddleware(BaseHTTPMiddleware):
    """
    Middleware que extrae especialista_id del JWT y ejecuta SET LOCAL
    para que RLS funcione automáticamente en PostgreSQL.
    """

    async def dispatch(self, request: Request, call_next):
        # Rutas públicas que no requieren tenant context
        public_paths = ["/health", "/docs", "/openapi.json", "/api/auth/register", "/api/auth/login"]
        
        if request.url.path in public_paths:
            return await call_next(request)

        # Extraer token del header Authorization
        authorization = request.headers.get("Authorization")
        if not authorization or not authorization.startswith("Bearer "):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token de autenticación requerido",
            )

        token = authorization.split(" ")[1]
        
        # Decodificar JWT y extraer especialista_id
        # Por ahora, el token se valida en el dependency get_current_especialista
        # Aquí solo configuramos el contexto si el token es válido
        # En una implementación completa, validaríamos el token aquí también
        
        # Para Fase 1, el SET LOCAL se ejecutará en el dependency
        # que valida el token y obtiene el especialista_id
        
        response = await call_next(request)
        return response


def set_tenant_context(especialista_id: str) -> None:
    """
    Ejecuta SET LOCAL app.especialista_id para activar RLS.
    Debe llamarse dentro de una transacción de base de datos.
    """
    with engine.connect() as conn:
        conn.execute(text(f"SET LOCAL app.especialista_id = '{especialista_id}'"))
        conn.commit()
