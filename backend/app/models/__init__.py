"""
Modelos SQLModel para Odonto-Focus.
Fase 1: Especialidades, Especialistas y relación N:N.
Fase 2.1: Pacientes.
Fase 2.2: OdontogramaHallazgo (catálogo).
Fase 2.3: OdontogramaRegistro (evolutivo).
Fase 2.4: HistoriaClinica.
Fase 3.1: Insumo.
Fase 3.2: Servicio, ServicioInsumo.
Fase 3.3: Cita.
Fase 3.4: Presupuesto, PresupuestoDetalle, Abono.
"""
from app.models.especialidad import Especialidad
from app.models.especialista import Especialista, EspecialistaEspecialidad
from app.models.paciente import Paciente
from app.models.odontograma import OdontogramaHallazgo, OdontogramaRegistro
from app.models.historia_clinica import HistoriaClinica
from app.models.insumo_servicio import Insumo, Servicio, ServicioInsumo
from app.models.finanzas import Cita, Presupuesto, PresupuestoDetalle, Abono
from app.models.comunicaciones import ColaMensaje

__all__ = [
    "Especialidad",
    "Especialista",
    "EspecialistaEspecialidad",
    "Paciente",
    "OdontogramaHallazgo",
    "OdontogramaRegistro",
    "HistoriaClinica",
    "Insumo",
    "Servicio",
    "ServicioInsumo",
    "Cita",
    "Presupuesto",
    "PresupuestoDetalle",
    "Abono",
    "ColaMensaje",
]
