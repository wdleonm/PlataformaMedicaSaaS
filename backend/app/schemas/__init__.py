"""
Schemas Pydantic request/response.
"""
from app.schemas.auth import (
    EspecialidadRead,
    EspecialistaRegister,
    EspecialistaLogin,
    EspecialistaRead,
    Token,
)
from app.schemas.pacientes import (
    PacienteBaseSchema,
    PacienteCreate,
    PacienteUpdate,
    PacienteRead,
    PacienteList,
)

__all__ = [
    "EspecialidadRead",
    "EspecialistaRegister",
    "EspecialistaLogin",
    "EspecialistaRead",
    "Token",
    "PacienteBaseSchema",
    "PacienteCreate",
    "PacienteUpdate",
    "PacienteRead",
    "PacienteList",
]

