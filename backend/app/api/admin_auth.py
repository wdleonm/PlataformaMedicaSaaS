"""
Rutas de autenticación para Administradores.
Fase 7: Login de administradores SaaS.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from app.database import get_session
from app.models.admin import Admin
from app.schemas.admin import AdminLogin, AdminToken, AdminRead
from app.api.auth import verify_password, create_access_token, get_password_hash
from app.api.dependencies import get_current_admin
from app.schemas.admin import AdminChangePassword

router = APIRouter(prefix="/api/admin/auth", tags=["Admin Auth"])

@router.post("/login", response_model=AdminToken)
def admin_login(
    data: AdminLogin,
    session: Session = Depends(get_session),
):
    """Login de administrador; retorna JWT con rol: admin."""
    statement = select(Admin).where(Admin.email == data.email)
    admin = session.exec(statement).first()
    
    if not admin or not verify_password(data.password, admin.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña de administrador incorrectos",
        )

    if not admin.activo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cuenta de administrador desactivada",
        )

    # Crear token JWT con rol: admin
    access_token = create_access_token(
        data={"sub": str(admin.id), "email": admin.email, "rol": "admin"}
    )
    
    return AdminToken(
        access_token=access_token,
        admin=admin
    )

@router.get("/me", response_model=AdminRead)
def get_current_admin_user(
    admin: Admin = Depends(get_current_admin),
):
    """Obtener información del administrador actual."""
    return admin

@router.post("/change-password", response_model=dict)
def admin_change_password(
    data: AdminChangePassword,
    session: Session = Depends(get_session),
    admin: Admin = Depends(get_current_admin),
):
    """Cambiar contraseña de administrador."""
    if not verify_password(data.current_password, admin.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña actual es incorrecta",
        )
    
    admin.password_hash = get_password_hash(data.new_password)
    session.add(admin)
    session.commit()
    
    return {"message": "Contraseña actualizada exitosamente"}
