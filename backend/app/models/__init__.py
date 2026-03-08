"""
Modelos SQLModel para Odonto-Focus.
Fase 1: Especialidades, Especialistas y relación N:N.
Fase 2.1: Pacientes.
"""
from app.models.especialidad import Especialidad
from app.models.especialista import Especialista, EspecialistaEspecialidad
from app.models.paciente import Paciente

__all__ = ["Especialidad", "Especialista", "EspecialistaEspecialidad", "Paciente"]
