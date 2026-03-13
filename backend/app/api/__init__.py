from app.api import (
    auth, pacientes, odontograma, historias_clinicas, inventario, 
    citas, presupuestos, comunicaciones, admin_auth, admin_especialistas, 
    admin_planes, admin_dashboard, admin_config, public_portal
)

__all__ = [
    "auth", "pacientes", "odontograma", "historias_clinicas", 
    "inventario", "citas", "presupuestos", "comunicaciones",
    "admin_auth", "admin_especialistas", "admin_planes", 
    "admin_dashboard", "admin_config", "public_portal"
]
