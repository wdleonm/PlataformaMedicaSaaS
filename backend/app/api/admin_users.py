"""
Endpoints para gestión de usuarios administradores (Master Panel).
"""
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from app.database import get_session
from app.models.admin import Admin
from app.schemas.admin import AdminRead, AdminCreate, AdminUpdate
from app.api.dependencies import get_current_admin
from app.api.auth import get_password_hash

router = APIRouter(prefix="/api/admin/users", tags=["Admin Users"])

@router.get("/", response_model=List[AdminRead])
def admin_listar_admins(
    session: Session = Depends(get_session),
    current_admin: Admin = Depends(get_current_admin)
):
    """Listar todos los administradores del sistema."""
    if current_admin.rol != "master":
        raise HTTPException(status_code=403, detail="No tiene permisos para ver esta lista")
    
    statement = select(Admin).order_by(Admin.created_at)
    return session.exec(statement).all()

@router.post("/", response_model=AdminRead)
def admin_crear_admin(
    data: AdminCreate,
    session: Session = Depends(get_session),
    current_admin: Admin = Depends(get_current_admin)
):
    """Crear un nuevo administrador (Solo Master)."""
    if current_admin.rol != "master":
        raise HTTPException(status_code=403, detail="Solo administradores Master pueden crear otros")
    
    # Verificar si ya existe
    existing = session.exec(select(Admin).where(Admin.email == data.email)).first()
    if existing:
        raise HTTPException(status_code=400, detail="El email ya está registrado como administrador")
    
    new_admin = Admin(
        email=data.email,
        password_hash=get_password_hash(data.password),
        nombre=data.nombre,
        apellido=data.apellido,
        rol=data.rol
    )
    session.add(new_admin)
    session.commit()
    session.refresh(new_admin)
    return new_admin

@router.patch("/{admin_id}", response_model=AdminRead)
def admin_actualizar_admin(
    admin_id: UUID,
    data: AdminUpdate,
    session: Session = Depends(get_session),
    current_admin: Admin = Depends(get_current_admin)
):
    """Actualizar datos o desactivar un administrador."""
    if current_admin.rol != "master" and current_admin.id != admin_id:
         raise HTTPException(status_code=403, detail="No tiene permisos para editar este usuario")
    
    target_admin = session.get(Admin, admin_id)
    if not target_admin:
        raise HTTPException(status_code=404, detail="Administrador no encontrado")
        
    values = data.model_dump(exclude_unset=True)
    
    if "password" in values:
        target_admin.password_hash = get_password_hash(values.pop("password"))
        
    for key, value in values.items():
        setattr(target_admin, key, value)
        
    session.add(target_admin)
    session.commit()
    session.refresh(target_admin)
    return target_admin

@router.delete("/{admin_id}")
def admin_eliminar_admin(
    admin_id: UUID,
    session: Session = Depends(get_session),
    current_admin: Admin = Depends(get_current_admin)
):
    """Eliminar un administrador (Solo Master)."""
    if current_admin.rol != "master":
        raise HTTPException(status_code=403, detail="Solo administradores Master pueden eliminar")
        
    if current_admin.id == admin_id:
        raise HTTPException(status_code=400, detail="No puedes eliminarte a ti mismo")
        
    target_admin = session.get(Admin, admin_id)
    if not target_admin:
        raise HTTPException(status_code=404, detail="Administrador no encontrado")
        
    session.delete(target_admin)
    session.commit()
    return {"message": "Administrador eliminado"}
