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
from app.schemas.odontograma import (
    OdontogramaHallazgoRead,
    OdontogramaRegistroCreate,
    OdontogramaRegistroRead,
    OdontogramaEstadoRead,
    EstadoDiente,
)
from app.schemas.historias_clinicas import (
    HistoriaClinicaCreate,
    HistoriaClinicaUpdate,
    HistoriaClinicaRead,
    HistoriaClinicaList,
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
    "OdontogramaHallazgoRead",
    "OdontogramaRegistroCreate",
    "OdontogramaRegistroRead",
    "OdontogramaEstadoRead",
    "EstadoDiente",
    "HistoriaClinicaCreate",
    "HistoriaClinicaUpdate",
    "HistoriaClinicaRead",
    "HistoriaClinicaList",
]
